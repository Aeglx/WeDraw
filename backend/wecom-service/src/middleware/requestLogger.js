const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * 请求日志中间件
 * 记录所有HTTP请求的详细信息
 */
const requestLogger = (req, res, next) => {
  // 生成请求ID
  req.requestId = uuidv4();
  
  // 记录请求开始时间
  const startTime = Date.now();
  
  // 获取客户端IP
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // 记录请求信息
  logger.info('HTTP Request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: clientIp,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    referer: req.get('Referer'),
    timestamp: new Date().toISOString()
  });
  
  // 记录请求体（仅在开发环境且非敏感数据）
  if (process.env.NODE_ENV === 'development' && req.body) {
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const logBody = { ...req.body };
    
    // 过滤敏感字段
    Object.keys(logBody).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        logBody[key] = '[FILTERED]';
      }
    });
    
    logger.debug('Request Body', {
      requestId: req.requestId,
      body: logBody
    });
  }
  
  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseSize = res.get('Content-Length') || 0;
    
    // 记录响应信息
    logger.info('HTTP Response', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: `${responseSize} bytes`,
      ip: clientIp,
      timestamp: new Date().toISOString()
    });
    
    // 记录慢请求
    if (duration > 1000) {
      logger.warn('Slow Request', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        duration: `${duration}ms`,
        ip: clientIp
      });
    }
    
    // 记录错误响应
    if (res.statusCode >= 400) {
      logger.error('Error Response', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: clientIp
      });
    }
  });
  
  // 监听响应错误事件
  res.on('error', (error) => {
    logger.error('Response Error', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      error: error.message,
      stack: error.stack,
      ip: clientIp
    });
  });
  
  next();
};

module.exports = requestLogger;