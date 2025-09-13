const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const config = require('../config');

/**
 * 全局错误处理中间件
 */
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // 记录错误日志
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Mongoose错误处理
  if (error.name === 'CastError') {
    const message = '资源未找到';
    err = new AppError(message, 404);
  }

  // Mongoose重复字段错误
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `${field}已存在`;
    err = new AppError(message, 400);
  }

  // Mongoose验证错误
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message).join(', ');
    err = new AppError(message, 400);
  }

  // Sequelize错误处理
  if (error.name === 'SequelizeValidationError') {
    const message = error.errors.map(e => e.message).join(', ');
    err = new AppError(message, 400);
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'field';
    const message = `${field}已存在`;
    err = new AppError(message, 400);
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    const message = '关联数据不存在';
    err = new AppError(message, 400);
  }

  if (error.name === 'SequelizeDatabaseError') {
    const message = '数据库操作失败';
    err = new AppError(message, 500);
  }

  // JWT错误处理
  if (error.name === 'JsonWebTokenError') {
    const message = '无效的访问令牌';
    err = new AppError(message, 401);
  }

  if (error.name === 'TokenExpiredError') {
    const message = '访问令牌已过期';
    err = new AppError(message, 401);
  }

  // 语法错误
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    const message = '请求体格式错误';
    err = new AppError(message, 400);
  }

  // 文件上传错误
  if (error.code === 'LIMIT_FILE_SIZE') {
    const message = '文件大小超过限制';
    err = new AppError(message, 400);
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = '不支持的文件字段';
    err = new AppError(message, 400);
  }

  // Redis错误处理
  if (error.code === 'ECONNREFUSED' && error.address) {
    const message = '缓存服务连接失败';
    err = new AppError(message, 503);
  }

  // 网络错误
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
    const message = '网络连接失败';
    err = new AppError(message, 503);
  }

  // 超时错误
  if (error.code === 'ETIMEDOUT') {
    const message = '请求超时';
    err = new AppError(message, 408);
  }

  // 权限错误
  if (error.code === 'EACCES' || error.code === 'EPERM') {
    const message = '权限不足';
    err = new AppError(message, 403);
  }

  // 磁盘空间不足
  if (error.code === 'ENOSPC') {
    const message = '服务器存储空间不足';
    err = new AppError(message, 507);
  }

  // 微信API错误
  if (error.errcode) {
    const wxErrorMessages = {
      40001: '微信接口调用凭证无效',
      40002: '微信接口调用凭证类型无效',
      40003: '微信openid无效',
      40013: '微信appid无效',
      40125: '微信小程序密钥无效',
      41001: '微信接口调用凭证缺失',
      42001: '微信接口调用凭证过期',
      43101: '微信用户拒绝授权',
      45011: '微信API调用频率限制',
      47001: '微信数据解析失败'
    };
    
    const message = wxErrorMessages[error.errcode] || `微信API错误: ${error.errmsg}`;
    err = new AppError(message, 400);
  }

  // 发送错误响应
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(config.env === 'development' && {
      stack: error.stack,
      error: error
    })
  });
};

/**
 * 404错误处理中间件
 */
const notFoundHandler = (req, res, next) => {
  const message = `路由 ${req.originalUrl} 未找到`;
  const error = new AppError(message, 404);
  next(error);
};

/**
 * 异步错误捕获包装器
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 未捕获异常处理
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  
  // 优雅关闭服务器
  process.exit(1);
});

/**
 * 未处理的Promise拒绝
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // 优雅关闭服务器
  process.exit(1);
});

/**
 * 进程终止信号处理
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

/**
 * 错误分类和统计
 */
const errorStats = {
  counts: {},
  lastReset: Date.now()
};

const trackError = (error) => {
  const errorType = error.constructor.name || 'Unknown';
  errorStats.counts[errorType] = (errorStats.counts[errorType] || 0) + 1;
  
  // 每小时重置统计
  if (Date.now() - errorStats.lastReset > 60 * 60 * 1000) {
    logger.info('Error statistics:', errorStats.counts);
    errorStats.counts = {};
    errorStats.lastReset = Date.now();
  }
};

/**
 * 错误恢复策略
 */
const errorRecovery = {
  // 数据库连接恢复
  async recoverDatabase() {
    try {
      const { sequelize } = require('../models');
      await sequelize.authenticate();
      logger.info('Database connection recovered');
      return true;
    } catch (error) {
      logger.error('Database recovery failed:', error);
      return false;
    }
  },
  
  // Redis连接恢复
  async recoverRedis() {
    try {
      const Redis = require('ioredis');
      const redis = new Redis(config.redis);
      await redis.ping();
      redis.disconnect();
      logger.info('Redis connection recovered');
      return true;
    } catch (error) {
      logger.error('Redis recovery failed:', error);
      return false;
    }
  }
};

/**
 * 健康检查错误处理
 */
const healthCheckError = (error) => {
  return {
    status: 'error',
    message: error.message,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    error: config.env === 'development' ? error.stack : undefined
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  trackError,
  errorRecovery,
  healthCheckError,
  errorStats
};