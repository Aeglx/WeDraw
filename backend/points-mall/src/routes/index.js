const express = require('express');
const userRoutes = require('./userRoutes');
const pointsRoutes = require('./pointsRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const orderRoutes = require('./orderRoutes');
const couponRoutes = require('./couponRoutes');
const adminRoutes = require('./adminRoutes');
const { asyncErrorHandler } = require('../utils/errors');
const { successResponse } = require('../utils/response');

/**
 * 积分商城路由配置
 */

const router = express.Router();

// API版本信息
router.get('/', asyncErrorHandler(async (req, res) => {
  successResponse(res, {
    service: 'Points Mall API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: '/api/users',
      points: '/api/points',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      coupons: '/api/coupons',
      admin: '/api/admin'
    }
  }, 'API服务正常运行');
}));

// 健康检查
router.get('/health', asyncErrorHandler(async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  successResponse(res, healthCheck, '服务健康状态正常');
}));

// 注册各模块路由
router.use('/users', userRoutes);
router.use('/points', pointsRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/admin', adminRoutes);

module.exports = router;