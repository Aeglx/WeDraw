/**
 * 小程序消息模型
 */

const { DataTypes, Model } = require('sequelize');

class Message extends Model {
  /**
   * 格式化消息内容
   * @returns {Object}
   */
  formatContent() {
    try {
      return typeof this.content === 'string' ? JSON.parse(this.content) : this.content;
    } catch (error) {
      return { text: this.content };
    }
  }

  /**
   * 检查消息是否可以撤回
   * @param {number} userId - 用户ID
   * @returns {boolean}
   */
  canRecall(userId) {
    if (this.sender_id !== userId) return false;
    if (this.status === 'recalled') return false;
    
    // 消息发送后2分钟内可以撤回
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return new Date(this.created_at) > twoMinutesAgo;
  }

  /**
   * 撤回消息
   * @param {number} userId - 操作用户ID
   * @returns {Promise<Message>}
   */
  async recall(userId) {
    if (!this.canRecall(userId)) {
      throw new Error('消息无法撤回');
    }
    
    this.status = 'recalled';
    this.recalled_at = new Date();
    return this.save();
  }

  /**
   * 标记消息为已读
   * @param {number} userId - 用户ID
   * @returns {Promise<void>}
   */
  async markAsRead(userId) {
    // 这里可以实现消息已读逻辑
    // 可能需要创建一个单独的消息已读表
  }

  /**
   * 获取消息详细信息
   * @returns {Object}
   */
  getDetailInfo() {
    return {
      ...this.toJSON(),
      formatted_content: this.formatContent(),
      can_recall: this.canRecall(this.sender_id),
      is_recalled: this.status === 'recalled'
    };
  }

  /**
   * 重试发送消息
   * @returns {Promise<Message>}
   */
  async retrySend() {
    if (this.status !== 'failed') {
      throw new Error('只能重试发送失败的消息');
    }
    
    this.status = 'pending';
    this.retry_count = (this.retry_count || 0) + 1;
    this.error_message = null;
    return this.save();
  }

  /**
   * 标记发送成功
   * @param {Object} result - 发送结果
   * @returns {Promise<Message>}
   */
  async markSent(result = {}) {
    this.status = 'sent';
    this.sent_at = new Date();
    if (result.msgid) {
      this.external_id = result.msgid;
    }
    return this.save();
  }

  /**
   * 标记发送失败
   * @param {string} errorMessage - 错误信息
   * @returns {Promise<Message>}
   */
  async markFailed(errorMessage) {
    this.status = 'failed';
    this.error_message = errorMessage;
    this.retry_count = (this.retry_count || 0) + 1;
    return this.save();
  }

  /**
   * 根据用户ID获取消息列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  static async getByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      type = null,
      status = null,
      startDate = null,
      endDate = null
    } = options;

    const where = {
      [this.sequelize.Sequelize.Op.or]: [
        { sender_id: userId },
        { receiver_id: userId }
      ]
    };
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate) {
      where.created_at = {
        [this.sequelize.Sequelize.Op.gte]: startDate
      };
    }
    
    if (endDate) {
      where.created_at = {
        ...where.created_at,
        [this.sequelize.Sequelize.Op.lte]: endDate
      };
    }

    const offset = (page - 1) * limit;
    
    const { count, rows } = await this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: this.sequelize.models.User,
          as: 'sender',
          attributes: ['id', 'nickname', 'avatar_url']
        },
        {
          model: this.sequelize.models.User,
          as: 'receiver',
          attributes: ['id', 'nickname', 'avatar_url']
        }
      ]
    });

    return {
      messages: rows.map(msg => msg.getDetailInfo()),
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 获取待发送的消息
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>}
   */
  static async getPendingMessages(limit = 100) {
    return this.findAll({
      where: {
        status: 'pending',
        retry_count: {
          [this.sequelize.Sequelize.Op.lt]: 3
        }
      },
      limit,
      order: [['created_at', 'ASC']]
    });
  }

  /**
   * 获取需要重试的消息
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>}
   */
  static async getRetryMessages(limit = 50) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return this.findAll({
      where: {
        status: 'failed',
        retry_count: {
          [this.sequelize.Sequelize.Op.lt]: 3
        },
        updated_at: {
          [this.sequelize.Sequelize.Op.lt]: fiveMinutesAgo
        }
      },
      limit,
      order: [['updated_at', 'ASC']]
    });
  }

  /**
   * 创建文本消息
   * @param {Object} data - 消息数据
   * @returns {Promise<Message>}
   */
  static async createTextMessage(data) {
    const { senderId, receiverId, text, extra = {} } = data;
    
    return this.create({
      sender_id: senderId,
      receiver_id: receiverId,
      type: 'text',
      content: JSON.stringify({ text }),
      status: 'pending',
      extra_data: extra
    });
  }

  /**
   * 创建模板消息
   * @param {Object} data - 消息数据
   * @returns {Promise<Message>}
   */
  static async createTemplateMessage(data) {
    const { senderId, receiverId, templateId, templateData, extra = {} } = data;
    
    return this.create({
      sender_id: senderId,
      receiver_id: receiverId,
      type: 'template',
      content: JSON.stringify({
        template_id: templateId,
        data: templateData
      }),
      status: 'pending',
      extra_data: extra
    });
  }

  /**
   * 批量创建消息
   * @param {Array} messages - 消息数组
   * @returns {Promise<Array>}
   */
  static async batchCreate(messages) {
    const messageData = messages.map(msg => ({
      ...msg,
      status: 'pending',
      content: typeof msg.content === 'object' ? JSON.stringify(msg.content) : msg.content
    }));
    
    return this.bulkCreate(messageData);
  }

  /**
   * 获取消息统计
   * @param {Object} options - 统计选项
   * @returns {Promise<Object>}
   */
  static async getStats(options = {}) {
    const { userId = null, startDate = null, endDate = null } = options;
    
    const where = {};
    
    if (userId) {
      where[this.sequelize.Sequelize.Op.or] = [
        { sender_id: userId },
        { receiver_id: userId }
      ];
    }
    
    if (startDate) {
      where.created_at = {
        [this.sequelize.Sequelize.Op.gte]: startDate
      };
    }
    
    if (endDate) {
      where.created_at = {
        ...where.created_at,
        [this.sequelize.Sequelize.Op.lte]: endDate
      };
    }

    const total = await this.count({ where });
    const sent = await this.count({ where: { ...where, status: 'sent' } });
    const pending = await this.count({ where: { ...where, status: 'pending' } });
    const failed = await this.count({ where: { ...where, status: 'failed' } });
    const recalled = await this.count({ where: { ...where, status: 'recalled' } });

    return {
      total,
      sent,
      pending,
      failed,
      recalled,
      success_rate: total > 0 ? (sent / total * 100).toFixed(2) : 0
    };
  }

  /**
   * 清理过期消息
   * @param {number} days - 保留天数
   * @returns {Promise<number>}
   */
  static async cleanExpiredMessages(days = 30) {
    const expireDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const deletedCount = await this.destroy({
      where: {
        created_at: {
          [this.sequelize.Sequelize.Op.lt]: expireDate
        },
        status: {
          [this.sequelize.Sequelize.Op.in]: ['sent', 'failed', 'recalled']
        }
      }
    });
    
    return deletedCount;
  }
}

/**
 * 初始化消息模型
 * @param {Sequelize} sequelize - Sequelize实例
 * @returns {typeof Message}
 */
function initMessage(sequelize) {
  Message.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '消息ID'
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '发送者ID（系统消息时为空）'
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '接收者ID'
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'template', 'system', 'custom'),
      allowNull: false,
      defaultValue: 'text',
      comment: '消息类型'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '消息内容（JSON格式）'
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'recalled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '消息状态'
    },
    external_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '外部消息ID（微信返回的msgid）'
    },
    template_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '模板消息ID'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发送时间'
    },
    recalled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '撤回时间'
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '重试次数'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息'
    },
    priority: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '优先级：1-低，2-中，3-高'
    },
    extra_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '扩展数据'
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    indexes: [
      {
        fields: ['sender_id']
      },
      {
        fields: ['receiver_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['sent_at']
      },
      {
        fields: ['external_id']
      },
      {
        fields: ['template_id']
      },
      {
        fields: ['status', 'retry_count']
      },
      {
        fields: ['receiver_id', 'created_at']
      }
    ]
  });

  return Message;
}

module.exports = initMessage;