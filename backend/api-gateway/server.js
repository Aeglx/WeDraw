const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

// 导入自定义模块
const logger = require('./src/utils/logger');
const redisClient = require('./src/config/redis');
const authMiddleware = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');
const { globalLimiter } = require('./src/middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// 信任代理（用于获取真实IP）
app.set('trust proxy', 1);

// 请求ID中间件
app.use((req, res, next) => {
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// 请求日志
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
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
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost:8081'
    ];
    
    // 允许没有origin的请求（如移动应用）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-User-Agent'
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining']
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

// 请求解析
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

// 全局限流
app.use(globalLimiter);

// 响应时间中间件
app.use((req, res, next) => {
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    logger.info('Request completed:', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  next();
});

// 健康检查
app.get('/health', async (req, res) => {
  try {
    // 检查Redis连接
    let redisStatus = 'disconnected';
    if (redisClient) {
      await redisClient.ping();
      redisStatus = 'connected';
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: require('./package.json').version,
      redis: redisStatus,
      memory: process.memoryUsage()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable'
    });
  }
});

// API路由
app.use('/api', routes);

// 微服务代理配置
const services = {
  '/api/user': {
    target: process.env.USER_CENTER_URL || 'http://localhost:3001',
    pathRewrite: { '^/api/user': '' }
  },
  '/api/wechat': {
    target: process.env.WECHAT_OFFICIAL_URL || 'http://localhost:3002',
    pathRewrite: { '^/api/wechat': '' }
  },
  '/api/wecom': {
    target: process.env.WECOM_SERVICE_URL || 'http://localhost:3003',
    pathRewrite: { '^/api/wecom': '' }
  },
  '/api/miniprogram': {
    target: process.env.MINIPROGRAM_SERVICE_URL || 'http://localhost:3004',
    pathRewrite: { '^/api/miniprogram': '' }
  },
  '/api/points': {
    target: process.env.POINTS_MALL_URL || 'http://localhost:3005',
    pathRewrite: { '^/api/points': '' }
  },
  '/api/message': {
    target: process.env.MESSAGE_CENTER_URL || 'http://localhost:3006',
    pathRewrite: { '^/api/message': '' }
  },
  '/api/analytics': {
    target: process.env.DATA_ANALYSIS_URL || 'http://localhost:3007',
    pathRewrite: { '^/api/analytics': '' }
  }
};

// 创建代理中间件
Object.keys(services).forEach(path => {
  const config = services[path];
  app.use(path, authMiddleware, createProxyMiddleware({
    target: config.target,
    changeOrigin: true,
    pathRewrite: config.pathRewrite,
    timeout: parseInt(process.env.PROXY_TIMEOUT) || 25000,
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${path}:`, err.message);
      res.status(503).json({
        error: 'Service temporarily unavailable',
        code: 'PROXY_ERROR',
        service: path
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // 添加请求头
      proxyReq.setHeader('X-Forwarded-For', req.ip);
      proxyReq.setHeader('X-Gateway-Version', require('./package.json').version);
      
      // 传递用户信息
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // 添加响应头
      proxyRes.headers['X-Gateway-Timestamp'] = new Date().toISOString();
    }
  }));
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use(errorHandler);

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  if (redisClient) {
    await redisClient.quit();
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  if (redisClient) {
    await redisClient.quit();
  }
  
  process.exit(0);
});

// 启动服务器
const server = app.listen(PORT, async () => {
  logger.info(`🚀 API Gateway started on port ${PORT}`);
  logger.info(`📋 Health check: http://localhost:${PORT}/health`);
  logger.info(`📖 API docs: http://localhost:${PORT}/docs`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
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