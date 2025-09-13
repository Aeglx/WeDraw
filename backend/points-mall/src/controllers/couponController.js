const { Coupon, UserCoupon, User, Product, Category, Order } = require('../models');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { ValidationError, NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');
const { validateInput, validatePagination } = require('../utils/validation');
const logger = require('../utils/logger');
const { Op, Sequelize } = require('sequelize');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const moment = require('moment');

/**
 * 优惠券控制器
 * 处理优惠券相关的业务逻辑
 */
class CouponController {
  /**
   * 获取可用优惠券列表
   */
  async getAvailableCoupons(req, res) {
    const { type, minOrderAmount, categoryId, page = 1, limit = 20 } = req.query;
    const { page: validPage, limit: validLimit } = validatePagination(page, limit);

    const whereClause = {
      status: 'active',
      startTime: { [Op.lte]: new Date() },
      endTime: { [Op.gte]: new Date() },
      remainingQuantity: { [Op.gt]: 0 }
    };

    if (type) {
      whereClause.type = type;
    }

    if (minOrderAmount) {
      whereClause.minOrderAmount = { [Op.lte]: minOrderAmount };
    }

    if (categoryId) {
      whereClause[Op.or] = [
        { applicableCategories: { [Op.contains]: [parseInt(categoryId)] } },
        { applicableCategories: { [Op.is]: null } }
      ];
    }

    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: validLimit,
      offset: (validPage - 1) * validLimit,
      attributes: {
        exclude: ['applicableProducts', 'excludeProducts', 'applicableCategories', 'excludeCategories']
      }
    });

    logger.logBusinessOperation('coupon', 'list_available', {
      filters: { type, minOrderAmount, categoryId },
      resultCount: coupons.length
    });

    return paginatedResponse(res, coupons, count, validPage, validLimit, '获取可用优惠券列表成功');
  }

  /**
   * 根据代码获取优惠券信息
   */
  async getCouponByCode(req, res) {
    const { code } = req.params;

    const coupon = await Coupon.findOne({
      where: {
        code,
        status: 'active',
        startTime: { [Op.lte]: new Date() },
        endTime: { [Op.gte]: new Date() },
        remainingQuantity: { [Op.gt]: 0 }
      },
      attributes: {
        exclude: ['applicableProducts', 'excludeProducts', 'applicableCategories', 'excludeCategories']
      }
    });

    if (!coupon) {
      throw new NotFoundError('优惠券不存在或已失效');
    }

    logger.logBusinessOperation('coupon', 'get_by_code', {
      code,
      couponId: coupon.id
    });

    return successResponse(res, coupon, '获取优惠券信息成功');
  }

  /**
   * 获取用户优惠券
   */
  async getUserCoupons(req, res) {
    const userId = req.user.id;
    const { status, type, page = 1, limit = 20 } = req.query;
    const { page: validPage, limit: validLimit } = validatePagination(page, limit);

    const whereClause = { userId };

    if (status) {
      if (status === 'available') {
        whereClause.status = 'available';
        whereClause.expiresAt = { [Op.gt]: new Date() };
      } else if (status === 'used') {
        whereClause.status = 'used';
      } else if (status === 'expired') {
        whereClause[Op.or] = [
          { status: 'expired' },
          {
            status: 'available',
            expiresAt: { [Op.lte]: new Date() }
          }
        ];
      }
    }

    const couponWhere = {};
    if (type) {
      couponWhere.type = type;
    }

    const { count, rows: userCoupons } = await UserCoupon.findAndCountAll({
      where: whereClause,
      include: [{
        model: Coupon,
        where: couponWhere,
        attributes: {
          exclude: ['applicableProducts', 'excludeProducts', 'applicableCategories', 'excludeCategories']
        }
      }],
      order: [['createdAt', 'DESC']],
      limit: validLimit,
      offset: (validPage - 1) * validLimit
    });

    logger.logBusinessOperation('coupon', 'get_user_coupons', {
      userId,
      filters: { status, type },
      resultCount: userCoupons.length
    });

    return paginatedResponse(res, userCoupons, count, validPage, validLimit, '获取用户优惠券成功');
  }

  /**
   * 领取优惠券
   */
  async claimCoupon(req, res) {
    const userId = req.user.id;
    const { id: couponId } = req.params;

    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      throw new NotFoundError('优惠券不存在');
    }

    // 检查优惠券状态
    if (coupon.status !== 'active') {
      throw new ValidationError('优惠券未激活');
    }

    if (new Date() < coupon.startTime) {
      throw new ValidationError('优惠券尚未开始');
    }

    if (new Date() > coupon.endTime) {
      throw new ValidationError('优惠券已过期');
    }

    if (coupon.remainingQuantity <= 0) {
      throw new ValidationError('优惠券已被领完');
    }

    // 检查用户是否已领取
    const existingUserCoupon = await UserCoupon.findOne({
      where: { userId, couponId }
    });

    if (existingUserCoupon) {
      throw new ConflictError('您已经领取过此优惠券');
    }

    // 检查用户领取限制
    const userCouponCount = await UserCoupon.count({
      where: { userId, couponId }
    });

    if (userCouponCount >= coupon.limitPerUser) {
      throw new ValidationError(`每人限领${coupon.limitPerUser}张`);
    }

    // 检查新用户限制
    if (coupon.newUserOnly) {
      const user = await User.findByPk(userId);
      const orderCount = await Order.count({ where: { userId } });
      if (orderCount > 0) {
        throw new ValidationError('此优惠券仅限新用户领取');
      }
    }

    // 检查用户等级限制
    if (coupon.userLevels && coupon.userLevels.length > 0) {
      const user = await User.findByPk(userId);
      if (!coupon.userLevels.includes(user.level)) {
        throw new ValidationError('您的用户等级不符合领取条件');
      }
    }

    // 开始事务
    const transaction = await Coupon.sequelize.transaction();

    try {
      // 减少优惠券剩余数量
      await coupon.decrement('remainingQuantity', { transaction });
      await coupon.increment('claimedQuantity', { transaction });

      // 创建用户优惠券记录
      const userCoupon = await UserCoupon.create({
        userId,
        couponId,
        status: 'available',
        obtainedAt: new Date(),
        expiresAt: coupon.endTime
      }, { transaction });

      await transaction.commit();

      logger.logBusinessOperation('coupon', 'claim', {
        userId,
        couponId,
        userCouponId: userCoupon.id
      });

      return successResponse(res, userCoupon, '领取优惠券成功');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 通过代码领取优惠券
   */
  async claimCouponByCode(req, res) {
    const userId = req.user.id;
    const { code } = req.body;

    const coupon = await Coupon.findOne({ where: { code } });
    if (!coupon) {
      throw new NotFoundError('优惠券代码无效');
    }

    // 临时设置 couponId 到 params 中，复用 claimCoupon 逻辑
    req.params.id = coupon.id;
    return this.claimCoupon(req, res);
  }

  /**
   * 验证优惠券可用性
   */
  async validateCoupon(req, res) {
    const userId = req.user.id;
    const { couponId, orderAmount, productIds = [], categoryIds = [] } = req.body;

    const userCoupon = await UserCoupon.findOne({
      where: { userId, couponId, status: 'available' },
      include: [{ model: Coupon }]
    });

    if (!userCoupon) {
      throw new NotFoundError('优惠券不存在或已使用');
    }

    const coupon = userCoupon.Coupon;
    const validationResult = {
      valid: true,
      reason: null,
      discount: 0
    };

    // 检查优惠券状态
    if (coupon.status !== 'active') {
      validationResult.valid = false;
      validationResult.reason = '优惠券未激活';
      return successResponse(res, validationResult, '优惠券验证完成');
    }

    // 检查时间有效性
    const now = new Date();
    if (now < coupon.startTime || now > coupon.endTime || now > userCoupon.expiresAt) {
      validationResult.valid = false;
      validationResult.reason = '优惠券已过期';
      return successResponse(res, validationResult, '优惠券验证完成');
    }

    // 检查最低订单金额
    if (orderAmount < coupon.minOrderAmount) {
      validationResult.valid = false;
      validationResult.reason = `订单金额需满${coupon.minOrderAmount}元`;
      return successResponse(res, validationResult, '优惠券验证完成');
    }

    // 检查适用商品
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const hasApplicableProduct = productIds.some(id => 
        coupon.applicableProducts.includes(id)
      );
      if (!hasApplicableProduct) {
        validationResult.valid = false;
        validationResult.reason = '订单中没有适用的商品';
        return successResponse(res, validationResult, '优惠券验证完成');
      }
    }

    // 检查适用分类
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const hasApplicableCategory = categoryIds.some(id => 
        coupon.applicableCategories.includes(id)
      );
      if (!hasApplicableCategory) {
        validationResult.valid = false;
        validationResult.reason = '订单中没有适用分类的商品';
        return successResponse(res, validationResult, '优惠券验证完成');
      }
    }

    // 检查排除商品
    if (coupon.excludeProducts && coupon.excludeProducts.length > 0) {
      const hasExcludedProduct = productIds.some(id => 
        coupon.excludeProducts.includes(id)
      );
      if (hasExcludedProduct) {
        validationResult.valid = false;
        validationResult.reason = '订单中包含不适用的商品';
        return successResponse(res, validationResult, '优惠券验证完成');
      }
    }

    // 检查排除分类
    if (coupon.excludeCategories && coupon.excludeCategories.length > 0) {
      const hasExcludedCategory = categoryIds.some(id => 
        coupon.excludeCategories.includes(id)
      );
      if (hasExcludedCategory) {
        validationResult.valid = false;
        validationResult.reason = '订单中包含不适用分类的商品';
        return successResponse(res, validationResult, '优惠券验证完成');
      }
    }

    // 计算折扣金额
    if (coupon.type === 'discount') {
      if (coupon.isPercentage) {
        validationResult.discount = Math.min(
          orderAmount * (coupon.value / 100),
          coupon.maxDiscountAmount || orderAmount
        );
      } else {
        validationResult.discount = Math.min(coupon.value, orderAmount);
      }
    } else if (coupon.type === 'points') {
      validationResult.discount = coupon.value;
    } else if (coupon.type === 'shipping') {
      validationResult.discount = coupon.value;
    }

    logger.logBusinessOperation('coupon', 'validate', {
      userId,
      couponId,
      orderAmount,
      valid: validationResult.valid,
      discount: validationResult.discount
    });

    return successResponse(res, validationResult, '优惠券验证完成');
  }

  /**
   * 计算优惠券折扣
   */
  async calculateDiscount(req, res) {
    const userId = req.user.id;
    const { couponId, orderAmount, items } = req.body;

    const userCoupon = await UserCoupon.findOne({
      where: { userId, couponId, status: 'available' },
      include: [{ model: Coupon }]
    });

    if (!userCoupon) {
      throw new NotFoundError('优惠券不存在或已使用');
    }

    const coupon = userCoupon.Coupon;
    let discountAmount = 0;
    let applicableAmount = 0;

    // 计算适用金额
    for (const item of items) {
      let itemApplicable = true;

      // 检查适用商品
      if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
        itemApplicable = coupon.applicableProducts.includes(item.productId);
      }

      // 检查适用分类
      if (itemApplicable && coupon.applicableCategories && coupon.applicableCategories.length > 0) {
        itemApplicable = coupon.applicableCategories.includes(item.categoryId);
      }

      // 检查排除商品
      if (itemApplicable && coupon.excludeProducts && coupon.excludeProducts.length > 0) {
        itemApplicable = !coupon.excludeProducts.includes(item.productId);
      }

      // 检查排除分类
      if (itemApplicable && coupon.excludeCategories && coupon.excludeCategories.length > 0) {
        itemApplicable = !coupon.excludeCategories.includes(item.categoryId);
      }

      if (itemApplicable) {
        applicableAmount += item.points * item.quantity;
      }
    }

    // 如果没有适用商品，使用总金额
    if (applicableAmount === 0 && 
        (!coupon.applicableProducts || coupon.applicableProducts.length === 0) &&
        (!coupon.applicableCategories || coupon.applicableCategories.length === 0)) {
      applicableAmount = orderAmount;
    }

    // 计算折扣
    if (coupon.type === 'discount') {
      if (coupon.isPercentage) {
        discountAmount = applicableAmount * (coupon.value / 100);
        if (coupon.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
        }
      } else {
        discountAmount = Math.min(coupon.value, applicableAmount);
      }
    } else if (coupon.type === 'points') {
      discountAmount = coupon.value;
    } else if (coupon.type === 'shipping') {
      discountAmount = coupon.value;
    }

    const result = {
      couponId,
      discountAmount: Math.round(discountAmount * 100) / 100,
      applicableAmount: Math.round(applicableAmount * 100) / 100,
      finalAmount: Math.max(0, orderAmount - discountAmount)
    };

    logger.logBusinessOperation('coupon', 'calculate_discount', {
      userId,
      couponId,
      orderAmount,
      discountAmount: result.discountAmount
    });

    return successResponse(res, result, '计算优惠券折扣成功');
  }

  /**
   * 获取用户优惠券统计
   */
  async getUserCouponStats(req, res) {
    const userId = req.user.id;

    const stats = await UserCoupon.findAll({
      where: { userId },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
        [Sequelize.fn('COUNT', Sequelize.literal(
          "CASE WHEN status = 'available' AND expires_at > NOW() THEN 1 END"
        )), 'available'],
        [Sequelize.fn('COUNT', Sequelize.literal(
          "CASE WHEN status = 'used' THEN 1 END"
        )), 'used'],
        [Sequelize.fn('COUNT', Sequelize.literal(
          "CASE WHEN status = 'expired' OR (status = 'available' AND expires_at <= NOW()) THEN 1 END"
        )), 'expired']
      ],
      raw: true
    });

    const result = {
      total: parseInt(stats[0].total) || 0,
      available: parseInt(stats[0].available) || 0,
      used: parseInt(stats[0].used) || 0,
      expired: parseInt(stats[0].expired) || 0
    };

    return successResponse(res, result, '获取用户优惠券统计成功');
  }

  // 管理员方法

  /**
   * 管理员获取优惠券列表
   */
  async adminGetCoupons(req, res) {
    const { 
      name, code, type, status, startDate, endDate, 
      page = 1, limit = 20 
    } = req.query;
    const { page: validPage, limit: validLimit } = validatePagination(page, limit);

    const whereClause = {};

    if (name) {
      whereClause.name = { [Op.iLike]: `%${name}%` };
    }

    if (code) {
      whereClause.code = { [Op.iLike]: `%${code}%` };
    }

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      if (status === 'expired') {
        whereClause.endTime = { [Op.lt]: new Date() };
      } else {
        whereClause.status = status;
      }
    }

    if (startDate) {
      whereClause.startTime = { [Op.gte]: new Date(startDate) };
    }

    if (endDate) {
      whereClause.endTime = { [Op.lte]: new Date(endDate) };
    }

    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: validLimit,
      offset: (validPage - 1) * validLimit
    });

    logger.logBusinessOperation('coupon', 'admin_list', {
      adminId: req.user.id,
      filters: { name, code, type, status, startDate, endDate },
      resultCount: coupons.length
    });

    return paginatedResponse(res, coupons, count, validPage, validLimit, '获取优惠券列表成功');
  }

  /**
   * 管理员获取优惠券详情
   */
  async adminGetCouponById(req, res) {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id, {
      include: [
        {
          model: UserCoupon,
          attributes: ['id', 'userId', 'status', 'obtainedAt', 'usedAt', 'expiresAt'],
          include: [{
            model: User,
            attributes: ['id', 'username', 'email']
          }],
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!coupon) {
      throw new NotFoundError('优惠券不存在');
    }

    logger.logBusinessOperation('coupon', 'admin_get_detail', {
      adminId: req.user.id,
      couponId: id
    });

    return successResponse(res, coupon, '获取优惠券详情成功');
  }

  /**
   * 管理员创建优惠券
   */
  async adminCreateCoupon(req, res) {
    const couponData = req.body;
    const adminId = req.user.id;

    // 验证时间
    if (new Date(couponData.startTime) >= new Date(couponData.endTime)) {
      throw new ValidationError('开始时间必须早于结束时间');
    }

    // 生成优惠券代码（如果未提供）
    if (!couponData.code) {
      couponData.code = this.generateCouponCode();
    } else {
      // 检查代码唯一性
      const existingCoupon = await Coupon.findOne({
        where: { code: couponData.code }
      });
      if (existingCoupon) {
        throw new ConflictError('优惠券代码已存在');
      }
    }

    // 设置初始数量
    couponData.remainingQuantity = couponData.totalQuantity;
    couponData.claimedQuantity = 0;
    couponData.usedQuantity = 0;
    couponData.createdBy = adminId;

    const coupon = await Coupon.create(couponData);

    logger.logBusinessOperation('coupon', 'admin_create', {
      adminId,
      couponId: coupon.id,
      couponData: {
        name: coupon.name,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      }
    });

    return successResponse(res, coupon, '创建优惠券成功', 201);
  }

  /**
   * 管理员更新优惠券
   */
  async adminUpdateCoupon(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    const adminId = req.user.id;

    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      throw new NotFoundError('优惠券不存在');
    }

    // 检查是否可以修改
    if (coupon.claimedQuantity > 0 && updateData.code && updateData.code !== coupon.code) {
      throw new ValidationError('已被领取的优惠券不能修改代码');
    }

    // 验证时间
    if (updateData.startTime && updateData.endTime) {
      if (new Date(updateData.startTime) >= new Date(updateData.endTime)) {
        throw new ValidationError('开始时间必须早于结束时间');
      }
    }

    // 检查代码唯一性
    if (updateData.code && updateData.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        where: { code: updateData.code, id: { [Op.ne]: id } }
      });
      if (existingCoupon) {
        throw new ConflictError('优惠券代码已存在');
      }
    }

    // 更新剩余数量
    if (updateData.totalQuantity && updateData.totalQuantity !== coupon.totalQuantity) {
      const difference = updateData.totalQuantity - coupon.totalQuantity;
      updateData.remainingQuantity = coupon.remainingQuantity + difference;
      
      if (updateData.remainingQuantity < 0) {
        throw new ValidationError('总数量不能小于已领取数量');
      }
    }

    updateData.updatedBy = adminId;
    await coupon.update(updateData);

    logger.logBusinessOperation('coupon', 'admin_update', {
      adminId,
      couponId: id,
      updateData
    });

    return successResponse(res, coupon, '更新优惠券成功');
  }

  /**
   * 管理员删除优惠券
   */
  async adminDeleteCoupon(req, res) {
    const { id } = req.params;
    const adminId = req.user.id;

    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      throw new NotFoundError('优惠券不存在');
    }

    // 检查是否可以删除
    if (coupon.claimedQuantity > 0) {
      throw new ValidationError('已被领取的优惠券不能删除');
    }

    await coupon.destroy();

    logger.logBusinessOperation('coupon', 'admin_delete', {
      adminId,
      couponId: id,
      couponName: coupon.name
    });

    return successResponse(res, null, '删除优惠券成功');
  }

  /**
   * 管理员批量发放优惠券
   */
  async adminDistributeCoupon(req, res) {
    const { id: couponId } = req.params;
    const { userIds, userLevels, allUsers, newUsersOnly, quantity = 1, reason } = req.body;
    const adminId = req.user.id;

    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      throw new NotFoundError('优惠券不存在');
    }

    let targetUsers = [];

    if (allUsers) {
      const whereClause = {};
      if (newUsersOnly) {
        // 查找没有订单的用户
        const usersWithOrders = await Order.findAll({
          attributes: ['userId'],
          group: ['userId'],
          raw: true
        });
        const userIdsWithOrders = usersWithOrders.map(u => u.userId);
        whereClause.id = { [Op.notIn]: userIdsWithOrders };
      }
      if (userLevels && userLevels.length > 0) {
        whereClause.level = { [Op.in]: userLevels };
      }
      targetUsers = await User.findAll({
        where: whereClause,
        attributes: ['id']
      });
    } else if (userIds && userIds.length > 0) {
      targetUsers = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id']
      });
    } else if (userLevels && userLevels.length > 0) {
      targetUsers = await User.findAll({
        where: { level: { [Op.in]: userLevels } },
        attributes: ['id']
      });
    }

    if (targetUsers.length === 0) {
      throw new ValidationError('没有找到符合条件的用户');
    }

    const totalNeeded = targetUsers.length * quantity;
    if (coupon.remainingQuantity < totalNeeded) {
      throw new ValidationError(`优惠券剩余数量不足，需要${totalNeeded}张，剩余${coupon.remainingQuantity}张`);
    }

    const transaction = await Coupon.sequelize.transaction();

    try {
      const userCoupons = [];
      
      for (const user of targetUsers) {
        for (let i = 0; i < quantity; i++) {
          userCoupons.push({
            userId: user.id,
            couponId,
            status: 'available',
            obtainedAt: new Date(),
            expiresAt: coupon.endTime,
            source: 'admin_distribute',
            reason
          });
        }
      }

      await UserCoupon.bulkCreate(userCoupons, { transaction });
      
      await coupon.decrement('remainingQuantity', { 
        by: totalNeeded, 
        transaction 
      });
      await coupon.increment('claimedQuantity', { 
        by: totalNeeded, 
        transaction 
      });

      await transaction.commit();

      logger.logBusinessOperation('coupon', 'admin_distribute', {
        adminId,
        couponId,
        userCount: targetUsers.length,
        totalQuantity: totalNeeded,
        reason
      });

      return successResponse(res, {
        distributedCount: totalNeeded,
        userCount: targetUsers.length
      }, '批量发放优惠券成功');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 管理员获取优惠券统计
   */
  async adminGetCouponStatistics(req, res) {
    const { id: couponId } = req.params;
    const { startDate, endDate } = req.query;

    const coupon = await Coupon.findByPk(couponId);
    if (!coupon) {
      throw new NotFoundError('优惠券不存在');
    }

    const whereClause = { couponId };
    if (startDate) {
      whereClause.obtainedAt = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      whereClause.obtainedAt = { 
        ...whereClause.obtainedAt,
        [Op.lte]: new Date(endDate) 
      };
    }

    const stats = await UserCoupon.findAll({
      where: whereClause,
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalClaimed'],
        [Sequelize.fn('COUNT', Sequelize.literal(
          "CASE WHEN status = 'used' THEN 1 END"
        )), 'totalUsed'],
        [Sequelize.fn('SUM', Sequelize.literal(
          "CASE WHEN status = 'used' THEN discount_amount ELSE 0 END"
        )), 'totalDiscountAmount']
      ],
      raw: true
    });

    const result = {
      couponInfo: {
        id: coupon.id,
        name: coupon.name,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      },
      statistics: {
        totalQuantity: coupon.totalQuantity,
        claimedQuantity: coupon.claimedQuantity,
        usedQuantity: coupon.usedQuantity,
        remainingQuantity: coupon.remainingQuantity,
        totalClaimed: parseInt(stats[0].totalClaimed) || 0,
        totalUsed: parseInt(stats[0].totalUsed) || 0,
        totalDiscountAmount: parseFloat(stats[0].totalDiscountAmount) || 0,
        usageRate: coupon.claimedQuantity > 0 ? 
          (coupon.usedQuantity / coupon.claimedQuantity * 100).toFixed(2) : 0
      }
    };

    return successResponse(res, result, '获取优惠券统计成功');
  }

  /**
   * 管理员获取优惠券使用记录
   */
  async adminGetCouponUsage(req, res) {
    const { id: couponId } = req.params;
    const { userId, status, page = 1, limit = 20 } = req.query;
    const { page: validPage, limit: validLimit } = validatePagination(page, limit);

    const whereClause = { couponId };
    if (userId) {
      whereClause.userId = userId;
    }
    if (status) {
      if (status === 'expired') {
        whereClause[Op.or] = [
          { status: 'expired' },
          {
            status: 'available',
            expiresAt: { [Op.lte]: new Date() }
          }
        ];
      } else {
        whereClause.status = status;
      }
    }

    const { count, rows: usageRecords } = await UserCoupon.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email', 'level']
        },
        {
          model: Order,
          attributes: ['id', 'orderNumber', 'totalAmount'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: validLimit,
      offset: (validPage - 1) * validLimit
    });

    return paginatedResponse(res, usageRecords, count, validPage, validLimit, '获取优惠券使用记录成功');
  }

  /**
   * 管理员批量操作优惠券
   */
  async adminBatchOperation(req, res) {
    const { action, couponIds } = req.body;
    const adminId = req.user.id;

    const coupons = await Coupon.findAll({
      where: { id: { [Op.in]: couponIds } }
    });

    if (coupons.length !== couponIds.length) {
      throw new ValidationError('部分优惠券不存在');
    }

    let updateData = {};
    let cannotOperateIds = [];

    switch (action) {
      case 'activate':
        updateData.status = 'active';
        break;
      case 'deactivate':
        updateData.status = 'inactive';
        break;
      case 'delete':
        // 检查是否可以删除
        cannotOperateIds = coupons
          .filter(c => c.claimedQuantity > 0)
          .map(c => c.id);
        if (cannotOperateIds.length > 0) {
          throw new ValidationError(`优惠券 ${cannotOperateIds.join(', ')} 已被领取，不能删除`);
        }
        break;
      default:
        throw new ValidationError('无效的操作类型');
    }

    const transaction = await Coupon.sequelize.transaction();

    try {
      if (action === 'delete') {
        await Coupon.destroy({
          where: { id: { [Op.in]: couponIds } },
          transaction
        });
      } else {
        updateData.updatedBy = adminId;
        await Coupon.update(updateData, {
          where: { id: { [Op.in]: couponIds } },
          transaction
        });
      }

      await transaction.commit();

      logger.logBusinessOperation('coupon', 'admin_batch_operation', {
        adminId,
        action,
        couponIds,
        affectedCount: couponIds.length
      });

      return successResponse(res, {
        action,
        affectedCount: couponIds.length
      }, `批量${action === 'activate' ? '激活' : action === 'deactivate' ? '停用' : '删除'}优惠券成功`);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 管理员生成优惠券代码
   */
  async adminGenerateCodes(req, res) {
    const { count, length = 8, prefix = '', suffix = '' } = req.body;

    const codes = [];
    const existingCodes = new Set();

    // 获取现有代码
    const existing = await Coupon.findAll({
      attributes: ['code'],
      raw: true
    });
    existing.forEach(item => existingCodes.add(item.code));

    for (let i = 0; i < count; i++) {
      let code;
      let attempts = 0;
      
      do {
        code = prefix + this.generateRandomString(length - prefix.length - suffix.length) + suffix;
        attempts++;
        
        if (attempts > 1000) {
          throw new ValidationError('生成唯一代码失败，请调整参数');
        }
      } while (existingCodes.has(code) || codes.includes(code));
      
      codes.push(code);
    }

    return successResponse(res, { codes }, '生成优惠券代码成功');
  }

  /**
   * 管理员导出优惠券数据
   */
  async adminExportCoupons(req, res) {
    const { format = 'xlsx', includeUsage = false, filters = {} } = req.body;
    const adminId = req.user.id;

    const whereClause = {};
    if (filters.type) whereClause.type = filters.type;
    if (filters.status) {
      if (filters.status === 'expired') {
        whereClause.endTime = { [Op.lt]: new Date() };
      } else {
        whereClause.status = filters.status;
      }
    }
    if (filters.startDate) {
      whereClause.startTime = { [Op.gte]: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      whereClause.endTime = { [Op.lte]: new Date(filters.endDate) };
    }

    const coupons = await Coupon.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('优惠券数据');

    // 设置表头
    const headers = [
      'ID', '名称', '代码', '类型', '面值', '是否百分比', 
      '最低订单金额', '最大折扣金额', '总数量', '已领取', '已使用', '剩余',
      '每人限领', '开始时间', '结束时间', '状态', '创建时间'
    ];
    
    if (includeUsage) {
      headers.push('使用率', '总折扣金额');
    }

    worksheet.addRow(headers);

    // 添加数据
    for (const coupon of coupons) {
      const row = [
        coupon.id,
        coupon.name,
        coupon.code,
        coupon.type,
        coupon.value,
        coupon.isPercentage ? '是' : '否',
        coupon.minOrderAmount,
        coupon.maxDiscountAmount,
        coupon.totalQuantity,
        coupon.claimedQuantity,
        coupon.usedQuantity,
        coupon.remainingQuantity,
        coupon.limitPerUser,
        moment(coupon.startTime).format('YYYY-MM-DD HH:mm:ss'),
        moment(coupon.endTime).format('YYYY-MM-DD HH:mm:ss'),
        coupon.status,
        moment(coupon.createdAt).format('YYYY-MM-DD HH:mm:ss')
      ];

      if (includeUsage) {
        const usageRate = coupon.claimedQuantity > 0 ? 
          (coupon.usedQuantity / coupon.claimedQuantity * 100).toFixed(2) + '%' : '0%';
        
        // 计算总折扣金额
        const totalDiscount = await UserCoupon.sum('discountAmount', {
          where: { couponId: coupon.id, status: 'used' }
        }) || 0;
        
        row.push(usageRate, totalDiscount);
      }

      worksheet.addRow(row);
    }

    // 设置列宽
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    logger.logBusinessOperation('coupon', 'admin_export', {
      adminId,
      format,
      includeUsage,
      filters,
      exportCount: coupons.length
    });

    // 设置响应头
    const filename = `coupons_${moment().format('YYYYMMDD_HHmmss')}.${format}`;
    res.setHeader('Content-Type', 
      format === 'xlsx' ? 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
        'text/csv'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (format === 'xlsx') {
      await workbook.xlsx.write(res);
    } else {
      await workbook.csv.write(res);
    }

    res.end();
  }

  // 工具方法

  /**
   * 生成优惠券代码
   */
  generateCouponCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成随机字符串
   */
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

module.exports = CouponController;