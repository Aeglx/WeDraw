const logger = require('../utils/logger');

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  logger.error('全局错误处理:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? { id: req.user.id, username: req.user.username } : null
  });

  // 默认错误响应
  let statusCode = 500;
  let message = '服务器内部错误';
  let code = 500;

  // 根据错误类型设置响应
  if (err.name === 'ValidationError') {
    // 数据验证错误
    statusCode = 400;
    code = 400;
    message = '请求参数验证失败';
    
    // 如果是Sequelize验证错误，提取具体错误信息
    if (err.errors && Array.isArray(err.errors)) {
      const errorMessages = err.errors.map(error => error.message);
      message = errorMessages.join(', ');
    }
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    // 数据库唯一约束错误
    statusCode = 409;
    code = 409;
    message = '数据已存在，请检查重复字段';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    // 外键约束错误
    statusCode = 400;
    code = 400;
    message = '关联数据不存在';
  } else if (err.name === 'SequelizeDatabaseError') {
    // 数据库错误
    statusCode = 500;
    code = 500;
    message = '数据库操作失败';
  } else if (err.name === 'JsonWebTokenError') {
    // JWT错误
    statusCode = 401;
    code = 401;
    message = '认证令牌无效';
  } else if (err.name === 'TokenExpiredError') {
    // JWT过期错误
    statusCode = 401;
    code = 401;
    message = '认证令牌已过期';
  } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    // JSON解析错误
    statusCode = 400;
    code = 400;
    message = '请求数据格式错误';
  } else if (err.code === 'ECONNREFUSED') {
    // 连接被拒绝（服务不可用）
    statusCode = 503;
    code = 503;
    message = '服务暂时不可用';
  } else if (err.code === 'ETIMEDOUT') {
    // 请求超时
    statusCode = 504;
    code = 504;
    message = '请求超时';
  } else if (err.statusCode || err.status) {
    // 已设置状态码的错误
    statusCode = err.statusCode || err.status;
    code = statusCode;
    message = err.message || message;
  }

  // 开发环境下返回详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = {
    code,
    message,
    data: null,
    timestamp: Date.now()
  };

  // 开发环境添加调试信息
  if (isDevelopment) {
    errorResponse.debug = {
      error: err.message,
      stack: err.stack,
      name: err.name
    };
  }

  // 发送错误响应
  res.status(statusCode).json(errorResponse);
};

/**
 * 异步错误包装器
 * 用于包装异步路由处理函数，自动捕获异常
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404错误处理
 */
const notFoundHandler = (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? { id: req.user.id, username: req.user.username } : null
  });

  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
    data: null,
    timestamp: Date.now()
  });
};

/**
 * 创建自定义错误
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 创建验证错误
 */
class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * 创建认证错误
 */
class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * 创建授权错误
 */
class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * 创建资源不存在错误
 */
class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 创建冲突错误
 */
class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 409);
    this.name = 'ConflictError';
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
};