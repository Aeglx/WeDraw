const express = require('express');
const CouponController = require('../controllers/couponController');
const { asyncErrorHandler } = require('../utils/errors');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rateLimit');

/**
 * 优惠券路由
 */

const router = express.Router();
const couponController = new CouponController();

// 公开路由 - 不需要认证

// 获取可用优惠券列表
router.get('/available',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      type: { type: 'string', optional: true, enum: ['discount', 'points', 'shipping'] },
      minOrderAmount: { type: 'number', optional: true, min: 0 },
      categoryId: { type: 'number', optional: true, min: 1 },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 50, default: 20 }
    }
  }),
  asyncErrorHandler(couponController.getAvailableCoupons.bind(couponController))
);

// 根据代码获取优惠券信息
router.get('/code/:code',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    params: {
      code: { type: 'string', minLength: 4, maxLength: 20 }
    }
  }),
  asyncErrorHandler(couponController.getCouponByCode.bind(couponController))
);

// 需要认证的路由
router.use(authenticate);

// 获取用户优惠券
router.get('/my',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      status: { type: 'string', optional: true, enum: ['available', 'used', 'expired'] },
      type: { type: 'string', optional: true, enum: ['discount', 'points', 'shipping'] },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 50, default: 20 }
    }
  }),
  asyncErrorHandler(couponController.getUserCoupons.bind(couponController))
);

// 领取优惠券
router.post('/:id/claim',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(couponController.claimCoupon.bind(couponController))
);

// 通过代码领取优惠券
router.post('/claim-by-code',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    body: {
      code: { type: 'string', minLength: 4, maxLength: 20 }
    }
  }),
  asyncErrorHandler(couponController.claimCouponByCode.bind(couponController))
);

// 验证优惠券可用性
router.post('/validate',
  rateLimit({ windowMs: 60000, max: 30 }), // 1分钟30次
  validateRequest({
    body: {
      couponId: { type: 'number', min: 1 },
      orderAmount: { type: 'number', min: 0 },
      productIds: {
        type: 'array',
        optional: true,
        items: { type: 'number', min: 1 }
      },
      categoryIds: {
        type: 'array',
        optional: true,
        items: { type: 'number', min: 1 }
      }
    }
  }),
  asyncErrorHandler(couponController.validateCoupon.bind(couponController))
);

// 计算优惠券折扣
router.post('/calculate-discount',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    body: {
      couponId: { type: 'number', min: 1 },
      orderAmount: { type: 'number', min: 0 },
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            productId: { type: 'number', min: 1 },
            categoryId: { type: 'number', min: 1 },
            points: { type: 'number', min: 0 },
            quantity: { type: 'number', min: 1 }
          },
          required: ['productId', 'categoryId', 'points', 'quantity']
        }
      }
    }
  }),
  asyncErrorHandler(couponController.calculateDiscount.bind(couponController))
);

// 获取用户优惠券统计
router.get('/my/stats',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  asyncErrorHandler(couponController.getUserCouponStats.bind(couponController))
);

// 管理员路由 - 需要管理员权限
router.use('/admin', authorize(['admin', 'super_admin']));

// 获取优惠券列表
router.get('/admin',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    query: {
      name: { type: 'string', optional: true, minLength: 1, maxLength: 50 },
      code: { type: 'string', optional: true, minLength: 4, maxLength: 20 },
      type: { type: 'string', optional: true, enum: ['discount', 'points', 'shipping'] },
      status: { type: 'string', optional: true, enum: ['active', 'inactive', 'expired'] },
      startDate: { type: 'string', optional: true, format: 'date' },
      endDate: { type: 'string', optional: true, format: 'date' },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(couponController.adminGetCoupons.bind(couponController))
);

// 获取优惠券详情
router.get('/admin/:id',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(couponController.adminGetCouponById.bind(couponController))
);

// 创建优惠券
router.post('/admin',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    body: {
      name: { type: 'string', minLength: 2, maxLength: 50 },
      description: { type: 'string', optional: true, maxLength: 500 },
      code: { type: 'string', optional: true, minLength: 4, maxLength: 20 },
      type: { type: 'string', enum: ['discount', 'points', 'shipping'] },
      value: { type: 'number', min: 0 },
      isPercentage: { type: 'boolean', optional: true, default: false },
      minOrderAmount: { type: 'number', optional: true, min: 0, default: 0 },
      maxDiscountAmount: { type: 'number', optional: true, min: 0 },
      totalQuantity: { type: 'number', min: 1, max: 999999 },
      limitPerUser: { type: 'number', optional: true, min: 1, max: 999, default: 1 },
      startTime: { type: 'string', format: 'datetime' },
      endTime: { type: 'string', format: 'datetime' },
      applicableProducts: {
        type: 'array',
        optional: true,
        items: { type: 'number', min: 1 }
      },
      applicableCategories: {
        type: 'array',
        optional: true,
        items: { type: 'number', min: 1 }
      },
      excludeProducts: {
        type: 'array',
        optional: true,
        items: { type: 'number', min: 1 }
      },
      excludeCategories: {
        type: 'array',
        optional: true,
        items: { type: 'number', min: 1 }
      },
      userLevels: {
        type: 'array',
        optional: true,
        items: { type: 'string' }
      },
      newUserOnly: { type: 'boolean', optional: true, default: false },
      stackable: { type: 'boolean', optional: true, default: false },
      autoApply: { type: 'boolean', optional: true, default: false },
      status: { type: 'string', optional: true, enum: ['active', 'inactive'], default: 'active' }
    }
  }),
  asyncErrorHandler(couponController.adminCreateCoupon.bind(couponController))
);

// 更新优惠券
router.put('/admin/:id',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      name: { type: 'string', optional: true, minLength: 2, maxLength: 50 },
      description: { type: 'string', optional: true, maxLength: 500 },
      code: { type: 'string', optional: true, minLength: 4, maxLength: 20 },
      type: { type: 'string', optional: true, enum: ['discount', 'points', 'shipping'] },
      value: { type: 'number', optional: true, min: 0 },
      isPercentage: { type: 'boolean', optional: true },
      minOrderAmount: { type: 'number', optional: true, min: 0 },
      maxDiscountAmount: { type: 'number', optional: true, min: 0 },
      totalQuantity: { type: 'number', optional: true, min: 1, max: 999999 },
      limitPerUser: { type: 'number', optional: true, min: 1, max: 999 },
      startTime: { type: 'string', optional: true, format: 'datetime' },
      endTime: { type: 'string', optional: true, format: 'datetime' },
      applicableProducts: {
        type: 'array',
        optional: true,
        items: { type: 'number', min: 1 }
      },
      applicableCategories: {
        type: 'array',
        optional: true,
        items: { type: 'number', min: 1 }
      },
      excludeProducts: {
        type: 'array',
        optional: true,
        items: { type: 'number', min: 1 }
      },
      excludeCategories: {
        type: 'array',
        optional: true,
        items: { type: 'number', min: 1 }
      },
      userLevels: {
        type: 'array',
        optional: true,
        items: { type: 'string' }
      },
      newUserOnly: { type: 'boolean', optional: true },
      stackable: { type: 'boolean', optional: true },
      autoApply: { type: 'boolean', optional: true },
      status: { type: 'string', optional: true, enum: ['active', 'inactive'] }
    }
  }),
  asyncErrorHandler(couponController.adminUpdateCoupon.bind(couponController))
);

// 删除优惠券
router.delete('/admin/:id',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(couponController.adminDeleteCoupon.bind(couponController))
);

// 批量发放优惠券
router.post('/admin/:id/distribute',
  rateLimit({ windowMs: 300000, max: 5 }), // 5分钟5次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      userIds: {
        type: 'array',
        optional: true,
        minItems: 1,
        maxItems: 1000,
        items: { type: 'number', min: 1 }
      },
      userLevels: {
        type: 'array',
        optional: true,
        items: { type: 'string' }
      },
      allUsers: { type: 'boolean', optional: true, default: false },
      newUsersOnly: { type: 'boolean', optional: true, default: false },
      quantity: { type: 'number', optional: true, min: 1, default: 1 },
      reason: { type: 'string', optional: true, maxLength: 200 }
    }
  }),
  asyncErrorHandler(couponController.adminDistributeCoupon.bind(couponController))
);

// 获取优惠券使用统计
router.get('/admin/:id/statistics',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    query: {
      startDate: { type: 'string', optional: true, format: 'date' },
      endDate: { type: 'string', optional: true, format: 'date' }
    }
  }),
  asyncErrorHandler(couponController.adminGetCouponStatistics.bind(couponController))
);

// 获取用户优惠券使用记录
router.get('/admin/:id/usage',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    query: {
      userId: { type: 'number', optional: true, min: 1 },
      status: { type: 'string', optional: true, enum: ['available', 'used', 'expired'] },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(couponController.adminGetCouponUsage.bind(couponController))
);

// 批量操作优惠券
router.post('/admin/batch',
  rateLimit({ windowMs: 300000, max: 5 }), // 5分钟5次
  validateRequest({
    body: {
      action: { type: 'string', enum: ['activate', 'deactivate', 'delete'] },
      couponIds: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: { type: 'number', min: 1 }
      }
    }
  }),
  asyncErrorHandler(couponController.adminBatchOperation.bind(couponController))
);

// 生成优惠券代码
router.post('/admin/generate-codes',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    body: {
      count: { type: 'number', min: 1, max: 1000 },
      length: { type: 'number', optional: true, min: 4, max: 20, default: 8 },
      prefix: { type: 'string', optional: true, maxLength: 10 },
      suffix: { type: 'string', optional: true, maxLength: 10 }
    }
  }),
  asyncErrorHandler(couponController.adminGenerateCodes.bind(couponController))
);

// 导出优惠券数据
router.post('/admin/export',
  rateLimit({ windowMs: 300000, max: 3 }), // 5分钟3次
  validateRequest({
    body: {
      format: { type: 'string', optional: true, enum: ['xlsx', 'csv'], default: 'xlsx' },
      includeUsage: { type: 'boolean', optional: true, default: false },
      filters: {
        type: 'object',
        optional: true,
        properties: {
          type: { type: 'string', optional: true, enum: ['discount', 'points', 'shipping'] },
          status: { type: 'string', optional: true, enum: ['active', 'inactive', 'expired'] },
          startDate: { type: 'string', optional: true, format: 'date' },
          endDate: { type: 'string', optional: true, format: 'date' }
        }
      }
    }
  }),
  asyncErrorHandler(couponController.adminExportCoupons.bind(couponController))
);

module.exports = router;