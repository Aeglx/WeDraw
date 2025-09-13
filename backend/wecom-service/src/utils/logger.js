const winston = require('winston');
const path = require('path');
const config = require('../config');

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'wecom-service' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join('./logs', 'error.log'),
      level: 'error',
      maxsize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
    }),
    // 组合日志文件
    new winston.transports.File({
      filename: path.join('./logs', 'combined.log'),
      maxsize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
    }),
  ],
});

// 开发环境添加控制台输出
if (config.env === 'development') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// 业务日志记录方法
logger.business = (action, data = {}) => {
  logger.info(`Business Action: ${action}`, {
    action,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// 性能日志记录方法
logger.performance = (operation, duration, data = {}) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// API请求日志记录方法
logger.request = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode,
    duration,
    timestamp: new Date().toISOString(),
  };
  
  if (req.user) {
    logData.userId = req.user.id;
  }
  
  logger.info('API Request', logData);
};

// 错误日志记录方法
logger.apiError = (req, error, statusCode = 500) => {
  logger.error('API Error', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode,
    error: error.message,
    stack: error.stack,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });
};

module.exports = logger;