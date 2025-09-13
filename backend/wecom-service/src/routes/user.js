const express = require('express');
const { body, query, param } = require('express-validator');
const { User, Department } = require('../models');
const { validateRequest } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const wecomService = require('../services/wecomService');
const contactsService = require('../services/contactsService');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [Users]
 *     parameters:
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
 *         name: department_id
 *         schema:
 *           type: integer
 *         description: 部门ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [1, 2, 4, 5]
 *         description: 用户状态
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('department_id').optional().isInt({ min: 1 }).withMessage('部门ID必须是正整数'),
  query('status').optional().isIn([1, 2, 4, 5]).withMessage('用户状态值无效'),
  query('search').optional().isLength({ max: 100 }).withMessage('搜索关键词长度不能超过100个字符'),
  validateRequest
], async (req, res) => {
  try {
    const { page = 1, limit = 20, department_id, status, search } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {};
    if (department_id) {
      where.department = {
        [Op.contains]: [parseInt(department_id)]
      };
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { english_name: { [Op.like]: `%${search}%` } },
        { userid: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { position: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: [
        'id', 'userid', 'name', 'english_name', 'mobile', 'department',
        'position', 'gender', 'email', 'status', 'avatar', 'telephone',
        'alias', 'address', 'open_userid', 'main_department', 'created_at', 'updated_at'
      ],
      limit: parseInt(limit),
      offset,
      order: [['name', 'ASC']]
    });

    logger.info('User list retrieved', {
      count,
      page,
      limit,
      filters: { department_id, status, search }
    });

    res.json({
      success: true,
      message: '获取用户列表成功',
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
    logger.error('Get users error:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      code: 'GET_USERS_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 获取用户详情
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户详情
 *       404:
 *         description: 用户不存在
 */
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('用户ID必须是正整数'),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: [
        'id', 'userid', 'name', 'english_name', 'mobile', 'department',
        'order', 'position', 'gender', 'email', 'biz_mail', 'is_leader_in_dept',
        'direct_leader', 'avatar', 'thumb_avatar', 'telephone', 'alias',
        'status', 'extattr', 'qr_code', 'external_profile', 'external_position',
        'address', 'open_userid', 'main_department', 'created_at', 'updated_at'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    // 获取用户所属部门信息
    let departmentInfo = [];
    if (user.department && Array.isArray(user.department)) {
      departmentInfo = await Department.findAll({
        where: {
          department_id: {
            [Op.in]: user.department
          }
        },
        attributes: ['id', 'department_id', 'name', 'name_en', 'full_name']
      });
    }

    logger.info('User detail retrieved', {
      userId: id,
      userName: user.name
    });

    res.json({
      success: true,
      message: '获取用户详情成功',
      data: {
        user: {
          ...user.toJSON(),
          departmentInfo
        }
      }
    });
  } catch (error) {
    logger.error('Get user detail error:', {
      error: error.message,
      userId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      code: 'GET_USER_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/users/sync:
 *   post:
 *     summary: 同步用户数据
 *     tags: [Users]
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
 *               department_id:
 *                 type: integer
 *                 description: 指定同步的部门ID，不传则同步所有部门
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
    body('department_id').optional().isInt({ min: 1 }).withMessage('部门ID必须是正整数'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { force = false, department_id } = req.body;

      logger.info('User sync started', {
        userId: req.user.id,
        force,
        department_id
      });

      const result = await contactsService.syncUsers(force, department_id);

      logger.info('User sync completed', {
        userId: req.user.id,
        result
      });

      res.json({
        success: true,
        message: '用户同步成功',
        data: result
      });
    } catch (error) {
      logger.error('User sync error:', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        message: '用户同步失败',
        code: 'USER_SYNC_ERROR'
      });
    }
  }
);

/**
 * @swagger
 * /api/users/export:
 *   get:
 *     summary: 导出用户数据
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, csv]
 *           default: excel
 *         description: 导出格式
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *         description: 部门ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [1, 2, 4, 5]
 *         description: 用户状态
 *     responses:
 *       200:
 *         description: 导出成功
 *       401:
 *         description: 未授权
 */
router.get('/export',
  authenticateToken,
  [
    query('format').optional().isIn(['excel', 'csv']).withMessage('导出格式只能是excel或csv'),
    query('department_id').optional().isInt({ min: 1 }).withMessage('部门ID必须是正整数'),
    query('status').optional().isIn([1, 2, 4, 5]).withMessage('用户状态值无效'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { format = 'excel', department_id, status } = req.query;

      logger.info('User export started', {
        userId: req.user.id,
        format,
        department_id,
        status
      });

      const result = await contactsService.exportUsers({
        format,
        department_id,
        status
      });

      // 设置响应头
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `users_${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      
      res.setHeader('Content-Type', format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info('User export completed', {
        userId: req.user.id,
        filename,
        recordCount: result.count
      });

      res.send(result.buffer);
    } catch (error) {
      logger.error('User export error:', {
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        message: '用户导出失败',
        code: 'USER_EXPORT_ERROR'
      });
    }
  }
);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: 搜索用户
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: 返回结果数量限制
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *         description: 限制搜索范围的部门ID
 *     responses:
 *       200:
 *         description: 搜索成功
 */
router.get('/search', [
  query('q').notEmpty().withMessage('搜索关键词不能为空')
    .isLength({ min: 1, max: 100 }).withMessage('搜索关键词长度必须在1-100个字符之间'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('返回数量限制必须在1-50之间'),
  query('department_id').optional().isInt({ min: 1 }).withMessage('部门ID必须是正整数'),
  validateRequest
], async (req, res) => {
  try {
    const { q, limit = 10, department_id } = req.query;

    // 构建搜索条件
    const where = {
      [Op.or]: [
        { name: { [Op.like]: `%${q}%` } },
        { english_name: { [Op.like]: `%${q}%` } },
        { userid: { [Op.like]: `%${q}%` } },
        { mobile: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { position: { [Op.like]: `%${q}%` } }
      ],
      status: 1 // 只搜索激活用户
    };

    if (department_id) {
      where.department = {
        [Op.contains]: [parseInt(department_id)]
      };
    }

    const users = await User.findAll({
      where,
      attributes: [
        'id', 'userid', 'name', 'english_name', 'mobile',
        'position', 'email', 'avatar', 'department'
      ],
      limit: parseInt(limit),
      order: [['name', 'ASC']]
    });

    logger.info('User search completed', {
      query: q,
      resultCount: users.length,
      department_id
    });

    res.json({
      success: true,
      message: '用户搜索成功',
      data: {
        users,
        query: q,
        total: users.length
      }
    });
  } catch (error) {
    logger.error('User search error:', {
      error: error.message,
      query: req.query.q
    });
    res.status(500).json({
      success: false,
      message: '用户搜索失败',
      code: 'USER_SEARCH_ERROR'
    });
  }
});

module.exports = router;