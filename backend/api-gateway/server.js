const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const logger = require('./src/utils/logger');
const redisClient = require('./src/config/redis');
const authMiddleware = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization'
}));

// 请求日志
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 限流中间件
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? {
    incr: async (key) => {
      const result = await redisClient.incr(key);
      if (result === 1) {
        await redisClient.expire(key, Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000) / 1000));
      }
      return result;
    },
    decrement: async (key) => {
      return await redisClient.decr(key);
    },
    resetKey: async (key) => {
      return await redisClient.del(key);
    }
  } : undefined
});

app.use('/api', limiter);

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
app.listen(PORT, () => {
  logger.info(`API Gateway started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Health check available at: http://localhost:${PORT}/health`);
});

module.exports = app;