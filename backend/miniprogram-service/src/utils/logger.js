const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

// 日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// 控制台日志格式
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// 创建日志目录
const logDir = path.join(process.cwd(), 'logs');

// 传输器配置
const transports = [];

// 控制台输出
if (config.env !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.env === 'development' ? 'debug' : 'info'
    })
  );
}

// 错误日志文件
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  })
);

// 组合日志文件
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  })
);

// HTTP访问日志
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'access-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  levels,
  format: logFormat,
  transports,
  exitOnError: false
});

// 异常处理
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join(logDir, 'exceptions-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  })
);

// 未捕获的Promise拒绝
logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join(logDir, 'rejections-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  })
);

// 扩展logger功能
class ExtendedLogger {
  constructor(winstonLogger) {
    this.logger = winstonLogger;
  }

  // 基础日志方法
  error(message, meta = {}) {
    this.logger.error(message, { ...meta, service: 'miniprogram-service' });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, { ...meta, service: 'miniprogram-service' });
  }

  info(message, meta = {}) {
    this.logger.info(message, { ...meta, service: 'miniprogram-service' });
  }

  http(message, meta = {}) {
    this.logger.http(message, { ...meta, service: 'miniprogram-service' });
  }

  debug(message, meta = {}) {
    this.logger.debug(message, { ...meta, service: 'miniprogram-service' });
  }

  // 业务日志方法
  userAction(action, userId, meta = {}) {
    this.info(`User action: ${action}`, {
      userId,
      action,
      ...meta,
      type: 'user_action'
    });
  }

  apiCall(method, url, statusCode, responseTime, meta = {}) {
    this.http(`${method} ${url} ${statusCode}`, {
      method,
      url,
      statusCode,
      responseTime,
      ...meta,
      type: 'api_call'
    });
  }

  dbQuery(query, duration, meta = {}) {
    this.debug(`Database query: ${query}`, {
      query,
      duration,
      ...meta,
      type: 'db_query'
    });
  }

  security(event, details, meta = {}) {
    this.warn(`Security event: ${event}`, {
      event,
      details,
      ...meta,
      type: 'security'
    });
  }

  performance(metric, value, meta = {}) {
    this.info(`Performance metric: ${metric} = ${value}`, {
      metric,
      value,
      ...meta,
      type: 'performance'
    });
  }

  business(event, data, meta = {}) {
    this.info(`Business event: ${event}`, {
      event,
      data,
      ...meta,
      type: 'business'
    });
  }

  // 结构化日志方法
  structured(level, message, data = {}) {
    this.logger.log(level, message, {
      ...data,
      timestamp: new Date().toISOString(),
      service: 'miniprogram-service',
      structured: true
    });
  }

  // 条件日志
  errorIf(condition, message, meta = {}) {
    if (condition) {
      this.error(message, meta);
    }
  }

  warnIf(condition, message, meta = {}) {
    if (condition) {
      this.warn(message, meta);
    }
  }

  // 计时器
  startTimer(label) {
    const start = process.hrtime.bigint();
    return {
      end: (meta = {}) => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // 转换为毫秒
        this.debug(`Timer ${label}: ${duration.toFixed(2)}ms`, {
          label,
          duration,
          ...meta,
          type: 'timer'
        });
        return duration;
      }
    };
  }

  // 批量日志
  batch(logs) {
    logs.forEach(({ level, message, meta }) => {
      this[level](message, meta);
    });
  }

  // 日志统计
  getStats() {
    return {
      transports: this.logger.transports.length,
      level: this.logger.level,
      levels: Object.keys(levels)
    };
  }

  // 动态设置日志级别
  setLevel(level) {
    this.logger.level = level;
    this.info(`Log level changed to: ${level}`);
  }

  // 添加临时传输器
  addTransport(transport) {
    this.logger.add(transport);
  }

  // 移除传输器
  removeTransport(transport) {
    this.logger.remove(transport);
  }

  // 清理旧日志文件
  async cleanup(days = 30) {
    const fs = require('fs').promises;
    const glob = require('glob');
    
    try {
      const files = glob.sync(path.join(logDir, '*.log'));
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      for (const file of files) {
        const stats = await fs.stat(file);
        if (stats.mtime < cutoffDate) {
          await fs.unlink(file);
          this.info(`Cleaned up old log file: ${file}`);
        }
      }
    } catch (error) {
      this.error('Failed to cleanup log files:', error);
    }
  }
}

// 创建扩展logger实例
const extendedLogger = new ExtendedLogger(logger);

// 启动时记录服务信息
extendedLogger.info('Logger initialized', {
  environment: config.env,
  logLevel: logger.level,
  logDirectory: logDir,
  transports: logger.transports.length
});

module.exports = extendedLogger;