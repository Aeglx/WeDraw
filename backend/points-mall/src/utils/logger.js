const winston = require('winston');
const path = require('path');
const config = require('../config');

/**
 * 日志工具
 * 基于Winston的日志记录器
 */

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      log += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    // 添加错误堆栈
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// 控制台格式（开发环境）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    // 添加错误堆栈
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// 创建传输器
const transports = [];

// 控制台输出
if (config.logging.console) {
  transports.push(
    new winston.transports.Console({
      level: config.logging.level,
      format: process.env.NODE_ENV === 'development' ? consoleFormat : logFormat
    })
  );
}

// 文件输出
if (config.logging.file) {
  const logDir = config.logging.dir || 'logs';
  
  // 确保日志目录存在
  const fs = require('fs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // 错误日志
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: config.logging.maxSize || 5242880, // 5MB
      maxFiles: config.logging.maxFiles || 5
    })
  );
  
  // 组合日志
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: logFormat,
      maxsize: config.logging.maxSize || 5242880, // 5MB
      maxFiles: config.logging.maxFiles || 5
    })
  );
  
  // 访问日志
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'info',
      format: logFormat,
      maxsize: config.logging.maxSize || 5242880, // 5MB
      maxFiles: config.logging.maxFiles || 5
    })
  );
}

// 创建日志器
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: logFormat,
  transports,
  // 处理未捕获的异常
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(config.logging.dir || 'logs', 'exceptions.log') })
  ],
  // 处理未处理的Promise拒绝
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(config.logging.dir || 'logs', 'rejections.log') })
  ]
});

// 开发环境下的额外配置
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * 创建子日志器
 * @param {string} module - 模块名称
 * @returns {Object} 子日志器
 */
const createChildLogger = (module) => {
  return logger.child({ module });
};

/**
 * 记录HTTP请求
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {number} responseTime - 响应时间
 */
const logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userId: req.user?.id || null
  };
  
  if (res.statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

/**
 * 记录数据库操作
 * @param {string} operation - 操作类型
 * @param {string} table - 表名
 * @param {Object} data - 操作数据
 * @param {number} duration - 执行时间
 */
const logDatabase = (operation, table, data = {}, duration = null) => {
  const logData = {
    operation,
    table,
    duration: duration ? `${duration}ms` : null,
    ...data
  };
  
  logger.debug('Database Operation', logData);
};

/**
 * 记录业务操作
 * @param {string} action - 操作名称
 * @param {Object} data - 操作数据
 * @param {Object} user - 用户信息
 */
const logBusiness = (action, data = {}, user = null) => {
  const logData = {
    action,
    userId: user?.id || null,
    userRole: user?.role || null,
    ...data
  };
  
  logger.info('Business Operation', logData);
};

/**
 * 记录安全事件
 * @param {string} event - 事件类型
 * @param {Object} data - 事件数据
 * @param {string} level - 日志级别
 */
const logSecurity = (event, data = {}, level = 'warn') => {
  const logData = {
    securityEvent: event,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  logger[level]('Security Event', logData);
};

/**
 * 记录性能指标
 * @param {string} metric - 指标名称
 * @param {number} value - 指标值
 * @param {string} unit - 单位
 * @param {Object} tags - 标签
 */
const logPerformance = (metric, value, unit = 'ms', tags = {}) => {
  const logData = {
    metric,
    value,
    unit,
    tags
  };
  
  logger.info('Performance Metric', logData);
};

/**
 * 记录错误
 * @param {Error} error - 错误对象
 * @param {Object} context - 上下文信息
 */
const logError = (error, context = {}) => {
  const logData = {
    errorMessage: error.message,
    errorStack: error.stack,
    errorName: error.name,
    ...context
  };
  
  logger.error('Application Error', logData);
};

/**
 * 创建请求日志中间件
 * @returns {Function} Express中间件
 */
const requestLoggerMiddleware = () => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // 记录请求开始
    logger.debug('Request Start', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // 监听响应结束
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      logRequest(req, res, responseTime);
    });
    
    next();
  };
};

/**
 * 创建错误日志中间件
 * @returns {Function} Express错误中间件
 */
const errorLoggerMiddleware = () => {
  return (error, req, res, next) => {
    logError(error, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id || null,
      body: req.body,
      params: req.params,
      query: req.query
    });
    
    next(error);
  };
};

// 导出日志器和相关方法
module.exports = {
  // Winston日志器实例
  ...logger,
  
  // 自定义方法
  createChildLogger,
  logRequest,
  logDatabase,
  logBusiness,
  logSecurity,
  logPerformance,
  logError,
  
  // 中间件
  requestLoggerMiddleware,
  errorLoggerMiddleware,
  
  // 便捷方法
  child: createChildLogger
};