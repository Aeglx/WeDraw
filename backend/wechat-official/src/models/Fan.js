module.exports = (sequelize, DataTypes) => {
  const Fan = sequelize.define('Fan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    openid: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      comment: '微信用户唯一标识',
    },
    unionid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: '微信开放平台唯一标识',
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '昵称',
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '头像URL',
    },
    gender: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
      comment: '性别：0-未知，1-男，2-女',
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '国家',
    },
    province: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '省份',
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '城市',
    },
    language: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '语言',
    },
    subscribe: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否关注',
    },
    subscribe_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '关注时间',
    },
    unsubscribe_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '取消关注时间',
    },
    subscribe_scene: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '关注场景',
    },
    qr_scene: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '二维码场景值',
    },
    qr_scene_str: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '二维码场景描述',
    },
    remark: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '备注',
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '分组ID',
    },
    tag_ids: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '标签ID列表',
    },
    last_interaction_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后互动时间',
    },
    interaction_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '互动次数',
    },
    message_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '消息数量',
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '积分',
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '等级',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'blocked'),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态：active-活跃，inactive-不活跃，blocked-已拉黑',
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '来源渠道',
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
    tableName: 'fans',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['openid'],
      },
      {
        fields: ['unionid'],
      },
      {
        fields: ['subscribe'],
      },
      {
        fields: ['subscribe_time'],
      },
      {
        fields: ['last_interaction_time'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['qr_scene'],
      },
      {
        fields: ['group_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
    hooks: {
      beforeUpdate: (fan) => {
        fan.updated_at = new Date();
      },
    },
  });

  // 实例方法
  Fan.prototype.toSafeJSON = function() {
    const values = this.get({ plain: true });
    delete values.extra_data;
    return values;
  };

  Fan.prototype.updateInteraction = async function() {
    this.last_interaction_time = new Date();
    this.interaction_count += 1;
    await this.save();
  };

  Fan.prototype.addPoints = async function(points, reason = '') {
    this.points += points;
    // 这里可以添加积分变更日志
    await this.save();
    return this.points;
  };

  Fan.prototype.updateLevel = async function() {
    // 根据积分计算等级
    let newLevel = 1;
    if (this.points >= 10000) newLevel = 5;
    else if (this.points >= 5000) newLevel = 4;
    else if (this.points >= 1000) newLevel = 3;
    else if (this.points >= 100) newLevel = 2;
    
    if (newLevel !== this.level) {
      this.level = newLevel;
      await this.save();
    }
    
    return this.level;
  };

  Fan.prototype.subscribe = async function(subscribeTime = new Date(), scene = null, qrScene = null) {
    this.subscribe = true;
    this.subscribe_time = subscribeTime;
    this.unsubscribe_time = null;
    this.status = 'active';
    
    if (scene) this.subscribe_scene = scene;
    if (qrScene) this.qr_scene = qrScene;
    
    await this.save();
  };

  Fan.prototype.unsubscribe = async function() {
    this.subscribe = false;
    this.unsubscribe_time = new Date();
    this.status = 'inactive';
    await this.save();
  };

  Fan.prototype.block = async function() {
    this.status = 'blocked';
    await this.save();
  };

  Fan.prototype.unblock = async function() {
    this.status = 'active';
    await this.save();
  };

  // 类方法
  Fan.findByOpenid = async function(openid) {
    return await this.findOne({ where: { openid } });
  };

  Fan.findByUnionid = async function(unionid) {
    return await this.findOne({ where: { unionid } });
  };

  Fan.getSubscribedFans = async function(options = {}) {
    return await this.findAll({
      where: {
        subscribe: true,
        status: 'active',
      },
      ...options,
    });
  };

  Fan.getFansByTag = async function(tagId, options = {}) {
    return await this.findAll({
      where: {
        tag_ids: {
          [sequelize.Sequelize.Op.contains]: [tagId],
        },
        subscribe: true,
        status: 'active',
      },
      ...options,
    });
  };

  Fan.getFansByQRScene = async function(qrScene, options = {}) {
    return await this.findAll({
      where: {
        qr_scene: qrScene,
        subscribe: true,
      },
      ...options,
    });
  };

  Fan.getActiveFans = async function(days = 30, options = {}) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return await this.findAll({
      where: {
        last_interaction_time: {
          [sequelize.Sequelize.Op.gte]: since,
        },
        subscribe: true,
        status: 'active',
      },
      ...options,
    });
  };

  Fan.getInactiveFans = async function(days = 30, options = {}) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return await this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            last_interaction_time: {
              [sequelize.Sequelize.Op.lt]: since,
            },
          },
          {
            last_interaction_time: null,
          },
        ],
        subscribe: true,
        status: 'active',
      },
      ...options,
    });
  };

  Fan.getStatistics = async function() {
    const total = await this.count();
    const subscribed = await this.count({ where: { subscribe: true } });
    const active = await this.count({ where: { status: 'active', subscribe: true } });
    const blocked = await this.count({ where: { status: 'blocked' } });
    
    // 今日新增
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNew = await this.count({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: today,
        },
      },
    });
    
    // 本周新增
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekNew = await this.count({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.gte]: weekStart,
        },
      },
    });
    
    return {
      total,
      subscribed,
      active,
      blocked,
      unsubscribed: total - subscribed,
      todayNew,
      weekNew,
    };
  };

  return Fan;
};