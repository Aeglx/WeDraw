/**
 * 企业微信服务中间件
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const { validationResult } = require('express-validator');

/**
 * JWT认证中间件
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 401,
      message: '访问令牌缺失',
      timestamp: new Date().toISOString()
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'wework-service-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '访问令牌无效',
        timestamp: new Date().toISOString()
      });
    }

    req.user = user;
    next();
  });
};

/**
 * 可选JWT认证中间件
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'wework-service-secret', (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

/**
 * API密钥认证中间件
 */
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      code: 401,
      message: 'API密钥缺失',
      timestamp: new Date().toISOString()
    });
  }

  // 验证API密钥
  const validApiKeys = (process.env.API_KEYS || '').split(',').filter(key => key.trim());
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      code: 403,
      message: 'API密钥无效',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Webhook签名验证中间件
 */
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const body = JSON.stringify(req.body);

  if (!signature || !timestamp) {
    return res.status(401).json({
      success: false,
      code: 401,
      message: 'Webhook签名信息缺失',
      timestamp: new Date().toISOString()
    });
  }

  // 检查时间戳（防重放攻击）
  const now = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp);
  
  if (Math.abs(now - requestTime) > 300) { // 5分钟内有效
    return res.status(401).json({
      success: false,
      code: 401,
      message: 'Webhook请求已过期',
      timestamp: new Date().toISOString()
    });
  }

  // 验证签名
  const crypto = require('crypto');
  const secret = process.env.WEBHOOK_SECRET || 'wework-webhook-secret';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(timestamp + body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({
      success: false,
      code: 401,
      message: 'Webhook签名验证失败',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * 请求验证中间件
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: 400,
      message: '请求参数验证失败',
      errors: errors.array(),
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * 请求日志中间件
 */
const requestLogger = morgan('combined', {
  stream: {
    write: (message) => {
      console.log(message.trim());
    }
  },
  skip: (req, res) => {
    // 跳过健康检查请求的日志
    return req.url === '/api/health';
  }
});

/**
 * 错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('服务错误:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Sequelize错误处理
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      code: 400,
      message: '数据验证失败',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      })),
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      code: 400,
      message: '数据重复',
      errors: err.errors.map(e => ({
        field: e.path,
        message: `${e.path} 已存在`
      })),
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      code: 400,
      message: '关联数据不存在',
      timestamp: new Date().toISOString()
    });
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      code: 401,
      message: '访问令牌无效',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 401,
      message: '访问令牌已过期',
      timestamp: new Date().toISOString()
    });
  }

  // 默认错误响应
  res.status(err.status || 500).json({
    success: false,
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * 404处理中间件
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    code: 404,
    message: '请求的资源不存在',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * 速率限制配置
 */
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: {
      success: false,
      code: 429,
      message: '请求过于频繁，请稍后再试',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

/**
 * API速率限制
 */
const apiRateLimit = createRateLimit(15 * 60 * 1000, 1000); // 15分钟1000次

/**
 * Webhook速率限制
 */
const webhookRateLimit = createRateLimit(1 * 60 * 1000, 100); // 1分钟100次

/**
 * 严格速率限制（用于敏感操作）
 */
const strictRateLimit = createRateLimit(15 * 60 * 1000, 10); // 15分钟10次

/**
 * CORS配置
 */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    
    // 允许没有origin的请求（如移动应用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('不允许的跨域请求'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Signature', 'X-Timestamp']
};

/**
 * 安全头配置
 */
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
};

/**
 * 压缩配置
 */
const compressionOptions = {
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
};

/**
 * IP白名单中间件
 */
const ipWhitelist = (whitelist = []) => {
  return (req, res, next) => {
    if (whitelist.length === 0) {
      return next();
    }

    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (!whitelist.includes(clientIp)) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: 'IP地址不在白名单中',
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * 请求大小限制中间件
 */
const requestSizeLimit = (limit = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = parseSize(limit);
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        code: 413,
        message: '请求体过大',
        maxSize: limit,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * 解析大小字符串
 */
function parseSize(size) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(\w+)?$/);
  
  if (!match) {
    throw new Error('Invalid size format');
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * (units[unit] || 1));
}

module.exports = {
  // 认证中间件
  authenticateToken,
  optionalAuth,
  authenticateApiKey,
  verifyWebhookSignature,
  
  // 验证中间件
  validateRequest,
  
  // 日志中间件
  requestLogger,
  
  // 错误处理中间件
  errorHandler,
  notFoundHandler,
  
  // 速率限制中间件
  apiRateLimit,
  webhookRateLimit,
  strictRateLimit,
  createRateLimit,
  
  // 安全中间件
  cors: cors(corsOptions),
  helmet: helmet(helmetOptions),
  compression: compression(compressionOptions),
  ipWhitelist,
  requestSizeLimit,
  
  // 配置选项
  corsOptions,
  helmetOptions,
  compressionOptions
};