const express = require('express');
const { body, query, param } = require('express-validator');
const { User, Department } = require('../models');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');
const wecomService = require('../services/wecomService');
const contactsService = require('../services/contactsService');

const router = express.Router();

/**
 * @swagger
 * /api/contacts/users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [Contacts]
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
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('department_id').optional().isInt().toInt(),
  query('status').optional().isInt().toInt(),
  query('search').optional().isString().trim(),
  validateRequest,
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      department_id,
      status,
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 构建查询条件
    if (department_id) {
      where.department = {
        [sequelize.Sequelize.Op.contains]: [department_id],
      };
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where[sequelize.Sequelize.Op.or] = [
        { name: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
        { english_name: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
        { mobile: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
        { email: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'departments',
          attributes: ['department_id', 'name', 'name_en'],
        },
        {
          association: 'tags',
          attributes: ['id', 'tagname', 'tagid'],
        },
      ],
    });

    logger.business('contacts_users_list_viewed', {
      page,
      limit,
      total: count,
      department_id,
      status,
      search,
      user: req.user?.id,
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get users list:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/contacts/users/{userid}:
 *   get:
 *     summary: 获取用户详情
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: userid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户详情
 */
router.get('/users/:userid', [
  param('userid').isString().trim(),
  validateRequest,
], async (req, res) => {
  try {
    const { userid } = req.params;

    const user = await User.findByUserid(userid);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    logger.business('contacts_user_viewed', {
      userid,
      user: req.user?.id,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Failed to get user:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/contacts/departments:
 *   get:
 *     summary: 获取部门列表
 *     tags: [Contacts]
 *     parameters:
 *       - in: query
 *         name: tree
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否返回树形结构
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: integer
 *         description: 父部门ID
 *     responses:
 *       200:
 *         description: 成功获取部门列表
 */
router.get('/departments', [
  query('tree').optional().isBoolean().toBoolean(),
  query('parent_id').optional().isInt().toInt(),
  validateRequest,
], async (req, res) => {
  try {
    const { tree = false, parent_id = 1 } = req.query;

    let departments;
    if (tree) {
      departments = await Department.getTree(parent_id);
    } else {
      const result = await Department.getFlatList(req.query);
      departments = {
        departments: result.rows,
        pagination: {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 50,
          total: result.count,
          pages: Math.ceil(result.count / (parseInt(req.query.limit) || 50)),
        },
      };
    }

    logger.business('contacts_departments_list_viewed', {
      tree,
      parent_id,
      user: req.user?.id,
    });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    logger.error('Failed to get departments list:', error);
    res.status(500).json({
      success: false,
      message: '获取部门列表失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/contacts/departments/{department_id}:
 *   get:
 *     summary: 获取部门详情
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 部门ID
 *     responses:
 *       200:
 *         description: 成功获取部门详情
 */
router.get('/departments/:department_id', [
  param('department_id').isInt().toInt(),
  validateRequest,
], async (req, res) => {
  try {
    const { department_id } = req.params;

    const department = await Department.findByDepartmentId(department_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: '部门不存在',
      });
    }

    logger.business('contacts_department_viewed', {
      department_id,
      user: req.user?.id,
    });

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    logger.error('Failed to get department:', error);
    res.status(500).json({
      success: false,
      message: '获取部门详情失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/contacts/sync:
 *   post:
 *     summary: 同步通讯录数据
 *     tags: [Contacts]
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
 *     responses:
 *       200:
 *         description: 同步成功
 */
router.post('/sync', [
  body('force').optional().isBoolean(),
  validateRequest,
], async (req, res) => {
  try {
    const { force = false } = req.body;

    logger.info('Starting contacts sync', {
      force,
      user: req.user?.id,
    });

    const result = await contactsService.syncContacts(force);

    logger.business('contacts_sync_completed', {
      ...result,
      force,
      user: req.user?.id,
    });

    res.json({
      success: true,
      message: '通讯录同步成功',
      data: result,
    });
  } catch (error) {
    logger.error('Failed to sync contacts:', error);
    res.status(500).json({
      success: false,
      message: '通讯录同步失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/contacts/statistics:
 *   get:
 *     summary: 获取通讯录统计信息
 *     tags: [Contacts]
 *     responses:
 *       200:
 *         description: 成功获取统计信息
 */
router.get('/statistics', async (req, res) => {
  try {
    const [userStats, deptStats] = await Promise.all([
      User.getStatistics(),
      Department.getStatistics(),
    ]);

    const statistics = {
      users: userStats,
      departments: deptStats,
      lastSyncTime: await contactsService.getLastSyncTime(),
    };

    logger.business('contacts_statistics_viewed', {
      statistics,
      user: req.user?.id,
    });

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    logger.error('Failed to get contacts statistics:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/contacts/export:
 *   get:
 *     summary: 导出通讯录数据
 *     tags: [Contacts]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *           default: xlsx
 *         description: 导出格式
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *         description: 部门ID
 *     responses:
 *       200:
 *         description: 导出成功
 */
router.get('/export', [
  query('format').optional().isIn(['csv', 'xlsx']),
  query('department_id').optional().isInt().toInt(),
  validateRequest,
], async (req, res) => {
  try {
    const { format = 'xlsx', department_id } = req.query;

    const result = await contactsService.exportContacts({
      format,
      department_id,
    });

    logger.business('contacts_exported', {
      format,
      department_id,
      user: req.user?.id,
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    logger.error('Failed to export contacts:', error);
    res.status(500).json({
      success: false,
      message: '导出通讯录失败',
      error: error.message,
    });
  }
});

module.exports = router;