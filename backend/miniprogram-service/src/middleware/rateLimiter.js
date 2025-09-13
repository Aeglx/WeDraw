const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

// 创建Redis连接
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Redis连接错误处理
redis.on('error', (error) => {
  logger.error('Redis connection error for rate limiter:', error);
});

// 创建Redis存储
const redisStore = new RedisStore({
  sendCommand: (...args) => redis.call(...args),
  prefix: 'rl:miniprogram:'
});

/**
 * 创建速率限制器
 */
const createRateLimiter = (options) => {
  const defaultOptions = {
    store: redisStore,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        userId: req.user?.id
      });
      
      res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    keyGenerator: (req) => {
      // 优先使用用户ID，其次使用IP地址
      return req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
    },
    skip: (req) => {
      // 跳过健康检查和静态资源
      return req.path === '/health' || req.path.startsWith('/static/');
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * 通用API速率限制
 */
const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个窗口期最多1000次请求
  message: '请求过于频繁，请稍后再试'
});

/**
 * 登录接口速率限制
 */
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 每个窗口期最多10次登录尝试
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `login:${req.ip}`,
  message: '登录尝试过于频繁，请15分钟后再试'
});

/**
 * 发送消息速率限制
 */
const sendMessageLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 每分钟最多发送30条消息
  message: '发送消息过于频繁，请稍后再试'
});

/**
 * 批量发送消息速率限制
 */
const batchSendMessageLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 5, // 每5分钟最多5次批量发送
  message: '批量发送过于频繁，请稍后再试'
});

/**
 * 更新用户资料速率限制
 */
const updateProfileLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多更新10次
  message: '更新资料过于频繁，请稍后再试'
});

/**
 * 注销所有会话速率限制
 */
const logoutAllLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 3, // 每5分钟最多3次
  message: '注销操作过于频繁，请稍后再试'
});

/**
 * 刷新会话速率限制
 */
const refreshSessionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 每分钟最多20次
  message: '刷新会话过于频繁，请稍后再试'
});

/**
 * 撤回消息速率限制
 */
const recallMessageLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多撤回10条消息
  message: '撤回消息过于频繁，请稍后再试'
});

/**
 * 重试消息速率限制
 */
const retryMessageLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟最多重试5次
  message: '重试操作过于频繁，请稍后再试'
});

/**
 * 管理员操作速率限制
 */
const adminActionLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 每分钟最多100次管理员操作
  message: '管理员操作过于频繁，请稍后再试'
});

/**
 * 严格的速率限制（用于敏感操作）
 */
const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 每分钟最多5次
  message: '操作过于频繁，请稍后再试'
});

/**
 * 基于用户等级的动态速率限制
 */
const dynamicRateLimiter = (baseMax, premiumMultiplier = 2) => {
  return createRateLimiter({
    windowMs: 60 * 1000,
    max: (req) => {
      if (req.user?.isPremium) {
        return baseMax * premiumMultiplier;
      }
      return baseMax;
    },
    message: '请求过于频繁，升级会员可获得更高限额'
  });
};

/**
 * IP白名单检查
 */
const ipWhitelistCheck = (whitelist = []) => {
  return (req, res, next) => {
    const clientIP = req.ip;
    
    if (whitelist.includes(clientIP)) {
      return next();
    }
    
    // 检查是否在内网IP范围
    const isPrivateIP = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.)/.test(clientIP);
    if (isPrivateIP && config.env === 'development') {
      return next();
    }
    
    next();
  };
};

/**
 * 清理过期的速率限制记录
 */
const cleanupExpiredRecords = async () => {
  try {
    const keys = await redis.keys('rl:miniprogram:*');
    const pipeline = redis.pipeline();
    
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) { // 没有过期时间的key
        pipeline.expire(key, 3600); // 设置1小时过期
      }
    }
    
    await pipeline.exec();
    logger.info(`Cleaned up ${keys.length} rate limit records`);
  } catch (error) {
    logger.error('Failed to cleanup expired rate limit records:', error);
  }
};

// 定期清理过期记录
setInterval(cleanupExpiredRecords, 60 * 60 * 1000); // 每小时清理一次

module.exports = {
  rateLimiter,
  login: loginLimiter,
  sendMessage: sendMessageLimiter,
  batchSendMessage: batchSendMessageLimiter,
  updateProfile: updateProfileLimiter,
  logoutAll: logoutAllLimiter,
  refreshSession: refreshSessionLimiter,
  recallMessage: recallMessageLimiter,
  retryMessage: retryMessageLimiter,
  adminAction: adminActionLimiter,
  strict: strictLimiter,
  dynamic: dynamicRateLimiter,
  ipWhitelistCheck,
  createRateLimiter
};