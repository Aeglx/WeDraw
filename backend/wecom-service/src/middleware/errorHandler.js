const logger = require('../utils/logger');
const config = require('../config');

/**
 * 全局错误处理中间件
 * @param {Error} error - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const errorHandler = (error, req, res, next) => {
  // 记录错误日志
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  });

  // 数据库错误处理
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      code: 'VALIDATION_ERROR',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: '数据已存在',
      code: 'DUPLICATE_ERROR',
      field: error.errors[0]?.path
    });
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: '关联数据不存在',
      code: 'FOREIGN_KEY_ERROR'
    });
  }

  // JWT错误处理
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌',
      code: 'INVALID_TOKEN'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '访问令牌已过期',
      code: 'TOKEN_EXPIRED'
    });
  }

  // 企业微信API错误
  if (error.code && error.code.startsWith('WECOM_')) {
    return res.status(400).json({
      success: false,
      message: error.message || '企业微信API调用失败',
      code: error.code
    });
  }

  // 默认错误响应
  const statusCode = error.statusCode || error.status || 500;
  const message = config.env === 'production' ? '服务器内部错误' : error.message;

  res.status(statusCode).json({
    success: false,
    message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(config.env !== 'production' && { stack: error.stack })
  });
};

/**
 * 404错误处理中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler
};