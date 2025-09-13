const express = require('express');
const PointsController = require('../controllers/pointsController');
const { asyncErrorHandler } = require('../utils/errors');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rateLimit');

/**
 * 积分路由
 */

const router = express.Router();
const pointsController = new PointsController();

// 应用认证中间件到所有路由
router.use(authenticate);

// 获取当前用户积分账户信息
router.get('/account',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  asyncErrorHandler(pointsController.getPointsAccount.bind(pointsController))
);

// 获取积分交易记录
router.get('/transactions',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      type: { 
        type: 'string', 
        optional: true, 
        enum: ['earn', 'spend', 'refund', 'expire', 'freeze', 'unfreeze'] 
      },
      source: { 
        type: 'string', 
        optional: true, 
        enum: ['order', 'refund', 'checkin', 'activity', 'admin', 'system'] 
      },
      startDate: { type: 'string', optional: true, format: 'date' },
      endDate: { type: 'string', optional: true, format: 'date' },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(pointsController.getPointsTransactions.bind(pointsController))
);

// 获取积分统计信息
router.get('/stats',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    query: {
      period: { type: 'string', optional: true, enum: ['day', 'week', 'month', 'year'], default: 'month' }
    }
  }),
  asyncErrorHandler(pointsController.getPointsStats.bind(pointsController))
);

// 获取积分排行榜
router.get('/leaderboard',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    query: {
      type: { type: 'string', optional: true, enum: ['total', 'monthly', 'weekly'], default: 'total' },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 50 }
    }
  }),
  asyncErrorHandler(pointsController.getPointsLeaderboard.bind(pointsController))
);

// 获取积分规则说明
router.get('/rules',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  asyncErrorHandler(pointsController.getPointsRules.bind(pointsController))
);

// 预览积分变动（用于下单前预览）
router.post('/preview',
  rateLimit({ windowMs: 60000, max: 30 }), // 1分钟30次
  validateRequest({
    body: {
      action: { type: 'string', enum: ['spend', 'earn'] },
      amount: { type: 'number', min: 1 },
      source: { type: 'string', enum: ['order', 'checkin', 'activity'] },
      metadata: { type: 'object', optional: true }
    }
  }),
  asyncErrorHandler(pointsController.previewPointsChange.bind(pointsController))
);

// 管理员路由 - 需要管理员权限
router.use('/admin', authorize(['admin', 'super_admin']));

// 管理员添加积分
router.post('/admin/add',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    body: {
      userId: { type: 'number', min: 1 },
      amount: { type: 'number', min: 1, max: 100000 },
      reason: { type: 'string', minLength: 2, maxLength: 200 },
      source: { type: 'string', enum: ['admin', 'activity', 'compensation'], default: 'admin' },
      expiresAt: { type: 'string', optional: true, format: 'datetime' }
    }
  }),
  asyncErrorHandler(pointsController.adminAddPoints.bind(pointsController))
);

// 管理员扣减积分
router.post('/admin/deduct',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    body: {
      userId: { type: 'number', min: 1 },
      amount: { type: 'number', min: 1, max: 100000 },
      reason: { type: 'string', minLength: 2, maxLength: 200 },
      source: { type: 'string', enum: ['admin', 'penalty', 'correction'], default: 'admin' }
    }
  }),
  asyncErrorHandler(pointsController.adminDeductPoints.bind(pointsController))
);

// 管理员冻结积分
router.post('/admin/freeze',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    body: {
      userId: { type: 'number', min: 1 },
      amount: { type: 'number', min: 1, max: 100000 },
      reason: { type: 'string', minLength: 2, maxLength: 200 },
      duration: { type: 'number', optional: true, min: 1 } // 冻结天数
    }
  }),
  asyncErrorHandler(pointsController.adminFreezePoints.bind(pointsController))
);

// 管理员解冻积分
router.post('/admin/unfreeze',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    body: {
      userId: { type: 'number', min: 1 },
      amount: { type: 'number', optional: true, min: 1, max: 100000 }, // 不指定则解冻全部
      reason: { type: 'string', minLength: 2, maxLength: 200 }
    }
  }),
  asyncErrorHandler(pointsController.adminUnfreezePoints.bind(pointsController))
);

// 管理员获取用户积分详情
router.get('/admin/user/:userId',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    params: {
      userId: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(pointsController.adminGetUserPoints.bind(pointsController))
);

// 管理员获取积分统计
router.get('/admin/statistics',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    query: {
      startDate: { type: 'string', optional: true, format: 'date' },
      endDate: { type: 'string', optional: true, format: 'date' },
      groupBy: { type: 'string', optional: true, enum: ['day', 'week', 'month'], default: 'day' }
    }
  }),
  asyncErrorHandler(pointsController.adminGetPointsStatistics.bind(pointsController))
);

// 管理员获取积分交易记录
router.get('/admin/transactions',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      userId: { type: 'number', optional: true, min: 1 },
      type: { 
        type: 'string', 
        optional: true, 
        enum: ['earn', 'spend', 'refund', 'expire', 'freeze', 'unfreeze'] 
      },
      source: { 
        type: 'string', 
        optional: true, 
        enum: ['order', 'refund', 'checkin', 'activity', 'admin', 'system'] 
      },
      startDate: { type: 'string', optional: true, format: 'date' },
      endDate: { type: 'string', optional: true, format: 'date' },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(pointsController.adminGetPointsTransactions.bind(pointsController))
);

// 管理员批量操作积分
router.post('/admin/batch',
  rateLimit({ windowMs: 300000, max: 5 }), // 5分钟5次
  validateRequest({
    body: {
      action: { type: 'string', enum: ['add', 'deduct'] },
      users: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: {
          type: 'object',
          properties: {
            userId: { type: 'number', min: 1 },
            amount: { type: 'number', min: 1, max: 100000 }
          },
          required: ['userId', 'amount']
        }
      },
      reason: { type: 'string', minLength: 2, maxLength: 200 },
      source: { type: 'string', enum: ['admin', 'activity', 'compensation', 'penalty'], default: 'admin' }
    }
  }),
  asyncErrorHandler(pointsController.adminBatchPointsOperation.bind(pointsController))
);

// 管理员设置积分规则
router.put('/admin/rules',
  rateLimit({ windowMs: 60000, max: 5 }), // 1分钟5次
  validateRequest({
    body: {
      checkinPoints: { type: 'number', optional: true, min: 1, max: 1000 },
      orderPointsRate: { type: 'number', optional: true, min: 0, max: 1 }, // 订单积分比例
      pointsExpireDays: { type: 'number', optional: true, min: 30, max: 3650 }, // 积分过期天数
      maxDailyEarn: { type: 'number', optional: true, min: 100, max: 10000 }, // 每日最大获得积分
      minRedeemPoints: { type: 'number', optional: true, min: 1, max: 1000 } // 最小兑换积分
    }
  }),
  asyncErrorHandler(pointsController.adminUpdatePointsRules.bind(pointsController))
);

module.exports = router;