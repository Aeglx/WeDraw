const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * 仪表盘数据限流
 */
const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 30, // 每分钟最多30次请求
  message: {
    success: false,
    message: 'Too many dashboard requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route   GET /api/dashboard/stats
 * @desc    获取仪表盘统计数据
 * @access  Private (Admin)
 */
router.get('/stats', 
  authenticate,
  requireRole(['admin']),
  dashboardLimiter,
  async (req, res) => {
    try {
      // 模拟统计数据
      const stats = {
        totalUsers: 1250,
        activeUsers: 890,
        totalOrders: 3420,
        totalRevenue: 125600.50,
        newUsersToday: 23,
        ordersToday: 45,
        revenueToday: 2340.80,
        growthRate: {
          users: 12.5,
          orders: 8.3,
          revenue: 15.2
        },
        topProducts: [
          { name: '产品A', sales: 234, revenue: 12340 },
          { name: '产品B', sales: 189, revenue: 9450 },
          { name: '产品C', sales: 156, revenue: 7800 }
        ]
      };

      logger.info('Dashboard stats requested', {
        userId: req.user.id,
        userRole: req.user.role
      });

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: '获取仪表盘统计数据失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/dashboard/user-growth
 * @desc    获取用户增长数据
 * @access  Private (Admin)
 */
router.get('/user-growth',
  authenticate,
  requireRole(['admin']),
  dashboardLimiter,
  async (req, res) => {
    try {
      // 模拟用户增长数据（最近30天）
      const userGrowthData = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        userGrowthData.push({
          date: date.toISOString().split('T')[0],
          newUsers: Math.floor(Math.random() * 50) + 10,
          activeUsers: Math.floor(Math.random() * 200) + 100,
          totalUsers: 1000 + (29 - i) * 8 + Math.floor(Math.random() * 20)
        });
      }

      logger.info('User growth data requested', {
        userId: req.user.id,
        userRole: req.user.role
      });

      res.json({
        success: true,
        data: userGrowthData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching user growth data:', error);
      res.status(500).json({
        success: false,
        message: '获取用户增长数据失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/dashboard/order-stats
 * @desc    获取订单统计数据
 * @access  Private (Admin)
 */
router.get('/order-stats',
  authenticate,
  requireRole(['admin']),
  dashboardLimiter,
  async (req, res) => {
    try {
      // 模拟订单统计数据
      const orderStats = {
        daily: [],
        monthly: [],
        categories: [
          { name: '数字绘画', orders: 450, revenue: 22500 },
          { name: '插画设计', orders: 320, revenue: 16000 },
          { name: '品牌设计', orders: 280, revenue: 14000 },
          { name: '包装设计', orders: 190, revenue: 9500 },
          { name: '其他', orders: 160, revenue: 8000 }
        ],
        status: {
          pending: 45,
          processing: 123,
          completed: 2890,
          cancelled: 67,
          refunded: 23
        }
      };

      // 生成最近7天的订单数据
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        orderStats.daily.push({
          date: date.toISOString().split('T')[0],
          orders: Math.floor(Math.random() * 100) + 20,
          revenue: Math.floor(Math.random() * 5000) + 1000
        });
      }

      // 生成最近12个月的订单数据
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        
        orderStats.monthly.push({
          month: date.toISOString().substring(0, 7),
          orders: Math.floor(Math.random() * 500) + 200,
          revenue: Math.floor(Math.random() * 25000) + 10000
        });
      }

      logger.info('Order stats requested', {
        userId: req.user.id,
        userRole: req.user.role
      });

      res.json({
        success: true,
        data: orderStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching order stats:', error);
      res.status(500).json({
        success: false,
        message: '获取订单统计数据失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/dashboard/system-info
 * @desc    获取系统信息
 * @access  Private (Admin)
 */
router.get('/system-info',
  authenticate,
  requireRole(['admin']),
  dashboardLimiter,
  async (req, res) => {
    try {
      const systemInfo = {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          platform: process.platform
        },
        database: {
          status: 'connected',
          connections: 12,
          maxConnections: 100
        },
        redis: {
          status: 'connected',
          memory: '45.2MB',
          keys: 1250
        },
        services: {
          userCenter: 'running',
          apiGateway: 'running',
          pointsMall: 'running',
          wechatService: 'running'
        }
      };

      logger.info('System info requested', {
        userId: req.user.id,
        userRole: req.user.role
      });

      res.json({
        success: true,
        data: systemInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching system info:', error);
      res.status(500).json({
        success: false,
        message: '获取系统信息失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;