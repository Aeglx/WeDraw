const { PointsAccount, PointsTransaction, User } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { validateInput } = require('../utils/validation');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { transaction } = require('../models');

/**
 * 积分控制器
 * 处理积分相关的业务逻辑
 */
class PointsController {
  /**
   * 获取积分账户信息
   */
  async getAccount(req, res) {
    try {
      const userId = req.user.id;
      
      const account = await PointsAccount.findOne({
        where: { user_id: userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nickname', 'avatar']
          }
        ]
      });
      
      if (!account) {
        return errorResponse(res, '积分账户不存在', 404);
      }
      
      return successResponse(res, '获取积分账户成功', account);
    } catch (error) {
      logger.error('获取积分账户失败:', error);
      return errorResponse(res, '获取积分账户失败');
    }
  }
  
  /**
   * 获取积分交易记录
   */
  async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        type,
        source,
        start_date,
        end_date
      } = req.query;
      
      const offset = (page - 1) * limit;
      const where = { user_id: userId };
      
      // 类型筛选
      if (type) {
        where.type = type;
      }
      
      // 来源筛选
      if (source) {
        where.source = source;
      }
      
      // 日期范围筛选
      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) {
          where.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          where.created_at[Op.lte] = new Date(end_date);
        }
      }
      
      const { count, rows } = await PointsTransaction.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nickname', 'avatar']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return successResponse(res, '获取积分交易记录成功', {
        transactions: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('获取积分交易记录失败:', error);
      return errorResponse(res, '获取积分交易记录失败');
    }
  }
  
  /**
   * 管理员添加积分
   */
  async addPoints(req, res) {
    try {
      const { user_id, points, source, description, expire_days } = req.body;
      
      // 验证输入
      const validation = validateInput({
        user_id: { value: user_id, type: 'integer', min: 1 },
        points: { value: points, type: 'integer', min: 1 },
        source: { value: source, type: 'enum', enum: Object.values(PointsTransaction.SOURCES) },
        description: { value: description, type: 'string', maxLength: 200, required: false },
        expire_days: { value: expire_days, type: 'integer', min: 1, required: false }
      });
      
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      
      // 检查用户是否存在
      const user = await User.findByPk(user_id);
      if (!user) {
        return errorResponse(res, '用户不存在', 404);
      }
      
      // 获取或创建积分账户
      let account = await PointsAccount.findOne({ where: { user_id } });
      if (!account) {
        account = await PointsAccount.createForUser(user_id);
      }
      
      // 计算过期时间
      let expireAt = null;
      if (expire_days) {
        expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + expire_days);
      }
      
      // 执行积分添加
      const result = await transaction(async (t) => {
        // 添加积分
        await account.addPoints(points, { transaction: t });
        
        // 创建交易记录
        const transactionRecord = await PointsTransaction.create({
          user_id,
          points_account_id: account.id,
          transaction_no: PointsTransaction.generateTransactionNo(),
          type: PointsTransaction.TYPES.EARN,
          source,
          points,
          balance_after: account.available_points + points,
          description: description || `管理员添加积分`,
          expire_at: expireAt,
          status: 'completed',
          admin_id: req.user.id
        }, { transaction: t });
        
        return transactionRecord;
      });
      
      logger.info(`管理员 ${req.user.id} 为用户 ${user_id} 添加积分 ${points}`, {
        adminId: req.user.id,
        userId: user_id,
        points,
        source,
        transactionId: result.id
      });
      
      return successResponse(res, '添加积分成功', result);
    } catch (error) {
      logger.error('添加积分失败:', error);
      return errorResponse(res, '添加积分失败');
    }
  }
  
  /**
   * 管理员扣减积分
   */
  async deductPoints(req, res) {
    try {
      const { user_id, points, source, description } = req.body;
      
      // 验证输入
      const validation = validateInput({
        user_id: { value: user_id, type: 'integer', min: 1 },
        points: { value: points, type: 'integer', min: 1 },
        source: { value: source, type: 'enum', enum: Object.values(PointsTransaction.SOURCES) },
        description: { value: description, type: 'string', maxLength: 200, required: false }
      });
      
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      
      // 检查用户是否存在
      const user = await User.findByPk(user_id);
      if (!user) {
        return errorResponse(res, '用户不存在', 404);
      }
      
      // 获取积分账户
      const account = await PointsAccount.findOne({ where: { user_id } });
      if (!account) {
        return errorResponse(res, '积分账户不存在', 404);
      }
      
      // 检查积分余额
      if (account.available_points < points) {
        return errorResponse(res, '积分余额不足', 400);
      }
      
      // 执行积分扣减
      const result = await transaction(async (t) => {
        // 扣减积分
        await account.usePoints(points, { transaction: t });
        
        // 创建交易记录
        const transactionRecord = await PointsTransaction.create({
          user_id,
          points_account_id: account.id,
          transaction_no: PointsTransaction.generateTransactionNo(),
          type: PointsTransaction.TYPES.SPEND,
          source,
          points,
          balance_after: account.available_points - points,
          description: description || `管理员扣减积分`,
          status: 'completed',
          admin_id: req.user.id
        }, { transaction: t });
        
        return transactionRecord;
      });
      
      logger.info(`管理员 ${req.user.id} 为用户 ${user_id} 扣减积分 ${points}`, {
        adminId: req.user.id,
        userId: user_id,
        points,
        source,
        transactionId: result.id
      });
      
      return successResponse(res, '扣减积分成功', result);
    } catch (error) {
      logger.error('扣减积分失败:', error);
      return errorResponse(res, '扣减积分失败');
    }
  }
  
  /**
   * 冻结积分
   */
  async freezePoints(req, res) {
    try {
      const { user_id, points, reason, expire_hours = 24 } = req.body;
      
      // 验证输入
      const validation = validateInput({
        user_id: { value: user_id, type: 'integer', min: 1 },
        points: { value: points, type: 'integer', min: 1 },
        reason: { value: reason, type: 'string', maxLength: 200 },
        expire_hours: { value: expire_hours, type: 'integer', min: 1, max: 168 }
      });
      
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      
      // 检查用户是否存在
      const user = await User.findByPk(user_id);
      if (!user) {
        return errorResponse(res, '用户不存在', 404);
      }
      
      // 获取积分账户
      const account = await PointsAccount.findOne({ where: { user_id } });
      if (!account) {
        return errorResponse(res, '积分账户不存在', 404);
      }
      
      // 检查可用积分
      if (account.available_points < points) {
        return errorResponse(res, '可用积分不足', 400);
      }
      
      // 计算解冻时间
      const unfreezeAt = new Date();
      unfreezeAt.setHours(unfreezeAt.getHours() + expire_hours);
      
      // 执行积分冻结
      const result = await transaction(async (t) => {
        // 冻结积分
        await account.freezePoints(points, { transaction: t });
        
        // 创建交易记录
        const transactionRecord = await PointsTransaction.create({
          user_id,
          points_account_id: account.id,
          transaction_no: PointsTransaction.generateTransactionNo(),
          type: PointsTransaction.TYPES.FREEZE,
          source: PointsTransaction.SOURCES.ADMIN,
          points,
          balance_after: account.available_points - points,
          description: `积分冻结: ${reason}`,
          expire_at: unfreezeAt,
          status: 'completed',
          admin_id: req.user.id
        }, { transaction: t });
        
        return transactionRecord;
      });
      
      logger.info(`管理员 ${req.user.id} 冻结用户 ${user_id} 积分 ${points}`, {
        adminId: req.user.id,
        userId: user_id,
        points,
        reason,
        unfreezeAt,
        transactionId: result.id
      });
      
      return successResponse(res, '冻结积分成功', result);
    } catch (error) {
      logger.error('冻结积分失败:', error);
      return errorResponse(res, '冻结积分失败');
    }
  }
  
  /**
   * 解冻积分
   */
  async unfreezePoints(req, res) {
    try {
      const { user_id, points, reason } = req.body;
      
      // 验证输入
      const validation = validateInput({
        user_id: { value: user_id, type: 'integer', min: 1 },
        points: { value: points, type: 'integer', min: 1 },
        reason: { value: reason, type: 'string', maxLength: 200, required: false }
      });
      
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      
      // 检查用户是否存在
      const user = await User.findByPk(user_id);
      if (!user) {
        return errorResponse(res, '用户不存在', 404);
      }
      
      // 获取积分账户
      const account = await PointsAccount.findOne({ where: { user_id } });
      if (!account) {
        return errorResponse(res, '积分账户不存在', 404);
      }
      
      // 检查冻结积分
      if (account.frozen_points < points) {
        return errorResponse(res, '冻结积分不足', 400);
      }
      
      // 执行积分解冻
      const result = await transaction(async (t) => {
        // 解冻积分
        await account.unfreezePoints(points, { transaction: t });
        
        // 创建交易记录
        const transactionRecord = await PointsTransaction.create({
          user_id,
          points_account_id: account.id,
          transaction_no: PointsTransaction.generateTransactionNo(),
          type: PointsTransaction.TYPES.UNFREEZE,
          source: PointsTransaction.SOURCES.ADMIN,
          points,
          balance_after: account.available_points + points,
          description: `积分解冻: ${reason || '管理员操作'}`,
          status: 'completed',
          admin_id: req.user.id
        }, { transaction: t });
        
        return transactionRecord;
      });
      
      logger.info(`管理员 ${req.user.id} 解冻用户 ${user_id} 积分 ${points}`, {
        adminId: req.user.id,
        userId: user_id,
        points,
        reason,
        transactionId: result.id
      });
      
      return successResponse(res, '解冻积分成功', result);
    } catch (error) {
      logger.error('解冻积分失败:', error);
      return errorResponse(res, '解冻积分失败');
    }
  }
  
  /**
   * 获取积分统计信息
   */
  async getPointsStats(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const where = {};
      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) {
          where.created_at[Op.gte] = new Date(start_date);
        }
        if (end_date) {
          where.created_at[Op.lte] = new Date(end_date);
        }
      }
      
      const stats = await PointsTransaction.getStatistics(where);
      
      return successResponse(res, '获取积分统计成功', stats);
    } catch (error) {
      logger.error('获取积分统计失败:', error);
      return errorResponse(res, '获取积分统计失败');
    }
  }
  
  /**
   * 获取积分排行榜
   */
  async getPointsRanking(req, res) {
    try {
      const { limit = 50, type = 'total' } = req.query;
      
      let orderField = 'total_points';
      if (type === 'available') {
        orderField = 'available_points';
      } else if (type === 'used') {
        orderField = 'used_points';
      }
      
      const rankings = await PointsAccount.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nickname', 'avatar'],
            where: { status: 'active' }
          }
        ],
        order: [[orderField, 'DESC']],
        limit: parseInt(limit)
      });
      
      const result = rankings.map((account, index) => ({
        rank: index + 1,
        user: account.user,
        points: {
          total: account.total_points,
          available: account.available_points,
          used: account.used_points,
          frozen: account.frozen_points
        }
      }));
      
      return successResponse(res, '获取积分排行榜成功', result);
    } catch (error) {
      logger.error('获取积分排行榜失败:', error);
      return errorResponse(res, '获取积分排行榜失败');
    }
  }
}

module.exports = new PointsController();