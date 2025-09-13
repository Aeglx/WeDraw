const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// 导入自定义模块
const logger = require('./src/utils/logger');
const db = require('./src/config/database');
const redisClient = require('./src/config/redis');
const routes = require('./src/routes');
const { globalLimiter } = require('./src/middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 3001;

// 信任代理（用于获取真实IP）
app.set('trust proxy', 1);

// 请求ID和时间戳中间件
app.use((req, res, next) => {
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', req.id);
  res.setHeader('X-Service', 'user-center');
  next();
});

// HTTP请求日志
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  },
  skip: (req) => {
    // 跳过健康检查和静态资源的日志
    return req.url === '/health' || req.url.startsWith('/uploads/');
  }
}));

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS配置
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8081'
    ];
    
    // 允许没有origin的请求（如移动应用、服务间调用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-User-Agent',
    'X-Forwarded-For'
  ],
  exposedHeaders: ['X-Request-ID', 'X-Total-Count', 'X-Page-Count']
};
app.use(cors(corsOptions));

// 压缩响应
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // 只压缩大于1KB的响应
}));

// 解析请求体
app.use(express.json({ 
  limit: process.env.MAX_JSON_SIZE || '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_FORM_SIZE || '10mb' 
}));

// 静态文件服务
app.use('/uploads', express.static(process.env.UPLOAD_PATH || './uploads', {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// 全局限流
app.use(globalLimiter);

// 请求日志中间件
app.use(requestLogger);

// 健康检查
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'user-center',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };

  // 检查数据库连接
  try {
    await db.authenticate();
    health.database = { status: 'connected', type: 'mysql' };
  } catch (error) {
    health.database = { status: 'disconnected', error: error.message };
    health.status = 'unhealthy';
  }

  // 检查Redis连接
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      health.redis = { status: 'connected' };
    } else {
      health.redis = { status: 'disconnected' };
    }
  } catch (error) {
    health.redis = { status: 'error', error: error.message };
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API路由
app.use('/api/v1', routes);
app.use('/api', routes); // 向后兼容

// API文档
app.get('/docs', (req, res) => {
  res.json({
    name: 'WeDraw User Center Service',
    version: process.env.npm_package_version || '1.0.0',
    description: '用户中心服务 - 统一身份认证和权限管理',
    endpoints: {
      'POST /api/v1/auth/register': '用户注册',
      'POST /api/v1/auth/login': '用户登录',
      'POST /api/v1/auth/logout': '用户登出',
      'POST /api/v1/auth/refresh': '刷新令牌',
      'POST /api/v1/auth/forgot-password': '忘记密码',
      'POST /api/v1/auth/reset-password': '重置密码',
      'GET /api/v1/users/profile': '获取用户资料',
      'PUT /api/v1/users/profile': '更新用户资料',
      'POST /api/v1/users/avatar': '上传头像',
      'GET /api/v1/users/permissions': '获取用户权限',
      'GET /api/v1/roles': '获取角色列表',
      'POST /api/v1/verification/sms': '发送短信验证码',
      'POST /api/v1/verification/email': '发送邮件验证码',
      'POST /api/v1/verification/verify': '验证验证码'
    },
    authentication: 'Bearer Token (JWT)',
    rateLimit: 'Dynamic rate limiting based on endpoint and user type',
    support: {
      email: 'support@wedraw.com',
      documentation: '/docs'
    }
  });
});

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const server = app.listen(PORT, async () => {
  logger.info(`🚀 User Center Service started on port ${PORT}`);
  logger.info(`📋 Health check: http://localhost:${PORT}/health`);
  logger.info(`📖 API docs: http://localhost:${PORT}/docs`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // 连接数据库
  try {
    await db.authenticate();
    logger.info('✅ Database connected successfully');
    
    // 同步数据库模型（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      await db.sync({ alter: true });
      logger.info('📊 Database models synchronized');
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
  
  // 连接Redis
  try {
    if (redisClient && typeof redisClient.connect === 'function') {
      await redisClient.connect();
    }
    logger.info('✅ Redis connected successfully');
  } catch (error) {
    logger.warn('⚠️  Redis connection failed:', error.message);
  }
});

// 优雅关闭
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // 关闭数据库连接
    try {
      await db.close();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting database:', error);
    }
    
    // 关闭Redis连接
    try {
      if (redisClient && typeof redisClient.quit === 'function') {
        await redisClient.quit();
      }
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
    }
    
    logger.info('Process terminated');
    process.exit(0);
  });
  
  // 强制退出（如果10秒内没有正常关闭）
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;