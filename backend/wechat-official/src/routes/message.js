const express = require('express');
const { body, query, param } = require('express-validator');
const { Message, Fan, Template } = require('../models');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');
const wechatService = require('../services/wechatService');
const messageService = require('../services/messageService');
const cacheService = require('../services/cacheService');

const router = express.Router();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: 获取消息列表
 *     tags: [Messages]
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
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [in, out]
 *         description: 消息方向
 *       - in: query
 *         name: msg_type
 *         schema:
 *           type: string
 *         description: 消息类型
 *       - in: query
 *         name: openid
 *         schema:
 *           type: string
 *         description: 用户openid
 *     responses:
 *       200:
 *         description: 成功获取消息列表
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('direction').optional().isIn(['in', 'out']),
  query('msg_type').optional().isString(),
  query('openid').optional().isString(),
  validateRequest,
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      direction,
      msg_type,
      openid,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 构建查询条件
    if (direction) where.direction = direction;
    if (msg_type) where.msg_type = msg_type;
    if (openid) where.openid = openid;

    const { count, rows } = await Message.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'fan',
          attributes: ['id', 'nickname', 'avatar'],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        messages: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get messages list:', error);
    res.status(500).json({
      success: false,
      message: '获取消息列表失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: 发送消息
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - openid
 *               - msg_type
 *             properties:
 *               openid:
 *                 type: string
 *                 description: 接收者openid
 *               msg_type:
 *                 type: string
 *                 enum: [text, image, news, music]
 *                 description: 消息类型
 *               content:
 *                 type: string
 *                 description: 文本消息内容
 *               media_id:
 *                 type: string
 *                 description: 媒体文件ID
 *               articles:
 *                 type: array
 *                 description: 图文消息列表
 *     responses:
 *       200:
 *         description: 发送成功
 */
router.post('/send', [
  body('openid').isString().notEmpty(),
  body('msg_type').isIn(['text', 'image', 'news', 'music']),
  body('content').optional().isString(),
  body('media_id').optional().isString(),
  body('articles').optional().isArray(),
  validateRequest,
], async (req, res) => {
  try {
    const { openid, msg_type, content, media_id, articles } = req.body;

    // 验证粉丝是否存在
    const fan = await Fan.findByOpenid(openid);
    if (!fan) {
      return res.status(404).json({
        success: false,
        message: '粉丝不存在',
      });
    }

    if (!fan.subscribe) {
      return res.status(400).json({
        success: false,
        message: '用户未关注，无法发送消息',
      });
    }

    // 创建消息记录
    const message = await Message.create({
      fan_id: fan.id,
      openid,
      msg_type,
      direction: 'out',
      content,
      media_id,
      articles,
      status: 'pending',
    });

    // 发送消息
    try {
      let result;
      switch (msg_type) {
        case 'text':
          result = await wechatService.sendTextMessage(openid, content);
          break;
        case 'image':
          result = await wechatService.sendImageMessage(openid, media_id);
          break;
        case 'news':
          result = await wechatService.sendNewsMessage(openid, articles);
          break;
        case 'music':
          result = await wechatService.sendMusicMessage(openid, req.body);
          break;
        default:
          throw new Error('不支持的消息类型');
      }

      await message.markAsSent();
      await fan.updateInteraction();

      logger.business('message_sent', {
        messageId: message.id,
        openid,
        msgType: msg_type,
      }, req.user.id);

      res.json({
        success: true,
        message: '发送成功',
        data: {
          messageId: message.id,
          result,
        },
      });
    } catch (error) {
      await message.markAsFailed(error.code || 500, error.message);
      throw error;
    }
  } catch (error) {
    logger.error('Failed to send message:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/messages/broadcast:
 *   post:
 *     summary: 群发消息
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - msg_type
 *               - target_type
 *             properties:
 *               msg_type:
 *                 type: string
 *                 enum: [text, image, news]
 *                 description: 消息类型
 *               target_type:
 *                 type: string
 *                 enum: [all, tag, openid_list]
 *                 description: 目标类型
 *               tag_id:
 *                 type: integer
 *                 description: 标签ID（target_type为tag时必填）
 *               openid_list:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: openid列表（target_type为openid_list时必填）
 *               content:
 *                 type: string
 *                 description: 文本消息内容
 *               media_id:
 *                 type: string
 *                 description: 媒体文件ID
 *               articles:
 *                 type: array
 *                 description: 图文消息列表
 *     responses:
 *       200:
 *         description: 群发成功
 */
router.post('/broadcast', [
  body('msg_type').isIn(['text', 'image', 'news']),
  body('target_type').isIn(['all', 'tag', 'openid_list']),
  body('tag_id').optional().isInt(),
  body('openid_list').optional().isArray(),
  body('content').optional().isString(),
  body('media_id').optional().isString(),
  body('articles').optional().isArray(),
  validateRequest,
], async (req, res) => {
  try {
    const {
      msg_type,
      target_type,
      tag_id,
      openid_list,
      content,
      media_id,
      articles,
    } = req.body;

    // 获取目标用户列表
    let targetFans = [];
    switch (target_type) {
      case 'all':
        targetFans = await Fan.getSubscribedFans();
        break;
      case 'tag':
        if (!tag_id) {
          return res.status(400).json({
            success: false,
            message: '标签ID不能为空',
          });
        }
        targetFans = await Fan.getFansByTag(tag_id);
        break;
      case 'openid_list':
        if (!openid_list || openid_list.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'openid列表不能为空',
          });
        }
        targetFans = await Fan.findAll({
          where: {
            openid: openid_list,
            subscribe: true,
            status: 'active',
          },
        });
        break;
    }

    if (targetFans.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有找到目标用户',
      });
    }

    // 使用微信群发接口
    let result;
    try {
      const messageData = {
        msg_type,
        content,
        media_id,
        articles,
      };

      if (target_type === 'all') {
        result = await wechatService.sendMassMessageToAll(messageData);
      } else if (target_type === 'tag') {
        result = await wechatService.sendMassMessageByTag(tag_id, messageData);
      } else {
        result = await wechatService.sendMassMessageByOpenid(openid_list, messageData);
      }

      // 记录群发消息
      const messages = await Promise.all(
        targetFans.map(fan => Message.create({
          fan_id: fan.id,
          openid: fan.openid,
          msg_type,
          direction: 'out',
          content,
          media_id,
          articles,
          status: 'sent',
          send_time: new Date(),
        }))
      );

      logger.business('mass_message_sent', {
        targetType: target_type,
        targetCount: targetFans.length,
        msgType: msg_type,
        msgId: result.msg_id,
      }, req.user.id);

      res.json({
        success: true,
        message: '群发成功',
        data: {
          msg_id: result.msg_id,
          target_count: targetFans.length,
          message_count: messages.length,
        },
      });
    } catch (error) {
      logger.error('Mass message failed:', error);
      throw error;
    }
  } catch (error) {
    logger.error('Failed to broadcast message:', error);
    res.status(500).json({
      success: false,
      message: '群发消息失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/messages/template:
 *   post:
 *     summary: 发送模板消息
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - openid
 *               - template_id
 *               - data
 *             properties:
 *               openid:
 *                 type: string
 *                 description: 接收者openid
 *               template_id:
 *                 type: string
 *                 description: 模板ID
 *               url:
 *                 type: string
 *                 description: 跳转链接
 *               miniprogram:
 *                 type: object
 *                 description: 小程序信息
 *               data:
 *                 type: object
 *                 description: 模板数据
 *     responses:
 *       200:
 *         description: 发送成功
 */
router.post('/template', [
  body('openid').isString().notEmpty(),
  body('template_id').isString().notEmpty(),
  body('url').optional().isURL(),
  body('miniprogram').optional().isObject(),
  body('data').isObject(),
  validateRequest,
], async (req, res) => {
  try {
    const { openid, template_id, url, miniprogram, data } = req.body;

    // 验证粉丝是否存在
    const fan = await Fan.findByOpenid(openid);
    if (!fan) {
      return res.status(404).json({
        success: false,
        message: '粉丝不存在',
      });
    }

    // 发送模板消息
    const result = await wechatService.sendTemplateMessage({
      touser: openid,
      template_id,
      url,
      miniprogram,
      data,
    });

    // 记录消息
    const message = await Message.create({
      fan_id: fan.id,
      openid,
      msg_type: 'template',
      direction: 'out',
      template_id,
      content: JSON.stringify(data),
      url,
      status: 'sent',
      send_time: new Date(),
      extra_data: { miniprogram },
    });

    await fan.updateInteraction();

    logger.business('template_message_sent', {
      messageId: message.id,
      openid,
      templateId: template_id,
      msgId: result.msgid,
    }, req.user.id);

    res.json({
      success: true,
      message: '模板消息发送成功',
      data: {
        messageId: message.id,
        msgid: result.msgid,
      },
    });
  } catch (error) {
    logger.error('Failed to send template message:', error);
    res.status(500).json({
      success: false,
      message: '发送模板消息失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/messages/conversation/{openid}:
 *   get:
 *     summary: 获取对话记录
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: openid
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户openid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 消息数量限制
 *     responses:
 *       200:
 *         description: 成功获取对话记录
 */
router.get('/conversation/:openid', [
  param('openid').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  validateRequest,
], async (req, res) => {
  try {
    const { openid } = req.params;
    const { limit = 50 } = req.query;

    const messages = await Message.getConversation(openid, limit);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    logger.error('Failed to get conversation:', error);
    res.status(500).json({
      success: false,
      message: '获取对话记录失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/messages/statistics:
 *   get:
 *     summary: 获取消息统计数据
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: 成功获取统计数据
 */
router.get('/statistics', [
  query('start_date').optional().isISO8601().toDate(),
  query('end_date').optional().isISO8601().toDate(),
  validateRequest,
], async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const cacheKey = `messages:statistics:${start_date || 'all'}:${end_date || 'all'}`;
    let stats = await cacheService.get(cacheKey);

    if (!stats) {
      stats = await Message.getStatistics(start_date, end_date);
      await cacheService.set(cacheKey, stats, 300); // 缓存5分钟
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get message statistics:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: 删除消息
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 消息ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 消息不存在
 */
router.delete('/:id', [
  param('id').isInt().toInt(),
  validateRequest,
], async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在',
      });
    }

    await message.destroy();

    logger.business('message_deleted', { messageId: id }, req.user.id);

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    logger.error('Failed to delete message:', error);
    res.status(500).json({
      success: false,
      message: '删除消息失败',
      error: error.message,
    });
  }
});

module.exports = router;