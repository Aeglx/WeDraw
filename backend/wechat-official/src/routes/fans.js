const express = require('express');
const { body, query, param } = require('express-validator');
const { Fan, FanTag } = require('../models');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');
const wechatService = require('../services/wechatService');
const cacheService = require('../services/cacheService');

const router = express.Router();

/**
 * @swagger
 * /api/fans:
 *   get:
 *     summary: 获取粉丝列表
 *     tags: [Fans]
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
 *         name: subscribe
 *         schema:
 *           type: boolean
 *         description: 是否关注
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, blocked]
 *         description: 状态
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词（昵称、备注）
 *     responses:
 *       200:
 *         description: 成功获取粉丝列表
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('subscribe').optional().isBoolean().toBoolean(),
  query('status').optional().isIn(['active', 'inactive', 'blocked']),
  query('search').optional().isString().trim(),
  validateRequest,
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      subscribe,
      status,
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 构建查询条件
    if (subscribe !== undefined) {
      where.subscribe = subscribe;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where[Op.or] = [
        { nickname: { [Op.like]: `%${search}%` } },
        { remark: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Fan.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'tags',
          attributes: ['id', 'name', 'color'],
        },
      ],
    });

    logger.business('fans_list_viewed', {
      page,
      limit,
      total: count,
      filters: { subscribe, status, search },
    }, req.user.id);

    res.json({
      success: true,
      data: {
        fans: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get fans list:', error);
    res.status(500).json({
      success: false,
      message: '获取粉丝列表失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/fans/{id}:
 *   get:
 *     summary: 获取粉丝详情
 *     tags: [Fans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 粉丝ID
 *     responses:
 *       200:
 *         description: 成功获取粉丝详情
 *       404:
 *         description: 粉丝不存在
 */
router.get('/:id', [
  param('id').isInt().toInt(),
  validateRequest,
], async (req, res) => {
  try {
    const { id } = req.params;

    const fan = await Fan.findByPk(id, {
      include: [
        {
          association: 'tags',
          attributes: ['id', 'name', 'color'],
        },
        {
          association: 'messages',
          limit: 10,
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!fan) {
      return res.status(404).json({
        success: false,
        message: '粉丝不存在',
      });
    }

    logger.business('fan_detail_viewed', { fanId: id }, req.user.id);

    res.json({
      success: true,
      data: fan,
    });
  } catch (error) {
    logger.error('Failed to get fan detail:', error);
    res.status(500).json({
      success: false,
      message: '获取粉丝详情失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/fans/{id}:
 *   put:
 *     summary: 更新粉丝信息
 *     tags: [Fans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 粉丝ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remark:
 *                 type: string
 *                 description: 备注
 *               tag_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 标签ID列表
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 粉丝不存在
 */
router.put('/:id', [
  param('id').isInt().toInt(),
  body('remark').optional().isString().trim().isLength({ max: 200 }),
  body('tag_ids').optional().isArray(),
  body('tag_ids.*').optional().isInt(),
  validateRequest,
], async (req, res) => {
  try {
    const { id } = req.params;
    const { remark, tag_ids } = req.body;

    const fan = await Fan.findByPk(id);
    if (!fan) {
      return res.status(404).json({
        success: false,
        message: '粉丝不存在',
      });
    }

    // 更新粉丝信息
    const updateData = {};
    if (remark !== undefined) updateData.remark = remark;
    if (tag_ids !== undefined) updateData.tag_ids = tag_ids;

    await fan.update(updateData);

    // 同步到微信服务器（如果需要）
    if (remark !== undefined) {
      try {
        await wechatService.updateUserRemark(fan.openid, remark);
      } catch (error) {
        logger.warn('Failed to sync remark to WeChat:', error);
      }
    }

    logger.business('fan_updated', {
      fanId: id,
      updates: updateData,
    }, req.user.id);

    res.json({
      success: true,
      message: '更新成功',
      data: fan,
    });
  } catch (error) {
    logger.error('Failed to update fan:', error);
    res.status(500).json({
      success: false,
      message: '更新粉丝信息失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/fans/{id}/block:
 *   post:
 *     summary: 拉黑粉丝
 *     tags: [Fans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 粉丝ID
 *     responses:
 *       200:
 *         description: 拉黑成功
 *       404:
 *         description: 粉丝不存在
 */
router.post('/:id/block', [
  param('id').isInt().toInt(),
  validateRequest,
], async (req, res) => {
  try {
    const { id } = req.params;

    const fan = await Fan.findByPk(id);
    if (!fan) {
      return res.status(404).json({
        success: false,
        message: '粉丝不存在',
      });
    }

    await fan.block();

    // 同步到微信服务器
    try {
      await wechatService.batchBlackList([fan.openid]);
    } catch (error) {
      logger.warn('Failed to sync block status to WeChat:', error);
    }

    logger.business('fan_blocked', { fanId: id }, req.user.id);

    res.json({
      success: true,
      message: '拉黑成功',
    });
  } catch (error) {
    logger.error('Failed to block fan:', error);
    res.status(500).json({
      success: false,
      message: '拉黑粉丝失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/fans/{id}/unblock:
 *   post:
 *     summary: 取消拉黑粉丝
 *     tags: [Fans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 粉丝ID
 *     responses:
 *       200:
 *         description: 取消拉黑成功
 *       404:
 *         description: 粉丝不存在
 */
router.post('/:id/unblock', [
  param('id').isInt().toInt(),
  validateRequest,
], async (req, res) => {
  try {
    const { id } = req.params;

    const fan = await Fan.findByPk(id);
    if (!fan) {
      return res.status(404).json({
        success: false,
        message: '粉丝不存在',
      });
    }

    await fan.unblock();

    // 同步到微信服务器
    try {
      await wechatService.batchUnblackList([fan.openid]);
    } catch (error) {
      logger.warn('Failed to sync unblock status to WeChat:', error);
    }

    logger.business('fan_unblocked', { fanId: id }, req.user.id);

    res.json({
      success: true,
      message: '取消拉黑成功',
    });
  } catch (error) {
    logger.error('Failed to unblock fan:', error);
    res.status(500).json({
      success: false,
      message: '取消拉黑粉丝失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/fans/sync:
 *   post:
 *     summary: 同步粉丝数据
 *     tags: [Fans]
 *     responses:
 *       200:
 *         description: 同步成功
 */
router.post('/sync', async (req, res) => {
  try {
    // 获取微信粉丝列表
    const wechatFans = await wechatService.getUserList();
    
    let syncCount = 0;
    let updateCount = 0;
    
    for (const openid of wechatFans.data.openid) {
      try {
        // 获取用户详细信息
        const userInfo = await wechatService.getUserInfo(openid);
        
        // 查找或创建粉丝记录
        const [fan, created] = await Fan.findOrCreate({
          where: { openid },
          defaults: {
            openid: userInfo.openid,
            unionid: userInfo.unionid,
            nickname: userInfo.nickname,
            avatar: userInfo.headimgurl,
            gender: userInfo.sex,
            country: userInfo.country,
            province: userInfo.province,
            city: userInfo.city,
            language: userInfo.language,
            subscribe: userInfo.subscribe === 1,
            subscribe_time: userInfo.subscribe_time ? new Date(userInfo.subscribe_time * 1000) : null,
            subscribe_scene: userInfo.subscribe_scene,
            qr_scene: userInfo.qr_scene,
            qr_scene_str: userInfo.qr_scene_str,
          },
        });
        
        if (created) {
          syncCount++;
        } else {
          // 更新现有粉丝信息
          await fan.update({
            nickname: userInfo.nickname,
            avatar: userInfo.headimgurl,
            gender: userInfo.sex,
            country: userInfo.country,
            province: userInfo.province,
            city: userInfo.city,
            language: userInfo.language,
            subscribe: userInfo.subscribe === 1,
          });
          updateCount++;
        }
      } catch (error) {
        logger.warn(`Failed to sync fan ${openid}:`, error);
      }
    }
    
    logger.business('fans_synced', {
      total: wechatFans.total,
      syncCount,
      updateCount,
    }, req.user.id);
    
    res.json({
      success: true,
      message: '同步完成',
      data: {
        total: wechatFans.total,
        synced: syncCount,
        updated: updateCount,
      },
    });
  } catch (error) {
    logger.error('Failed to sync fans:', error);
    res.status(500).json({
      success: false,
      message: '同步粉丝数据失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/fans/statistics:
 *   get:
 *     summary: 获取粉丝统计数据
 *     tags: [Fans]
 *     responses:
 *       200:
 *         description: 成功获取统计数据
 */
router.get('/statistics', async (req, res) => {
  try {
    const cacheKey = 'fans:statistics';
    let stats = await cacheService.get(cacheKey);
    
    if (!stats) {
      stats = await Fan.getStatistics();
      await cacheService.set(cacheKey, stats, 300); // 缓存5分钟
    }
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get fan statistics:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/fans/export:
 *   get:
 *     summary: 导出粉丝数据
 *     tags: [Fans]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx]
 *           default: csv
 *         description: 导出格式
 *     responses:
 *       200:
 *         description: 导出成功
 */
router.get('/export', [
  query('format').optional().isIn(['csv', 'xlsx']),
  validateRequest,
], async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    const fans = await Fan.findAll({
      attributes: [
        'openid', 'nickname', 'gender', 'country', 'province', 'city',
        'subscribe', 'subscribe_time', 'remark', 'created_at'
      ],
      order: [['created_at', 'DESC']],
    });
    
    if (format === 'csv') {
      // 生成CSV格式
      const csv = fans.map(fan => {
        return [
          fan.openid,
          fan.nickname || '',
          fan.gender === 1 ? '男' : fan.gender === 2 ? '女' : '未知',
          fan.country || '',
          fan.province || '',
          fan.city || '',
          fan.subscribe ? '是' : '否',
          fan.subscribe_time ? fan.subscribe_time.toISOString() : '',
          fan.remark || '',
          fan.created_at.toISOString(),
        ].join(',');
      });
      
      const header = 'OpenID,昵称,性别,国家,省份,城市,是否关注,关注时间,备注,创建时间';
      const csvContent = [header, ...csv].join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=fans.csv');
      res.send('\uFEFF' + csvContent); // 添加BOM以支持中文
    } else {
      // 这里可以实现XLSX格式导出
      res.status(501).json({
        success: false,
        message: 'XLSX格式暂不支持',
      });
    }
    
    logger.business('fans_exported', {
      format,
      count: fans.length,
    }, req.user.id);
  } catch (error) {
    logger.error('Failed to export fans:', error);
    res.status(500).json({
      success: false,
      message: '导出粉丝数据失败',
      error: error.message,
    });
  }
});

module.exports = router;