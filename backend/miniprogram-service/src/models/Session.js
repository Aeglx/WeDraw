/**
 * 小程序会话模型
 */

const { DataTypes, Model } = require('sequelize');
const crypto = require('crypto');

class Session extends Model {
  /**
   * 检查会话是否有效
   * @returns {boolean}
   */
  isValid() {
    if (this.status !== 'active') return false;
    if (this.expires_at && new Date() > this.expires_at) return false;
    return true;
  }

  /**
   * 检查会话是否过期
   * @returns {boolean}
   */
  isExpired() {
    return this.expires_at && new Date() > this.expires_at;
  }

  /**
   * 刷新会话
   * @param {number} expiresIn - 过期时间（秒）
   * @returns {Promise<Session>}
   */
  async refresh(expiresIn = 86400) {
    this.expires_at = new Date(Date.now() + expiresIn * 1000);
    this.last_active_at = new Date();
    return this.save();
  }

  /**
   * 更新最后活跃时间
   * @returns {Promise<Session>}
   */
  async updateLastActive() {
    this.last_active_at = new Date();
    return this.save();
  }

  /**
   * 销毁会话
   * @returns {Promise<Session>}
   */
  async destroy() {
    this.status = 'expired';
    this.expired_at = new Date();
    return this.save();
  }

  /**
   * 获取会话信息
   * @returns {Object}
   */
  getInfo() {
    return {
      id: this.id,
      user_id: this.user_id,
      session_key: this.session_key,
      openid: this.openid,
      status: this.status,
      expires_at: this.expires_at,
      last_active_at: this.last_active_at,
      is_valid: this.isValid(),
      is_expired: this.isExpired(),
      created_at: this.created_at
    };
  }

  /**
   * 更新会话数据
   * @param {Object} data - 会话数据
   * @returns {Promise<Session>}
   */
  async updateSessionData(data) {
    const allowedFields = ['session_key', 'unionid', 'extra_data'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    if (Object.keys(updateData).length > 0) {
      Object.assign(this, updateData);
      this.last_active_at = new Date();
      return this.save();
    }
    
    return this;
  }

  /**
   * 根据OpenID查找会话
   * @param {string} openid - 微信OpenID
   * @returns {Promise<Session|null>}
   */
  static async findByOpenId(openid) {
    return this.findOne({
      where: { openid, status: 'active' },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 根据用户ID查找会话
   * @param {number} userId - 用户ID
   * @returns {Promise<Session|null>}
   */
  static async findByUserId(userId) {
    return this.findOne({
      where: { user_id: userId, status: 'active' },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 根据会话密钥查找会话
   * @param {string} sessionKey - 会话密钥
   * @returns {Promise<Session|null>}
   */
  static async findBySessionKey(sessionKey) {
    return this.findOne({
      where: { session_key: sessionKey, status: 'active' }
    });
  }

  /**
   * 创建或更新会话
   * @param {Object} sessionData - 会话数据
   * @returns {Promise<Session>}
   */
  static async createOrUpdate(sessionData) {
    const { openid, user_id, session_key, unionid, expires_in = 86400, ...otherData } = sessionData;
    
    // 先查找现有会话
    let session = await this.findByOpenId(openid);
    
    if (session) {
      // 更新现有会话
      await session.updateSessionData({
        session_key,
        unionid,
        ...otherData
      });
      await session.refresh(expires_in);
    } else {
      // 创建新会话
      session = await this.create({
        user_id,
        openid,
        session_key,
        unionid,
        status: 'active',
        expires_at: new Date(Date.now() + expires_in * 1000),
        last_active_at: new Date(),
        ...otherData
      });
    }
    
    return session;
  }

  /**
   * 获取用户的所有会话
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  static async getUserSessions(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status = null,
      includeExpired = false
    } = options;

    const where = { user_id: userId };
    
    if (status) {
      where.status = status;
    } else if (!includeExpired) {
      where.status = 'active';
    }

    const offset = (page - 1) * limit;
    
    const { count, rows } = await this.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      sessions: rows.map(session => session.getInfo()),
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * 清理过期会话
   * @returns {Promise<number>}
   */
  static async cleanExpiredSessions() {
    const now = new Date();
    
    const [affectedCount] = await this.update(
      {
        status: 'expired',
        expired_at: now
      },
      {
        where: {
          status: 'active',
          expires_at: {
            [this.sequelize.Sequelize.Op.lt]: now
          }
        }
      }
    );
    
    return affectedCount;
  }

  /**
   * 批量销毁用户会话
   * @param {number} userId - 用户ID
   * @param {Array} excludeSessionIds - 排除的会话ID
   * @returns {Promise<number>}
   */
  static async destroyUserSessions(userId, excludeSessionIds = []) {
    const where = {
      user_id: userId,
      status: 'active'
    };
    
    if (excludeSessionIds.length > 0) {
      where.id = {
        [this.sequelize.Sequelize.Op.notIn]: excludeSessionIds
      };
    }
    
    const [affectedCount] = await this.update(
      {
        status: 'expired',
        expired_at: new Date()
      },
      { where }
    );
    
    return affectedCount;
  }

  /**
   * 获取活跃会话统计
   * @returns {Promise<Object>}
   */
  static async getActiveStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const total = await this.count({ where: { status: 'active' } });
    const today = await this.count({
      where: {
        status: 'active',
        last_active_at: {
          [this.sequelize.Sequelize.Op.gte]: oneDayAgo
        }
      }
    });
    const thisWeek = await this.count({
      where: {
        status: 'active',
        last_active_at: {
          [this.sequelize.Sequelize.Op.gte]: oneWeekAgo
        }
      }
    });
    
    return {
      total_active: total,
      active_today: today,
      active_this_week: thisWeek,
      activity_rate_today: total > 0 ? (today / total * 100).toFixed(2) : 0,
      activity_rate_week: total > 0 ? (thisWeek / total * 100).toFixed(2) : 0
    };
  }

  /**
   * 生成会话密钥
   * @returns {string}
   */
  static generateSessionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * 验证会话密钥格式
   * @param {string} sessionKey - 会话密钥
   * @returns {boolean}
   */
  static validateSessionKey(sessionKey) {
    return typeof sessionKey === 'string' && sessionKey.length === 64;
  }

  /**
   * 删除过期会话记录
   * @param {number} days - 保留天数
   * @returns {Promise<number>}
   */
  static async deleteExpiredSessions(days = 30) {
    const expireDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const deletedCount = await this.destroy({
      where: {
        status: 'expired',
        expired_at: {
          [this.sequelize.Sequelize.Op.lt]: expireDate
        }
      }
    });
    
    return deletedCount;
  }
}

/**
 * 初始化会话模型
 * @param {Sequelize} sequelize - Sequelize实例
 * @returns {typeof Session}
 */
function initSession(sequelize) {
  Session.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '会话ID'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    openid: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '微信OpenID'
    },
    session_key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '微信会话密钥'
    },
    unionid: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '微信UnionID'
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'revoked'),
      allowNull: false,
      defaultValue: 'active',
      comment: '会话状态'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '过期时间'
    },
    last_active_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '最后活跃时间'
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '实际过期时间'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP地址'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户代理'
    },
    device_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '设备信息'
    },
    extra_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '扩展数据'
    }
  }, {
    sequelize,
    modelName: 'Session',
    tableName: 'sessions',
    indexes: [
      {
        unique: true,
        fields: ['session_key']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['openid']
      },
      {
        fields: ['unionid']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['last_active_at']
      },
      {
        fields: ['user_id', 'status']
      },
      {
        fields: ['openid', 'status']
      }
    ]
  });

  return Session;
}

module.exports = initSession;