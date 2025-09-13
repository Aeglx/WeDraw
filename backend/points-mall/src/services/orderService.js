const { Order, OrderItem, Product, User, PointsAccount, Coupon, UserCoupon, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const pointsService = require('./pointsService');
const productService = require('./productService');
const couponService = require('./couponService');
const config = require('../config');

class OrderService {
  /**
   * 创建订单
   */
  async createOrder(userId, orderData) {
    const transaction = await sequelize.transaction();
    
    try {
      const { items, couponId, shippingAddress, remark } = orderData;

      if (!items || items.length === 0) {
        throw new Error('订单商品不能为空');
      }

      // 验证用户积分账户
      const pointsAccount = await pointsService.getPointsAccount(userId);
      if (!pointsAccount) {
        throw new Error('用户积分账户不存在');
      }

      let totalAmount = 0;
      let totalPoints = 0;
      const orderItems = [];

      // 验证商品和计算总价
      for (const item of items) {
        const { productId, quantity } = item;

        // 检查商品
        const product = await Product.findByPk(productId, { transaction });
        if (!product) {
          throw new Error(`商品不存在: ${productId}`);
        }

        if (product.status !== 'active') {
          throw new Error(`商品不可用: ${product.name}`);
        }

        // 检查库存
        await productService.checkStock(productId, quantity);

        const itemTotal = product.pointsPrice * quantity;
        totalAmount += product.originalPrice * quantity;
        totalPoints += itemTotal;

        orderItems.push({
          productId,
          productName: product.name,
          productImage: product.images?.[0] || null,
          productSku: product.sku,
          originalPrice: product.originalPrice,
          pointsPrice: product.pointsPrice,
          quantity,
          totalPrice: itemTotal,
          productSnapshot: {
            name: product.name,
            description: product.description,
            images: product.images,
            specifications: product.specifications
          }
        });
      }

      let discountAmount = 0;
      let couponInfo = null;

      // 处理优惠券
      if (couponId) {
        const couponResult = await couponService.validateCoupon(couponId, userId, totalPoints);
        if (couponResult.valid) {
          discountAmount = couponResult.discountAmount;
          couponInfo = couponResult.coupon;
        } else {
          throw new Error(couponResult.message);
        }
      }

      const finalAmount = Math.max(0, totalPoints - discountAmount);

      // 检查用户积分余额
      if (pointsAccount.balance < finalAmount) {
        throw new Error('积分余额不足');
      }

      // 生成订单号
      const orderNumber = await this.generateOrderNumber();

      // 创建订单
      const order = await Order.create({
        orderNumber,
        userId,
        status: 'pending',
        totalAmount,
        pointsAmount: totalPoints,
        discountAmount,
        finalAmount,
        couponId,
        couponInfo,
        shippingAddress,
        remark,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
      }, { transaction });

      // 创建订单项
      for (const itemData of orderItems) {
        await OrderItem.create({
          orderId: order.id,
          ...itemData
        }, { transaction });
      }

      // 扣减库存
      for (const item of items) {
        await productService.reduceStock(item.productId, item.quantity, order.id);
      }

      // 扣减积分
      await pointsService.deductPoints(
        userId,
        finalAmount,
        'order_payment',
        `订单支付: ${orderNumber}`,
        order.id
      );

      // 使用优惠券
      if (couponId) {
        await couponService.useCoupon(couponId, userId, order.id);
      }

      await transaction.commit();

      logger.info(`订单创建成功: ${orderNumber}`, {
        orderId: order.id,
        userId,
        totalAmount: finalAmount,
        itemCount: order.itemCount
      });

      return await this.getOrderById(order.id, userId);

    } catch (error) {
      await transaction.rollback();
      logger.error('创建订单失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderById(orderId, userId = null, includeUser = false) {
    try {
      const where = { id: orderId };
      if (userId) {
        where.userId = userId;
      }

      const include = [
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'images', 'status']
          }]
        }
      ];

      if (includeUser) {
        include.push({
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'email', 'phone']
        });
      }

      const order = await Order.findOne({
        where,
        include
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      return order;

    } catch (error) {
      logger.error('获取订单详情失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户订单列表
   */
  async getUserOrders(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = options;

      const where = { userId };

      if (status) {
        where.status = status;
      }

      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const offset = (page - 1) * limit;

      const { rows: orders, count } = await Order.findAndCountAll({
        where,
        include: [{
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'images', 'status']
          }]
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset,
        distinct: true
      });

      return {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('获取用户订单列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有订单列表（管理员）
   */
  async getAllOrders(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        userId,
        orderNumber,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = options;

      const where = {};

      if (status) {
        where.status = status;
      }

      if (userId) {
        where.userId = userId;
      }

      if (orderNumber) {
        where.orderNumber = { [Op.like]: `%${orderNumber}%` };
      }

      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const offset = (page - 1) * limit;

      const { rows: orders, count } = await Order.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'nickname', 'email', 'phone']
          },
          {
            model: OrderItem,
            as: 'items',
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'images', 'status']
            }]
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset,
        distinct: true
      });

      return {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };

    } catch (error) {
      logger.error('获取订单列表失败:', error);
      throw error;
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId, userId, reason = '用户取消') {
    const transaction = await sequelize.transaction();
    
    try {
      const order = await Order.findOne({
        where: { id: orderId, userId },
        include: [{
          model: OrderItem,
          as: 'items'
        }],
        transaction
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      // 只有待支付和已支付的订单可以取消
      if (!['pending', 'paid'].includes(order.status)) {
        throw new Error('订单状态不允许取消');
      }

      // 更新订单状态
      await order.update({
        status: 'cancelled',
        cancelReason: reason,
        cancelledAt: new Date()
      }, { transaction });

      // 恢复库存
      for (const item of order.items) {
        await productService.restoreStock(item.productId, item.quantity, orderId);
      }

      // 退还积分
      if (order.finalAmount > 0) {
        await pointsService.addPoints(
          userId,
          order.finalAmount,
          'order_refund',
          `订单取消退款: ${order.orderNumber}`,
          orderId
        );
      }

      // 退还优惠券
      if (order.couponId) {
        await couponService.refundCoupon(order.couponId, userId, orderId);
      }

      await transaction.commit();

      logger.info(`订单取消成功: ${order.orderNumber}`, {
        orderId,
        userId,
        reason
      });

      return await this.getOrderById(orderId, userId);

    } catch (error) {
      await transaction.rollback();
      logger.error('取消订单失败:', error);
      throw error;
    }
  }

  /**
   * 确认订单（管理员）
   */
  async confirmOrder(orderId, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'pending') {
        throw new Error('订单状态不允许确认');
      }

      await order.update({
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedBy: adminUserId
      }, { transaction });

      await transaction.commit();

      logger.info(`订单确认成功: ${order.orderNumber}`, {
        orderId,
        adminUserId
      });

      return await this.getOrderById(orderId, null, true);

    } catch (error) {
      await transaction.rollback();
      logger.error('确认订单失败:', error);
      throw error;
    }
  }

  /**
   * 发货（管理员）
   */
  async shipOrder(orderId, shippingInfo, adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'confirmed') {
        throw new Error('订单状态不允许发货');
      }

      await order.update({
        status: 'shipped',
        shippingInfo,
        shippedAt: new Date(),
        shippedBy: adminUserId
      }, { transaction });

      await transaction.commit();

      logger.info(`订单发货成功: ${order.orderNumber}`, {
        orderId,
        shippingInfo,
        adminUserId
      });

      return await this.getOrderById(orderId, null, true);

    } catch (error) {
      await transaction.rollback();
      logger.error('订单发货失败:', error);
      throw error;
    }
  }

  /**
   * 确认收货
   */
  async confirmDelivery(orderId, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const order = await Order.findOne({
        where: { id: orderId, userId },
        transaction
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'shipped') {
        throw new Error('订单状态不允许确认收货');
      }

      await order.update({
        status: 'delivered',
        deliveredAt: new Date()
      }, { transaction });

      await transaction.commit();

      logger.info(`确认收货成功: ${order.orderNumber}`, {
        orderId,
        userId
      });

      return await this.getOrderById(orderId, userId);

    } catch (error) {
      await transaction.rollback();
      logger.error('确认收货失败:', error);
      throw error;
    }
  }

  /**
   * 申请退款
   */
  async requestRefund(orderId, userId, reason, refundAmount = null) {
    const transaction = await sequelize.transaction();
    
    try {
      const order = await Order.findOne({
        where: { id: orderId, userId },
        transaction
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (!['delivered', 'completed'].includes(order.status)) {
        throw new Error('订单状态不允许申请退款');
      }

      const requestedAmount = refundAmount || order.finalAmount;

      await order.update({
        status: 'refund_requested',
        refundInfo: {
          reason,
          requestedAmount,
          requestedAt: new Date()
        }
      }, { transaction });

      await transaction.commit();

      logger.info(`退款申请成功: ${order.orderNumber}`, {
        orderId,
        userId,
        reason,
        requestedAmount
      });

      return await this.getOrderById(orderId, userId);

    } catch (error) {
      await transaction.rollback();
      logger.error('申请退款失败:', error);
      throw error;
    }
  }

  /**
   * 处理退款（管理员）
   */
  async processRefund(orderId, approved, adminReason = '', adminUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const order = await Order.findByPk(orderId, {
        include: [{
          model: OrderItem,
          as: 'items'
        }],
        transaction
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'refund_requested') {
        throw new Error('订单状态不允许处理退款');
      }

      if (approved) {
        // 退还积分
        const refundAmount = order.refundInfo?.requestedAmount || order.finalAmount;
        await pointsService.addPoints(
          order.userId,
          refundAmount,
          'order_refund',
          `订单退款: ${order.orderNumber}`,
          orderId
        );

        // 恢复库存
        for (const item of order.items) {
          await productService.restoreStock(item.productId, item.quantity, orderId);
        }

        await order.update({
          status: 'refunded',
          refundInfo: {
            ...order.refundInfo,
            approved: true,
            processedAt: new Date(),
            processedBy: adminUserId,
            adminReason
          }
        }, { transaction });
      } else {
        await order.update({
          status: 'delivered', // 恢复到原状态
          refundInfo: {
            ...order.refundInfo,
            approved: false,
            processedAt: new Date(),
            processedBy: adminUserId,
            adminReason
          }
        }, { transaction });
      }

      await transaction.commit();

      logger.info(`退款处理完成: ${order.orderNumber}`, {
        orderId,
        approved,
        adminUserId,
        adminReason
      });

      return await this.getOrderById(orderId, null, true);

    } catch (error) {
      await transaction.rollback();
      logger.error('处理退款失败:', error);
      throw error;
    }
  }

  /**
   * 获取订单统计
   */
  async getOrderStats(options = {}) {
    try {
      const { startDate, endDate, userId } = options;

      const where = {};
      if (userId) {
        where.userId = userId;
      }
      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // 订单状态统计
      const statusStats = await Order.findAll({
        where,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('final_amount')), 'totalAmount']
        ],
        group: ['status']
      });

      // 每日订单统计
      const dailyStats = await Order.findAll({
        where,
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('final_amount')), 'totalAmount'],
          [sequelize.fn('SUM', sequelize.col('item_count')), 'totalItems']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
      });

      // 总体统计
      const totalStats = await Order.findOne({
        where,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
          [sequelize.fn('SUM', sequelize.col('final_amount')), 'totalRevenue'],
          [sequelize.fn('SUM', sequelize.col('item_count')), 'totalItems'],
          [sequelize.fn('AVG', sequelize.col('final_amount')), 'avgOrderValue']
        ]
      });

      return {
        statusStats,
        dailyStats,
        totalStats
      };

    } catch (error) {
      logger.error('获取订单统计失败:', error);
      throw error;
    }
  }

  /**
   * 生成订单号
   */
  async generateOrderNumber() {
    const prefix = 'ORD';
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    return `${prefix}${dateStr}${timeStr}${random}`;
  }

  /**
   * 自动确认收货（定时任务）
   */
  async autoConfirmDelivery(days = 7) {
    const transaction = await sequelize.transaction();
    
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [updatedCount] = await Order.update({
        status: 'delivered',
        deliveredAt: new Date(),
        autoConfirmed: true
      }, {
        where: {
          status: 'shipped',
          shippedAt: { [Op.lte]: cutoffDate }
        },
        transaction
      });

      await transaction.commit();

      logger.info(`自动确认收货完成`, {
        updatedCount,
        cutoffDate
      });

      return { updatedCount };

    } catch (error) {
      await transaction.rollback();
      logger.error('自动确认收货失败:', error);
      throw error;
    }
  }
}

module.exports = new OrderService();