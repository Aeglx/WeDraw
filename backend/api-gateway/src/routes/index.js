const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const logger = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
const { dynamicLimiter, authLimiter, messageLimiter, uploadLimiter, searchLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * 微服务配置
 */
const services = {
  'user-center': {
    target: process.env.USER_CENTER_URL || 'http://localhost:3001',
    pathRewrite: { '^/api/user': '' },
    timeout: 30000
  },
  'wechat-official': {
    target: process.env.WECHAT_OFFICIAL_URL || 'http://localhost:3002',
    pathRewrite: { '^/api/wechat': '' },
    timeout: 30000
  },
  'wecom': {
    target: process.env.WECOM_URL || 'http://localhost:3003',
    pathRewrite: { '^/api/wecom': '' },
    timeout: 30000
  },
  'miniprogram': {
    target: process.env.MINIPROGRAM_URL || 'http://localhost:3004',
    pathRewrite: { '^/api/miniprogram': '' },
    timeout: 30000
  },
  'points-mall': {
    target: process.env.POINTS_MALL_URL || 'http://localhost:3005',
    pathRewrite: { '^/api/points': '' },
    timeout: 30000
  },
  'message-center': {
    target: process.env.MESSAGE_CENTER_URL || 'http://localhost:3006',
    pathRewrite: { '^/api/message': '' },
    timeout: 30000
  },
  'data-analytics': {
    target: process.env.DATA_ANALYTICS_URL || 'http://localhost:3007',
    pathRewrite: { '^/api/analytics': '' },
    timeout: 30000
  }
};

/**
 * 创建代理中间件
 */
const createProxy = (serviceName, options = {}) => {
  const serviceConfig = services[serviceName];
  if (!serviceConfig) {
    throw new Error(`Service ${serviceName} not found`);
  }

  return createProxyMiddleware({
    target: serviceConfig.target,
    changeOrigin: true,
    pathRewrite: serviceConfig.pathRewrite,
    timeout: serviceConfig.timeout,
    ...options,
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}:`, {
        error: err.message,
        target: serviceConfig.target,
        url: req.url,
        method: req.method
      });
      
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          service: serviceName,
          timestamp: new Date().toISOString()
        });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      // 添加请求头
      proxyReq.setHeader('X-Forwarded-For', req.ip);
      proxyReq.setHeader('X-Real-IP', req.ip);
      proxyReq.setHeader('X-Gateway-Version', process.env.npm_package_version || '1.0.0');
      
      // 传递用户信息
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.id);
        proxyReq.setHeader('X-User-Role', req.user.role || 'user');
        proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions || []));
      }
      
      // 记录代理请求
      logger.info(`Proxying request to ${serviceName}:`, {
        method: req.method,
        url: req.url,
        target: serviceConfig.target,
        userId: req.user?.id
      });
    },
    onProxyRes: (proxyRes, req, res) => {
      // 记录代理响应
      logger.info(`Proxy response from ${serviceName}:`, {
        statusCode: proxyRes.statusCode,
        method: req.method,
        url: req.url,
        responseTime: Date.now() - req.startTime
      });
    }
  });
};

/**
 * 健康检查路由
 */
router.get('/health', asyncHandler(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {}
  };

  // 检查各个微服务的健康状态
  for (const [serviceName, config] of Object.entries(services)) {
    try {
      const response = await fetch(`${config.target}/health`, {
        method: 'GET',
        timeout: 5000
      });
      health.services[serviceName] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        url: config.target
      };
    } catch (error) {
      health.services[serviceName] = {
        status: 'unhealthy',
        url: config.target,
        error: error.message
      };
    }
  }

  res.json(health);
}));

/**
 * API文档路由
 */
router.get('/docs', (req, res) => {
  res.json({
    name: 'WeDraw API Gateway',
    version: process.env.npm_package_version || '1.0.0',
    description: 'API Gateway for WeDraw microservices',
    services: Object.keys(services),
    endpoints: {
      '/api/user/*': 'User Center Service',
      '/api/wechat/*': 'WeChat Official Account Service',
      '/api/wecom/*': 'WeCom Service',
      '/api/miniprogram/*': 'Mini Program Service',
      '/api/points/*': 'Points Mall Service',
      '/api/message/*': 'Message Center Service',
      '/api/analytics/*': 'Data Analytics Service'
    },
    authentication: 'Bearer Token (JWT)',
    rateLimit: 'Dynamic rate limiting based on user type and endpoint'
  });
});

/**
 * 用户中心服务路由
 */
router.use('/api/user/auth/login', authLimiter);
router.use('/api/user/auth/register', authLimiter);
router.use('/api/user/auth/forgot-password', authLimiter);
router.use('/api/user/*', dynamicLimiter, createProxy('user-center'));

/**
 * 微信公众号服务路由
 */
router.use('/api/wechat/webhook', express.raw({ type: 'text/xml' })); // 微信回调需要原始数据
router.use('/api/wechat/message/send', messageLimiter);
router.use('/api/wechat/*', authMiddleware, dynamicLimiter, createProxy('wechat-official'));

/**
 * 企业微信服务路由
 */
router.use('/api/wecom/webhook', express.raw({ type: 'application/json' })); // 企业微信回调
router.use('/api/wecom/message/send', messageLimiter);
router.use('/api/wecom/*', authMiddleware, dynamicLimiter, createProxy('wecom'));

/**
 * 小程序服务路由
 */
router.use('/api/miniprogram/auth/login', authLimiter);
router.use('/api/miniprogram/message/send', messageLimiter);
router.use('/api/miniprogram/*', dynamicLimiter, createProxy('miniprogram'));

/**
 * 积分商城服务路由
 */
router.use('/api/points/upload/*', uploadLimiter);
router.use('/api/points/search', searchLimiter);
router.use('/api/points/*', authMiddleware, dynamicLimiter, createProxy('points-mall'));

/**
 * 消息中心服务路由
 */
router.use('/api/message/send', messageLimiter);
router.use('/api/message/batch-send', messageLimiter);
router.use('/api/message/*', authMiddleware, dynamicLimiter, createProxy('message-center'));

/**
 * 数据分析服务路由
 */
router.use('/api/analytics/search', searchLimiter);
router.use('/api/analytics/*', authMiddleware, dynamicLimiter, createProxy('data-analytics'));

/**
 * 通用文件上传路由（可以路由到不同服务）
 */
router.use('/api/upload/*', authMiddleware, uploadLimiter, (req, res, next) => {
  // 根据上传类型路由到不同服务
  const uploadType = req.path.split('/')[3]; // /api/upload/{type}/...
  
  switch (uploadType) {
    case 'avatar':
    case 'profile':
      return createProxy('user-center')(req, res, next);
    case 'product':
    case 'mall':
      return createProxy('points-mall')(req, res, next);
    case 'wechat':
      return createProxy('wechat-official')(req, res, next);
    case 'wecom':
      return createProxy('wecom')(req, res, next);
    default:
      return createProxy('user-center')(req, res, next); // 默认路由到用户中心
  }
});

/**
 * 通用搜索路由
 */
router.use('/api/search/*', authMiddleware, searchLimiter, (req, res, next) => {
  // 根据搜索类型路由到不同服务
  const searchType = req.path.split('/')[3]; // /api/search/{type}/...
  
  switch (searchType) {
    case 'users':
      return createProxy('user-center')(req, res, next);
    case 'products':
    case 'orders':
      return createProxy('points-mall')(req, res, next);
    case 'messages':
      return createProxy('message-center')(req, res, next);
    case 'analytics':
    case 'reports':
      return createProxy('data-analytics')(req, res, next);
    default:
      return createProxy('data-analytics')(req, res, next); // 默认路由到数据分析服务
  }
});

/**
 * 服务状态检查路由
 */
router.get('/api/services/status', authMiddleware, asyncHandler(async (req, res) => {
  const status = {};
  
  for (const [serviceName, config] of Object.entries(services)) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${config.target}/health`, {
        method: 'GET',
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;
      
      status[serviceName] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        url: config.target,
        responseTime,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      status[serviceName] = {
        status: 'error',
        url: config.target,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
  
  res.json(status);
}));

module.exports = router;