/**
 * 企业微信机器人控制器
 */

const BaseController = require('./BaseController');
const { Bot, Group, Message } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const axios = require('axios');

class BotController extends BaseController {
  constructor() {
    super();
  }

  /**
   * 获取机器人列表
   */
  getBots = this.asyncHandler(async (req, res) => {
    const { page, limit, offset } = this.getPaginationParams(req.query);
    const order = this.getSortParams(req.query, ['name', 'bot_type', 'status', 'created_at']);
    const searchCondition = this.getSearchParams(req.query, ['name', 'description']);
    const dateCondition = this.getDateRangeParams(req.query);

    const where = {
      ...searchCondition,
      ...dateCondition
    };

    // 机器人类型筛选
    if (req.query.bot_type) {
      where.bot_type = req.query.bot_type;
    }

    // 状态筛选
    if (req.query.status) {
      where.status = req.query.status;
    }

    // 群组筛选
    if (req.query.group_id) {
      where.group_id = req.query.group_id;
    }

    // 是否启用筛选
    if (req.query.is_enabled !== undefined) {
      where.is_enabled = req.query.is_enabled === 'true';
    }

    const { count, rows } = await Bot.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: [{
        model: Group,
        as: 'group',
        attributes: ['id', 'name', 'wework_chat_id']
      }],
      attributes: { exclude: ['webhook_key'] } // 不返回敏感信息
    });

    const pagination = {
      page,
      limit,
      total: count
    };

    return this.paginatedResponse(res, rows, pagination, '获取机器人列表成功');
  });

  /**
   * 获取机器人详情
   */
  getBot = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bot = await Bot.findByPk(id, {
      include: [{
        model: Group,
        as: 'group'
      }],
      attributes: { exclude: ['webhook_key'] } // 不返回敏感信息
    });

    if (!bot) {
      return this.notFoundResponse(res, '机器人不存在');
    }

    return this.successResponse(res, bot, '获取机器人详情成功');
  });

  /**
   * 创建机器人
   */
  createBot = this.asyncHandler(async (req, res) => {
    const {
      name,
      description,
      webhook_url,
      group_id,
      wework_chat_id,
      bot_type = 'group',
      avatar,
      creator_id,
      config = {},
      commands = {},
      auto_reply = false,
      auto_reply_rules = [],
      keywords = [],
      welcome_message,
      help_message,
      rate_limit = 20,
      rate_limit_window = 60000,
      max_message_length = 4096,
      allowed_users = [],
      blocked_users = [],
      permissions = {}
    } = req.body;

    // 验证必需字段
    const requiredErrors = this.validateRequired(req.body, ['name', 'webhook_url']);
    if (requiredErrors.length > 0) {
      return this.validationErrorResponse(res, requiredErrors);
    }

    // 验证字段长度
    const lengthErrors = this.validateLength(req.body, {
      name: { min: 1, max: 100 },
      description: { max: 500 },
      welcome_message: { max: 1000 },
      help_message: { max: 1000 }
    });
    if (lengthErrors.length > 0) {
      return this.validationErrorResponse(res, lengthErrors);
    }

    // 验证Webhook URL格式
    try {
      new URL(webhook_url);
    } catch (error) {
      return this.validationErrorResponse(res, [{
        field: 'webhook_url',
        message: 'Webhook URL格式不正确'
      }]);
    }

    // 检查机器人名称是否已存在
    const existingBot = await Bot.findOne({
      where: { name }
    });

    if (existingBot) {
      return this.errorResponse(res, '机器人名称已存在', 400);
    }

    // 如果指定了群组，检查群组是否存在
    if (group_id) {
      const group = await Group.findByPk(group_id);
      if (!group) {
        return this.notFoundResponse(res, '指定的群组不存在');
      }
    }

    try {
      // 生成Webhook密钥
      const webhook_key = crypto.randomBytes(32).toString('hex');

      // 创建机器人
      const bot = await Bot.create({
        name,
        description,
        webhook_url,
        webhook_key,
        group_id,
        wework_chat_id,
        bot_type,
        avatar,
        creator_id,
        config,
        commands,
        auto_reply,
        auto_reply_rules,
        keywords,
        welcome_message,
        help_message,
        rate_limit,
        rate_limit_window,
        max_message_length,
        allowed_users,
        blocked_users,
        permissions,
        status: 'active',
        is_enabled: true
      });

      // 重新获取包含关联数据的机器人（不包含敏感信息）
      const createdBot = await Bot.findByPk(bot.id, {
        include: [{
          model: Group,
          as: 'group'
        }],
        attributes: { exclude: ['webhook_key'] }
      });

      this.logAction('CREATE_BOT', { bot_id: bot.id }, req);

      return this.successResponse(res, createdBot, '创建机器人成功', 201);
    } catch (error) {
      console.error('创建机器人失败:', error);
      return this.errorResponse(res, '创建机器人失败', 500, error.message);
    }
  });

  /**
   * 更新机器人
   */
  updateBot = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const bot = await Bot.findByPk(id);
    if (!bot) {
      return this.notFoundResponse(res, '机器人不存在');
    }

    // 验证字段长度
    const lengthErrors = this.validateLength(updateData, {
      name: { min: 1, max: 100 },
      description: { max: 500 },
      welcome_message: { max: 1000 },
      help_message: { max: 1000 }
    });
    if (lengthErrors.length > 0) {
      return this.validationErrorResponse(res, lengthErrors);
    }

    // 验证Webhook URL格式
    if (updateData.webhook_url) {
      try {
        new URL(updateData.webhook_url);
      } catch (error) {
        return this.validationErrorResponse(res, [{
          field: 'webhook_url',
          message: 'Webhook URL格式不正确'
        }]);
      }
    }

    // 检查机器人名称是否已存在（排除当前机器人）
    if (updateData.name && updateData.name !== bot.name) {
      const existingBot = await Bot.findOne({
        where: {
          name: updateData.name,
          id: { [Op.ne]: id }
        }
      });

      if (existingBot) {
        return this.errorResponse(res, '机器人名称已存在', 400);
      }
    }

    // 如果更新了群组，检查群组是否存在
    if (updateData.group_id) {
      const group = await Group.findByPk(updateData.group_id);
      if (!group) {
        return this.notFoundResponse(res, '指定的群组不存在');
      }
    }

    try {
      // 更新机器人
      await bot.update(updateData);

      // 重新获取包含关联数据的机器人（不包含敏感信息）
      const updatedBot = await Bot.findByPk(bot.id, {
        include: [{
          model: Group,
          as: 'group'
        }],
        attributes: { exclude: ['webhook_key'] }
      });

      this.logAction('UPDATE_BOT', { bot_id: bot.id, changes: updateData }, req);

      return this.successResponse(res, updatedBot, '更新机器人成功');
    } catch (error) {
      console.error('更新机器人失败:', error);
      return this.errorResponse(res, '更新机器人失败', 500, error.message);
    }
  });

  /**
   * 删除机器人
   */
  deleteBot = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bot = await Bot.findByPk(id);
    if (!bot) {
      return this.notFoundResponse(res, '机器人不存在');
    }

    try {
      await bot.destroy();

      this.logAction('DELETE_BOT', { bot_id: id }, req);

      return this.successResponse(res, null, '删除机器人成功');
    } catch (error) {
      console.error('删除机器人失败:', error);
      return this.errorResponse(res, '删除机器人失败', 500, error.message);
    }
  });

  /**
   * 发送消息
   */
  sendMessage = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      content,
      msgtype = 'text',
      mentioned_list = [],
      mentioned_mobile_list = []
    } = req.body;

    // 验证必需字段
    const requiredErrors = this.validateRequired(req.body, ['content']);
    if (requiredErrors.length > 0) {
      return this.validationErrorResponse(res, requiredErrors);
    }

    const bot = await Bot.findByPk(id);
    if (!bot) {
      return this.notFoundResponse(res, '机器人不存在');
    }

    if (!bot.is_enabled || bot.status !== 'active') {
      return this.errorResponse(res, '机器人未启用或状态异常', 400);
    }

    // 检查消息长度限制
    if (content.length > bot.max_message_length) {
      return this.errorResponse(res, `消息长度超过限制（${bot.max_message_length}字符）`, 400);
    }

    try {
      let result;
      
      switch (msgtype) {
        case 'text':
          result = await bot.sendText(content, mentioned_list);
          break;
        case 'markdown':
          result = await bot.sendMarkdown(content);
          break;
        default:
          return this.errorResponse(res, '不支持的消息类型', 400);
      }

      // 创建消息记录
      const message = await Message.create({
        group_id: bot.group_id,
        bot_id: bot.id,
        chat_id: bot.wework_chat_id,
        chat_type: 'group',
        msg_type: msgtype,
        content: content,
        mentioned_list: mentioned_list,
        mentioned_mobile_list: mentioned_mobile_list,
        is_from_bot: true,
        send_status: 'sent',
        send_time: new Date(),
        delivered_time: new Date()
      });

      this.logAction('SEND_BOT_MESSAGE', {
        bot_id: id,
        message_id: message.id,
        msgtype: msgtype
      }, req);

      return this.successResponse(res, {
        message_id: message.id,
        result: result
      }, '发送消息成功');
    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 创建失败的消息记录
      await Message.create({
        group_id: bot.group_id,
        bot_id: bot.id,
        chat_id: bot.wework_chat_id,
        chat_type: 'group',
        msg_type: msgtype,
        content: content,
        mentioned_list: mentioned_list,
        mentioned_mobile_list: mentioned_mobile_list,
        is_from_bot: true,
        send_status: 'failed',
        send_time: new Date(),
        error_message: error.message
      });

      return this.errorResponse(res, '发送消息失败', 500, error.message);
    }
  });

  /**
   * 测试机器人连接
   */
  testBot = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bot = await Bot.findByPk(id);
    if (!bot) {
      return this.notFoundResponse(res, '机器人不存在');
    }

    try {
      // 发送测试消息
      const testMessage = `机器人测试消息 - ${new Date().toLocaleString()}`;
      const result = await bot.sendText(testMessage);

      // 更新机器人状态
      await bot.update({
        status: 'active',
        last_active_at: new Date(),
        error_count: 0,
        last_error: null,
        last_error_at: null
      });

      this.logAction('TEST_BOT', { bot_id: id, result: 'success' }, req);

      return this.successResponse(res, result, '机器人测试成功');
    } catch (error) {
      console.error('机器人测试失败:', error);
      
      // 更新机器人错误状态
      await bot.update({
        status: 'error',
        last_error: error.message,
        last_error_at: new Date()
      });
      await bot.increment('error_count');

      this.logAction('TEST_BOT', { bot_id: id, result: 'failed', error: error.message }, req);

      return this.errorResponse(res, '机器人测试失败', 500, error.message);
    }
  });

  /**
   * 获取机器人统计信息
   */
  getBotStats = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const bot = await Bot.findByPk(id);
    if (!bot) {
      return this.notFoundResponse(res, '机器人不存在');
    }

    try {
      const where = {
        bot_id: id,
        is_from_bot: true
      };

      // 日期范围筛选
      if (start_date && end_date) {
        where.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }

      // 获取消息统计
      const messageStats = await Message.findAll({
        where: where,
        attributes: [
          'send_status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['send_status']
      });

      // 获取消息类型统计
      const typeStats = await Message.findAll({
        where: where,
        attributes: [
          'msg_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['msg_type']
      });

      // 获取每日消息统计
      const dailyStats = await Message.findAll({
        where: where,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      });

      const stats = {
        basic: {
          total_messages: bot.message_count,
          error_count: bot.error_count,
          last_active_at: bot.last_active_at,
          status: bot.status
        },
        message_status: messageStats.reduce((acc, stat) => {
          acc[stat.send_status] = parseInt(stat.get('count'));
          return acc;
        }, {}),
        message_types: typeStats.reduce((acc, stat) => {
          acc[stat.msg_type] = parseInt(stat.get('count'));
          return acc;
        }, {}),
        daily_messages: dailyStats.map(stat => ({
          date: stat.get('date'),
          count: parseInt(stat.get('count'))
        }))
      };

      return this.successResponse(res, stats, '获取机器人统计信息成功');
    } catch (error) {
      console.error('获取机器人统计信息失败:', error);
      return this.errorResponse(res, '获取统计信息失败', 500, error.message);
    }
  });

  /**
   * 重置机器人Webhook密钥
   */
  resetWebhookKey = this.asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bot = await Bot.findByPk(id);
    if (!bot) {
      return this.notFoundResponse(res, '机器人不存在');
    }

    try {
      // 生成新的Webhook密钥
      const newWebhookKey = crypto.randomBytes(32).toString('hex');
      
      await bot.update({
        webhook_key: newWebhookKey
      });

      this.logAction('RESET_BOT_WEBHOOK_KEY', { bot_id: id }, req);

      return this.successResponse(res, {
        webhook_key: newWebhookKey
      }, '重置Webhook密钥成功');
    } catch (error) {
      console.error('重置Webhook密钥失败:', error);
      return this.errorResponse(res, '重置Webhook密钥失败', 500, error.message);
    }
  });

  /**
   * 启用/禁用机器人
   */
  toggleBot = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_enabled } = req.body;

    if (typeof is_enabled !== 'boolean') {
      return this.validationErrorResponse(res, [{
        field: 'is_enabled',
        message: 'is_enabled必须是布尔值'
      }]);
    }

    const bot = await Bot.findByPk(id);
    if (!bot) {
      return this.notFoundResponse(res, '机器人不存在');
    }

    try {
      await bot.update({ is_enabled });

      this.logAction('TOGGLE_BOT', {
        bot_id: id,
        is_enabled: is_enabled
      }, req);

      return this.successResponse(res, {
        is_enabled: is_enabled
      }, `${is_enabled ? '启用' : '禁用'}机器人成功`);
    } catch (error) {
      console.error('切换机器人状态失败:', error);
      return this.errorResponse(res, '操作失败', 500, error.message);
    }
  });
}

module.exports = new BotController();