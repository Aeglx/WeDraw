const express = require('express');
const { body, query, param } = require('express-validator');
const { Department, User } = require('../models');
const { validateRequest } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const wecomService = require('../services/wecomService');
const contactsService = require('../services/contactsService');

const router = express.Router();

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: 获取部门列表
 *     tags: [Departments]
 *     parameters:
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: integer
 *         description: 父部门ID，不传则获取所有部门
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *         description: 部门层级
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功获取部门列表
 */
router.get('/', [
  query('parent_id').optional().isInt({ min: 0 }).withMessage('父部门ID必须是非负整数'),
  query('level').optional().isInt({ min: 1 }).withMessage('部门层级必须是正整数'),
  query('search').optional().isLength({ max: 100 }).withMessage('搜索关键词长度不能超过100个字符'),
  validateRequest
], async (req, res) => {
  try {
    const { parent_id, level, search } = req.query;
    
    // 构建查询条件
    const where = {};
    if (parent_id !== undefined) {
      where.parentid = parent_id;
    }
    if (level !== undefined) {
      where.level = level;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { name_en: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } }
      ];
    }

    const departments = await Department.findAll({
      where,
      include: [
        {
          model: Department,
          as: 'parent',
          attributes: ['id', 'department_id', 'name', 'name_en']
        },
        {
          model: Department,
          as: 'children',
          attributes: ['id', 'department_id', 'name', 'name_en', 'order']
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'userid', 'name', 'position', 'status']
        }
      ],
      order: [['order', 'ASC'], ['name', 'ASC']]
    });

    logger.info('Department list retrieved', {
      count: departments.length,
      filters: { parent_id, level, search }
    });

    res.json({
      success: true,
      message: '获取部门列表成功',
      data: {
        departments,
        total: departments.length
      }
    });
  } catch (error) {
    logger.error('Get departments error:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取部门列表失败',
      code: 'GET_DEPARTMENTS_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     summary: 获取部门详情
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 部门ID
 *     responses:
 *       200:
 *         description: 成功获取部门详情
 *       404:
 *         description: 部门不存在
 */
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('部门ID必须是正整数'),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'parent',
          attributes: ['id', 'department_id', 'name', 'name_en']
        },
        {
          model: Department,
          as: 'children',
          attributes: ['id', 'department_id', 'name', 'name_en', 'order'],
          order: [['order', 'ASC']]
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'userid', 'name', 'english_name', 'position', 'mobile', 'email', 'status'],
          order: [['name', 'ASC']]
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: '部门不存在',
        code: 'DEPARTMENT_NOT_FOUND'
      });
    }

    logger.info('Department detail retrieved', {
      departmentId: id,
      departmentName: department.name
    });

    res.json({
      success: true,
      message: '获取部门详情成功',
      data: { department }
    });
  } catch (error) {
    logger.error('Get department detail error:', {
      error: error.message,
      departmentId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: '获取部门详情失败',
      code: 'GET_DEPARTMENT_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/departments/tree:
 *   get:
 *     summary: 获取部门树形结构
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: 成功获取部门树
 */
router.get('/tree', async (req, res) => {
  try {
    // 获取所有部门
    const departments = await Department.findAll({
      attributes: ['id', 'department_id', 'name', 'name_en', 'parentid', 'order', 'level'],
      order: [['level', 'ASC'], ['order', 'ASC'], ['name', 'ASC']]
    });

    // 构建树形结构
    const buildTree = (parentId = 0) => {
      return departments
        .filter(dept => dept.parentid === parentId)
        .map(dept => ({
          ...dept.toJSON(),
          children: buildTree(dept.department_id)
        }));
    };

    const tree = buildTree();

    logger.info('Department tree retrieved', {
      totalDepartments: departments.length,
      rootDepartments: tree.length
    });

    res.json({
      success: true,
      message: '获取部门树成功',
      data: { tree }
    });
  } catch (error) {
    logger.error('Get department tree error:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取部门树失败',
      code: 'GET_DEPARTMENT_TREE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/departments/sync:
 *   post:
 *     summary: 同步部门数据
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 description: 是否强制全量同步
 *                 default: false
 *     responses:
 *       200:
 *         description: 同步成功
 *       401:
 *         description: 未授权
 */
router.post('/sync', 
  authenticateToken,
  [
    body('force').optional().isBoolean().withMessage('force参数必须是布尔值'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { force = false } = req.body;

      logger.info('Department sync started', {
        userId: req.user.id,
        force
      });

      const result = await contactsService.syncDepartments(force);

      logger.info('Department sync completed', {
        userId: req.user.id,
        result
      });

      res.json({
        success: true,
        message: '部门同步成功',
        data: result
      });
    } catch (error) {
      logger.error('Department sync error:', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        message: '部门同步失败',
        code: 'DEPARTMENT_SYNC_ERROR'
      });
    }
  }
);

/**
 * @swagger
 * /api/departments/{id}/users:
 *   get:
 *     summary: 获取部门用户列表
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 部门ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [1, 2, 4, 5]
 *         description: 用户状态
 *     responses:
 *       200:
 *         description: 成功获取部门用户列表
 */
router.get('/:id/users', [
  param('id').isInt({ min: 1 }).withMessage('部门ID必须是正整数'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('status').optional().isIn([1, 2, 4, 5]).withMessage('用户状态值无效'),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // 检查部门是否存在
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: '部门不存在',
        code: 'DEPARTMENT_NOT_FOUND'
      });
    }

    // 构建查询条件
    const where = {
      department: {
        [Op.contains]: [parseInt(id)]
      }
    };
    if (status !== undefined) {
      where.status = status;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'userid', 'name', 'english_name', 'position', 'mobile', 'email', 'status', 'avatar', 'created_at'],
      limit: parseInt(limit),
      offset,
      order: [['name', 'ASC']]
    });

    logger.info('Department users retrieved', {
      departmentId: id,
      count,
      page,
      limit
    });

    res.json({
      success: true,
      message: '获取部门用户列表成功',
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get department users error:', {
      error: error.message,
      departmentId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: '获取部门用户列表失败',
      code: 'GET_DEPARTMENT_USERS_ERROR'
    });
  }
});

module.exports = router;