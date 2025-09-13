const { User, PointsAccount, PointsTransaction } = require('../models');
const { Op, sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const { generateCode } = require('../utils/helpers');
const { uploadFile } = require('../utils/upload');

class UserService {
  /**
   * 创建用户
   */
  async createUser(userData) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        username,
        email,
        password,
        phone,
        nickname,
        role = 'user',
        status = 'active'
      } = userData;

      // 检查用户是否已存在
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email },
            ...(phone ? [{ phone }] : [])
          ]
        },
        transaction
      });

      if (existingUser) {
        throw new Error('用户名、邮箱或手机号已存在');
      }

      // 创建用户
      const user = await User.create({
        username,
        email,
        password,
        phone,
        nickname: nickname || username,
        role,
        status
      }, { transaction });

      // 创建积分账户
      const initialPoints = config.user.initialPoints || 0;
      await PointsAccount.create({
        userId: user.id,
        balance: initialPoints
      }, { transaction });

      // 记录初始积分
      if (initialPoints > 0) {
        await PointsTransaction.create({
          userId: user.id,
          type: 'earn',
          amount: initialPoints,
          source: 'register',
          description: '注册赠送积分',
          status: 'completed'
        }, { transaction });
      }

      await transaction.commit();

      logger.info(`用户创建成功: ${user.id}`, { userId: user.id, username });

      return user;

    } catch (error) {
      await transaction.rollback();
      logger.error('创建用户失败:', error);
      throw error;
    }
  }

  /**
   * 用户登录验证
   */
  async authenticateUser(identifier, password) {
    try {
      // 查找用户
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { username: identifier },
            { email: identifier },
            { phone: identifier }
          ]
        },
        include: [{
          model: PointsAccount,
          as: 'pointsAccount'
        }]
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        throw new Error('账户已被禁用');
      }

      // 验证密码
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        // 记录登录失败
        await user.increment('loginFailCount');
        throw new Error('密码错误');
      }

      // 更新登录信息
      await user.update({
        lastLoginAt: new Date(),
        loginFailCount: 0
      });

      logger.info(`用户登录成功: ${user.id}`, { userId: user.id, username: user.username });

      return user;

    } catch (error) {
      logger.error('用户登录验证失败:', error);
      throw error;
    }
  }

  /**
   * 生成JWT令牌
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  /**
   * 验证JWT令牌
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('令牌无效');
    }
  }

  /**
   * 获取用户详细信息
   */
  async getUserById(userId, includePoints = true) {
    try {
      const include = [];
      
      if (includePoints) {
        include.push({
          model: PointsAccount,
          as: 'pointsAccount'
        });
      }

      const user = await User.findByPk(userId, {
        include,
        attributes: { exclude: ['password', 'passwordSalt'] }
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      return user;

    } catch (error) {
      logger.error('获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查邮箱和手机号是否被其他用户使用
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email: updateData.email,
            id: { [Op.ne]: userId }
          }
        });
        if (existingUser) {
          throw new Error('邮箱已被其他用户使用');
        }
      }

      if (updateData.phone && updateData.phone !== user.phone) {
        const existingUser = await User.findOne({
          where: {
            phone: updateData.phone,
            id: { [Op.ne]: userId }
          }
        });
        if (existingUser) {
          throw new Error('手机号已被其他用户使用');
        }
      }

      // 过滤敏感字段
      const allowedFields = [
        'nickname', 'avatar', 'phone', 'birthday', 'gender', 'bio', 'email'
      ];
      const filteredData = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      await user.update(filteredData);

      logger.info(`用户信息更新成功: ${userId}`);

      return user;

    } catch (error) {
      logger.error('更新用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证旧密码
      const isValidPassword = await user.validatePassword(oldPassword);
      if (!isValidPassword) {
        throw new Error('原密码错误');
      }

      // 更新密码
      await user.update({ password: newPassword });

      logger.info(`用户密码修改成功: ${userId}`);

      return true;

    } catch (error) {
      logger.error('修改密码失败:', error);
      throw error;
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(email) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error('邮箱不存在');
      }

      // 生成重置令牌
      const resetToken = generateCode(32);
      const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期

      await user.update({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires
      });

      // 发送重置邮件
      const resetUrl = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: email,
        subject: '密码重置',
        template: 'reset-password',
        data: {
          username: user.username,
          resetUrl
        }
      });

      logger.info(`密码重置邮件发送成功: ${user.id}`);

      return true;

    } catch (error) {
      logger.error('发送密码重置邮件失败:', error);
      throw error;
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!user) {
        throw new Error('重置令牌无效或已过期');
      }

      // 更新密码并清除重置令牌
      await user.update({
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      });

      logger.info(`密码重置成功: ${user.id}`);

      return true;

    } catch (error) {
      logger.error('重置密码失败:', error);
      throw error;
    }
  }

  /**
   * 上传用户头像
   */
  async uploadAvatar(userId, file) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 上传文件
      const avatarUrl = await uploadFile(file, 'avatars');

      // 更新用户头像
      await user.update({ avatar: avatarUrl });

      logger.info(`用户头像上传成功: ${userId}`);

      return avatarUrl;

    } catch (error) {
      logger.error('上传用户头像失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户积分信息
   */
  async getUserPointsInfo(userId) {
    try {
      const pointsAccount = await PointsAccount.findOne({
        where: { userId }
      });

      if (!pointsAccount) {
        throw new Error('积分账户不存在');
      }

      // 获取最近的积分交易记录
      const recentTransactions = await PointsTransaction.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // 获取积分统计
      const stats = await PointsTransaction.findAll({
        where: { userId },
        attributes: [
          'type',
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['type']
      });

      return {
        account: pointsAccount,
        recentTransactions,
        stats
      };

    } catch (error) {
      logger.error('获取用户积分信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户列表（管理员）
   */
  async getUserList(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        role,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = options;

      const where = {};

      if (search) {
        where[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { nickname: { [Op.like]: `%${search}%` } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (role) {
        where.role = role;
      }

      const offset = (page - 1) * limit;

      const { rows: users, count } = await User.findAndCountAll({
        where,
        include: [{
          model: PointsAccount,
          as: 'pointsAccount'
        }],
        attributes: { exclude: ['password', 'passwordSalt'] },
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset
      });

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('获取用户列表失败:', error);
      throw error;
    }
  }

  /**
   * 禁用/启用用户（管理员）
   */
  async toggleUserStatus(userId, status) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      await user.update({ status });

      logger.info(`用户状态更新成功: ${userId} -> ${status}`);

      return user;

    } catch (error) {
      logger.error('更新用户状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户统计信息（管理员）
   */
  async getUserStats() {
    try {
      const stats = await User.findAll({
        attributes: [
          'status',
          'role',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status', 'role']
      });

      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { status: 'active' } });
      const newUsersToday = await User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      return {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        breakdown: stats
      };

    } catch (error) {
      logger.error('获取用户统计失败:', error);
      throw error;
    }
  }
}

module.exports = new UserService();