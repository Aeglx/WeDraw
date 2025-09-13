const express = require('express');
const ProductController = require('../controllers/productController');
const { asyncErrorHandler } = require('../utils/errors');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rateLimit');
const { upload } = require('../middleware/upload');

/**
 * 商品路由
 */

const router = express.Router();
const productController = new ProductController();

// 公开路由 - 不需要认证

// 获取商品列表
router.get('/',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    query: {
      categoryId: { type: 'number', optional: true, min: 1 },
      status: { type: 'string', optional: true, enum: ['active', 'inactive'], default: 'active' },
      featured: { type: 'boolean', optional: true },
      recommended: { type: 'boolean', optional: true },
      minPoints: { type: 'number', optional: true, min: 0 },
      maxPoints: { type: 'number', optional: true, min: 0 },
      sortBy: { 
        type: 'string', 
        optional: true, 
        enum: ['createdAt', 'points', 'sales', 'rating'], 
        default: 'createdAt' 
      },
      sortOrder: { type: 'string', optional: true, enum: ['asc', 'desc'], default: 'desc' },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(productController.getProducts.bind(productController))
);

// 搜索商品
router.get('/search',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      keyword: { type: 'string', minLength: 1, maxLength: 50 },
      categoryId: { type: 'number', optional: true, min: 1 },
      minPoints: { type: 'number', optional: true, min: 0 },
      maxPoints: { type: 'number', optional: true, min: 0 },
      sortBy: { 
        type: 'string', 
        optional: true, 
        enum: ['relevance', 'createdAt', 'points', 'sales', 'rating'], 
        default: 'relevance' 
      },
      sortOrder: { type: 'string', optional: true, enum: ['asc', 'desc'], default: 'desc' },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 20 }
    }
  }),
  asyncErrorHandler(productController.searchProducts.bind(productController))
);

// 获取热门商品
router.get('/hot',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      limit: { type: 'number', optional: true, min: 1, max: 50, default: 10 },
      categoryId: { type: 'number', optional: true, min: 1 }
    }
  }),
  asyncErrorHandler(productController.getHotProducts.bind(productController))
);

// 获取推荐商品
router.get('/recommended',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    query: {
      limit: { type: 'number', optional: true, min: 1, max: 50, default: 10 },
      categoryId: { type: 'number', optional: true, min: 1 }
    }
  }),
  asyncErrorHandler(productController.getRecommendedProducts.bind(productController))
);

// 获取商品详情
router.get('/:id',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(productController.getProductById.bind(productController))
);

// 获取商品SKU列表
router.get('/:id/skus',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(productController.getProductSkus.bind(productController))
);

// 获取商品评价
router.get('/:id/reviews',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    query: {
      rating: { type: 'number', optional: true, min: 1, max: 5 },
      hasImages: { type: 'boolean', optional: true },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 50, default: 20 }
    }
  }),
  asyncErrorHandler(productController.getProductReviews.bind(productController))
);

// 需要认证的路由
router.use(authenticate);

// 添加商品评价
router.post('/:id/reviews',
  rateLimit({ windowMs: 300000, max: 5 }), // 5分钟5次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      orderId: { type: 'number', min: 1 },
      skuId: { type: 'number', optional: true, min: 1 },
      rating: { type: 'number', min: 1, max: 5 },
      content: { type: 'string', minLength: 5, maxLength: 500 },
      images: {
        type: 'array',
        optional: true,
        maxItems: 9,
        items: { type: 'string', format: 'url' }
      },
      anonymous: { type: 'boolean', optional: true, default: false }
    }
  }),
  asyncErrorHandler(productController.addProductReview.bind(productController))
);

// 管理员路由 - 需要管理员权限
router.use('/admin', authorize(['admin', 'super_admin']));

// 创建商品
router.post('/admin',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  upload.array('images', 10), // 最多10张图片
  validateRequest({
    body: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: { type: 'string', minLength: 10, maxLength: 2000 },
      categoryId: { type: 'number', min: 1 },
      points: { type: 'number', min: 1, max: 1000000 },
      originalPrice: { type: 'number', optional: true, min: 0 },
      stock: { type: 'number', min: 0, max: 999999 },
      minStock: { type: 'number', optional: true, min: 0, max: 100, default: 0 },
      maxPurchase: { type: 'number', optional: true, min: 1, max: 999, default: 999 },
      weight: { type: 'number', optional: true, min: 0 },
      dimensions: {
        type: 'object',
        optional: true,
        properties: {
          length: { type: 'number', min: 0 },
          width: { type: 'number', min: 0 },
          height: { type: 'number', min: 0 }
        }
      },
      tags: {
        type: 'array',
        optional: true,
        maxItems: 10,
        items: { type: 'string', minLength: 1, maxLength: 20 }
      },
      attributes: { type: 'object', optional: true },
      featured: { type: 'boolean', optional: true, default: false },
      recommended: { type: 'boolean', optional: true, default: false },
      status: { type: 'string', optional: true, enum: ['active', 'inactive'], default: 'active' },
      skus: {
        type: 'array',
        optional: true,
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            points: { type: 'number', min: 1, max: 1000000 },
            originalPrice: { type: 'number', optional: true, min: 0 },
            stock: { type: 'number', min: 0, max: 999999 },
            weight: { type: 'number', optional: true, min: 0 },
            attributes: { type: 'object', optional: true },
            status: { type: 'string', optional: true, enum: ['active', 'inactive'], default: 'active' }
          },
          required: ['name', 'points', 'stock']
        }
      }
    }
  }),
  asyncErrorHandler(productController.createProduct.bind(productController))
);

// 更新商品
router.put('/admin/:id',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  upload.array('images', 10), // 最多10张图片
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      name: { type: 'string', optional: true, minLength: 2, maxLength: 100 },
      description: { type: 'string', optional: true, minLength: 10, maxLength: 2000 },
      categoryId: { type: 'number', optional: true, min: 1 },
      points: { type: 'number', optional: true, min: 1, max: 1000000 },
      originalPrice: { type: 'number', optional: true, min: 0 },
      stock: { type: 'number', optional: true, min: 0, max: 999999 },
      minStock: { type: 'number', optional: true, min: 0, max: 100 },
      maxPurchase: { type: 'number', optional: true, min: 1, max: 999 },
      weight: { type: 'number', optional: true, min: 0 },
      dimensions: {
        type: 'object',
        optional: true,
        properties: {
          length: { type: 'number', min: 0 },
          width: { type: 'number', min: 0 },
          height: { type: 'number', min: 0 }
        }
      },
      tags: {
        type: 'array',
        optional: true,
        maxItems: 10,
        items: { type: 'string', minLength: 1, maxLength: 20 }
      },
      attributes: { type: 'object', optional: true },
      featured: { type: 'boolean', optional: true },
      recommended: { type: 'boolean', optional: true },
      status: { type: 'string', optional: true, enum: ['active', 'inactive'] }
    }
  }),
  asyncErrorHandler(productController.updateProduct.bind(productController))
);

// 删除商品
router.delete('/admin/:id',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(productController.deleteProduct.bind(productController))
);

// 批量更新商品状态
router.put('/admin/batch/status',
  rateLimit({ windowMs: 60000, max: 5 }), // 1分钟5次
  validateRequest({
    body: {
      productIds: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: { type: 'number', min: 1 }
      },
      status: { type: 'string', enum: ['active', 'inactive'] }
    }
  }),
  asyncErrorHandler(productController.batchUpdateStatus.bind(productController))
);

// 获取商品统计信息
router.get('/admin/statistics',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    query: {
      startDate: { type: 'string', optional: true, format: 'date' },
      endDate: { type: 'string', optional: true, format: 'date' },
      categoryId: { type: 'number', optional: true, min: 1 }
    }
  }),
  asyncErrorHandler(productController.getProductStatistics.bind(productController))
);

// 管理商品SKU
router.post('/admin/:id/skus',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      points: { type: 'number', min: 1, max: 1000000 },
      originalPrice: { type: 'number', optional: true, min: 0 },
      stock: { type: 'number', min: 0, max: 999999 },
      weight: { type: 'number', optional: true, min: 0 },
      attributes: { type: 'object', optional: true },
      status: { type: 'string', optional: true, enum: ['active', 'inactive'], default: 'active' }
    }
  }),
  asyncErrorHandler(productController.createProductSku.bind(productController))
);

router.put('/admin/:id/skus/:skuId',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 },
      skuId: { type: 'number', min: 1 }
    },
    body: {
      name: { type: 'string', optional: true, minLength: 1, maxLength: 100 },
      points: { type: 'number', optional: true, min: 1, max: 1000000 },
      originalPrice: { type: 'number', optional: true, min: 0 },
      stock: { type: 'number', optional: true, min: 0, max: 999999 },
      weight: { type: 'number', optional: true, min: 0 },
      attributes: { type: 'object', optional: true },
      status: { type: 'string', optional: true, enum: ['active', 'inactive'] }
    }
  }),
  asyncErrorHandler(productController.updateProductSku.bind(productController))
);

router.delete('/admin/:id/skus/:skuId',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 },
      skuId: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(productController.deleteProductSku.bind(productController))
);

module.exports = router;