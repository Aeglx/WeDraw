const { User, PointsAccount } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { validateInput } = require('../utils/validation');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * 用户控制器
 * 处理用户相关的业务逻辑
 */
class UserController {
  /**
   * 获取用户信息
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId, {
        include: [
          {
            model: PointsAccount,
            as: 'pointsAccount',
            attributes: ['total_points', 'available_points', 'frozen_points', 'used_points']
          }
        ],
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return errorResponse(res, '用户不存在', 404);
      }
      
      return successResponse(res, '获取用户信息成功', user.toSafeJSON());
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      return errorResponse(res, '获取用户信息失败');
    }
  }
  
  /**
   * 更新用户信息
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { nickname, avatar, phone, email, gender, birthday } = req.body;
      
      // 验证输入
      const validation = validateInput({
        nickname: { value: nickname, type: 'string', maxLength: 50 },
        avatar: { value: avatar, type: 'url', required: false },
        phone: { value: phone, type: 'phone', required: false },
        email: { value: email, type: 'email', required: false },
        gender: { value: gender, type: 'enum', enum: ['male', 'female', 'other'], required: false },
        birthday: { value: birthday, type: 'date', required: false }
      });
      
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        return errorResponse(res, '用户不存在', 404);
      }
      
      // 检查手机号和邮箱是否已被其他用户使用
      if (phone && phone !== user.phone) {
        const existingUser = await User.findOne({
          where: {
            phone,
            id: { [Op.ne]: userId }
          }
        });
        if (existingUser) {
          return errorResponse(res, '手机号已被其他用户使用', 400);
        }
      }
      
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email,
            id: { [Op.ne]: userId }
          }
        });
        if (existingUser) {
          return errorResponse(res, '邮箱已被其他用户使用', 400);
        }
      }
      
      // 更新用户信息
      await user.update({
        nickname: nickname || user.nickname,
        avatar: avatar || user.avatar,
        phone: phone || user.phone,
        email: email || user.email,
        gender: gender || user.gender,
        birthday: birthday || user.birthday
      });
      
      return successResponse(res, '更新用户信息成功', user.toSafeJSON());
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      return errorResponse(res, '更新用户信息失败');
    }
  }
  
  /**
   * 获取用户积分信息
   */
  async getPointsInfo(req, res) {
    try {
      const userId = req.user.id;
      
      const pointsAccount = await PointsAccount.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nickname', 'avatar']
          }
        ]
      });
      
      if (!pointsAccount) {
        return errorResponse(res, '积分账户不存在', 404);
      }
      
      return successResponse(res, '获取积分信息成功', pointsAccount);
    } catch (error) {
      logger.error('获取积分信息失败:', error);
      return errorResponse(res, '获取积分信息失败');
    }
  }
  
  /**
   * 获取用户列表（管理员）
   */
  async getUserList(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        keyword,
        status,
        sort = 'created_at',
        order = 'DESC'
      } = req.query;
      
      const offset = (page - 1) * limit;
      const where = {};
      
      // 关键词搜索
      if (keyword) {
        where[Op.or] = [
          { nickname: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
          { openid: { [Op.like]: `%${keyword}%` } }
        ];
      }
      
      // 状态筛选
      if (status) {
        where.status = status;
      }
      
      const { count, rows } = await User.findAndCountAll({
        where,
        include: [
          {
            model: PointsAccount,
            as: 'pointsAccount',
            attributes: ['total_points', 'available_points']
          }
        ],
        attributes: { exclude: ['password'] },
        order: [[sort, order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return successResponse(res, '获取用户列表成功', {
        users: rows.map(user => user.toSafeJSON()),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('获取用户列表失败:', error);
      return errorResponse(res, '获取用户列表失败');
    }
  }
  
  /**
   * 获取用户详情（管理员）
   */
  async getUserDetail(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await User.findByPk(userId, {
        include: [
          {
            model: PointsAccount,
            as: 'pointsAccount'
          }
        ],
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return errorResponse(res, '用户不存在', 404);
      }
      
      return successResponse(res, '获取用户详情成功', user.toSafeJSON());
    } catch (error) {
      logger.error('获取用户详情失败:', error);
      return errorResponse(res, '获取用户详情失败');
    }
  }
  
  /**
   * 更新用户状态（管理员）
   */
  async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { status, reason } = req.body;
      
      // 验证输入
      const validation = validateInput({
        status: { value: status, type: 'enum', enum: ['active', 'inactive', 'banned'] },
        reason: { value: reason, type: 'string', maxLength: 200, required: false }
      });
      
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        return errorResponse(res, '用户不存在', 404);
      }
      
      await user.update({
        status,
        status_reason: reason || null,
        updated_at: new Date()
      });
      
      logger.info(`管理员 ${req.user.id} 更新用户 ${userId} 状态为 ${status}`, {
        adminId: req.user.id,
        userId,
        status,
        reason
      });
      
      return successResponse(res, '更新用户状态成功', user.toSafeJSON());
    } catch (error) {
      logger.error('更新用户状态失败:', error);
      return errorResponse(res, '更新用户状态失败');
    }
  }
  
  /**
   * 获取用户统计信息（管理员）
   */
  async getUserStats(req, res) {
    try {
      const stats = await User.getStatistics();
      return successResponse(res, '获取用户统计信息成功', stats);
    } catch (error) {
      logger.error('获取用户统计信息失败:', error);
      return errorResponse(res, '获取用户统计信息失败');
    }
  }
}

module.exports = new UserController();