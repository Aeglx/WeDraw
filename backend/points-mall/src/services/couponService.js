const { Coupon, UserCoupon, User, Product, Category, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const config = require('../config');

class CouponService {
  /**
   * 获取可用优惠券列表
   */
  async getAvailableCoupons(userId = null, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        minOrderAmount,
        categoryId,
        productId
      } = options;

      const where = {
        status: 'active',
        startTime: { [Op.lte]: new Date() },
        endTime: { [Op.gte]: new Date() },
        totalLimit: { [Op.or]: [null, { [Op.gt]: sequelize.col('used_count') }] }
      };

      if (type) {
        where.type = type;
      }

      if (minOrderAmount !== undefined) {
        where.minOrderAmount = { [Op.lte]: minOrderAmount };
      }

      if (categoryId) {
        where[Op.or] = [
          { applicableType: 'all' },
          {
            applicableType: 'category',
            applicableIds: { [Op.contains]: [categoryId] }
          }
        ];
      }

      if (productId) {
        where[Op.or] = [
          { applicableType: 'all' },
          {
            applicableType: 'product',
            applicableIds: { [Op.contains]: [productId] }
          }
        ];
      }

      const offset = (page - 1) * limit;

      let { rows: coupons, count } = await Coupon.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      // 如果指定了用户，检查用户是否已领取
      if (userId) {
        const userCouponIds = await UserCoupon.findAll({
          where: { userId },
          attributes: ['couponId']
        }).then(results => results.map(r => r.couponId));

        coupons = coupons.map(coupon => ({
          ...coupon.toJSON(),
          isReceived: userCouponIds.includes(coupon.id)
        }));
      }

      return {
        coupons,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('获取可用优惠券列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户优惠券列表
   */
  async getUserCoupons(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = options;

      const where = { userId };

      if (status) {
        where.status = status;
      }

      const include = [{
        model: Coupon,
        as: 'coupon',
        where: type ? { type } : undefined
      }];

      const offset = (page - 1) * limit;

      const { rows: userCoupons, count } = await UserCoupon.findAndCountAll({
        where,
        include,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset
      });

      return {
        coupons: userCoupons,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('获取用户优惠券列表失败:', error);
      throw error;
    }
  }

  /**
   * 领取优惠券
   */
  async receiveCoupon(couponId, userId, source = 'manual') {
    const transaction = await sequelize.transaction();
    
    try {
      const coupon = await Coupon.findByPk(couponId, {
        transaction,
        lock: true
      });

      if (!coupon) {
        throw new Error('优惠券不存在');
      }

      // 检查优惠券状态
      if (coupon.status !== 'active') {
        throw new Error('优惠券不可用');
      }

      // 检查时间范围
      const now = new Date();
      if (now < coupon.startTime || now > coupon.endTime) {
        throw new Error('优惠券不在有效期内');
      }

      // 检查总数量限制
      if (coupon.totalLimit && coupon.usedCount >= coupon.totalLimit) {
        throw new Error('优惠券已被领完');
      }

      // 检查用户是否已领取
      const existingUserCoupon = await UserCoupon.findOne({
        where: { couponId, userId },
        transaction
      });

      if (existingUserCoupon) {
        throw new Error('您已经领取过这张优惠券');
      }

      // 检查用户领取限制
      if (coupon.userLimit) {
        const userCouponCount = await UserCoupon.count({
          where: { couponId, userId },
          transaction
        });

        if (userCouponCount >= coupon.userLimit) {
          throw new Error('您已达到该优惠券的领取上限');
        }
      }

      // 创建用户优惠券记录
      const userCoupon = await UserCoupon.create({
        userId,
        couponId,
        source,
        status: 'unused',
        receivedAt: new Date()
      }, { transaction });

      // 更新优惠券使用统计
      await coupon.increment('receivedCount', { transaction });

      await transaction.commit();

      logger.info(`优惠券领取成功: ${couponId}`, {
        couponId,
        userId,
        source,
        userCouponId: userCoupon.id
      });

      return await UserCoupon.findByPk(userCoupon.id, {
        include: [{
          model: Coupon,
          as: 'coupon'
        }]
      });

    } catch (error) {
      await transaction.rollback();
      logger.error('领取优惠券失败:', error);
      throw error;
    }
  }

  /**
   * 验证优惠券
   */
  async validateCoupon(couponId, userId, orderAmount, productIds = [], categoryIds = []) {
    try {
      const userCoupon = await UserCoupon.findOne({
        where: {
          couponId,
          userId,
          status: 'unused'
        },
        include: [{
          model: Coupon,
          as: 'coupon'
        }]
      });

      if (!userCoupon) {
        return {
          valid: false,
          message: '优惠券不存在或已使用'
        };
      }

      const coupon = userCoupon.coupon;

      // 检查优惠券状态
      if (coupon.status !== 'active') {
        return {
          valid: false,
          message: '优惠券不可用'
        };
      }

      // 检查时间范围
      const now = new Date();
      if (now < coupon.startTime || now > coupon.endTime) {
        return {
          valid: false,
          message: '优惠券不在有效期内'
        };
      }

      // 检查最低订单金额
      if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
        return {
          valid: false,
          message: `订单金额需满${coupon.minOrderAmount}积分才能使用此优惠券`
        };
      }

      // 检查适用范围
      if (coupon.applicableType === 'category' && categoryIds.length > 0) {
        const hasValidCategory = categoryIds.some(id => 
          coupon.applicableIds.includes(id)
        );
        if (!hasValidCategory) {
          return {
            valid: false,
            message: '优惠券不适用于当前商品分类'
          };
        }
      }

      if (coupon.applicableType === 'product' && productIds.length > 0) {
        const hasValidProduct = productIds.some(id => 
          coupon.applicableIds.includes(id)
        );
        if (!hasValidProduct) {
          return {
            valid: false,
            message: '优惠券不适用于当前商品'
          };
        }
      }

      // 计算折扣金额
      let discountAmount = 0;
      if (coupon.type === 'fixed') {
        discountAmount = coupon.discountValue;
      } else if (coupon.type === 'percentage') {
        discountAmount = Math.floor(orderAmount * coupon.discountValue / 100);
        if (coupon.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
        }
      }

      // 确保折扣金额不超过订单金额
      discountAmount = Math.min(discountAmount, orderAmount);

      return {
        valid: true,
        coupon,
        userCoupon,
        discountAmount
      };

    } catch (error) {
      logger.error('验证优惠券失败:', error);
      return {
        valid: false,
        message: '优惠券验证失败'
      };
    }
  }

  /**
   * 使用优惠券
   */
  async useCoupon(couponId, userId, orderId) {
    const transaction = await sequelize.transaction();
    
    try {
      const userCoupon = await UserCoupon.findOne({
        where: {
          couponId,
          userId,
          status: 'unused'
        },
        include: [{
          model: Coupon,
          as: 'coupon'
        }],
        transaction,
        lock: true
      });

      if (!userCoupon) {
        throw new Error('优惠券不存在或已使用');
      }

      // 更新用户优惠券状态
      await userCoupon.update({
        status: 'used',
        usedAt: new Date(),
        orderId
      }, { transaction });

      // 更新优惠券使用统计
      await userCoupon.coupon.increment('usedCount', { transaction });

      await transaction.commit();

      logger.info(`优惠券使用成功: ${couponId}`, {
        couponId,
        userId,
        orderId,
        userCouponId: userCoupon.id
      });

      return userCoupon;

    } catch (error) {
      await transaction.rollback();
      logger.error('使用优惠券失败:', error);
      throw error;
    }
  }

  /**
   * 退还优惠券
   */
  async refundCoupon(couponId, userId, orderId) {
    const transaction = await sequelize.transaction();
    
    try {
      const userCoupon = await UserCoupon.findOne({
        where: {
          couponId,
          userId,
          orderId,
          status: 'used'
        },
        include: [{
          model: Coupon,
          as: 'coupon'
        }],
        transaction,
        lock: true
      });

      if (!userCoupon) {
        throw new Error('未找到对应的已使用优惠券');
      }

      // 检查优惠券是否还在有效期内
      const now = new Date();
      if (now > userCoupon.coupon.endTime) {
        // 如果已过期，不退还
        logger.info(`优惠券已过期，不予退还: ${couponId}`);
        return null;
      }

      // 更新用户优惠券状态
      await userCoupon.update({
        status: 'unused',
        usedAt: null,
        orderId: null
      }, { transaction });

      // 更新优惠券使用统计
      await userCoupon.coupon.decrement('usedCount', { transaction });

      await transaction.commit();

      logger.info(`优惠券退还成功: ${couponId}`, {
        couponId,
        userId,
        orderId,
        userCouponId: userCoupon.id
      });

      return userCoupon;

    } catch (error) {
      await transaction.rollback();
      logger.error('退还优惠券失败:', error);
      throw error;
    }
  }

  /**
   * 创建优惠券（管理员）
   */
  async createCoupon(couponData, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      // 验证优惠券数据
      this.validateCouponData(couponData);

      const coupon = await Coupon.create({
        ...couponData,
        createdBy: adminUserId
      }, { transaction });

      await transaction.commit();

      logger.info(`优惠券创建成功: ${coupon.id}`, {
        couponId: coupon.id,
        name: coupon.name,
        adminUserId
      });

      return coupon;

    } catch (error) {
      await transaction.rollback();
      logger.error('创建优惠券失败:', error);
      throw error;
    }
  }

  /**
   * 更新优惠券（管理员）
   */
  async updateCoupon(couponId, updateData, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const coupon = await Coupon.findByPk(couponId, { transaction });
      if (!coupon) {
        throw new Error('优惠券不存在');
      }

      // 如果优惠券已被使用，限制可修改的字段
      if (coupon.usedCount > 0) {
        const allowedFields = ['name', 'description', 'status', 'endTime'];
        const restrictedFields = Object.keys(updateData).filter(
          field => !allowedFields.includes(field)
        );
        
        if (restrictedFields.length > 0) {
          throw new Error(`优惠券已被使用，不能修改字段: ${restrictedFields.join(', ')}`);
        }
      }

      // 验证更新数据
      this.validateCouponData({ ...coupon.toJSON(), ...updateData });

      await coupon.update({
        ...updateData,
        updatedBy: adminUserId
      }, { transaction });

      await transaction.commit();

      logger.info(`优惠券更新成功: ${couponId}`, {
        couponId,
        adminUserId,
        changes: Object.keys(updateData)
      });

      return coupon;

    } catch (error) {
      await transaction.rollback();
      logger.error('更新优惠券失败:', error);
      throw error;
    }
  }

  /**
   * 删除优惠券（管理员）
   */
  async deleteCoupon(couponId, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const coupon = await Coupon.findByPk(couponId, { transaction });
      if (!coupon) {
        throw new Error('优惠券不存在');
      }

      // 检查是否有用户已领取
      const userCouponCount = await UserCoupon.count({
        where: { couponId },
        transaction
      });

      if (userCouponCount > 0) {
        // 软删除：更新状态为deleted
        await coupon.update({
          status: 'deleted',
          updatedBy: adminUserId
        }, { transaction });
      } else {
        // 硬删除：没有用户领取过
        await coupon.destroy({ transaction });
      }

      await transaction.commit();

      logger.info(`优惠券删除成功: ${couponId}`, {
        couponId,
        name: coupon.name,
        adminUserId,
        hardDelete: userCouponCount === 0
      });

      return { success: true, message: '优惠券删除成功' };

    } catch (error) {
      await transaction.rollback();
      logger.error('删除优惠券失败:', error);
      throw error;
    }
  }

  /**
   * 批量发放优惠券（管理员）
   */
  async batchDistributeCoupons(couponId, userIds, adminUserId, source = 'admin_distribute') {
    const transaction = await sequelize.transaction();
    
    try {
      const coupon = await Coupon.findByPk(couponId, { transaction });
      if (!coupon) {
        throw new Error('优惠券不存在');
      }

      const results = [];
      let successCount = 0;

      for (const userId of userIds) {
        try {
          // 检查用户是否已领取
          const existingUserCoupon = await UserCoupon.findOne({
            where: { couponId, userId },
            transaction
          });

          if (existingUserCoupon) {
            results.push({
              userId,
              success: false,
              message: '用户已领取过此优惠券'
            });
            continue;
          }

          // 创建用户优惠券记录
          const userCoupon = await UserCoupon.create({
            userId,
            couponId,
            source,
            status: 'unused',
            receivedAt: new Date()
          }, { transaction });

          results.push({
            userId,
            success: true,
            userCouponId: userCoupon.id
          });
          successCount++;

        } catch (error) {
          results.push({
            userId,
            success: false,
            message: error.message
          });
        }
      }

      // 更新优惠券统计
      await coupon.increment('receivedCount', {
        by: successCount,
        transaction
      });

      await transaction.commit();

      logger.info(`批量发放优惠券完成: ${couponId}`, {
        couponId,
        adminUserId,
        total: userIds.length,
        success: successCount,
        failed: userIds.length - successCount
      });

      return {
        total: userIds.length,
        success: successCount,
        failed: userIds.length - successCount,
        results
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('批量发放优惠券失败:', error);
      throw error;
    }
  }

  /**
   * 获取优惠券统计
   */
  async getCouponStats(couponId = null) {
    try {
      const where = couponId ? { id: couponId } : {};

      const stats = await Coupon.findAll({
        where,
        attributes: [
          'id',
          'name',
          'type',
          'status',
          'totalLimit',
          'receivedCount',
          'usedCount',
          [sequelize.literal('received_count - used_count'), 'unusedCount'],
          [sequelize.literal('CASE WHEN total_limit IS NOT NULL THEN (total_limit - received_count) ELSE NULL END'), 'remainingCount']
        ]
      });

      if (couponId) {
        return stats[0] || null;
      }

      // 总体统计
      const totalStats = await Coupon.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalCoupons'],
          [sequelize.fn('SUM', sequelize.col('received_count')), 'totalReceived'],
          [sequelize.fn('SUM', sequelize.col('used_count')), 'totalUsed']
        ]
      });

      return {
        coupons: stats,
        totalStats
      };

    } catch (error) {
      logger.error('获取优惠券统计失败:', error);
      throw error;
    }
  }

  /**
   * 验证优惠券数据
   */
  validateCouponData(data) {
    const { type, discountValue, startTime, endTime, minOrderAmount, maxDiscountAmount } = data;

    if (!['fixed', 'percentage'].includes(type)) {
      throw new Error('无效的优惠券类型');
    }

    if (!discountValue || discountValue <= 0) {
      throw new Error('折扣值必须大于0');
    }

    if (type === 'percentage' && discountValue > 100) {
      throw new Error('百分比折扣不能超过100%');
    }

    if (new Date(startTime) >= new Date(endTime)) {
      throw new Error('开始时间必须早于结束时间');
    }

    if (minOrderAmount && minOrderAmount < 0) {
      throw new Error('最低订单金额不能为负数');
    }

    if (maxDiscountAmount && maxDiscountAmount <= 0) {
      throw new Error('最大折扣金额必须大于0');
    }
  }

  /**
   * 清理过期优惠券（定时任务）
   */
  async cleanupExpiredCoupons() {
    const transaction = await sequelize.transaction();
    
    try {
      const now = new Date();

      // 更新过期的用户优惠券状态
      const [updatedUserCoupons] = await UserCoupon.update({
        status: 'expired'
      }, {
        where: {
          status: 'unused'
        },
        include: [{
          model: Coupon,
          as: 'coupon',
          where: {
            endTime: { [Op.lt]: now }
          }
        }],
        transaction
      });

      // 更新过期的优惠券状态
      const [updatedCoupons] = await Coupon.update({
        status: 'expired'
      }, {
        where: {
          status: 'active',
          endTime: { [Op.lt]: now }
        },
        transaction
      });

      await transaction.commit();

      logger.info('清理过期优惠券完成', {
        updatedCoupons,
        updatedUserCoupons
      });

      return {
        updatedCoupons,
        updatedUserCoupons
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('清理过期优惠券失败:', error);
      throw error;
    }
  }
}

module.exports = new CouponService();