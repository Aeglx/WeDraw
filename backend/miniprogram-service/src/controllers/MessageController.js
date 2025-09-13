/**
 * 消息控制器
 */

const BaseController = require('./BaseController');
const { Message, User } = require('../models');
const { WeChatUtils, CacheUtils, ValidationUtils } = require('../utils');
const config = require('../config');

class MessageController extends BaseController {
  constructor() {
    super();
    this.wechatUtils = new WeChatUtils();
    this.cacheUtils = new CacheUtils();
  }

  /**
   * 发送文本消息
   */
  sendTextMessage = this.asyncHandler(async (req, res) => {
    const { receiverId, text, priority = 1 } = req.body;
    const senderId = req.user.id;

    // 验证必需参数
    const validation = this.validateRequired(req, ['receiverId', 'text']);
    if (!validation.isValid) {
      return this.error(res, validation.errors.join(', '), 400);
    }

    // 验证文本长度
    if (text.length > config.message.maxLength) {
      return this.error(res, `消息长度不能超过${config.message.maxLength}个字符`, 400);
    }

    try {
      // 检查接收者是否存在
      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        return this.error(res, '接收者不存在', 404);
      }

      if (!receiver.isActive()) {
        return this.error(res, '接收者账户已被禁用', 400);
      }

      // 创建消息
      const message = await Message.createTextMessage({
        senderId,
        receiverId,
        text,
        extra: {
          priority,
          source: 'api'
        }
      });

      // 异步发送消息
      this.sendMessageAsync(message.id);

      this.success(res, {
        message_id: message.id,
        status: 'pending'
      }, '消息发送中');

    } catch (error) {
      console.error('发送文本消息失败:', error);
      this.error(res, '发送消息失败', 500);
    }
  });

  /**
   * 发送模板消息
   */
  sendTemplateMessage = this.asyncHandler(async (req, res) => {
    const { receiverId, templateId, templateData, priority = 1 } = req.body;
    const senderId = req.user.id;

    // 验证必需参数
    const validation = this.validateRequired(req, ['receiverId', 'templateId', 'templateData']);
    if (!validation.isValid) {
      return this.error(res, validation.errors.join(', '), 400);
    }

    try {
      // 检查接收者是否存在
      const receiver = await User.findByPk(receiverId);
      if (!receiver) {
        return this.error(res, '接收者不存在', 404);
      }

      if (!receiver.isActive()) {
        return this.error(res, '接收者账户已被禁用', 400);
      }

      // 验证模板数据
      const templateValidation = ValidationUtils.validateTemplateData(templateId, templateData);
      if (!templateValidation.isValid) {
        return this.error(res, templateValidation.errors.join(', '), 400);
      }

      // 创建模板消息
      const message = await Message.createTemplateMessage({
        senderId,
        receiverId,
        templateId,
        templateData,
        extra: {
          priority,
          source: 'api'
        }
      });

      // 异步发送消息
      this.sendMessageAsync(message.id);

      this.success(res, {
        message_id: message.id,
        status: 'pending'
      }, '模板消息发送中');

    } catch (error) {
      console.error('发送模板消息失败:', error);
      this.error(res, '发送模板消息失败', 500);
    }
  });

  /**
   * 批量发送消息
   */
  batchSendMessage = this.asyncHandler(async (req, res) => {
    const { messages } = req.body;
    const senderId = req.user.id;

    if (!Array.isArray(messages) || messages.length === 0) {
      return this.error(res, '消息列表不能为空', 400);
    }

    if (messages.length > config.message.batchSize) {
      return this.error(res, `批量发送消息数量不能超过${config.message.batchSize}条`, 400);
    }

    try {
      // 验证所有消息
      const validMessages = [];
      const errors = [];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const { receiverId, type, content } = msg;

        // 基本验证
        if (!receiverId || !type || !content) {
          errors.push(`消息${i + 1}: 缺少必需参数`);
          continue;
        }

        // 检查接收者
        const receiver = await User.findByPk(receiverId);
        if (!receiver || !receiver.isActive()) {
          errors.push(`消息${i + 1}: 接收者不存在或已被禁用`);
          continue;
        }

        validMessages.push({
          sender_id: senderId,
          receiver_id: receiverId,
          type,
          content: typeof content === 'object' ? JSON.stringify(content) : content,
          priority: msg.priority || 1,
          extra_data: {
            source: 'batch_api',
            batch_index: i
          }
        });
      }

      if (errors.length > 0) {
        return this.error(res, '部分消息验证失败', 400, errors);
      }

      // 批量创建消息
      const createdMessages = await Message.batchCreate(validMessages);

      // 异步发送所有消息
      for (const message of createdMessages) {
        this.sendMessageAsync(message.id);
      }

      this.success(res, {
        total_messages: createdMessages.length,
        message_ids: createdMessages.map(msg => msg.id)
      }, `成功创建${createdMessages.length}条消息`);

    } catch (error) {
      console.error('批量发送消息失败:', error);
      this.error(res, '批量发送消息失败', 500);
    }
  });

  /**
   * 获取消息列表
   */
  getMessageList = this.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      type = null,
      status = null,
      startDate = null,
      endDate = null,
      direction = 'all' // all, sent, received
    } = req.query;

    try {
      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        type,
        status,
        startDate,
        endDate
      };

      // 根据方向过滤消息
      let targetUserId = userId;
      if (direction === 'sent') {
        options.senderOnly = true;
      } else if (direction === 'received') {
        options.receiverOnly = true;
      }

      const result = await Message.getByUserId(targetUserId, options);

      this.paginate(res, result.messages, result.pagination);

    } catch (error) {
      console.error('获取消息列表失败:', error);
      this.error(res, '获取消息列表失败', 500);
    }
  });

  /**
   * 获取消息详情
   */
  getMessageDetail = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const idValidation = this.validateId(id);
    if (!idValidation.isValid) {
      return this.error(res, idValidation.error, 400);
    }

    try {
      const message = await Message.findByPk(idValidation.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'nickname', 'avatar_url']
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'nickname', 'avatar_url']
          }
        ]
      });

      if (!message) {
        return this.error(res, '消息不存在', 404);
      }

      // 检查权限：只能查看自己发送或接收的消息
      if (message.sender_id !== userId && message.receiver_id !== userId) {
        return this.error(res, '无权查看此消息', 403);
      }

      this.success(res, message.getDetailInfo());

    } catch (error) {
      console.error('获取消息详情失败:', error);
      this.error(res, '获取消息详情失败', 500);
    }
  });

  /**
   * 撤回消息
   */
  recallMessage = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const idValidation = this.validateId(id);
    if (!idValidation.isValid) {
      return this.error(res, idValidation.error, 400);
    }

    try {
      const message = await Message.findByPk(idValidation.id);
      if (!message) {
        return this.error(res, '消息不存在', 404);
      }

      // 检查是否可以撤回
      if (!message.canRecall(userId)) {
        return this.error(res, '消息无法撤回', 400);
      }

      // 撤回消息
      await message.recall(userId);

      this.success(res, {
        message_id: message.id,
        status: 'recalled'
      }, '消息撤回成功');

    } catch (error) {
      console.error('撤回消息失败:', error);
      this.error(res, error.message || '撤回消息失败', 500);
    }
  });

  /**
   * 重试发送消息
   */
  retryMessage = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const idValidation = this.validateId(id);
    if (!idValidation.isValid) {
      return this.error(res, idValidation.error, 400);
    }

    try {
      const message = await Message.findByPk(idValidation.id);
      if (!message) {
        return this.error(res, '消息不存在', 404);
      }

      // 检查权限：只能重试自己发送的消息
      if (message.sender_id !== userId) {
        return this.error(res, '无权重试此消息', 403);
      }

      // 重试发送
      await message.retrySend();

      // 异步发送消息
      this.sendMessageAsync(message.id);

      this.success(res, {
        message_id: message.id,
        status: 'pending',
        retry_count: message.retry_count
      }, '消息重试发送中');

    } catch (error) {
      console.error('重试发送消息失败:', error);
      this.error(res, error.message || '重试发送失败', 500);
    }
  });

  /**
   * 获取消息统计
   */
  getMessageStats = this.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    try {
      const options = { userId };
      
      if (startDate || endDate) {
        const dateValidation = this.validateDateRange(startDate, endDate);
        if (!dateValidation.isValid) {
          return this.error(res, dateValidation.errors.join(', '), 400);
        }
        options.startDate = dateValidation.startDate;
        options.endDate = dateValidation.endDate;
      }

      const stats = await Message.getStats(options);

      this.success(res, stats);

    } catch (error) {
      console.error('获取消息统计失败:', error);
      this.error(res, '获取消息统计失败', 500);
    }
  });

  /**
   * 获取系统消息统计（管理员）
   */
  getSystemStats = this.asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
      const options = {};
      
      if (startDate || endDate) {
        const dateValidation = this.validateDateRange(startDate, endDate);
        if (!dateValidation.isValid) {
          return this.error(res, dateValidation.errors.join(', '), 400);
        }
        options.startDate = dateValidation.startDate;
        options.endDate = dateValidation.endDate;
      }

      const stats = await Message.getStats(options);

      // 获取待处理消息数量
      const pendingMessages = await Message.getPendingMessages(1);
      const retryMessages = await Message.getRetryMessages(1);

      this.success(res, {
        ...stats,
        pending_count: pendingMessages.length,
        retry_count: retryMessages.length
      });

    } catch (error) {
      console.error('获取系统消息统计失败:', error);
      this.error(res, '获取系统消息统计失败', 500);
    }
  });

  /**
   * 清理过期消息（管理员）
   */
  cleanExpiredMessages = this.asyncHandler(async (req, res) => {
    const { days = 30 } = req.body;

    if (days < 1 || days > 365) {
      return this.error(res, '保留天数必须在1-365之间', 400);
    }

    try {
      const deletedCount = await Message.cleanExpiredMessages(days);

      this.success(res, {
        deleted_count: deletedCount,
        retention_days: days
      }, `成功清理${deletedCount}条过期消息`);

    } catch (error) {
      console.error('清理过期消息失败:', error);
      this.error(res, '清理过期消息失败', 500);
    }
  });

  /**
   * 异步发送消息
   * @param {number} messageId - 消息ID
   */
  async sendMessageAsync(messageId) {
    try {
      const message = await Message.findByPk(messageId, {
        include: [
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'openid', 'subscribe_message']
          }
        ]
      });

      if (!message || !message.receiver) {
        console.error(`消息${messageId}或接收者不存在`);
        return;
      }

      // 检查用户是否订阅消息
      if (!message.receiver.subscribe_message) {
        await message.markFailed('用户未订阅消息推送');
        return;
      }

      const content = message.formatContent();
      let result;

      // 根据消息类型发送
      switch (message.type) {
        case 'text':
          result = await this.wechatUtils.sendTextMessage(
            message.receiver.openid,
            content.text
          );
          break;
          
        case 'template':
          result = await this.wechatUtils.sendTemplateMessage(
            message.receiver.openid,
            content.template_id,
            content.data
          );
          break;
          
        default:
          await message.markFailed('不支持的消息类型');
          return;
      }

      // 处理发送结果
      if (result.errcode === 0) {
        await message.markSent(result);
      } else {
        await message.markFailed(result.errmsg || '发送失败');
      }

    } catch (error) {
      console.error(`发送消息${messageId}失败:`, error);
      
      try {
        const message = await Message.findByPk(messageId);
        if (message) {
          await message.markFailed(error.message);
        }
      } catch (updateError) {
        console.error('更新消息状态失败:', updateError);
      }
    }
  }
}

module.exports = MessageController;