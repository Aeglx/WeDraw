const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const customFormat = winston.format.combine(
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
    
    // 添加堆栈信息
    if (stack) {
      log += `\n${stack}`;
    }
    
    // 添加额外的元数据
    const extraMeta = { ...meta };
    delete extraMeta.requestId;
    delete extraMeta.userId;
    
    if (Object.keys(extraMeta).length > 0) {
      log += ` ${JSON.stringify(extraMeta)}`;
    }
    
    return log;
  })
);

// 控制台格式（彩色输出）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.printf(({ timestamp, level, message, requestId, userId, ...meta }) => {
    let log = `${timestamp} ${level}`;
    
    if (requestId) {
      log += ` [${requestId}]`;
    }
    
    if (userId) {
      log += ` [User:${userId}]`;
    }
    
    log += `: ${message}`;
    
    // 在开发环境显示额外信息
    if (process.env.NODE_ENV === 'development' && Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// 创建传输器
const transports = [
  // 错误日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true
  }),
  
  // 组合日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: customFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    tailable: true
  }),
  
  // 访问日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'access.log'),
    level: 'http',
    format: customFormat,
    maxsize: 20 * 1024 * 1024, // 20MB
    maxFiles: 7,
    tailable: true
  })
];

// 在非生产环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'debug'
    })
  );
}

// 创建logger实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  
  // 异常处理
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: customFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3
    })
  ],
  
  // 未捕获的Promise拒绝
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: customFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3
    })
  ],
  
  // 退出时不崩溃
  exitOnError: false
});

// 扩展logger方法
logger.extend = function(defaultMeta = {}) {
  return {
    error: (message, meta = {}) => logger.error(message, { ...defaultMeta, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...defaultMeta, ...meta }),
    info: (message, meta = {}) => logger.info(message, { ...defaultMeta, ...meta }),
    http: (message, meta = {}) => logger.http(message, { ...defaultMeta, ...meta }),
    verbose: (message, meta = {}) => logger.verbose(message, { ...defaultMeta, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { ...defaultMeta, ...meta }),
    silly: (message, meta = {}) => logger.silly(message, { ...defaultMeta, ...meta })
  };
};

// 请求日志方法
logger.request = function(req, res, responseTime) {
  const { method, url, ip, headers } = req;
  const { statusCode } = res;
  const contentLength = res.get('content-length') || 0;
  const userAgent = headers['user-agent'] || 'Unknown';
  const referer = headers.referer || headers.referrer || '-';
  
  const logData = {
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    contentLength,
    ip,
    userAgent,
    referer,
    requestId: req.id,
    userId: req.user?.id
  };
  
  const level = statusCode >= 400 ? 'warn' : 'http';
  const message = `${method} ${url} ${statusCode} ${responseTime}ms - ${contentLength} bytes`;
  
  logger.log(level, message, logData);
};

// 响应日志方法
logger.response = function(req, res, data = {}) {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    requestId: req.id,
    userId: req.user?.id,
    ...data
  };
  
  const message = `Response: ${req.method} ${req.url} - ${res.statusCode}`;
  logger.info(message, logData);
};

// 安全日志方法
logger.security = function(event, req, details = {}) {
  const logData = {
    event,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    url: req.url,
    method: req.method,
    requestId: req.id,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  const message = `Security Event: ${event}`;
  logger.warn(message, logData);
};

// 业务日志方法
logger.business = function(action, userId, details = {}) {
  const logData = {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  const message = `Business Action: ${action} by User ${userId}`;
  logger.info(message, logData);
};

// 性能日志方法
logger.performance = function(operation, duration, details = {}) {
  const logData = {
    operation,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  const level = duration > 1000 ? 'warn' : 'info';
  const message = `Performance: ${operation} took ${duration}ms`;
  
  logger.log(level, message, logData);
};

// 数据库日志方法
logger.database = function(query, duration, details = {}) {
  const logData = {
    query: query.substring(0, 200), // 限制查询长度
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  const level = duration > 500 ? 'warn' : 'debug';
  const message = `Database Query: ${duration}ms`;
  
  logger.log(level, message, logData);
};

// 缓存日志方法
logger.cache = function(operation, key, hit = null, details = {}) {
  const logData = {
    operation,
    key,
    hit,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  const message = `Cache ${operation}: ${key}${hit !== null ? ` (${hit ? 'HIT' : 'MISS'})` : ''}`;
  logger.debug(message, logData);
};

// API调用日志方法
logger.api = function(service, endpoint, method, duration, statusCode, details = {}) {
  const logData = {
    service,
    endpoint,
    method,
    duration: `${duration}ms`,
    statusCode,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  const level = statusCode >= 400 ? 'error' : duration > 2000 ? 'warn' : 'info';
  const message = `API Call: ${method} ${service}${endpoint} - ${statusCode} (${duration}ms)`;
  
  logger.log(level, message, logData);
};

// 用户操作日志方法
logger.userAction = function(userId, action, resource, details = {}) {
  const logData = {
    userId,
    action,
    resource,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  const message = `User Action: ${userId} ${action} ${resource}`;
  logger.info(message, logData);
};

// 错误日志增强方法
logger.errorWithContext = function(error, context = {}) {
  const errorData = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    ...context
  };
  
  logger.error(`Error: ${error.message}`, errorData);
};

// 健康检查日志方法
logger.health = function(service, status, details = {}) {
  const logData = {
    service,
    status,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  const level = status === 'healthy' ? 'info' : 'error';
  const message = `Health Check: ${service} is ${status}`;
  
  logger.log(level, message, logData);
};

// 启动日志
logger.startup = function(service, version, port, env) {
  const logData = {
    service,
    version,
    port,
    environment: env,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    timestamp: new Date().toISOString()
  };
  
  const message = `Service Started: ${service} v${version} on port ${port} (${env})`;
  logger.info(message, logData);
};

// 关闭日志
logger.shutdown = function(service, reason = 'Normal shutdown') {
  const logData = {
    service,
    reason,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
  
  const message = `Service Shutdown: ${service} - ${reason}`;
  logger.info(message, logData);
};

// 流式日志（用于实时监控）
logger.stream = {
  write: function(message) {
    logger.http(message.trim());
  }
};

// 日志级别映射
logger.levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// 获取日志统计信息
logger.getStats = function() {
  return {
    logDir,
    transports: transports.length,
    level: logger.level,
    files: {
      error: path.join(logDir, 'error.log'),
      combined: path.join(logDir, 'combined.log'),
      access: path.join(logDir, 'access.log'),
      exceptions: path.join(logDir, 'exceptions.log'),
      rejections: path.join(logDir, 'rejections.log')
    }
  };
};

// 清理旧日志文件
logger.cleanup = function(daysToKeep = 30) {
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  fs.readdir(logDir, (err, files) => {
    if (err) {
      logger.error('Failed to read log directory:', err);
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(logDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error(`Failed to delete old log file ${file}:`, err);
            } else {
              logger.info(`Deleted old log file: ${file}`);
            }
          });
        }
      });
    });
  });
};

// 定期清理日志（每天执行一次）
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    logger.cleanup();
  }, 24 * 60 * 60 * 1000); // 24小时
}

module.exports = logger;