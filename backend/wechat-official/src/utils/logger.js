const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// 确保日志目录存在
const logDir = path.dirname(config.logging.file.filename.replace('%DATE%', ''));
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;
    
    // 添加请求ID（如果存在）
    if (meta.requestId) {
      log += ` [${meta.requestId}]`;
    }
    
    // 添加用户ID（如果存在）
    if (meta.userId) {
      log += ` [User:${meta.userId}]`;
    }
    
    log += `: ${message}`;
    
    // 添加错误堆栈
    if (stack) {
      log += `\n${stack}`;
    }
    
    // 添加额外的元数据
    const metaKeys = Object.keys(meta).filter(key => !['requestId', 'userId'].includes(key));
    if (metaKeys.length > 0) {
      const metaStr = metaKeys.map(key => `${key}=${JSON.stringify(meta[key])}`).join(' ');
      log += ` | ${metaStr}`;
    }
    
    return log;
  })
);

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// 创建传输器数组
const transports = [];

// 控制台传输器
if (config.logging.console.enabled) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logging.level,
    })
  );
}

// 文件传输器
if (config.logging.file.enabled) {
  // 错误日志
  transports.push(
    new DailyRotateFile({
      filename: config.logging.file.filename.replace('.log', '-error.log'),
      datePattern: config.logging.file.datePattern,
      maxSize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
      level: 'error',
      format: logFormat,
      auditFile: path.join(logDir, 'audit-error.json'),
    })
  );
  
  // 组合日志
  transports.push(
    new DailyRotateFile({
      filename: config.logging.file.filename,
      datePattern: config.logging.file.datePattern,
      maxSize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
      format: logFormat,
      auditFile: path.join(logDir, 'audit.json'),
    })
  );
}

// 创建logger实例
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// 添加请求日志方法
logger.request = (req, res, responseTime) => {
  const { method, url, ip, headers } = req;
  const { statusCode } = res;
  const userAgent = headers['user-agent'] || 'Unknown';
  const contentLength = res.get('content-length') || 0;
  
  logger.info('HTTP Request', {
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    ip,
    userAgent,
    contentLength,
    requestId: req.requestId,
    userId: req.user?.id,
  });
};

// 添加微信API日志方法
logger.wechat = (action, data, error = null) => {
  const logData = {
    action,
    data: typeof data === 'object' ? JSON.stringify(data) : data,
  };
  
  if (error) {
    logger.error(`WeChat API Error: ${action}`, {
      ...logData,
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.info(`WeChat API: ${action}`, logData);
  }
};

// 添加数据库日志方法
logger.database = (query, duration, error = null) => {
  const logData = {
    query: query.replace(/\s+/g, ' ').trim(),
    duration: `${duration}ms`,
  };
  
  if (error) {
    logger.error('Database Query Error', {
      ...logData,
      error: error.message,
    });
  } else {
    logger.debug('Database Query', logData);
  }
};

// 添加缓存日志方法
logger.cache = (action, key, hit = null) => {
  const logData = {
    action,
    key,
  };
  
  if (hit !== null) {
    logData.hit = hit;
  }
  
  logger.debug('Cache Operation', logData);
};

// 添加安全日志方法
logger.security = (event, details, req = null) => {
  const logData = {
    event,
    details,
    ip: req?.ip,
    userAgent: req?.headers['user-agent'],
    userId: req?.user?.id,
    requestId: req?.requestId,
  };
  
  logger.warn('Security Event', logData);
};

// 添加性能日志方法
logger.performance = (operation, duration, metadata = {}) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

// 添加业务日志方法
logger.business = (event, data, userId = null) => {
  logger.info('Business Event', {
    event,
    data: typeof data === 'object' ? JSON.stringify(data) : data,
    userId,
  });
};

// 处理未捕获的异常
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

// 优雅关闭
process.on('SIGINT', () => {
  logger.info('Received SIGINT, closing logger...');
  logger.end();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, closing logger...');
  logger.end();
});

module.exports = logger;