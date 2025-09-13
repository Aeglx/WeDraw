const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 用户模型
 */
class User extends Model {
  /**
   * 验证密码
   */
  async validatePassword(password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      logger.error('Password validation error:', error);
      return false;
    }
  }

  /**
   * 生成JWT令牌
   */
  generateToken() {
    const payload = {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      status: this.status
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'wedraw-user-center',
        audience: 'wedraw-app'
      }
    );
  }

  /**
   * 生成刷新令牌
   */
  generateRefreshToken() {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    this.refreshToken = refreshToken;
    this.refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天
    return refreshToken;
  }

  /**
   * 生成密码重置令牌
   */
  generatePasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10分钟
    return resetToken;
  }

  /**
   * 生成邮箱验证令牌
   */
  generateEmailVerificationToken() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时
    return verificationToken;
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(ip, userAgent) {
    this.lastLoginAt = new Date();
    this.lastLoginIp = ip;
    this.lastLoginUserAgent = userAgent;
    this.loginCount = (this.loginCount || 0) + 1;
    await this.save();
  }

  /**
   * 检查用户是否被锁定
   */
  isLocked() {
    return this.status === 'locked' || 
           (this.lockUntil && this.lockUntil > new Date());
  }

  /**
   * 锁定用户
   */
  async lock(duration = 30 * 60 * 1000) { // 默认30分钟
    this.status = 'locked';
    this.lockUntil = new Date(Date.now() + duration);
    this.failedLoginAttempts = 0;
    await this.save();
    
    logger.security('USER_LOCKED', { userId: this.id }, {
      reason: 'Too many failed login attempts',
      lockUntil: this.lockUntil
    });
  }

  /**
   * 解锁用户
   */
  async unlock() {
    this.status = 'active';
    this.lockUntil = null;
    this.failedLoginAttempts = 0;
    await this.save();
    
    logger.security('USER_UNLOCKED', { userId: this.id });
  }

  /**
   * 增加失败登录次数
   */
  async incrementFailedAttempts() {
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
    
    // 如果失败次数超过限制，锁定账户
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
    if (this.failedLoginAttempts >= maxAttempts) {
      await this.lock();
    } else {
      await this.save();
    }
  }

  /**
   * 重置失败登录次数
   */
  async resetFailedAttempts() {
    if (this.failedLoginAttempts > 0) {
      this.failedLoginAttempts = 0;
      await this.save();
    }
  }

  /**
   * 获取用户公开信息
   */
  getPublicProfile() {
    return {
      id: this.id,
      username: this.username,
      nickname: this.nickname,
      avatar: this.avatar,
      bio: this.bio,
      location: this.location,
      website: this.website,
      joinedAt: this.createdAt,
      isVerified: this.emailVerified,
      role: this.role === 'admin' ? 'admin' : 'user'
    };
  }

  /**
   * 获取用户完整信息（仅限本人或管理员）
   */
  getFullProfile() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      nickname: this.nickname,
      avatar: this.avatar,
      bio: this.bio,
      location: this.location,
      website: this.website,
      phone: this.phone,
      birthday: this.birthday,
      gender: this.gender,
      role: this.role,
      status: this.status,
      emailVerified: this.emailVerified,
      phoneVerified: this.phoneVerified,
      twoFactorEnabled: this.twoFactorEnabled,
      preferences: this.preferences,
      lastLoginAt: this.lastLoginAt,
      loginCount: this.loginCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * 更新用户偏好设置
   */
  async updatePreferences(newPreferences) {
    const currentPreferences = this.preferences || {};
    this.preferences = { ...currentPreferences, ...newPreferences };
    await this.save();
  }

  /**
   * 检查用户权限
   */
  hasPermission(permission) {
    const rolePermissions = {
      admin: ['*'], // 管理员拥有所有权限
      moderator: [
        'user.read', 'user.update', 'user.moderate',
        'content.read', 'content.moderate',
        'message.read', 'message.moderate'
      ],
      user: [
        'user.read.own', 'user.update.own',
        'content.create', 'content.read', 'content.update.own', 'content.delete.own',
        'message.create', 'message.read.own'
      ]
    };

    const permissions = rolePermissions[this.role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }

  /**
   * 静态方法：根据邮箱或用户名查找用户
   */
  static async findByEmailOrUsername(identifier) {
    return await User.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });
  }

  /**
   * 静态方法：创建用户
   */
  static async createUser(userData) {
    const transaction = await sequelize.transaction();
    
    try {
      // 检查用户名和邮箱是否已存在
      const existingUser = await User.findOne({
        where: {
          [sequelize.Sequelize.Op.or]: [
            { email: userData.email },
            { username: userData.username }
          ]
        },
        transaction
      });

      if (existingUser) {
        throw new Error(
          existingUser.email === userData.email 
            ? 'Email already exists' 
            : 'Username already exists'
        );
      }

      // 创建用户
      const user = await User.create(userData, { transaction });
      
      await transaction.commit();
      
      logger.business('USER_CREATED', user.id, {
        username: user.username,
        email: user.email
      });
      
      return user;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 静态方法：验证密码重置令牌
   */
  static async findByPasswordResetToken(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    return await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    });
  }

  /**
   * 静态方法：验证邮箱验证令牌
   */
  static async findByEmailVerificationToken(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    return await User.findOne({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    });
  }

  /**
   * 静态方法：获取用户统计信息
   */
  static async getStats() {
    const [totalUsers, activeUsers, verifiedUsers, lockedUsers] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      User.count({ where: { emailVerified: true } }),
      User.count({ where: { status: 'locked' } })
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      verified: verifiedUsers,
      locked: lockedUsers,
      verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(2) : 0
    };
  }
}

// 定义模型
User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // 基本信息
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: {
        msg: 'Username can only contain letters and numbers'
      }
    }
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  
  // 个人信息
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  
  birthday: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true
  },
  
  // 账户状态
  role: {
    type: DataTypes.ENUM('user', 'moderator', 'admin'),
    defaultValue: 'user',
    allowNull: false
  },
  
  status: {
    type: DataTypes.ENUM('pending', 'active', 'inactive', 'locked', 'banned'),
    defaultValue: 'pending',
    allowNull: false
  },
  
  // 验证状态
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  phoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // 安全相关
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  twoFactorSecret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  refreshToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  refreshTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // 登录相关
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  lastLoginIp: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  
  lastLoginUserAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  loginCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // 偏好设置
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        showEmail: false,
        showPhone: false,
        showOnlineStatus: true
      }
    }
  },
  
  // 第三方登录
  wechatOpenId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  
  wechatUnionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  
  // 统计信息
  profileViews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // 时间戳
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  paranoid: true, // 软删除
  
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['status']
    },
    {
      fields: ['role']
    },
    {
      fields: ['emailVerified']
    },
    {
      fields: ['lastLoginAt']
    },
    {
      fields: ['createdAt']
    },
    {
      unique: true,
      fields: ['wechatOpenId'],
      where: {
        wechatOpenId: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      unique: true,
      fields: ['wechatUnionId'],
      where: {
        wechatUnionId: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    }
  ],
  
  hooks: {
    // 创建前加密密码
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
      
      // 设置默认昵称
      if (!user.nickname) {
        user.nickname = user.username;
      }
    },
    
    // 更新前加密密码
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    
    // 创建后记录日志
    afterCreate: (user) => {
      logger.info('User created:', {
        userId: user.id,
        username: user.username,
        email: user.email
      });
    },
    
    // 更新后记录日志
    afterUpdate: (user) => {
      const changes = user.changed();
      if (changes && changes.length > 0) {
        logger.info('User updated:', {
          userId: user.id,
          changes: changes
        });
      }
    }
  }
});

module.exports = User;