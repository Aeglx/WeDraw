const express = require('express');
const userRoutes = require('./userRoutes');
const messageRoutes = require('./messageRoutes');
const { authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validator');
const { errorHandler } = require('../middleware/errorHandler');
const { requestLogger } = require('../middleware/logger');

const router = express.Router();

// 应用全局中间件
router.use(requestLogger);
router.use(rateLimiter);

// API版本路由
router.use('/v1/users', userRoutes);
router.use('/v1/messages', messageRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'miniprogram-service',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API文档重定向
router.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

// 404处理
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 错误处理中间件
router.use(errorHandler);

module.exports = router;