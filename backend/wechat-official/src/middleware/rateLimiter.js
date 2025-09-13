const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * 创建基于Redis的限流存储
 */
const createRedisStore = () => {
  try {
    return new RedisStore({
      client: cacheService.getClient(),
      prefix: 'rl:', // rate limit prefix
    });
  } catch (error) {
    logger.warn('Failed to create Redis store for rate limiting, falling back to memory store:', error.message);
    return undefined; // 使用默认的内存存储
  }
};

/**
 * 默认限流配置
 */
const defaultLimiterConfig = {
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个窗口期最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // 返回标准的 `RateLimit-*` 头部
  legacyHeaders: false, // 禁用 `X-RateLimit-*` 头部
  store: createRedisStore(),
  keyGenerator: (req) => {
    // 使用用户ID（如果已认证）或IP地址作为限流键
    return req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  },
  skip: (req) => {
    // 跳过健康检查和静态资源请求
    return req.path === '/health' || req.path.startsWith('/static/');
  }
};

/**
 * 创建通用限流器
 * @param {Object} options - 限流配置选项
 * @returns {Function} Express中间件
 */
const createLimiter = (options = {}) => {
  const config = { ...defaultLimiterConfig, ...options };
  return rateLimit(config);
};

/**
 * 严格限流器（用于敏感操作）
 */
const strictLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 每15分钟最多10个请求
  message: {
    success: false,
    message: '敏感操作请求过于频繁，请稍后再试',
    code: 'STRICT_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * 宽松限流器（用于一般操作）
 */
const looseLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每15分钟最多1000个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

/**
 * 微信API限流器（根据微信API限制）
 */
const wechatApiLimiter = createLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 每分钟最多100个请求（微信API限制）
  message: {
    success: false,
    message: '微信API调用过于频繁，请稍后再试',
    code: 'WECHAT_API_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * 登录限流器
 */
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每15分钟最多5次登录尝试
  skipSuccessfulRequests: true, // 成功的请求不计入限制
  keyGenerator: (req) => `login:${req.ip}`, // 基于IP限制
  message: {
    success: false,
    message: '登录尝试过于频繁，请15分钟后再试',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * 文件上传限流器
 */
const uploadLimiter = createLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多10个上传请求
  message: {
    success: false,
    message: '文件上传过于频繁，请稍后再试',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * 消息发送限流器
 */
const messageLimiter = createLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 每分钟最多30条消息
  message: {
    success: false,
    message: '消息发送过于频繁，请稍后再试',
    code: 'MESSAGE_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * 自定义限流器工厂函数
 * @param {string} name - 限流器名称
 * @param {number} max - 最大请求数
 * @param {number} windowMs - 时间窗口（毫秒）
 * @param {Object} options - 其他选项
 * @returns {Function} Express中间件
 */
const rateLimiter = (name, max, windowMs, options = {}) => {
  const limiterConfig = {
    windowMs: windowMs * 1000, // 转换为毫秒
    max,
    keyGenerator: (req) => {
      const userId = req.user?.id;
      const ip = req.ip;
      return userId ? `${name}:user:${userId}` : `${name}:ip:${ip}`;
    },
    message: {
      success: false,
      message: `${name}操作过于频繁，请稍后再试`,
      code: 'CUSTOM_RATE_LIMIT_EXCEEDED',
      limiter: name
    },
    handler: (req, res) => {
      logger.warn(`Custom rate limit exceeded: ${name}`, {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        limiter: name,
        max,
        windowMs
      });
      
      res.status(429).json({
        success: false,
        message: `${name}操作过于频繁，请稍后再试`,
        code: 'CUSTOM_RATE_LIMIT_EXCEEDED',
        limiter: name,
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      });
    },
    ...defaultLimiterConfig,
    ...options
  };
  
  return rateLimit(limiterConfig);
};

/**
 * 动态限流器（根据用户角色调整限制）
 * @param {Object} roleConfig - 角色配置
 * @returns {Function} Express中间件
 */
const dynamicLimiter = (roleConfig = {}) => {
  const defaultConfig = {
    admin: { max: 1000, windowMs: 15 * 60 * 1000 },
    user: { max: 100, windowMs: 15 * 60 * 1000 },
    guest: { max: 50, windowMs: 15 * 60 * 1000 }
  };
  
  const config = { ...defaultConfig, ...roleConfig };
  
  return (req, res, next) => {
    const userRole = req.user?.role || 'guest';
    const roleLimit = config[userRole] || config.guest;
    
    const limiter = createLimiter({
      ...roleLimit,
      keyGenerator: (req) => {
        return req.user?.id ? `dynamic:user:${req.user.id}` : `dynamic:ip:${req.ip}`;
      },
      message: {
        success: false,
        message: '请求过于频繁，请稍后再试',
        code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
        role: userRole
      }
    });
    
    limiter(req, res, next);
  };
};

/**
 * 获取限流状态
 * @param {string} key - 限流键
 * @returns {Promise<Object>} 限流状态
 */
const getRateLimitStatus = async (key) => {
  try {
    const client = cacheService.getClient();
    const current = await client.get(`rl:${key}`);
    const ttl = await client.ttl(`rl:${key}`);
    
    return {
      current: parseInt(current) || 0,
      remaining: Math.max(0, defaultLimiterConfig.max - (parseInt(current) || 0)),
      resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : null
    };
  } catch (error) {
    logger.error('Failed to get rate limit status:', error);
    return {
      current: 0,
      remaining: defaultLimiterConfig.max,
      resetTime: null
    };
  }
};

/**
 * 重置限流计数
 * @param {string} key - 限流键
 * @returns {Promise<boolean>} 重置结果
 */
const resetRateLimit = async (key) => {
  try {
    const client = cacheService.getClient();
    await client.del(`rl:${key}`);
    
    logger.info('Rate limit reset', { key });
    return true;
  } catch (error) {
    logger.error('Failed to reset rate limit:', error);
    return false;
  }
};

module.exports = {
  // 预定义限流器
  defaultLimiter: createLimiter(),
  strictLimiter,
  looseLimiter,
  wechatApiLimiter,
  loginLimiter,
  uploadLimiter,
  messageLimiter,
  
  // 工厂函数
  createLimiter,
  rateLimiter,
  dynamicLimiter,
  
  // 工具函数
  getRateLimitStatus,
  resetRateLimit
};