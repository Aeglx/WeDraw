module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户ID'
    },
    openid: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
      comment: '微信OpenID'
    },
    unionid: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
      comment: '微信UnionID'
    },
    nickname: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '用户昵称'
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户头像URL'
    },
    gender: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
      comment: '性别：0-未知，1-男，2-女'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      comment: '手机号码'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: '邮箱地址'
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '生日'
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '国家'
    },
    province: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '省份'
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '城市'
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: 'zh_CN',
      comment: '语言'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '用户状态：0-禁用，1-正常，2-冻结'
    },
    level: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '用户等级：1-普通用户，2-VIP用户，3-超级VIP'
    },
    source: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '用户来源：wechat-小程序，official-公众号，h5-H5页面'
    },
    subscribe_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '关注时间'
    },
    unsubscribe_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '取消关注时间'
    },
    last_login_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间'
    },
    last_login_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: '最后登录IP'
    },
    login_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '登录次数'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注信息'
    },
    extra_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '扩展数据'
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
    tableName: 'users',
    comment: '用户表',
    indexes: [
      {
        name: 'idx_openid',
        fields: ['openid']
      },
      {
        name: 'idx_unionid',
        fields: ['unionid']
      },
      {
        name: 'idx_phone',
        fields: ['phone']
      },
      {
        name: 'idx_email',
        fields: ['email']
      },
      {
        name: 'idx_status',
        fields: ['status']
      },
      {
        name: 'idx_level',
        fields: ['level']
      },
      {
        name: 'idx_source',
        fields: ['source']
      },
      {
        name: 'idx_created_at',
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeUpdate: (user) => {
        user.updated_at = new Date();
      }
    }
  });

  // 实例方法
  User.prototype.toSafeJSON = function() {
    const values = { ...this.get() };
    delete values.openid;
    delete values.unionid;
    delete values.phone;
    delete values.email;
    delete values.last_login_ip;
    delete values.extra_data;
    return values;
  };

  User.prototype.isActive = function() {
    return this.status === 1;
  };

  User.prototype.isVip = function() {
    return this.level >= 2;
  };

  User.prototype.updateLoginInfo = async function(ip) {
    this.last_login_time = new Date();
    this.last_login_ip = ip;
    this.login_count += 1;
    await this.save();
  };

  // 类方法
  User.findByOpenid = function(openid) {
    return this.findOne({ where: { openid } });
  };

  User.findByUnionid = function(unionid) {
    return this.findOne({ where: { unionid } });
  };

  User.findByPhone = function(phone) {
    return this.findOne({ where: { phone } });
  };

  User.findByEmail = function(email) {
    return this.findOne({ where: { email } });
  };

  User.findActiveUsers = function(options = {}) {
    return this.findAll({
      where: { status: 1 },
      ...options
    });
  };

  User.findVipUsers = function(options = {}) {
    return this.findAll({
      where: { 
        status: 1,
        level: { [sequelize.Sequelize.Op.gte]: 2 }
      },
      ...options
    });
  };

  User.getStatistics = async function() {
    const total = await this.count();
    const active = await this.count({ where: { status: 1 } });
    const vip = await this.count({ 
      where: { 
        status: 1,
        level: { [sequelize.Sequelize.Op.gte]: 2 }
      }
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await this.count({
      where: {
        created_at: { [sequelize.Sequelize.Op.gte]: today }
      }
    });

    return {
      total,
      active,
      vip,
      newToday,
      inactive: total - active
    };
  };

  return User;
};