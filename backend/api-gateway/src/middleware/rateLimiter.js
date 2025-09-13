const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');
const { TooManyRequestsError } = require('./errorHandler');

/**
 * 创建Redis存储实例
 */
const createRedisStore = () => {
  try {
    return new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:',
    });
  } catch (error) {
    logger.warn('Redis store creation failed, falling back to memory store:', error.message);
    return undefined; // 使用默认内存存储
  }
};

/**
 * 通用限流配置
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 最大请求数
    message: {
      error: 'Too many requests from this IP, please try again later',
      code: 'TOO_MANY_REQUESTS',
      retryAfter: Math.ceil(options.windowMs / 1000) || 900
    },
    standardHeaders: true, // 返回标准的 `RateLimit-*` 头部
    legacyHeaders: false, // 禁用 `X-RateLimit-*` 头部
    store: createRedisStore(),
    keyGenerator: (req) => {
      // 优先使用用户ID，其次使用IP
      return req.user?.id || req.ip;
    },
    handler: (req, res, next) => {
      logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        userId: req.user?.id,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
      
      const error = new TooManyRequestsError('Rate limit exceeded');
      next(error);
    },
    skip: (req) => {
      // 跳过健康检查和内部请求
      const skipPaths = ['/health', '/metrics', '/favicon.ico'];
      return skipPaths.includes(req.path);
    },
    onLimitReached: (req, res, options) => {
      logger.warn('Rate limit reached:', {
        ip: req.ip,
        userId: req.user?.id,
        url: req.originalUrl,
        limit: options.max,
        windowMs: options.windowMs
      });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * 全局限流 - 较宽松
 */
const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP 15分钟内最多1000个请求
  message: {
    error: 'Too many requests, please slow down',
    code: 'GLOBAL_RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  }
});

/**
 * API限流 - 中等严格
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 500, // 每个用户/IP 15分钟内最多500个API请求
  message: {
    error: 'API rate limit exceeded, please try again later',
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  }
});

/**
 * 认证限流 - 严格
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 每个IP 15分钟内最多10次认证尝试
  message: {
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900
  },
  keyGenerator: (req) => req.ip, // 只使用IP，不使用用户ID
  skipSuccessfulRequests: true // 跳过成功的请求
});

/**
 * 短信/邮件限流 - 非常严格
 */
const messageLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 每个用户/IP 1小时内最多5条消息
  message: {
    error: 'Message sending limit exceeded, please try again later',
    code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
    retryAfter: 3600
  }
});

/**
 * 文件上传限流
 */
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 50, // 每个用户/IP 1小时内最多50次上传
  message: {
    error: 'Upload limit exceeded, please try again later',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: 3600
  }
});

/**
 * 搜索限流
 */
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 每个用户/IP 1分钟内最多30次搜索
  message: {
    error: 'Search rate limit exceeded, please try again later',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  }
});

/**
 * 创建自定义限流器
 */
const createCustomLimiter = (windowMs, max, errorMessage = 'Rate limit exceeded') => {
  return createRateLimiter({
    windowMs,
    max,
    message: {
      error: errorMessage,
      code: 'CUSTOM_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMs / 1000)
    }
  });
};

/**
 * 动态限流中间件
 * 根据用户类型和API类型动态调整限流策略
 */
const dynamicLimiter = (req, res, next) => {
  const user = req.user;
  const path = req.path;
  
  // VIP用户或管理员享受更高的限流阈值
  if (user && (user.role === 'admin' || user.vip)) {
    return createCustomLimiter(15 * 60 * 1000, 2000, 'VIP rate limit exceeded')(req, res, next);
  }
  
  // 根据API路径选择不同的限流策略
  if (path.startsWith('/auth/')) {
    return authLimiter(req, res, next);
  } else if (path.startsWith('/message/') || path.startsWith('/sms/') || path.startsWith('/email/')) {
    return messageLimiter(req, res, next);
  } else if (path.startsWith('/upload/')) {
    return uploadLimiter(req, res, next);
  } else if (path.startsWith('/search/')) {
    return searchLimiter(req, res, next);
  } else {
    return apiLimiter(req, res, next);
  }
};

/**
 * 获取限流状态
 */
const getRateLimitStatus = async (key, windowMs, max) => {
  try {
    const store = createRedisStore();
    if (!store) {
      return { remaining: max, reset: Date.now() + windowMs };
    }
    
    const result = await store.get(key);
    return {
      remaining: Math.max(0, max - (result?.totalHits || 0)),
      reset: result?.resetTime || Date.now() + windowMs,
      total: max
    };
  } catch (error) {
    logger.error('Failed to get rate limit status:', error);
    return { remaining: max, reset: Date.now() + windowMs };
  }
};

/**
 * 重置限流计数
 */
const resetRateLimit = async (key) => {
  try {
    const store = createRedisStore();
    if (store) {
      await store.resetKey(key);
      logger.info('Rate limit reset for key:', key);
    }
  } catch (error) {
    logger.error('Failed to reset rate limit:', error);
  }
};

module.exports = {
  globalLimiter,
  apiLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  searchLimiter,
  dynamicLimiter,
  createCustomLimiter,
  createRateLimiter,
  getRateLimitStatus,
  resetRateLimit
};