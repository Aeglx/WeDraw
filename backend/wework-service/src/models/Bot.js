/**
 * 企业微信机器人模型
 */

module.exports = (sequelize, DataTypes) => {
  const Bot = sequelize.define('Bot', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '机器人ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '机器人名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '机器人描述'
    },
    webhook_url: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Webhook URL'
    },
    webhook_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Webhook Key'
    },
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '所属群组ID'
    },
    wework_chat_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '企业微信群聊ID'
    },
    bot_type: {
      type: DataTypes.ENUM('group', 'application', 'custom'),
      defaultValue: 'group',
      comment: '机器人类型：group-群机器人，application-应用机器人，custom-自定义机器人'
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '机器人头像URL'
    },
    creator_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '创建者UserID'
    },
    config: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '机器人配置'
    },
    commands: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '支持的命令列表'
    },
    auto_reply: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否开启自动回复'
    },
    auto_reply_rules: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '自动回复规则'
    },
    keywords: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '关键词触发列表'
    },
    welcome_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '欢迎消息'
    },
    help_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '帮助消息'
    },
    rate_limit: {
      type: DataTypes.INTEGER,
      defaultValue: 20,
      comment: '频率限制（每分钟）'
    },
    rate_limit_window: {
      type: DataTypes.INTEGER,
      defaultValue: 60000,
      comment: '频率限制窗口（毫秒）'
    },
    max_message_length: {
      type: DataTypes.INTEGER,
      defaultValue: 4096,
      comment: '最大消息长度'
    },
    allowed_users: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '允许使用的用户列表'
    },
    blocked_users: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '禁用的用户列表'
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '权限配置'
    },
    statistics: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '使用统计'
    },
    last_active_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后活跃时间'
    },
    message_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '发送消息数量'
    },
    error_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '错误次数'
    },
    last_error: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '最后错误信息'
    },
    last_error_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后错误时间'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'error', 'maintenance'),
      defaultValue: 'active',
      comment: '状态：active-活跃，inactive-非活跃，error-错误，maintenance-维护'
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
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
    tableName: 'bots',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['webhook_key']
      },
      {
        fields: ['group_id']
      },
      {
        fields: ['wework_chat_id']
      },
      {
        fields: ['bot_type']
      },
      {
        fields: ['creator_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['is_enabled']
      },
      {
        fields: ['last_active_at']
      },
      {
        fields: ['created_at']
      }
    ],
    comment: '企业微信机器人表'
  });

  Bot.associate = function(models) {
    // 机器人属于群组
    Bot.belongsTo(models.Group, {
      foreignKey: 'group_id',
      as: 'group'
    });
    
    // 机器人发送的消息
    Bot.hasMany(models.Message, {
      foreignKey: 'bot_id',
      as: 'messages'
    });
  };

  // 实例方法：发送消息
  Bot.prototype.sendMessage = async function(content, msgtype = 'text') {
    const axios = require('axios');
    
    try {
      const payload = {
        msgtype: msgtype
      };
      
      if (msgtype === 'text') {
        payload.text = {
          content: content
        };
      } else if (msgtype === 'markdown') {
        payload.markdown = {
          content: content
        };
      }
      
      const response = await axios.post(this.webhook_url, payload, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // 更新统计信息
      await this.increment('message_count');
      await this.update({ last_active_at: new Date() });
      
      return response.data;
    } catch (error) {
      // 记录错误
      await this.increment('error_count');
      await this.update({
        last_error: error.message,
        last_error_at: new Date(),
        status: 'error'
      });
      
      throw error;
    }
  };

  // 实例方法：发送文本消息
  Bot.prototype.sendText = async function(text, mentionedList = []) {
    const payload = {
      msgtype: 'text',
      text: {
        content: text
      }
    };
    
    if (mentionedList.length > 0) {
      payload.text.mentioned_list = mentionedList;
    }
    
    return await this.sendMessage(payload);
  };

  // 实例方法：发送Markdown消息
  Bot.prototype.sendMarkdown = async function(content) {
    return await this.sendMessage(content, 'markdown');
  };

  // 实例方法：发送图片消息
  Bot.prototype.sendImage = async function(base64, md5) {
    const payload = {
      msgtype: 'image',
      image: {
        base64: base64,
        md5: md5
      }
    };
    
    return await this.sendMessage(payload);
  };

  // 实例方法：发送文件消息
  Bot.prototype.sendFile = async function(mediaId) {
    const payload = {
      msgtype: 'file',
      file: {
        media_id: mediaId
      }
    };
    
    return await this.sendMessage(payload);
  };

  // 实例方法：检查用户权限
  Bot.prototype.checkUserPermission = function(userId) {
    // 检查是否在禁用列表中
    if (this.blocked_users && this.blocked_users.includes(userId)) {
      return false;
    }
    
    // 如果设置了允许列表，检查用户是否在列表中
    if (this.allowed_users && this.allowed_users.length > 0) {
      return this.allowed_users.includes(userId);
    }
    
    return true;
  };

  // 实例方法：处理命令
  Bot.prototype.handleCommand = async function(command, args, userId) {
    if (!this.checkUserPermission(userId)) {
      throw new Error('用户无权限使用此机器人');
    }
    
    if (!this.commands || !this.commands[command]) {
      throw new Error('未知命令');
    }
    
    const commandConfig = this.commands[command];
    
    // 这里可以根据命令配置执行相应的逻辑
    // 实际实现需要根据具体的命令类型来处理
    
    return {
      command: command,
      args: args,
      response: commandConfig.response || '命令执行成功'
    };
  };

  // 类方法：根据关键词查找机器人
  Bot.findByKeyword = async function(keyword, groupId = null) {
    const where = {
      is_enabled: true,
      status: 'active'
    };
    
    if (groupId) {
      where.group_id = groupId;
    }
    
    return await Bot.findAll({
      where: where,
      include: [{
        model: sequelize.models.Group,
        as: 'group'
      }]
    }).then(bots => {
      return bots.filter(bot => {
        if (!bot.keywords) return false;
        return bot.keywords.some(kw => 
          keyword.toLowerCase().includes(kw.toLowerCase())
        );
      });
    });
  };

  return Bot;
};