/**
 * 自定义应用错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, isOperational = true) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode();
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
  
  getDefaultCode() {
    const codeMap = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE'
    };
    
    return codeMap[this.statusCode] || 'UNKNOWN_ERROR';
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * 验证错误
 */
class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
    this.value = value;
  }
}

/**
 * 认证错误
 */
class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * 授权错误
 */
class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * 资源未找到错误
 */
class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(`${resource}未找到`, 404, 'NOT_FOUND_ERROR');
    this.resource = resource;
  }
}

/**
 * 冲突错误
 */
class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * 业务逻辑错误
 */
class BusinessError extends AppError {
  constructor(message, code = 'BUSINESS_ERROR') {
    super(message, 400, code);
  }
}

/**
 * 外部服务错误
 */
class ExternalServiceError extends AppError {
  constructor(service, message = '外部服务调用失败', originalError = null) {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * 数据库错误
 */
class DatabaseError extends AppError {
  constructor(message = '数据库操作失败', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * 缓存错误
 */
class CacheError extends AppError {
  constructor(message = '缓存操作失败', originalError = null) {
    super(message, 500, 'CACHE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * 文件操作错误
 */
class FileError extends AppError {
  constructor(message = '文件操作失败', operation = null) {
    super(message, 500, 'FILE_ERROR');
    this.operation = operation;
  }
}

/**
 * 网络错误
 */
class NetworkError extends AppError {
  constructor(message = '网络请求失败', url = null) {
    super(message, 503, 'NETWORK_ERROR');
    this.url = url;
  }
}

/**
 * 速率限制错误
 */
class RateLimitError extends AppError {
  constructor(message = '请求过于频繁', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.retryAfter = retryAfter;
  }
}

/**
 * 微信API错误
 */
class WeChatError extends AppError {
  constructor(errcode, errmsg, originalError = null) {
    const message = `微信API错误: ${errmsg} (${errcode})`;
    super(message, 400, 'WECHAT_API_ERROR');
    this.errcode = errcode;
    this.errmsg = errmsg;
    this.originalError = originalError;
  }
}

/**
 * 支付错误
 */
class PaymentError extends AppError {
  constructor(message = '支付处理失败', paymentMethod = null, transactionId = null) {
    super(message, 400, 'PAYMENT_ERROR');
    this.paymentMethod = paymentMethod;
    this.transactionId = transactionId;
  }
}

/**
 * 配置错误
 */
class ConfigError extends AppError {
  constructor(message = '配置错误', configKey = null) {
    super(message, 500, 'CONFIG_ERROR');
    this.configKey = configKey;
  }
}

/**
 * 错误工厂函数
 */
const createError = {
  validation: (message, field, value) => new ValidationError(message, field, value),
  authentication: (message) => new AuthenticationError(message),
  authorization: (message) => new AuthorizationError(message),
  notFound: (resource) => new NotFoundError(resource),
  conflict: (message) => new ConflictError(message),
  business: (message, code) => new BusinessError(message, code),
  external: (service, message, error) => new ExternalServiceError(service, message, error),
  database: (message, error) => new DatabaseError(message, error),
  cache: (message, error) => new CacheError(message, error),
  file: (message, operation) => new FileError(message, operation),
  network: (message, url) => new NetworkError(message, url),
  rateLimit: (message, retryAfter) => new RateLimitError(message, retryAfter),
  wechat: (errcode, errmsg, error) => new WeChatError(errcode, errmsg, error),
  payment: (message, method, transactionId) => new PaymentError(message, method, transactionId),
  config: (message, key) => new ConfigError(message, key)
};

/**
 * 错误处理工具函数
 */
const errorUtils = {
  /**
   * 判断是否为操作性错误
   */
  isOperationalError: (error) => {
    return error instanceof AppError && error.isOperational;
  },
  
  /**
   * 格式化错误响应
   */
  formatErrorResponse: (error, includeStack = false) => {
    const response = {
      success: false,
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: error.timestamp || new Date().toISOString()
    };
    
    if (error instanceof AppError) {
      response.statusCode = error.statusCode;
      
      // 添加特定错误类型的额外信息
      if (error instanceof ValidationError) {
        response.field = error.field;
        response.value = error.value;
      }
      
      if (error instanceof ExternalServiceError) {
        response.service = error.service;
      }
      
      if (error instanceof WeChatError) {
        response.errcode = error.errcode;
        response.errmsg = error.errmsg;
      }
      
      if (error instanceof RateLimitError && error.retryAfter) {
        response.retryAfter = error.retryAfter;
      }
    }
    
    if (includeStack && error.stack) {
      response.stack = error.stack;
    }
    
    return response;
  },
  
  /**
   * 包装异步函数以捕获错误
   */
  asyncWrapper: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },
  
  /**
   * 重试机制
   */
  retry: async (fn, maxAttempts = 3, delay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        // 指数退避
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  },
  
  /**
   * 错误聚合
   */
  aggregateErrors: (errors) => {
    if (!Array.isArray(errors) || errors.length === 0) {
      return null;
    }
    
    if (errors.length === 1) {
      return errors[0];
    }
    
    const messages = errors.map(err => err.message).join('; ');
    const aggregatedError = new AppError(`多个错误: ${messages}`, 400, 'MULTIPLE_ERRORS');
    aggregatedError.errors = errors;
    
    return aggregatedError;
  },
  
  /**
   * 错误转换
   */
  transformError: (error) => {
    // 已经是AppError的直接返回
    if (error instanceof AppError) {
      return error;
    }
    
    // Sequelize错误转换
    if (error.name === 'SequelizeValidationError') {
      const message = error.errors.map(e => e.message).join(', ');
      return new ValidationError(message);
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return new ConflictError('数据已存在');
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return new ValidationError('关联数据不存在');
    }
    
    // JWT错误转换
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('无效的访问令牌');
    }
    
    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('访问令牌已过期');
    }
    
    // 默认转换为内部服务器错误
    return new AppError(error.message || '内部服务器错误', 500, 'INTERNAL_SERVER_ERROR');
  }
};

/**
 * 错误常量
 */
const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  
  // 认证授权错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // 资源错误
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  
  // 业务错误
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // 外部服务错误
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  WECHAT_API_ERROR: 'WECHAT_API_ERROR',
  
  // 系统错误
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // 限制错误
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED'
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessError,
  ExternalServiceError,
  DatabaseError,
  CacheError,
  FileError,
  NetworkError,
  RateLimitError,
  WeChatError,
  PaymentError,
  ConfigError,
  createError,
  errorUtils,
  ERROR_CODES
};