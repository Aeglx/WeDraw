const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const { TooManyRequestsError } = require('../utils/errors');
const logger = require('../utils/logger');

// Redis客户端实例
let redisClient;

/**
 * 初始化Redis客户端
 */
const initRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    redisClient.on('error', (error) => {
      logger.logError('redis_rate_limit_error', error);
    });
  }
  return redisClient;
};

/**
 * 创建基础限流中间件
 * @param {object} options - 限流配置
 */
const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15分钟
    max = 100, // 最大请求数
    message = '请求过于频繁，请稍后再试',
    standardHeaders = true,
    legacyHeaders = false,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = null,
    skip = null,
    onLimitReached = null,
    store = null
  } = options;

  // 使用Redis存储（如果可用）
  let rateStore = store;
  if (!rateStore && process.env.REDIS_HOST) {
    try {
      const redis = initRedisClient();
      rateStore = new RedisStore({
        sendCommand: (...args) => redis.call(...args),
        prefix: 'rl:'
      });
    } catch (error) {
      logger.logError('redis_store_init_error', error);
    }
  }

  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    store: rateStore,
    keyGenerator: keyGenerator || ((req) => {
      // 优先使用用户ID，其次使用IP
      return req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
    }),
    skip: skip || ((req) => {
      // 跳过健康检查等系统接口
      return req.path === '/health' || req.path === '/ping';
    }),
    onLimitReached: (req, res, options) => {
      logger.logBusinessOperation('rate_limit', 'limit_reached', {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        limit: max,
        windowMs
      });

      if (onLimitReached) {
        onLimitReached(req, res, options);
      }
    },
    handler: (req, res) => {
      const error = new TooManyRequestsError(message);
      res.status(429).json({
        success: false,
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

/**
 * 通用API限流
 */
const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每15分钟1000次请求
  message: 'API请求过于频繁，请稍后再试'
});

/**
 * 严格限流（用于敏感操作）
 */
const strictRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 50, // 每15分钟50次请求
  message: '操作过于频繁，请稍后再试'
});

/**
 * 登录限流
 */
const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每15分钟5次登录尝试
  message: '登录尝试过于频繁，请15分钟后再试',
  keyGenerator: (req) => `login:${req.ip}`,
  skipSuccessfulRequests: true // 成功的登录不计入限制
});

/**
 * 注册限流
 */
const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 每小时3次注册
  message: '注册过于频繁，请1小时后再试',
  keyGenerator: (req) => `register:${req.ip}`
});

/**
 * 密码重置限流
 */
const passwordResetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 每小时3次密码重置
  message: '密码重置请求过于频繁，请1小时后再试',
  keyGenerator: (req) => `password-reset:${req.ip}`
});

/**
 * 短信验证码限流
 */
const smsRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 每分钟1次
  message: '短信发送过于频繁，请1分钟后再试',
  keyGenerator: (req) => `sms:${req.body.phone || req.ip}`
});

/**
 * 邮件验证码限流
 */
const emailRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 每分钟1次
  message: '邮件发送过于频繁，请1分钟后再试',
  keyGenerator: (req) => `email:${req.body.email || req.ip}`
});

/**
 * 文件上传限流
 */
const uploadRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟10次上传
  message: '文件上传过于频繁，请稍后再试'
});

/**
 * 搜索限流
 */
const searchRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 每分钟30次搜索
  message: '搜索过于频繁，请稍后再试'
});

/**
 * 订单创建限流
 */
const orderRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟5次订单创建
  message: '订单创建过于频繁，请稍后再试',
  keyGenerator: (req) => req.user?.id ? `order:${req.user.id}` : `order:${req.ip}`
});

/**
 * 支付限流
 */
const paymentRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 3, // 每分钟3次支付
  message: '支付操作过于频繁，请稍后再试',
  keyGenerator: (req) => req.user?.id ? `payment:${req.user.id}` : `payment:${req.ip}`
});

/**
 * 评论限流
 */
const commentRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟5条评论
  message: '评论过于频繁，请稍后再试',
  keyGenerator: (req) => req.user?.id ? `comment:${req.user.id}` : `comment:${req.ip}`
});

/**
 * 动态限流中间件
 * 根据用户等级调整限流策略
 */
const dynamicRateLimit = (baseOptions = {}) => {
  return (req, res, next) => {
    let options = { ...baseOptions };
    
    // 根据用户等级调整限制
    if (req.user) {
      const userLevel = req.user.level || 1;
      const isVip = req.user.isVip;
      
      // VIP用户获得更高的限制
      if (isVip) {
        options.max = Math.floor(options.max * 2);
      }
      
      // 高等级用户获得更高的限制
      if (userLevel >= 5) {
        options.max = Math.floor(options.max * 1.5);
      }
      
      // 管理员不受限制
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        return next();
      }
    }
    
    const limiter = createRateLimit(options);
    limiter(req, res, next);
  };
};

/**
 * IP白名单中间件
 */
const ipWhitelist = (whitelist = []) => {
  const whitelistSet = new Set(whitelist);
  
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (whitelistSet.has(clientIp)) {
      return next();
    }
    
    // 检查环境变量中的白名单
    const envWhitelist = process.env.IP_WHITELIST ? 
                        process.env.IP_WHITELIST.split(',') : [];
    
    if (envWhitelist.includes(clientIp)) {
      return next();
    }
    
    next();
  };
};

/**
 * 滑动窗口限流
 */
const slidingWindowRateLimit = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    max = 100,
    keyGenerator = (req) => req.ip
  } = options;
  
  const requests = new Map();
  
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // 获取或创建请求记录
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    // 清理过期的请求记录
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // 检查是否超过限制
    if (validRequests.length >= max) {
      logger.logBusinessOperation('rate_limit', 'sliding_window_exceeded', {
        key,
        requestCount: validRequests.length,
        limit: max,
        windowMs
      });
      
      return res.status(429).json({
        success: false,
        error: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    // 添加当前请求
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
};

/**
 * 令牌桶限流
 */
const tokenBucketRateLimit = (options = {}) => {
  const {
    capacity = 100, // 桶容量
    refillRate = 10, // 每秒补充的令牌数
    keyGenerator = (req) => req.ip
  } = options;
  
  const buckets = new Map();
  
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // 获取或创建令牌桶
    if (!buckets.has(key)) {
      buckets.set(key, {
        tokens: capacity,
        lastRefill: now
      });
    }
    
    const bucket = buckets.get(key);
    
    // 计算需要补充的令牌数
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * refillRate);
    
    // 补充令牌
    bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    // 检查是否有可用令牌
    if (bucket.tokens < 1) {
      logger.logBusinessOperation('rate_limit', 'token_bucket_empty', {
        key,
        tokens: bucket.tokens,
        capacity
      });
      
      return res.status(429).json({
        success: false,
        error: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    // 消耗一个令牌
    bucket.tokens -= 1;
    
    next();
  };
};

/**
 * 清理过期的限流记录
 */
const cleanupExpiredRecords = () => {
  setInterval(() => {
    // 这里可以实现清理逻辑
    // 对于内存存储的限流数据进行清理
    logger.logBusinessOperation('rate_limit', 'cleanup_expired_records', {
      timestamp: new Date().toISOString()
    });
  }, 5 * 60 * 1000); // 每5分钟清理一次
};

/**
 * 获取限流状态
 */
const getRateLimitStatus = (req, res, next) => {
  // 这个中间件可以用来获取当前用户的限流状态
  const rateLimitInfo = {
    remaining: res.getHeader('X-RateLimit-Remaining'),
    limit: res.getHeader('X-RateLimit-Limit'),
    reset: res.getHeader('X-RateLimit-Reset')
  };
  
  req.rateLimitInfo = rateLimitInfo;
  next();
};

// 启动清理任务
if (process.env.NODE_ENV !== 'test') {
  cleanupExpiredRecords();
}

module.exports = {
  rateLimit: createRateLimit,
  apiRateLimit,
  strictRateLimit,
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  smsRateLimit,
  emailRateLimit,
  uploadRateLimit,
  searchRateLimit,
  orderRateLimit,
  paymentRateLimit,
  commentRateLimit,
  dynamicRateLimit,
  ipWhitelist,
  slidingWindowRateLimit,
  tokenBucketRateLimit,
  getRateLimitStatus
};