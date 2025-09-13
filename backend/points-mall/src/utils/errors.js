/**
 * 错误处理工具
 * 定义自定义错误类型和错误处理函数
 */

/**
 * 基础应用错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * 验证错误
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 认证错误
 */
class AuthenticationError extends AppError {
  constructor(message = '认证失败', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * 授权错误
 */
class AuthorizationError extends AppError {
  constructor(message = '权限不足', details = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

/**
 * 资源未找到错误
 */
class NotFoundError extends AppError {
  constructor(message = '资源未找到', details = null) {
    super(message, 404, 'NOT_FOUND_ERROR', details);
  }
}

/**
 * 冲突错误
 */
class ConflictError extends AppError {
  constructor(message = '资源冲突', details = null) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

/**
 * 业务逻辑错误
 */
class BusinessError extends AppError {
  constructor(message, code = 'BUSINESS_ERROR', details = null) {
    super(message, 422, code, details);
  }
}

/**
 * 限流错误
 */
class RateLimitError extends AppError {
  constructor(message = '请求过于频繁', details = null) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
  }
}

/**
 * 数据库错误
 */
class DatabaseError extends AppError {
  constructor(message = '数据库操作失败', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

/**
 * 外部服务错误
 */
class ExternalServiceError extends AppError {
  constructor(message = '外部服务错误', details = null) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

/**
 * 积分相关错误
 */
class PointsError extends BusinessError {
  constructor(message, code = 'POINTS_ERROR', details = null) {
    super(message, code, details);
  }
}

/**
 * 库存不足错误
 */
class InsufficientStockError extends BusinessError {
  constructor(message = '库存不足', details = null) {
    super(message, 'INSUFFICIENT_STOCK', details);
  }
}

/**
 * 订单状态错误
 */
class OrderStatusError extends BusinessError {
  constructor(message = '订单状态错误', details = null) {
    super(message, 'ORDER_STATUS_ERROR', details);
  }
}

/**
 * 优惠券错误
 */
class CouponError extends BusinessError {
  constructor(message, code = 'COUPON_ERROR', details = null) {
    super(message, code, details);
  }
}

/**
 * 错误代码常量
 */
const ERROR_CODES = {
  // 通用错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // 业务错误
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  
  // 用户相关
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_INACTIVE: 'USER_INACTIVE',
  
  // 积分相关
  POINTS_ERROR: 'POINTS_ERROR',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  POINTS_FROZEN: 'POINTS_FROZEN',
  INVALID_POINTS_OPERATION: 'INVALID_POINTS_OPERATION',
  
  // 商品相关
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_INACTIVE: 'PRODUCT_INACTIVE',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_PRODUCT_STATUS: 'INVALID_PRODUCT_STATUS',
  
  // 订单相关
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_STATUS_ERROR: 'ORDER_STATUS_ERROR',
  ORDER_CANNOT_CANCEL: 'ORDER_CANNOT_CANCEL',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  ORDER_EXPIRED: 'ORDER_EXPIRED',
  
  // 优惠券相关
  COUPON_ERROR: 'COUPON_ERROR',
  COUPON_NOT_FOUND: 'COUPON_NOT_FOUND',
  COUPON_EXPIRED: 'COUPON_EXPIRED',
  COUPON_NOT_STARTED: 'COUPON_NOT_STARTED',
  COUPON_USED_UP: 'COUPON_USED_UP',
  COUPON_ALREADY_USED: 'COUPON_ALREADY_USED',
  COUPON_NOT_APPLICABLE: 'COUPON_NOT_APPLICABLE',
  
  // 分类相关
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_INACTIVE: 'CATEGORY_INACTIVE'
};

/**
 * 错误消息映射
 */
const ERROR_MESSAGES = {
  [ERROR_CODES.INTERNAL_ERROR]: '服务器内部错误',
  [ERROR_CODES.VALIDATION_ERROR]: '输入数据验证失败',
  [ERROR_CODES.AUTHENTICATION_ERROR]: '认证失败',
  [ERROR_CODES.AUTHORIZATION_ERROR]: '权限不足',
  [ERROR_CODES.NOT_FOUND_ERROR]: '资源未找到',
  [ERROR_CODES.CONFLICT_ERROR]: '资源冲突',
  [ERROR_CODES.RATE_LIMIT_ERROR]: '请求过于频繁',
  [ERROR_CODES.DATABASE_ERROR]: '数据库操作失败',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: '外部服务错误',
  
  [ERROR_CODES.USER_NOT_FOUND]: '用户不存在',
  [ERROR_CODES.USER_ALREADY_EXISTS]: '用户已存在',
  [ERROR_CODES.USER_INACTIVE]: '用户已被禁用',
  
  [ERROR_CODES.INSUFFICIENT_POINTS]: '积分不足',
  [ERROR_CODES.POINTS_FROZEN]: '积分已被冻结',
  [ERROR_CODES.INVALID_POINTS_OPERATION]: '无效的积分操作',
  
  [ERROR_CODES.PRODUCT_NOT_FOUND]: '商品不存在',
  [ERROR_CODES.PRODUCT_INACTIVE]: '商品已下架',
  [ERROR_CODES.INSUFFICIENT_STOCK]: '库存不足',
  [ERROR_CODES.INVALID_PRODUCT_STATUS]: '商品状态无效',
  
  [ERROR_CODES.ORDER_NOT_FOUND]: '订单不存在',
  [ERROR_CODES.ORDER_STATUS_ERROR]: '订单状态错误',
  [ERROR_CODES.ORDER_CANNOT_CANCEL]: '订单无法取消',
  [ERROR_CODES.ORDER_ALREADY_PAID]: '订单已支付',
  [ERROR_CODES.ORDER_EXPIRED]: '订单已过期',
  
  [ERROR_CODES.COUPON_NOT_FOUND]: '优惠券不存在',
  [ERROR_CODES.COUPON_EXPIRED]: '优惠券已过期',
  [ERROR_CODES.COUPON_NOT_STARTED]: '优惠券未开始',
  [ERROR_CODES.COUPON_USED_UP]: '优惠券已用完',
  [ERROR_CODES.COUPON_ALREADY_USED]: '优惠券已使用',
  [ERROR_CODES.COUPON_NOT_APPLICABLE]: '优惠券不适用',
  
  [ERROR_CODES.CATEGORY_NOT_FOUND]: '分类不存在',
  [ERROR_CODES.CATEGORY_INACTIVE]: '分类已禁用'
};

/**
 * 创建错误实例
 * @param {string} code - 错误代码
 * @param {string} message - 自定义消息
 * @param {*} details - 错误详情
 * @returns {AppError} 错误实例
 */
const createError = (code, message = null, details = null) => {
  const errorMessage = message || ERROR_MESSAGES[code] || '未知错误';
  
  switch (code) {
    case ERROR_CODES.VALIDATION_ERROR:
      return new ValidationError(errorMessage, details);
    case ERROR_CODES.AUTHENTICATION_ERROR:
      return new AuthenticationError(errorMessage, details);
    case ERROR_CODES.AUTHORIZATION_ERROR:
      return new AuthorizationError(errorMessage, details);
    case ERROR_CODES.NOT_FOUND_ERROR:
    case ERROR_CODES.USER_NOT_FOUND:
    case ERROR_CODES.PRODUCT_NOT_FOUND:
    case ERROR_CODES.ORDER_NOT_FOUND:
    case ERROR_CODES.COUPON_NOT_FOUND:
    case ERROR_CODES.CATEGORY_NOT_FOUND:
      return new NotFoundError(errorMessage, details);
    case ERROR_CODES.CONFLICT_ERROR:
    case ERROR_CODES.USER_ALREADY_EXISTS:
      return new ConflictError(errorMessage, details);
    case ERROR_CODES.RATE_LIMIT_ERROR:
      return new RateLimitError(errorMessage, details);
    case ERROR_CODES.DATABASE_ERROR:
      return new DatabaseError(errorMessage, details);
    case ERROR_CODES.EXTERNAL_SERVICE_ERROR:
      return new ExternalServiceError(errorMessage, details);
    case ERROR_CODES.INSUFFICIENT_STOCK:
      return new InsufficientStockError(errorMessage, details);
    case ERROR_CODES.ORDER_STATUS_ERROR:
    case ERROR_CODES.ORDER_CANNOT_CANCEL:
    case ERROR_CODES.ORDER_ALREADY_PAID:
    case ERROR_CODES.ORDER_EXPIRED:
      return new OrderStatusError(errorMessage, details);
    case ERROR_CODES.INSUFFICIENT_POINTS:
    case ERROR_CODES.POINTS_FROZEN:
    case ERROR_CODES.INVALID_POINTS_OPERATION:
      return new PointsError(errorMessage, code, details);
    case ERROR_CODES.COUPON_EXPIRED:
    case ERROR_CODES.COUPON_NOT_STARTED:
    case ERROR_CODES.COUPON_USED_UP:
    case ERROR_CODES.COUPON_ALREADY_USED:
    case ERROR_CODES.COUPON_NOT_APPLICABLE:
      return new CouponError(errorMessage, code, details);
    default:
      return new BusinessError(errorMessage, code, details);
  }
};

/**
 * 处理Sequelize错误
 * @param {Error} error - Sequelize错误
 * @returns {AppError} 应用错误
 */
const handleSequelizeError = (error) => {
  if (error.name === 'SequelizeValidationError') {
    const details = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    return new ValidationError('数据验证失败', details);
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'unknown';
    return new ConflictError(`${field} 已存在`, { field });
  }
  
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return new ValidationError('关联数据不存在', { constraint: error.index });
  }
  
  if (error.name === 'SequelizeConnectionError') {
    return new DatabaseError('数据库连接失败', { originalError: error.message });
  }
  
  return new DatabaseError('数据库操作失败', { originalError: error.message });
};

/**
 * 处理JWT错误
 * @param {Error} error - JWT错误
 * @returns {AppError} 应用错误
 */
const handleJWTError = (error) => {
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('令牌已过期');
  }
  
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('无效的令牌');
  }
  
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('令牌尚未生效');
  }
  
  return new AuthenticationError('令牌验证失败');
};

/**
 * 统一错误处理函数
 * @param {Error} error - 原始错误
 * @returns {AppError} 应用错误
 */
const handleError = (error) => {
  // 如果已经是应用错误，直接返回
  if (error instanceof AppError) {
    return error;
  }
  
  // 处理Sequelize错误
  if (error.name && error.name.startsWith('Sequelize')) {
    return handleSequelizeError(error);
  }
  
  // 处理JWT错误
  if (error.name && (error.name.includes('Token') || error.name === 'JsonWebTokenError')) {
    return handleJWTError(error);
  }
  
  // 处理其他已知错误类型
  if (error.code === 'ECONNREFUSED') {
    return new ExternalServiceError('服务连接被拒绝');
  }
  
  if (error.code === 'ETIMEDOUT') {
    return new ExternalServiceError('服务请求超时');
  }
  
  // 默认处理为内部错误
  return new AppError(error.message || '服务器内部错误', 500, 'INTERNAL_ERROR', {
    originalError: error.message,
    stack: error.stack
  });
};

/**
 * 异步错误包装器
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 错误响应格式化
 * @param {AppError} error - 应用错误
 * @param {boolean} includeStack - 是否包含堆栈信息
 * @returns {Object} 格式化的错误响应
 */
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      timestamp: error.timestamp
    }
  };
  
  if (error.details) {
    response.error.details = error.details;
  }
  
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }
  
  return response;
};

// 导出
module.exports = {
  // 错误类
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  PointsError,
  InsufficientStockError,
  OrderStatusError,
  CouponError,
  
  // 常量
  ERROR_CODES,
  ERROR_MESSAGES,
  
  // 工具函数
  createError,
  handleError,
  handleSequelizeError,
  handleJWTError,
  asyncErrorHandler,
  formatErrorResponse
};