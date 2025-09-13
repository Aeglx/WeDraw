const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const logger = require('./src/utils/logger');
const authMiddleware = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');
const config = require('../../config.json');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || config.ports.api_gateway || 3000;

// 基础中间件
app.use(helmet());
app.use(compression());
app.use(cors(config.cors));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 限流中间件
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 限制每个IP每分钟最多100个请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'API Gateway is running',
    data: {
      service: 'api-gateway',
      version: '1.0.0',
      timestamp: Date.now()
    }
  });
});

// API文档路由
app.get('/docs', (req, res) => {
  res.json({
    code: 200,
    message: 'API Documentation',
    data: {
      title: 'WeDraw Platform API',
      version: '1.0.0',
      description: '企业微信、公众号、小程序及积分商城管理平台API',
      baseUrl: `http://localhost:${PORT}`,
      endpoints: {
        user_center: '/api/v1/user',
        official_account: '/api/v1/official',
        wecom: '/api/v1/wecom',
        miniprogram: '/api/v1/miniprogram',
        points: '/api/v1/points',
        message: '/api/v1/message',
        analysis: '/api/v1/analysis'
      }
    }
  });
});

// 服务代理配置
const services = {
  user: {
    target: `http://localhost:${config.ports.user_center}`,
    pathRewrite: { '^/api/v1/user': '' }
  },
  official: {
    target: `http://localhost:${config.ports.official_account}`,
    pathRewrite: { '^/api/v1/official': '' }
  },
  wecom: {
    target: `http://localhost:${config.ports.wecom}`,
    pathRewrite: { '^/api/v1/wecom': '' }
  },
  miniprogram: {
    target: `http://localhost:${config.ports.miniprogram}`,
    pathRewrite: { '^/api/v1/miniprogram': '' }
  },
  points: {
    target: `http://localhost:${config.ports.points}`,
    pathRewrite: { '^/api/v1/points': '' }
  },
  message: {
    target: `http://localhost:${config.ports.message}`,
    pathRewrite: { '^/api/v1/message': '' }
  },
  analysis: {
    target: `http://localhost:${config.ports.analysis}`,
    pathRewrite: { '^/api/v1/analysis': '' }
  }
};

// 公开路由（不需要认证）
const publicRoutes = [
  '/api/v1/user/login',
  '/api/v1/user/register',
  '/api/v1/official/webhook',
  '/api/v1/wecom/webhook',
  '/api/v1/miniprogram/auth'
];

// 认证中间件（排除公开路由）
app.use('/api', (req, res, next) => {
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
  if (isPublicRoute) {
    return next();
  }
  return authMiddleware(req, res, next);
});

// 设置代理路由
Object.keys(services).forEach(serviceName => {
  const serviceConfig = services[serviceName];
  const routePath = `/api/v1/${serviceName === 'user' ? 'user' : serviceName}`;
  
  app.use(routePath, createProxyMiddleware({
    target: serviceConfig.target,
    changeOrigin: true,
    pathRewrite: serviceConfig.pathRewrite,
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}:`, err.message);
      res.status(503).json({
        code: 503,
        message: `${serviceName}服务暂时不可用`,
        data: null,
        timestamp: Date.now()
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // 添加请求头
      proxyReq.setHeader('X-Forwarded-For', req.ip);
      proxyReq.setHeader('X-Gateway-Service', serviceName);
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // 记录响应日志
      logger.info(`${serviceName} service response: ${proxyRes.statusCode} ${req.method} ${req.path}`);
    }
  }));
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
    timestamp: Date.now()
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务
app.listen(PORT, () => {
  logger.info(`API Gateway服务启动成功，端口: ${PORT}`);
  logger.info(`健康检查: http://localhost:${PORT}/health`);
  logger.info(`API文档: http://localhost:${PORT}/docs`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在关闭服务...');
  process.exit(0);
});

module.exports = app;