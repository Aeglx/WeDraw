const express = require('express');
const CategoryController = require('../controllers/categoryController');
const { asyncErrorHandler } = require('../utils/errors');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rateLimit');
const { upload } = require('../middleware/upload');

/**
 * 商品分类路由
 */

const router = express.Router();
const categoryController = new CategoryController();

// 公开路由 - 不需要认证

// 获取分类树
router.get('/tree',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    query: {
      status: { type: 'string', optional: true, enum: ['active', 'inactive'], default: 'active' },
      maxDepth: { type: 'number', optional: true, min: 1, max: 5, default: 3 }
    }
  }),
  asyncErrorHandler(categoryController.getCategoryTree.bind(categoryController))
);

// 获取分类列表
router.get('/',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    query: {
      parentId: { type: 'number', optional: true, min: 0 }, // 0表示根分类
      status: { type: 'string', optional: true, enum: ['active', 'inactive'], default: 'active' },
      level: { type: 'number', optional: true, min: 1, max: 5 },
      page: { type: 'number', optional: true, min: 1, default: 1 },
      limit: { type: 'number', optional: true, min: 1, max: 100, default: 50 }
    }
  }),
  asyncErrorHandler(categoryController.getCategories.bind(categoryController))
);

// 获取分类详情
router.get('/:id',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(categoryController.getCategoryById.bind(categoryController))
);

// 根据slug获取分类
router.get('/slug/:slug',
  rateLimit({ windowMs: 60000, max: 100 }), // 1分钟100次
  validateRequest({
    params: {
      slug: { type: 'string', minLength: 1, maxLength: 100 }
    }
  }),
  asyncErrorHandler(categoryController.getCategoryBySlug.bind(categoryController))
);

// 获取分类下的商品
router.get('/:id/products',
  rateLimit({ windowMs: 60000, max: 50 }), // 1分钟50次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    query: {
      includeChildren: { type: 'boolean', optional: true, default: true },
      status: { type: 'string', optional: true, enum: ['active', 'inactive'], default: 'active' },
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
  asyncErrorHandler(categoryController.getCategoryProducts.bind(categoryController))
);

// 获取分类统计信息
router.get('/:id/stats',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    }
  }),
  asyncErrorHandler(categoryController.getCategoryStats.bind(categoryController))
);

// 管理员路由 - 需要管理员权限
router.use('/admin', authenticate, authorize(['admin', 'super_admin']));

// 创建分类
router.post('/admin',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  upload.single('icon'), // 分类图标
  validateRequest({
    body: {
      name: { type: 'string', minLength: 2, maxLength: 50 },
      description: { type: 'string', optional: true, maxLength: 500 },
      parentId: { type: 'number', optional: true, min: 1 },
      slug: { type: 'string', optional: true, minLength: 2, maxLength: 100 },
      sort: { type: 'number', optional: true, min: 0, max: 9999, default: 0 },
      status: { type: 'string', optional: true, enum: ['active', 'inactive'], default: 'active' },
      attributes: { type: 'object', optional: true },
      seoTitle: { type: 'string', optional: true, maxLength: 100 },
      seoDescription: { type: 'string', optional: true, maxLength: 200 },
      seoKeywords: { type: 'string', optional: true, maxLength: 200 }
    }
  }),
  asyncErrorHandler(categoryController.createCategory.bind(categoryController))
);

// 更新分类
router.put('/admin/:id',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  upload.single('icon'), // 分类图标
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      name: { type: 'string', optional: true, minLength: 2, maxLength: 50 },
      description: { type: 'string', optional: true, maxLength: 500 },
      parentId: { type: 'number', optional: true, min: 1 },
      slug: { type: 'string', optional: true, minLength: 2, maxLength: 100 },
      sort: { type: 'number', optional: true, min: 0, max: 9999 },
      status: { type: 'string', optional: true, enum: ['active', 'inactive'] },
      attributes: { type: 'object', optional: true },
      seoTitle: { type: 'string', optional: true, maxLength: 100 },
      seoDescription: { type: 'string', optional: true, maxLength: 200 },
      seoKeywords: { type: 'string', optional: true, maxLength: 200 }
    }
  }),
  asyncErrorHandler(categoryController.updateCategory.bind(categoryController))
);

// 删除分类
router.delete('/admin/:id',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    query: {
      force: { type: 'boolean', optional: true, default: false } // 是否强制删除（包含子分类和商品）
    }
  }),
  asyncErrorHandler(categoryController.deleteCategory.bind(categoryController))
);

// 移动分类
router.put('/admin/:id/move',
  rateLimit({ windowMs: 60000, max: 10 }), // 1分钟10次
  validateRequest({
    params: {
      id: { type: 'number', min: 1 }
    },
    body: {
      parentId: { type: 'number', optional: true, min: 1 }, // null表示移动到根级别
      sort: { type: 'number', optional: true, min: 0, max: 9999 }
    }
  }),
  asyncErrorHandler(categoryController.moveCategory.bind(categoryController))
);

// 批量更新分类状态
router.put('/admin/batch/status',
  rateLimit({ windowMs: 60000, max: 5 }), // 1分钟5次
  validateRequest({
    body: {
      categoryIds: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: { type: 'number', min: 1 }
      },
      status: { type: 'string', enum: ['active', 'inactive'] }
    }
  }),
  asyncErrorHandler(categoryController.batchUpdateStatus.bind(categoryController))
);

// 批量更新分类排序
router.put('/admin/batch/sort',
  rateLimit({ windowMs: 60000, max: 5 }), // 1分钟5次
  validateRequest({
    body: {
      categories: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', min: 1 },
            sort: { type: 'number', min: 0, max: 9999 }
          },
          required: ['id', 'sort']
        }
      }
    }
  }),
  asyncErrorHandler(categoryController.batchUpdateSort.bind(categoryController))
);

// 获取分类管理统计
router.get('/admin/statistics',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  asyncErrorHandler(categoryController.getCategoryStatistics.bind(categoryController))
);

// 验证分类slug唯一性
router.post('/admin/validate-slug',
  rateLimit({ windowMs: 60000, max: 20 }), // 1分钟20次
  validateRequest({
    body: {
      slug: { type: 'string', minLength: 2, maxLength: 100 },
      excludeId: { type: 'number', optional: true, min: 1 } // 更新时排除自身ID
    }
  }),
  asyncErrorHandler(categoryController.validateSlug.bind(categoryController))
);

// 重建分类树结构（修复数据）
router.post('/admin/rebuild-tree',
  rateLimit({ windowMs: 300000, max: 1 }), // 5分钟1次
  asyncErrorHandler(categoryController.rebuildCategoryTree.bind(categoryController))
);

// 导入分类
router.post('/admin/import',
  rateLimit({ windowMs: 300000, max: 3 }), // 5分钟3次
  upload.single('file'),
  validateRequest({
    body: {
      format: { type: 'string', optional: true, enum: ['xlsx', 'csv'], default: 'xlsx' },
      overwrite: { type: 'boolean', optional: true, default: false } // 是否覆盖已存在的分类
    }
  }),
  asyncErrorHandler(categoryController.importCategories.bind(categoryController))
);

// 导出分类
router.post('/admin/export',
  rateLimit({ windowMs: 300000, max: 3 }), // 5分钟3次
  validateRequest({
    body: {
      format: { type: 'string', optional: true, enum: ['xlsx', 'csv'], default: 'xlsx' },
      includeProducts: { type: 'boolean', optional: true, default: false }, // 是否包含商品信息
      filters: {
        type: 'object',
        optional: true,
        properties: {
          status: { type: 'string', optional: true, enum: ['active', 'inactive'] },
          level: { type: 'number', optional: true, min: 1, max: 5 },
          parentId: { type: 'number', optional: true, min: 1 }
        }
      }
    }
  }),
  asyncErrorHandler(categoryController.exportCategories.bind(categoryController))
);

module.exports = router;