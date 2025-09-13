const User = require('../models/User');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');
const { AppError, ValidationError } = require('../middleware/errorHandler');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const crypto = require('crypto');
const { Op } = require('sequelize');

/**
 * 用户控制器
 */
class UserController {
  /**
   * 用户注册
   */
  static async register(req, res, next) {
    try {
      const { username, email, password, nickname, phone } = req.body;
      
      // 检查用户是否已存在
      const existingUser = await User.findByEmailOrUsername(email);
      if (existingUser) {
        throw new ValidationError(
          existingUser.email === email ? 'Email already exists' : 'Username already exists'
        );
      }
      
      // 创建用户
      const userData = {
        username,
        email,
        password,
        nickname: nickname || username,
        phone
      };
      
      const user = await User.createUser(userData);
      
      // 生成邮箱验证令牌
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();
      
      // 发送验证邮件
      try {
        await sendEmail({
          to: user.email,
          subject: 'Welcome to WeDraw - Verify Your Email',
          template: 'email-verification',
          data: {
            username: user.username,
            verificationToken,
            verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
          }
        });
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        // 不阻止注册流程
      }
      
      // 记录用户操作
      logger.userAction(user.id, 'REGISTER', 'user', {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 用户登录
   */
  static async login(req, res, next) {
    try {
      const { identifier, password, rememberMe } = req.body;
      const ip = req.ip;
      const userAgent = req.get('user-agent');
      
      // 查找用户
      const user = await User.findByEmailOrUsername(identifier);
      if (!user) {
        throw new ValidationError('Invalid credentials');
      }
      
      // 检查用户是否被锁定
      if (user.isLocked()) {
        logger.security('LOGIN_ATTEMPT_LOCKED', req, {
          userId: user.id,
          identifier
        });
        throw new ValidationError('Account is locked. Please try again later.');
      }
      
      // 验证密码
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        await user.incrementFailedAttempts();
        
        logger.security('LOGIN_FAILED', req, {
          userId: user.id,
          identifier,
          failedAttempts: user.failedLoginAttempts
        });
        
        throw new ValidationError('Invalid credentials');
      }
      
      // 检查用户状态
      if (user.status !== 'active') {
        throw new ValidationError('Account is not active');
      }
      
      // 重置失败登录次数
      await user.resetFailedAttempts();
      
      // 生成令牌
      const token = user.generateToken();
      const refreshToken = user.generateRefreshToken();
      
      // 更新登录信息
      await user.updateLastLogin(ip, userAgent);
      
      // 缓存用户信息
      const cacheKey = `user:${user.id}`;
      await redisClient.set(cacheKey, user.getFullProfile(), 3600); // 1小时
      
      // 设置Cookie（如果选择记住我）
      if (rememberMe) {
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30天
        });
      }
      
      // 记录登录日志
      logger.userAction(user.id, 'LOGIN', 'user', {
        ip,
        userAgent,
        rememberMe
      });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.getFullProfile(),
          token,
          refreshToken: rememberMe ? undefined : refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 刷新令牌
   */
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body || {};
      const cookieRefreshToken = req.cookies.refreshToken;
      
      const token = refreshToken || cookieRefreshToken;
      if (!token) {
        throw new ValidationError('Refresh token is required');
      }
      
      // 查找用户
      const user = await User.findOne({
        where: {
          refreshToken: token,
          refreshTokenExpires: {
            [Op.gt]: new Date()
          }
        }
      });
      
      if (!user) {
        throw new ValidationError('Invalid or expired refresh token');
      }
      
      // 生成新的令牌
      const newToken = user.generateToken();
      const newRefreshToken = user.generateRefreshToken();
      await user.save();
      
      // 更新缓存
      const cacheKey = `user:${user.id}`;
      await redisClient.set(cacheKey, user.getFullProfile(), 3600);
      
      // 更新Cookie
      if (cookieRefreshToken) {
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
      }
      
      res.json({
        success: true,
        data: {
          token: newToken,
          refreshToken: cookieRefreshToken ? undefined : newRefreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 用户登出
   */
  static async logout(req, res, next) {
    try {
      const user = req.user;
      
      // 清除刷新令牌
      user.refreshToken = null;
      user.refreshTokenExpires = null;
      await user.save();
      
      // 清除缓存
      const cacheKey = `user:${user.id}`;
      await redisClient.del(cacheKey);
      
      // 清除Cookie
      res.clearCookie('refreshToken');
      
      // 记录登出日志
      logger.userAction(user.id, 'LOGOUT', 'user', {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 获取当前用户信息
   */
  static async getProfile(req, res, next) {
    try {
      const user = req.user;
      
      // 尝试从缓存获取
      const cacheKey = `user:${user.id}`;
      let userProfile = await redisClient.get(cacheKey);
      
      if (!userProfile) {
        // 从数据库获取最新信息
        const freshUser = await User.findByPk(user.id);
        if (!freshUser) {
          throw new AppError('User not found', 404);
        }
        
        userProfile = freshUser.getFullProfile();
        await redisClient.set(cacheKey, userProfile, 3600);
      }
      
      res.json({
        success: true,
        data: {
          user: userProfile
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 更新用户信息
   */
  static async updateProfile(req, res, next) {
    try {
      const user = req.user;
      const allowedFields = [
        'nickname', 'bio', 'location', 'website', 'phone', 
        'birthday', 'gender', 'avatar'
      ];
      
      const updateData = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('No valid fields to update');
      }
      
      // 更新用户信息
      await user.update(updateData);
      
      // 更新缓存
      const cacheKey = `user:${user.id}`;
      await redisClient.set(cacheKey, user.getFullProfile(), 3600);
      
      // 记录操作日志
      logger.userAction(user.id, 'UPDATE_PROFILE', 'user', {
        updatedFields: Object.keys(updateData)
      });
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.getFullProfile()
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 更改密码
   */
  static async changePassword(req, res, next) {
    try {
      const user = req.user;
      const { currentPassword, newPassword } = req.body;
      
      // 验证当前密码
      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        throw new ValidationError('Current password is incorrect');
      }
      
      // 更新密码
      user.password = newPassword;
      await user.save();
      
      // 清除所有刷新令牌（强制重新登录）
      user.refreshToken = null;
      user.refreshTokenExpires = null;
      await user.save();
      
      // 清除缓存
      const cacheKey = `user:${user.id}`;
      await redisClient.del(cacheKey);
      
      // 记录安全日志
      logger.security('PASSWORD_CHANGED', req, {
        userId: user.id
      });
      
      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 忘记密码
   */
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // 为了安全，不透露用户是否存在
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent.'
        });
      }
      
      // 生成重置令牌
      const resetToken = user.generatePasswordResetToken();
      await user.save();
      
      // 发送重置邮件
      try {
        await sendEmail({
          to: user.email,
          subject: 'Password Reset Request',
          template: 'password-reset',
          data: {
            username: user.username,
            resetToken,
            resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
            expiresIn: '10 minutes'
          }
        });
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError);
        throw new AppError('Failed to send password reset email', 500);
      }
      
      // 记录安全日志
      logger.security('PASSWORD_RESET_REQUESTED', req, {
        userId: user.id,
        email
      });
      
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 重置密码
   */
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      
      // 查找用户
      const user = await User.findByPasswordResetToken(token);
      if (!user) {
        throw new ValidationError('Invalid or expired reset token');
      }
      
      // 更新密码
      user.password = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      user.refreshToken = null;
      user.refreshTokenExpires = null;
      await user.save();
      
      // 清除缓存
      const cacheKey = `user:${user.id}`;
      await redisClient.del(cacheKey);
      
      // 记录安全日志
      logger.security('PASSWORD_RESET_COMPLETED', req, {
        userId: user.id
      });
      
      res.json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 验证邮箱
   */
  static async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;
      
      // 查找用户
      const user = await User.findByEmailVerificationToken(token);
      if (!user) {
        throw new ValidationError('Invalid or expired verification token');
      }
      
      // 更新验证状态
      user.emailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      user.status = 'active'; // 激活账户
      await user.save();
      
      // 更新缓存
      const cacheKey = `user:${user.id}`;
      await redisClient.set(cacheKey, user.getFullProfile(), 3600);
      
      // 记录操作日志
      logger.userAction(user.id, 'EMAIL_VERIFIED', 'user', {
        ip: req.ip
      });
      
      res.json({
        success: true,
        message: 'Email verified successfully. Your account is now active.'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 重新发送验证邮件
   */
  static async resendVerificationEmail(req, res, next) {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      if (user.emailVerified) {
        throw new ValidationError('Email is already verified');
      }
      
      // 生成新的验证令牌
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();
      
      // 发送验证邮件
      try {
        await sendEmail({
          to: user.email,
          subject: 'Email Verification - WeDraw',
          template: 'email-verification',
          data: {
            username: user.username,
            verificationToken,
            verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
          }
        });
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        throw new AppError('Failed to send verification email', 500);
      }
      
      res.json({
        success: true,
        message: 'Verification email sent successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 更新用户偏好设置
   */
  static async updatePreferences(req, res, next) {
    try {
      const user = req.user;
      const { preferences } = req.body;
      
      if (!preferences || typeof preferences !== 'object') {
        throw new ValidationError('Invalid preferences data');
      }
      
      // 更新偏好设置
      await user.updatePreferences(preferences);
      
      // 更新缓存
      const cacheKey = `user:${user.id}`;
      await redisClient.set(cacheKey, user.getFullProfile(), 3600);
      
      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: {
          preferences: user.preferences
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 获取用户公开信息
   */
  static async getUserById(req, res, next) {
    try {
      const { userId } = req.params;
      
      // 尝试从缓存获取
      const cacheKey = `user:public:${userId}`;
      let userProfile = await redisClient.get(cacheKey);
      
      if (!userProfile) {
        const user = await User.findByPk(userId);
        if (!user) {
          throw new AppError('User not found', 404);
        }
        
        userProfile = user.getPublicProfile();
        await redisClient.set(cacheKey, userProfile, 1800); // 30分钟
      }
      
      // 增加访问次数
      if (req.user && req.user.id !== userId) {
        await User.increment('profileViews', { where: { id: userId } });
      }
      
      res.json({
        success: true,
        data: {
          user: userProfile
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 搜索用户
   */
  static async searchUsers(req, res, next) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      
      if (!q || q.trim().length < 2) {
        throw new ValidationError('Search query must be at least 2 characters');
      }
      
      const offset = (page - 1) * limit;
      const searchTerm = `%${q.trim()}%`;
      
      const { count, rows: users } = await User.findAndCountAll({
        where: {
          [Op.and]: [
            {
              status: 'active'
            },
            {
              [Op.or]: [
                { username: { [Op.iLike]: searchTerm } },
                { nickname: { [Op.iLike]: searchTerm } },
                { email: { [Op.iLike]: searchTerm } }
              ]
            }
          ]
        },
        attributes: ['id', 'username', 'nickname', 'avatar', 'bio', 'createdAt'],
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });
      
      res.json({
        success: true,
        data: {
          users: users.map(user => user.getPublicProfile()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * 删除账户
   */
  static async deleteAccount(req, res, next) {
    try {
      const user = req.user;
      const { password } = req.body;
      
      // 验证密码
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        throw new ValidationError('Password is incorrect');
      }
      
      // 软删除用户
      await user.destroy();
      
      // 清除缓存
      const cacheKey = `user:${user.id}`;
      await redisClient.del(cacheKey);
      
      // 记录安全日志
      logger.security('ACCOUNT_DELETED', req, {
        userId: user.id,
        username: user.username
      });
      
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;