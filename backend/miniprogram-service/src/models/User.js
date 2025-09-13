/**
 * 小程序用户模型
 */

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User extends Model {
  /**
   * 验证密码
   * @param {string} password - 明文密码
   * @returns {Promise<boolean>}
   */
  async validatePassword(password) {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }

  /**
   * 生成访问令牌
   * @returns {string}
   */
  generateAccessToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 更新最后登录时间
   * @returns {Promise<User>}
   */
  async updateLastLogin() {
    this.last_login_at = new Date();
    this.login_count = (this.login_count || 0) + 1;
    return this.save();
  }

  /**
   * 检查用户是否活跃
   * @returns {boolean}
   */
  isActive() {
    return this.status === 'active';
  }

  /**
   * 检查用户是否被封禁
   * @returns {boolean}
   */
  isBanned() {
    return this.status === 'banned';
  }

  /**
   * 获取用户完整信息（包含统计数据）
   * @returns {Object}
   */
  getFullInfo() {
    const userInfo = this.toJSON();
    delete userInfo.password;
    delete userInfo.session_key;
    return {
      ...userInfo,
      is_active: this.isActive(),
      is_banned: this.isBanned(),
      days_since_register: Math.floor((Date.now() - new Date(this.created_at)) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * 获取用户基本信息
   * @returns {Object}
   */
  getBasicInfo() {
    return {
      id: this.id,
      openid: this.openid,
      unionid: this.unionid,
      nickname: this.nickname,
      avatar_url: this.avatar_url,
      gender: this.gender,
      city: this.city,
      province: this.province,
      country: this.country,
      status: this.status,
      created_at: this.created_at
    };
  }

  /**
   * 更新用户信息
   * @param {Object} userInfo - 用户信息
   * @returns {Promise<User>}
   */
  async updateUserInfo(userInfo) {
    const allowedFields = ['nickname', 'avatar_url', 'gender', 'city', 'province', 'country', 'language'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (userInfo[field] !== undefined) {
        updateData[field] = userInfo[field];
      }
    });

    if (Object.keys(updateData).length > 0) {
      Object.assign(this, updateData);
      return this.save();
    }
    
    return this;
  }

  /**
   * 根据OpenID查找用户
   * @param {string} openid - 微信OpenID
   * @returns {Promise<User|null>}
   */
  static async findByOpenId(openid) {
    return this.findOne({ where: { openid } });
  }

  /**
   * 根据UnionID查找用户
   * @param {string} unionid - 微信UnionID
   * @returns {Promise<User|null>}
   */
  static async findByUnionId(unionid) {
    return this.findOne({ where: { unionid } });
  }

  /**
   * 创建或更新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<User>}
   */
  static async createOrUpdate(userData) {
    const { openid, unionid, ...otherData } = userData;
    
    let user = await this.findByOpenId(openid);
    
    if (user) {
      // 更新现有用户
      await user.updateUserInfo(otherData);
      if (unionid && !user.unionid) {
        user.unionid = unionid;
        await user.save();
      }
    } else {
      // 创建新用户
      user = await this.create({
        openid,
        unionid,
        ...otherData,
        status: 'active'
      });
    }
    
    return user;
  }

  /**
   * 获取活跃用户列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  static async getActiveUsers(options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      gender = null,
      city = null,
      province = null
    } = options;

    const where = { status: 'active' };
    
    if (search) {
      where.nickname = {
        [this.sequelize.Sequelize.Op.like]: `%${search}%`
      };
    }
    
    if (gender !== null) {
      where.gender = gender;
    }
    
    if (city) {
      where.city = city;
    }
    
    if (province) {
      where.province = province;
    }

    const offset = (page - 1) * limit;
    
    const { count, rows } = await this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password', 'session_key'] }
    });

    return {
      users: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 获取用户统计信息
   * @returns {Promise<Object>}
   */
  static async getStats() {
    const total = await this.count();
    const active = await this.count({ where: { status: 'active' } });
    const banned = await this.count({ where: { status: 'banned' } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNew = await this.count({
      where: {
        created_at: {
          [this.sequelize.Sequelize.Op.gte]: today
        }
      }
    });

    return {
      total,
      active,
      banned,
      today_new: todayNew,
      active_rate: total > 0 ? (active / total * 100).toFixed(2) : 0
    };
  }

  /**
   * 批量更新用户状态
   * @param {Array} userIds - 用户ID数组
   * @param {string} status - 新状态
   * @returns {Promise<number>}
   */
  static async batchUpdateStatus(userIds, status) {
    const [affectedCount] = await this.update(
      { status },
      {
        where: {
          id: {
            [this.sequelize.Sequelize.Op.in]: userIds
          }
        }
      }
    );
    return affectedCount;
  }
}

/**
 * 初始化用户模型
 * @param {Sequelize} sequelize - Sequelize实例
 * @returns {typeof User}
 */
function initUser(sequelize) {
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户ID'
    },
    openid: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '微信OpenID'
    },
    unionid: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
      comment: '微信UnionID'
    },
    session_key: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '微信会话密钥'
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '用户昵称'
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '头像URL'
    },
    gender: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0,
      comment: '性别：0-未知，1-男，2-女'
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '城市'
    },
    province: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '省份'
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '国家'
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: 'zh_CN',
      comment: '语言'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '密码哈希'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'banned'),
      allowNull: false,
      defaultValue: 'active',
      comment: '用户状态'
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间'
    },
    login_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '登录次数'
    },
    subscribe_message: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否订阅消息'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '用户标签'
    },
    extra_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '扩展数据'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [
      {
        unique: true,
        fields: ['openid']
      },
      {
        unique: true,
        fields: ['unionid'],
        where: {
          unionid: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['last_login_at']
      },
      {
        fields: ['phone']
      },
      {
        fields: ['email']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  return User;
}

module.exports = initUser;