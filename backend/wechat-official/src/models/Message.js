module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '粉丝ID，为空表示系统消息',
    },
    openid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: '微信用户openid',
    },
    msg_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '微信消息ID',
    },
    msg_type: {
      type: DataTypes.ENUM(
        'text', 'image', 'voice', 'video', 'shortvideo', 'location',
        'link', 'music', 'news', 'mpnews', 'msgmenu', 'wx_card',
        'miniprogrampage', 'event'
      ),
      allowNull: false,
      comment: '消息类型',
    },
    direction: {
      type: DataTypes.ENUM('in', 'out'),
      allowNull: false,
      comment: '消息方向：in-接收，out-发送',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '消息内容',
    },
    media_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '媒体文件ID',
    },
    pic_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '图片URL',
    },
    format: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '语音格式',
    },
    recognition: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '语音识别结果',
    },
    thumb_media_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '视频缩略图媒体ID',
    },
    location_x: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: '地理位置纬度',
    },
    location_y: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: '地理位置经度',
    },
    scale: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '地图缩放大小',
    },
    label: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '地理位置信息',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '消息标题',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '消息描述',
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '消息链接',
    },
    hq_music_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '高质量音乐链接',
    },
    music_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '音乐链接',
    },
    articles: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '图文消息列表',
    },
    event: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '事件类型',
    },
    event_key: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '事件KEY值',
    },
    ticket: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '二维码ticket',
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: '地理位置纬度（上报地理位置事件）',
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: '地理位置经度（上报地理位置事件）',
    },
    precision: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: '地理位置精度',
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '消息状态',
    },
    reply_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '回复的消息ID',
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联的素材ID',
    },
    template_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '模板消息ID',
    },
    send_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发送时间',
    },
    receive_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '接收时间',
    },
    error_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '错误码',
    },
    error_msg: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息',
    },
    extra_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '扩展数据',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['fan_id'],
      },
      {
        fields: ['openid'],
      },
      {
        fields: ['msg_id'],
      },
      {
        fields: ['msg_type'],
      },
      {
        fields: ['direction'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['event'],
      },
      {
        fields: ['send_time'],
      },
      {
        fields: ['receive_time'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['reply_to'],
      },
    ],
    hooks: {
      beforeUpdate: (message) => {
        message.updated_at = new Date();
      },
    },
  });

  // 实例方法
  Message.prototype.toSafeJSON = function() {
    const values = this.get({ plain: true });
    delete values.extra_data;
    return values;
  };

  Message.prototype.markAsSent = async function() {
    this.status = 'sent';
    this.send_time = new Date();
    await this.save();
  };

  Message.prototype.markAsDelivered = async function() {
    this.status = 'delivered';
    await this.save();
  };

  Message.prototype.markAsRead = async function() {
    this.status = 'read';
    await this.save();
  };

  Message.prototype.markAsFailed = async function(errorCode, errorMsg) {
    this.status = 'failed';
    this.error_code = errorCode;
    this.error_msg = errorMsg;
    await this.save();
  };

  Message.prototype.isTextMessage = function() {
    return this.msg_type === 'text';
  };

  Message.prototype.isImageMessage = function() {
    return this.msg_type === 'image';
  };

  Message.prototype.isVoiceMessage = function() {
    return this.msg_type === 'voice';
  };

  Message.prototype.isVideoMessage = function() {
    return this.msg_type === 'video' || this.msg_type === 'shortvideo';
  };

  Message.prototype.isLocationMessage = function() {
    return this.msg_type === 'location';
  };

  Message.prototype.isEventMessage = function() {
    return this.msg_type === 'event';
  };

  Message.prototype.isIncoming = function() {
    return this.direction === 'in';
  };

  Message.prototype.isOutgoing = function() {
    return this.direction === 'out';
  };

  // 类方法
  Message.findByMsgId = async function(msgId) {
    return await this.findOne({ where: { msg_id: msgId } });
  };

  Message.findByOpenid = async function(openid, options = {}) {
    return await this.findAll({
      where: { openid },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  Message.findByFanId = async function(fanId, options = {}) {
    return await this.findAll({
      where: { fan_id: fanId },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  Message.findIncomingMessages = async function(options = {}) {
    return await this.findAll({
      where: { direction: 'in' },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  Message.findOutgoingMessages = async function(options = {}) {
    return await this.findAll({
      where: { direction: 'out' },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  Message.findByType = async function(msgType, options = {}) {
    return await this.findAll({
      where: { msg_type: msgType },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  Message.findByEvent = async function(event, options = {}) {
    return await this.findAll({
      where: {
        msg_type: 'event',
        event,
      },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  Message.findFailedMessages = async function(options = {}) {
    return await this.findAll({
      where: { status: 'failed' },
      order: [['created_at', 'DESC']],
      ...options,
    });
  };

  Message.findPendingMessages = async function(options = {}) {
    return await this.findAll({
      where: { status: 'pending' },
      order: [['created_at', 'ASC']],
      ...options,
    });
  };

  Message.getConversation = async function(openid, limit = 50) {
    return await this.findAll({
      where: { openid },
      order: [['created_at', 'DESC']],
      limit,
      include: [
        {
          association: 'fan',
          attributes: ['id', 'nickname', 'avatar'],
        },
      ],
    });
  };

  Message.getStatistics = async function(startDate, endDate) {
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.created_at = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate],
      };
    }

    const total = await this.count({ where: whereClause });
    const incoming = await this.count({
      where: { ...whereClause, direction: 'in' },
    });
    const outgoing = await this.count({
      where: { ...whereClause, direction: 'out' },
    });
    const failed = await this.count({
      where: { ...whereClause, status: 'failed' },
    });

    // 按消息类型统计
    const typeStats = await this.findAll({
      where: whereClause,
      attributes: [
        'msg_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['msg_type'],
      raw: true,
    });

    // 按小时统计（最近24小时）
    const hourlyStats = await this.findAll({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      attributes: [
        [sequelize.fn('HOUR', sequelize.col('created_at')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('HOUR', sequelize.col('created_at'))],
      raw: true,
    });

    return {
      total,
      incoming,
      outgoing,
      failed,
      successRate: total > 0 ? ((total - failed) / total * 100).toFixed(2) : 0,
      typeStats,
      hourlyStats,
    };
  };

  Message.createTextMessage = async function(openid, content, direction = 'out') {
    return await this.create({
      openid,
      msg_type: 'text',
      direction,
      content,
      status: direction === 'out' ? 'pending' : 'delivered',
      receive_time: direction === 'in' ? new Date() : null,
    });
  };

  Message.createImageMessage = async function(openid, mediaId, picUrl, direction = 'out') {
    return await this.create({
      openid,
      msg_type: 'image',
      direction,
      media_id: mediaId,
      pic_url: picUrl,
      status: direction === 'out' ? 'pending' : 'delivered',
      receive_time: direction === 'in' ? new Date() : null,
    });
  };

  Message.createNewsMessage = async function(openid, articles, direction = 'out') {
    return await this.create({
      openid,
      msg_type: 'news',
      direction,
      articles,
      status: direction === 'out' ? 'pending' : 'delivered',
      receive_time: direction === 'in' ? new Date() : null,
    });
  };

  return Message;
};