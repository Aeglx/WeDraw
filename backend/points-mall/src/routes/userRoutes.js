const express = require('express');
const UserController = require('../controllers/userController');
const { asyncErrorHandler } = require('../utils/errors');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rateLimit');

/**
 * 用户路由
 */

const router = express.Router();
const userController = new UserController();

// 应用认证中间件到所有路由
router.use(authenticate);

// 获取当前用户信息
router.get('/profile', 
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  asyncErrorHandler(userController.getUserProfile.bind(userController))
);

// 更新当前用户信息
router.put('/profile',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    body: {
      nickname: { type: 'string', optional: true, minLength: 2, maxLength: 20 },
      avatar: { type: 'string', optional: true, format: 'url' },
      phone: { type: 'string', optional: true, pattern: /^1[3-9]\d{9}$/ },
      email: { type: 'string', optional: true, format: 'email' },
      gender: { type: 'string', optional: true, enum: ['male', 'female', 'other'] },
      birthday: { type: 'string', optional: true, format: 'date' },
      address: {
        type: 'object',
        optional: true,
        properties: {
          province: { type: 'string' },
          city: { type: 'string' },
          district: { type: 'string' },
          detail: { type: 'string' },
          zipCode: { type: 'string', optional: true }
        }
      }
    }
  }),
  asyncErrorHandler(userController.updateUserProfile.bind(userController))
);

// 获取用户积分信息
router.get('/points',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  asyncErrorHandler(userController.getUserPoints.bind(userController))
);

// 获取用户优惠券
router.get('/coupons',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      status: { type: 'string', optional: true, enum: ['available', 'used', 'expired'] },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(userController.getUserCoupons.bind(userController))
);

// 获取用户订单
router.get('/orders',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      status: { type: 'string', optional: true, enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(userController.getUserOrders.bind(userController))
);

// 获取用户收藏
router.get('/favorites',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(userController.getUserFavorites.bind(userController))
);

// 添加商品到收藏
router.post('/favorites/:productId',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    params: {
      productId: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(userController.addToFavorites.bind(userController))
);

// 从收藏中移除商品
router.delete('/favorites/:productId',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    params: {
      productId: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(userController.removeFromFavorites.bind(userController))
);

// 获取用户地址列表
router.get('/addresses',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  asyncErrorHandler(userController.getUserAddresses.bind(userController))
);

// 添加用户地址
router.post('/addresses',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    body: {
      name: { type: 'string', minLength: 2, maxLength: 20 },
      phone: { type: 'string', pattern: /^1[3-9]\d{9}$/ },
      province: { type: 'string', minLength: 2, maxLength: 20 },
      city: { type: 'string', minLength: 2, maxLength: 20 },
      district: { type: 'string', minLength: 2, maxLength: 20 },
      detail: { type: 'string', minLength: 5, maxLength: 100 },
      zipCode: { type: 'string', optional: true, pattern: /^\d{6}$/ },
      isDefault: { type: 'boolean', optional: true, default: false }
    }
  }),
  asyncErrorHandler(userController.addUserAddress.bind(userController))
);

// 更新用户地址
router.put('/addresses/:addressId',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      addressId: { type: 'number', min: 1 }
    },
    body: {
      name: { type: 'string', optional: true, minLength: 2, maxLength: 20 },
      phone: { type: 'string', optional: true, pattern: /^1[3-9]\d{9}$/ },
      province: { type: 'string', optional: true, minLength: 2, maxLength: 20 },
      city: { type: 'string', optional: true, minLength: 2, maxLength: 20 },
      district: { type: 'string', optional: true, minLength: 2, maxLength: 20 },
      detail: { type: 'string', optional: true, minLength: 5, maxLength: 100 },
      zipCode: { type: 'string', optional: true, pattern: /^\d{6}$/ },
      isDefault: { type: 'boolean', optional: true }
    }
  }),
  asyncErrorHandler(userController.updateUserAddress.bind(userController))
);

// 删除用户地址
router.delete('/addresses/:addressId',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      addressId: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(userController.deleteUserAddress.bind(userController))
);

// 设置默认地址
router.put('/addresses/:addressId/default',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      addressId: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(userController.setDefaultAddress.bind(userController))
);

// 获取用户统计信息
router.get('/stats',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  asyncErrorHandler(userController.getUserStats.bind(userController))
);

// 获取用户积分交易记录
router.get('/points/transactions',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      type: { type: 'string', optional: true, enum: ['earn', 'spend', 'refund', 'expire'] },
      startDate: { type: 'string', optional: true, format: 'date' },
      endDate: { type: 'string', optional: true, format: 'date' },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(userController.getUserPointsTransactions.bind(userController))
);

// 用户签到
router.post('/checkin',
  rateLimit({ windowMs: 86400000, max: 1 }), // 1天1次
  asyncErrorHandler(userController.userCheckin.bind(userController))
);

// 获取签到状态
router.get('/checkin/status',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  asyncErrorHandler(userController.getCheckinStatus.bind(userController))
);

module.exports = router;