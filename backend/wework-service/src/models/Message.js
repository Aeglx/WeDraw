/**
 * 企业微信消息模型
 */

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '消息ID'
    },
    wework_msg_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '企业微信消息ID'
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '群组ID'
    },
    bot_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '机器人ID'
    },
    sender_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '发送者UserID'
    },
    sender_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '发送者姓名'
    },
    receiver_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '接收者UserID'
    },
    receiver_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '接收者姓名'
    },
    chat_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '会话ID'
    },
    chat_type: {
      type: DataTypes.ENUM('single', 'group', 'external'),
      defaultValue: 'group',
      comment: '会话类型：single-单聊，group-群聊，external-外部群'
    },
    msg_type: {
      type: DataTypes.ENUM('text', 'image', 'voice', 'video', 'file', 'location', 'link', 'card', 'markdown', 'news', 'template_card', 'mixed'),
      allowNull: false,
      comment: '消息类型'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '消息内容'
    },
    content_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '消息数据（JSON格式）'
    },
    media_id: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: '媒体文件ID'
    },
    media_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '媒体文件URL'
    },
    media_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '媒体文件大小（字节）'
    },
    media_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '媒体文件时长（秒）'
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '文件名'
    },
    file_extension: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: '文件扩展名'
    },
    thumbnail_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '缩略图URL'
    },
    location_x: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: '位置经度'
    },
    location_y: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: '位置纬度'
    },
    location_scale: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '位置缩放级别'
    },
    location_label: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '位置标签'
    },
    mentioned_list: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '@用户列表'
    },
    mentioned_mobile_list: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '@手机号列表'
    },
    reply_to_msg_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '回复的消息ID'
    },
    forward_from_msg_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '转发来源消息ID'
    },
    is_from_bot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否来自机器人'
    },
    is_system_msg: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否系统消息'
    },
    is_recalled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已撤回'
    },
    recalled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '撤回时间'
    },
    is_encrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否加密'
    },
    encryption_key: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: '加密密钥'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
      comment: '消息优先级'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '消息标签'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '元数据'
    },
    send_status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
      defaultValue: 'pending',
      comment: '发送状态'
    },
    send_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发送时间'
    },
    delivered_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '送达时间'
    },
    read_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '已读时间'
    },
    error_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '错误代码'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息'
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '重试次数'
    },
    max_retry: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: '最大重试次数'
    },
    next_retry_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '下次重试时间'
    },
    webhook_delivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Webhook是否已投递'
    },
    webhook_response: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Webhook响应'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['wework_msg_id']
      },
      {
        fields: ['group_id']
      },
      {
        fields: ['bot_id']
      },
      {
        fields: ['sender_id']
      },
      {
        fields: ['receiver_id']
      },
      {
        fields: ['chat_id']
      },
      {
        fields: ['chat_type']
      },
      {
        fields: ['msg_type']
      },
      {
        fields: ['reply_to_msg_id']
      },
      {
        fields: ['is_from_bot']
      },
      {
        fields: ['is_system_msg']
      },
      {
        fields: ['is_recalled']
      },
      {
        fields: ['send_status']
      },
      {
        fields: ['send_time']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['webhook_delivered']
      },
      {
        fields: ['next_retry_at']
      }
    ],
    comment: '企业微信消息表'
  });

  Message.associate = function(models) {
    // 消息属于群组
    Message.belongsTo(models.Group, {
      foreignKey: 'group_id',
      as: 'group'
    });
    
    // 消息属于机器人
    Message.belongsTo(models.Bot, {
      foreignKey: 'bot_id',
      as: 'bot'
    });
    
    // 回复关系
    Message.belongsTo(models.Message, {
      foreignKey: 'reply_to_msg_id',
      as: 'replyToMessage'
    });
    
    Message.hasMany(models.Message, {
      foreignKey: 'reply_to_msg_id',
      as: 'replies'
    });
    
    // 转发关系
    Message.belongsTo(models.Message, {
      foreignKey: 'forward_from_msg_id',
      as: 'forwardFromMessage'
    });
    
    Message.hasMany(models.Message, {
      foreignKey: 'forward_from_msg_id',
      as: 'forwardedMessages'
    });
  };

  // 实例方法：格式化消息内容
  Message.prototype.formatContent = function() {
    switch (this.msg_type) {
      case 'text':
        return this.content;
      case 'image':
        return `[图片] ${this.file_name || ''}`;
      case 'voice':
        return `[语音] ${this.media_duration}秒`;
      case 'video':
        return `[视频] ${this.file_name || ''}`;
      case 'file':
        return `[文件] ${this.file_name || ''}`;
      case 'location':
        return `[位置] ${this.location_label || ''}`;
      case 'link':
        return `[链接] ${this.content || ''}`;
      case 'card':
        return `[名片] ${this.content || ''}`;
      case 'markdown':
        return `[Markdown] ${this.content || ''}`;
      default:
        return this.content || '[未知消息类型]';
    }
  };

  // 实例方法：检查是否可以撤回
  Message.prototype.canRecall = function() {
    if (this.is_recalled) return false;
    if (this.is_system_msg) return false;
    
    // 2分钟内可以撤回
    const now = new Date();
    const sentTime = this.send_time || this.created_at;
    const diffMinutes = (now - sentTime) / (1000 * 60);
    
    return diffMinutes <= 2;
  };

  // 实例方法：撤回消息
  Message.prototype.recall = async function() {
    if (!this.canRecall()) {
      throw new Error('消息无法撤回');
    }
    
    await this.update({
      is_recalled: true,
      recalled_at: new Date()
    });
    
    return true;
  };

  // 实例方法：标记为已读
  Message.prototype.markAsRead = async function() {
    if (this.send_status !== 'delivered') {
      throw new Error('消息尚未送达，无法标记为已读');
    }
    
    await this.update({
      send_status: 'read',
      read_time: new Date()
    });
    
    return true;
  };

  // 实例方法：重试发送
  Message.prototype.retry = async function() {
    if (this.retry_count >= this.max_retry) {
      throw new Error('已达到最大重试次数');
    }
    
    await this.update({
      send_status: 'pending',
      retry_count: this.retry_count + 1,
      next_retry_at: null,
      error_code: null,
      error_message: null
    });
    
    return true;
  };

  // 类方法：获取会话消息
  Message.getChatMessages = async function(chatId, limit = 50, offset = 0) {
    return await Message.findAll({
      where: {
        chat_id: chatId,
        is_recalled: false
      },
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset,
      include: [{
        model: sequelize.models.Group,
        as: 'group'
      }, {
        model: sequelize.models.Bot,
        as: 'bot'
      }]
    });
  };

  // 类方法：获取待重试消息
  Message.getPendingRetryMessages = async function() {
    const now = new Date();
    
    return await Message.findAll({
      where: {
        send_status: 'failed',
        retry_count: {
          [sequelize.Op.lt]: sequelize.col('max_retry')
        },
        next_retry_at: {
          [sequelize.Op.lte]: now
        }
      },
      order: [['next_retry_at', 'ASC']]
    });
  };

  // 类方法：统计消息数量
  Message.getMessageStats = async function(groupId = null, startDate = null, endDate = null) {
    const where = {};
    
    if (groupId) {
      where.group_id = groupId;
    }
    
    if (startDate && endDate) {
      where.created_at = {
        [sequelize.Op.between]: [startDate, endDate]
      };
    }
    
    const stats = await Message.findAll({
      where: where,
      attributes: [
        'msg_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['msg_type']
    });
    
    return stats.reduce((acc, stat) => {
      acc[stat.msg_type] = parseInt(stat.get('count'));
      return acc;
    }, {});
  };

  return Message;
};