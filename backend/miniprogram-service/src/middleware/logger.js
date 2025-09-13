const morgan = require('morgan');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * 自定义日志格式
 */
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

morgan.token('session-id', (req) => {
  return req.session?.sessionId || 'none';
});

morgan.token('real-ip', (req) => {
  return req.headers['x-real-ip'] || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.ip;
});

morgan.token('response-time-ms', (req, res) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

morgan.token('body-size', (req) => {
  return req.headers['content-length'] || '0';
});

morgan.token('error-message', (req, res) => {
  return res.locals.errorMessage || '-';
});

/**
 * 请求日志格式
 */
const logFormat = {
  // 开发环境格式
  dev: ':method :url :status :response-time ms - :res[content-length] - :user-id',
  
  // 生产环境格式
  combined: ':real-ip - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms :session-id',
  
  // 简化格式
  short: ':real-ip :user-id :method :url :status :res[content-length] - :response-time ms',
  
  // JSON格式
  json: JSON.stringify({
    timestamp: ':date[iso]',
    method: ':method',
    url: ':url',
    status: ':status',
    responseTime: ':response-time',
    contentLength: ':res[content-length]',
    userAgent: ':user-agent',
    ip: ':real-ip',
    userId: ':user-id',
    sessionId: ':session-id',
    referrer: ':referrer'
  })
};

/**
 * 请求日志中间件
 */
const requestLogger = morgan(
  config.env === 'production' ? logFormat.combined : logFormat.dev,
  {
    stream: {
      write: (message) => {
        // 移除换行符并记录到日志系统
        logger.info(message.trim(), { type: 'access' });
      }
    },
    skip: (req, res) => {
      // 跳过健康检查和静态资源请求
      return req.url === '/health' || 
             req.url.startsWith('/static/') ||
             req.url.startsWith('/favicon.ico');
    }
  }
);

/**
 * 详细请求日志中间件（用于调试）
 */
const detailedLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.debug('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    sessionId: req.session?.sessionId,
    headers: req.headers,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.debug('Request completed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      sessionId: req.session?.sessionId,
      responseHeaders: res.getHeaders()
    });
  });
  
  next();
};

/**
 * 错误日志中间件
 */
const errorLogger = (error, req, res, next) => {
  // 记录错误信息
  logger.error('Request error', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      sessionId: req.session?.sessionId,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    }
  });
  
  // 将错误信息添加到响应本地变量
  res.locals.errorMessage = error.message;
  
  next(error);
};

/**
 * 慢请求日志中间件
 */
const slowRequestLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > threshold) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          userId: req.user?.id,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    });
    
    next();
  };
};

/**
 * 响应时间中间件
 */
const responseTimeLogger = (req, res, next) => {
  const startTime = process.hrtime();
  
  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const time = diff[0] * 1000 + diff[1] * 1e-6; // 转换为毫秒
    
    res.setHeader('X-Response-Time', time.toFixed(2));
    
    // 记录响应时间统计
    logger.debug('Response time', {
      method: req.method,
      url: req.originalUrl,
      responseTime: `${time.toFixed(2)}ms`,
      status: res.statusCode
    });
  });
  
  next();
};

/**
 * 请求统计中间件
 */
const requestStats = {
  counts: {},
  responseTimes: [],
  errors: {},
  lastReset: Date.now()
};

const statsLogger = (req, res, next) => {
  const startTime = Date.now();
  const key = `${req.method} ${req.route?.path || req.path}`;
  
  // 增加请求计数
  requestStats.counts[key] = (requestStats.counts[key] || 0) + 1;
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // 记录响应时间
    requestStats.responseTimes.push({
      endpoint: key,
      duration,
      timestamp: Date.now()
    });
    
    // 记录错误
    if (res.statusCode >= 400) {
      const errorKey = `${key}:${res.statusCode}`;
      requestStats.errors[errorKey] = (requestStats.errors[errorKey] || 0) + 1;
    }
    
    // 每小时输出统计信息
    if (Date.now() - requestStats.lastReset > 60 * 60 * 1000) {
      logger.info('Request statistics', {
        counts: requestStats.counts,
        averageResponseTime: calculateAverageResponseTime(),
        errors: requestStats.errors,
        period: '1 hour'
      });
      
      // 重置统计
      requestStats.counts = {};
      requestStats.responseTimes = [];
      requestStats.errors = {};
      requestStats.lastReset = Date.now();
    }
  });
  
  next();
};

/**
 * 计算平均响应时间
 */
const calculateAverageResponseTime = () => {
  if (requestStats.responseTimes.length === 0) return 0;
  
  const total = requestStats.responseTimes.reduce((sum, item) => sum + item.duration, 0);
  return Math.round(total / requestStats.responseTimes.length);
};

/**
 * 安全日志中间件（过滤敏感信息）
 */
const secureLogger = (req, res, next) => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  // 过滤请求体中的敏感信息
  if (req.body) {
    const filteredBody = { ...req.body };
    sensitiveFields.forEach(field => {
      if (filteredBody[field]) {
        filteredBody[field] = '[FILTERED]';
      }
    });
    req.filteredBody = filteredBody;
  }
  
  // 过滤请求头中的敏感信息
  const filteredHeaders = { ...req.headers };
  sensitiveFields.forEach(field => {
    if (filteredHeaders[field]) {
      filteredHeaders[field] = '[FILTERED]';
    }
  });
  req.filteredHeaders = filteredHeaders;
  
  next();
};

/**
 * 获取请求统计信息
 */
const getRequestStats = () => {
  return {
    ...requestStats,
    averageResponseTime: calculateAverageResponseTime(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
};

module.exports = {
  requestLogger,
  detailedLogger,
  errorLogger,
  slowRequestLogger: slowRequestLogger(),
  responseTimeLogger,
  statsLogger,
  secureLogger,
  getRequestStats,
  logFormat
};