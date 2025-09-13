const { PointsAccount, PointsTransaction, User } = require('../models');
const { Op, sequelize } = require('sequelize');
const logger = require('../utils/logger');
const config = require('../config');

class PointsService {
  /**
   * 获取用户积分账户
   */
  async getPointsAccount(userId) {
    try {
      let account = await PointsAccount.findOne({
        where: { userId }
      });

      // 如果账户不存在，创建一个
      if (!account) {
        account = await PointsAccount.create({
          userId,
          balance: 0
        });
        logger.info(`创建积分账户: ${userId}`);
      }

      return account;

    } catch (error) {
      logger.error('获取积分账户失败:', error);
      throw error;
    }
  }

  /**
   * 增加积分
   */
  async addPoints(userId, amount, source, description, sourceId = null, metadata = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      if (amount <= 0) {
        throw new Error('积分数量必须大于0');
      }

      // 获取积分账户
      const account = await this.getPointsAccount(userId);

      // 更新账户余额
      await account.increment('balance', {
        by: amount,
        transaction
      });

      // 更新累计获得积分
      await account.increment('totalEarned', {
        by: amount,
        transaction
      });

      // 记录积分交易
      const pointsTransaction = await PointsTransaction.create({
        userId,
        type: 'earn',
        amount,
        source,
        sourceId,
        description,
        status: 'completed',
        metadata
      }, { transaction });

      await transaction.commit();

      logger.info(`积分增加成功: ${userId} +${amount} (${source})`, {
        userId,
        amount,
        source,
        transactionId: pointsTransaction.id
      });

      return {
        transaction: pointsTransaction,
        newBalance: account.balance + amount
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('增加积分失败:', error);
      throw error;
    }
  }

  /**
   * 扣减积分
   */
  async deductPoints(userId, amount, source, description, sourceId = null, metadata = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      if (amount <= 0) {
        throw new Error('积分数量必须大于0');
      }

      // 获取积分账户
      const account = await PointsAccount.findOne({
        where: { userId },
        transaction
      });

      if (!account) {
        throw new Error('积分账户不存在');
      }

      // 检查余额是否足够
      if (account.balance < amount) {
        throw new Error('积分余额不足');
      }

      // 更新账户余额
      await account.decrement('balance', {
        by: amount,
        transaction
      });

      // 更新累计消费积分
      await account.increment('totalSpent', {
        by: amount,
        transaction
      });

      // 记录积分交易
      const pointsTransaction = await PointsTransaction.create({
        userId,
        type: 'spend',
        amount,
        source,
        sourceId,
        description,
        status: 'completed',
        metadata
      }, { transaction });

      await transaction.commit();

      logger.info(`积分扣减成功: ${userId} -${amount} (${source})`, {
        userId,
        amount,
        source,
        transactionId: pointsTransaction.id
      });

      return {
        transaction: pointsTransaction,
        newBalance: account.balance - amount
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('扣减积分失败:', error);
      throw error;
    }
  }

  /**
   * 冻结积分
   */
  async freezePoints(userId, amount, reason, sourceId = null) {
    const transaction = await sequelize.transaction();
    
    try {
      if (amount <= 0) {
        throw new Error('积分数量必须大于0');
      }

      const account = await PointsAccount.findOne({
        where: { userId },
        transaction
      });

      if (!account) {
        throw new Error('积分账户不存在');
      }

      // 检查可用余额是否足够
      const availableBalance = account.balance - account.frozenBalance;
      if (availableBalance < amount) {
        throw new Error('可用积分余额不足');
      }

      // 增加冻结余额
      await account.increment('frozenBalance', {
        by: amount,
        transaction
      });

      // 记录积分交易
      const pointsTransaction = await PointsTransaction.create({
        userId,
        type: 'freeze',
        amount,
        source: 'freeze',
        sourceId,
        description: reason,
        status: 'completed'
      }, { transaction });

      await transaction.commit();

      logger.info(`积分冻结成功: ${userId} freeze ${amount}`, {
        userId,
        amount,
        reason,
        transactionId: pointsTransaction.id
      });

      return {
        transaction: pointsTransaction,
        frozenBalance: account.frozenBalance + amount
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('冻结积分失败:', error);
      throw error;
    }
  }

  /**
   * 解冻积分
   */
  async unfreezePoints(userId, amount, reason, sourceId = null) {
    const transaction = await sequelize.transaction();
    
    try {
      if (amount <= 0) {
        throw new Error('积分数量必须大于0');
      }

      const account = await PointsAccount.findOne({
        where: { userId },
        transaction
      });

      if (!account) {
        throw new Error('积分账户不存在');
      }

      // 检查冻结余额是否足够
      if (account.frozenBalance < amount) {
        throw new Error('冻结积分余额不足');
      }

      // 减少冻结余额
      await account.decrement('frozenBalance', {
        by: amount,
        transaction
      });

      // 记录积分交易
      const pointsTransaction = await PointsTransaction.create({
        userId,
        type: 'unfreeze',
        amount,
        source: 'unfreeze',
        sourceId,
        description: reason,
        status: 'completed'
      }, { transaction });

      await transaction.commit();

      logger.info(`积分解冻成功: ${userId} unfreeze ${amount}`, {
        userId,
        amount,
        reason,
        transactionId: pointsTransaction.id
      });

      return {
        transaction: pointsTransaction,
        frozenBalance: account.frozenBalance - amount
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('解冻积分失败:', error);
      throw error;
    }
  }

  /**
   * 积分转账
   */
  async transferPoints(fromUserId, toUserId, amount, description = '积分转账') {
    const transaction = await sequelize.transaction();
    
    try {
      if (amount <= 0) {
        throw new Error('转账积分数量必须大于0');
      }

      if (fromUserId === toUserId) {
        throw new Error('不能向自己转账');
      }

      // 检查转出用户积分余额
      const fromAccount = await PointsAccount.findOne({
        where: { userId: fromUserId },
        transaction
      });

      if (!fromAccount || fromAccount.balance < amount) {
        throw new Error('转出用户积分余额不足');
      }

      // 获取转入用户积分账户
      let toAccount = await PointsAccount.findOne({
        where: { userId: toUserId },
        transaction
      });

      if (!toAccount) {
        toAccount = await PointsAccount.create({
          userId: toUserId,
          balance: 0
        }, { transaction });
      }

      // 扣减转出用户积分
      await fromAccount.decrement('balance', {
        by: amount,
        transaction
      });
      await fromAccount.increment('totalSpent', {
        by: amount,
        transaction
      });

      // 增加转入用户积分
      await toAccount.increment('balance', {
        by: amount,
        transaction
      });
      await toAccount.increment('totalEarned', {
        by: amount,
        transaction
      });

      // 记录转出交易
      const fromTransaction = await PointsTransaction.create({
        userId: fromUserId,
        type: 'transfer_out',
        amount,
        source: 'transfer',
        sourceId: toUserId,
        description: `${description} (转给用户${toUserId})`,
        status: 'completed'
      }, { transaction });

      // 记录转入交易
      const toTransaction = await PointsTransaction.create({
        userId: toUserId,
        type: 'transfer_in',
        amount,
        source: 'transfer',
        sourceId: fromUserId,
        description: `${description} (来自用户${fromUserId})`,
        status: 'completed'
      }, { transaction });

      await transaction.commit();

      logger.info(`积分转账成功: ${fromUserId} -> ${toUserId} ${amount}`, {
        fromUserId,
        toUserId,
        amount,
        fromTransactionId: fromTransaction.id,
        toTransactionId: toTransaction.id
      });

      return {
        fromTransaction,
        toTransaction,
        fromNewBalance: fromAccount.balance - amount,
        toNewBalance: toAccount.balance + amount
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('积分转账失败:', error);
      throw error;
    }
  }

  /**
   * 获取积分交易记录
   */
  async getPointsTransactions(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        source,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = options;

      const where = { userId };

      if (type) {
        where.type = type;
      }

      if (source) {
        where.source = source;
      }

      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const offset = (page - 1) * limit;

      const { rows: transactions, count } = await PointsTransaction.findAndCountAll({
        where,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset
      });

      return {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('获取积分交易记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取积分统计
   */
  async getPointsStats(userId, period = '30d') {
    try {
      const account = await this.getPointsAccount(userId);

      // 计算时间范围
      let startDate;
      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      // 获取期间内的交易统计
      const periodStats = await PointsTransaction.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: startDate }
        },
        attributes: [
          'type',
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['type']
      });

      // 获取每日积分变化
      const dailyStats = await PointsTransaction.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: startDate }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          'type',
          [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
        ],
        group: [
          sequelize.fn('DATE', sequelize.col('created_at')),
          'type'
        ],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      });

      return {
        account,
        periodStats,
        dailyStats,
        period
      };

    } catch (error) {
      logger.error('获取积分统计失败:', error);
      throw error;
    }
  }

  /**
   * 批量调整积分（管理员）
   */
  async batchAdjustPoints(adjustments, adminUserId, reason = '管理员调整') {
    const transaction = await sequelize.transaction();
    
    try {
      const results = [];

      for (const adjustment of adjustments) {
        const { userId, amount, type = 'adjustment' } = adjustment;

        try {
          let result;
          if (amount > 0) {
            result = await this.addPoints(
              userId,
              amount,
              'admin_adjustment',
              `${reason} (+${amount})`,
              adminUserId
            );
          } else if (amount < 0) {
            result = await this.deductPoints(
              userId,
              Math.abs(amount),
              'admin_adjustment',
              `${reason} (${amount})`,
              adminUserId
            );
          }

          results.push({
            userId,
            amount,
            success: true,
            result
          });
        } catch (error) {
          results.push({
            userId,
            amount,
            success: false,
            error: error.message
          });
        }
      }

      await transaction.commit();

      logger.info(`批量积分调整完成`, {
        adminUserId,
        total: adjustments.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });

      return results;

    } catch (error) {
      await transaction.rollback();
      logger.error('批量调整积分失败:', error);
      throw error;
    }
  }

  /**
   * 获取积分排行榜
   */
  async getPointsLeaderboard(limit = 50, type = 'balance') {
    try {
      let orderField;
      switch (type) {
        case 'balance':
          orderField = 'balance';
          break;
        case 'earned':
          orderField = 'totalEarned';
          break;
        case 'spent':
          orderField = 'totalSpent';
          break;
        default:
          orderField = 'balance';
      }

      const leaderboard = await PointsAccount.findAll({
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar'],
          where: { status: 'active' }
        }],
        order: [[orderField, 'DESC']],
        limit: parseInt(limit)
      });

      return leaderboard.map((account, index) => ({
        rank: index + 1,
        user: account.user,
        points: account[orderField],
        account
      }));

    } catch (error) {
      logger.error('获取积分排行榜失败:', error);
      throw error;
    }
  }
}

module.exports = new PointsService();