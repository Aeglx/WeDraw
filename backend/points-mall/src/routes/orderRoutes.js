const express = require('express');
const OrderController = require('../controllers/orderController');
const { asyncErrorHandler } = require('../utils/errors');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rateLimit');

/**
 * 订单路由
 */

const router = express.Router();
const orderController = new OrderController();

// 应用认证中间件到所有路由
router.use(authenticate);

// 创建订单
router.post('/',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    body: {
      items: {
        type: 'array',
        minItems: 1,
        maxItems: 20,
        items: {
          type: 'object',
          properties: {
            productId: { type: 'number', min: 1 },
            skuId: { type: 'number', optional: true, min: 1 },
            quantity: { type: 'number', min: 1, max: 999 }
          },
          required: ['productId', 'quantity']
        }
      },
      addressId: { type: 'number', min: 1 },
      couponId: { type: 'number', optional: true, min: 1 },
      remark: { type: 'string', optional: true, maxLength: 200 },
      deliveryType: { type: 'string', optional: true, enum: ['standard', 'express'], default: 'standard' }
    }
  }),
  asyncErrorHandler(orderController.createOrder.bind(orderController))
);

// 获取订单列表
router.get('/',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      status: { 
        type: 'string', 
        optional: true, 
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'] 
      },
      startDate: { type: 'string', optional: true, format: 'date' },
      endDate: { type: 'string', optional: true, format: 'date' },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 50, default: 20 }
    }
  }),
  asyncErrorHandler(orderController.getOrders.bind(orderController))
);

// 获取订单详情
router.get('/:id',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(orderController.getOrderById.bind(orderController))
);

// 支付订单
router.post('/:id/pay',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      paymentMethod: { type: 'string', enum: ['points'], default: 'points' },
      paymentPassword: { type: 'string', optional: true, minLength: 6, maxLength: 20 }
    }
  }),
  asyncErrorHandler(orderController.payOrder.bind(orderController))
);

// 取消订单
router.post('/:id/cancel',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      reason: { type: 'string', minLength: 2, maxLength: 200 }
    }
  }),
  asyncErrorHandler(orderController.cancelOrder.bind(orderController))
);

// 确认收货
router.post('/:id/confirm',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(orderController.confirmOrder.bind(orderController))
);

// 申请退款
router.post('/:id/refund',
  rateLimit({ windowMs: 60000, max: 5 }), // 1分钟5次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      reason: { type: 'string', minLength: 5, maxLength: 500 },
      type: { type: 'string', enum: ['full', 'partial'], default: 'full' },
      items: {
        type: 'array',
        optional: true,
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            orderItemId: { type: 'number', min: 1 },
            quantity: { type: 'number', min: 1 },
            reason: { type: 'string', minLength: 2, maxLength: 200 }
          },
          required: ['orderItemId', 'quantity', 'reason']
        }
      },
      images: {
        type: 'array',
        optional: true,
        maxItems: 9,
        items: { type: 'string', format: 'url' }
      }
    }
  }),
  asyncErrorHandler(orderController.requestRefund.bind(orderController))
);

// 获取订单物流信息
router.get('/:id/logistics',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(orderController.getOrderLogistics.bind(orderController))
);

// 获取用户订单统计
router.get('/stats/summary',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  asyncErrorHandler(orderController.getOrderStats.bind(orderController))
);

// 重新下单（基于历史订单）
router.post('/:id/reorder',
  rateLimit({ windowMs: 60000, max: 5 }), // 1分钟5次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      addressId: { type: 'number', optional: true, min: 1 },
      items: {
        type: 'array',
        optional: true,
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            orderItemId: { type: 'number', min: 1 },
            quantity: { type: 'number', min: 1, max: 999 }
          },
          required: ['orderItemId', 'quantity']
        }
      }
    }
  }),
  asyncErrorHandler(orderController.reorder.bind(orderController))
);

// 管理员路由 - 需要管理员权限
router.use('/admin', authorize(['admin', 'super_admin']));

// 管理员获取订单列表
router.get('/admin',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    query: {
      userId: { type: 'number', optional: true, min: 1 },
      orderNo: { type: 'string', optional: true, minLength: 10, maxLength: 50 },
      status: { 
        type: 'string', 
        optional: true, 
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'] 
      },
      paymentStatus: { 
        type: 'string', 
        optional: true, 
        enum: ['pending', 'paid', 'failed', 'refunded'] 
      },
      startDate: { type: 'string', optional: true, format: 'date' },
      endDate: { type: 'string', optional: true, format: 'date' },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(orderController.adminGetOrders.bind(orderController))
);

// 管理员获取订单详情
router.get('/admin/:id',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(orderController.adminGetOrderById.bind(orderController))
);

// 管理员更新订单状态
router.put('/admin/:id/status',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      status: { 
        type: 'string', 
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'] 
      },
      remark: { type: 'string', optional: true, maxLength: 500 }
    }
  }),
  asyncErrorHandler(orderController.adminUpdateOrderStatus.bind(orderController))
);

// 管理员发货
router.post('/admin/:id/ship',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      logisticsCompany: { type: 'string', minLength: 2, maxLength: 50 },
      trackingNumber: { type: 'string', minLength: 5, maxLength: 50 },
      remark: { type: 'string', optional: true, maxLength: 200 }
    }
  }),
  asyncErrorHandler(orderController.adminShipOrder.bind(orderController))
);

// 管理员处理退款申请
router.post('/admin/:id/refund/process',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      action: { type: 'string', enum: ['approve', 'reject'] },
      reason: { type: 'string', optional: true, maxLength: 500 },
      refundAmount: { type: 'number', optional: true, min: 0 }
    }
  }),
  asyncErrorHandler(orderController.adminProcessRefund.bind(orderController))
);

// 管理员获取订单统计
router.get('/admin/statistics',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    query: {
      startDate: { type: 'string', optional: true, format: 'date' },
      endDate: { type: 'string', optional: true, format: 'date' },
      groupBy: { type: 'string', optional: true, enum: ['day', 'week', 'month'], default: 'day' }
    }
  }),
  asyncErrorHandler(orderController.adminGetOrderStatistics.bind(orderController))
);

// 管理员批量操作订单
router.post('/admin/batch',
  rateLimit({ windowMs: 300000, max: 5 }), // 5分钟5次
  validateRequest({
    body: {
      action: { type: 'string', enum: ['updateStatus', 'export'] },
      orderIds: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: { type: 'number', min: 1 }
      },
      status: { 
        type: 'string', 
        optional: true,
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'] 
      },
      remark: { type: 'string', optional: true, maxLength: 500 }
    }
  }),
  asyncErrorHandler(orderController.adminBatchOperation.bind(orderController))
);

// 管理员导出订单
router.post('/admin/export',
  rateLimit({ windowMs: 300000, max: 3 }), // 5分钟3次
  validateRequest({
    body: {
      filters: {
        type: 'object',
        optional: true,
        properties: {
          status: { type: 'string', optional: true },
          startDate: { type: 'string', optional: true, format: 'date' },
          endDate: { type: 'string', optional: true, format: 'date' },
          userId: { type: 'number', optional: true, min: 1 }
        }
      },
      format: { type: 'string', optional: true, enum: ['xlsx', 'csv'], default: 'xlsx' }
    }
  }),
  asyncErrorHandler(orderController.adminExportOrders.bind(orderController))
);

module.exports = router;