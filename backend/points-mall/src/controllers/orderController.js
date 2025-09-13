const { Order, OrderItem, Product, ProductSku, User, PointsAccount, PointsTransaction, UserCoupon, Coupon } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const { validateInput } = require('../utils/validation');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { transaction } = require('../models');

/**
 * 订单控制器
 * 处理订单相关的业务逻辑
 */
class OrderController {
  /**
   * 创建订单
   */
  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const {
        items,
        shipping_address,
        coupon_id,
        remark
      } = req.body;
      
      // 验证输入
      const validation = validateInput({
        items: { value: items, type: 'array', minLength: 1 },
        shipping_address: { value: shipping_address, type: 'object' },
        coupon_id: { value: coupon_id, type: 'integer', required: false },
        remark: { value: remark, type: 'string', maxLength: 500, required: false }
      });
      
      if (!validation.isValid) {
        return errorResponse(res, validation.message, 400);
      }
      
      // 验证商品项
      for (const item of items) {
        const itemValidation = validateInput({
          product_id: { value: item.product_id, type: 'integer', min: 1 },
          sku_id: { value: item.sku_id, type: 'integer', min: 1, required: false },
          quantity: { value: item.quantity, type: 'integer', min: 1 }
        });
        
        if (!itemValidation.isValid) {
          return errorResponse(res, `商品项验证失败: ${itemValidation.message}`, 400);
        }
      }
      
      // 验证收货地址
      const addressValidation = validateInput({
        name: { value: shipping_address.name, type: 'string', maxLength: 50 },
        phone: { value: shipping_address.phone, type: 'phone' },
        province: { value: shipping_address.province, type: 'string', maxLength: 50 },
        city: { value: shipping_address.city, type: 'string', maxLength: 50 },
        district: { value: shipping_address.district, type: 'string', maxLength: 50 },
        address: { value: shipping_address.address, type: 'string', maxLength: 200 }
      });
      
      if (!addressValidation.isValid) {
        return errorResponse(res, `收货地址验证失败: ${addressValidation.message}`, 400);
      }
      
      // 获取用户积分账户
      const pointsAccount = await PointsAccount.findOne({ where: { user_id: userId } });
      if (!pointsAccount) {
        return errorResponse(res, '积分账户不存在', 404);
      }
      
      // 创建订单
      const result = await transaction(async (t) => {
        let totalPoints = 0;
        let totalAmount = 0;
        const orderItems = [];
        
        // 验证商品和计算总价
        for (const item of items) {
          const product = await Product.findByPk(item.product_id, {
            include: [
              {
                model: ProductSku,
                as: 'skus',
                where: item.sku_id ? { id: item.sku_id } : undefined,
                required: false
              }
            ],
            transaction: t
          });
          
          if (!product) {
            throw new Error(`商品 ${item.product_id} 不存在`);
          }
          
          if (!product.isPublished()) {
            throw new Error(`商品 ${product.name} 未上架`);
          }
          
          let sku = null;
          let price = product.price;
          let pointsPrice = product.points_price;
          let stock = product.stock;
          
          if (item.sku_id) {
            sku = product.skus.find(s => s.id === item.sku_id);
            if (!sku) {
              throw new Error(`商品规格 ${item.sku_id} 不存在`);
            }
            
            if (!sku.isActive()) {
              throw new Error(`商品规格 ${sku.sku_code} 未激活`);
            }
            
            price = sku.price;
            pointsPrice = sku.points_price;
            stock = sku.stock;
          }
          
          if (!product.hasStock(item.quantity) || (sku && !sku.hasStock(item.quantity))) {
            throw new Error(`商品 ${product.name} 库存不足`);
          }
          
          const itemTotal = price * item.quantity;
          const itemPointsTotal = pointsPrice * item.quantity;
          
          totalAmount += itemTotal;
          totalPoints += itemPointsTotal;
          
          orderItems.push({
            product_id: item.product_id,
            product_sku_id: item.sku_id || null,
            product_name: product.name,
            product_image: product.images?.[0]?.url || null,
            sku_name: sku ? sku.getSpecificationText() : null,
            price,
            points_price: pointsPrice,
            quantity: item.quantity,
            total_amount: itemTotal,
            total_points: itemPointsTotal
          });
        }
        
        // 处理优惠券
        let userCoupon = null;
        let discountAmount = 0;
        let discountPoints = 0;
        
        if (coupon_id) {
          userCoupon = await UserCoupon.findOne({
            where: {
              id: coupon_id,
              user_id: userId,
              status: 'unused'
            },
            include: [
              {
                model: Coupon,
                as: 'coupon'
              }
            ],
            transaction: t
          });
          
          if (!userCoupon) {
            throw new Error('优惠券不存在或已使用');
          }
          
          if (!userCoupon.isValid()) {
            throw new Error('优惠券已过期或不可用');
          }
          
          if (!userCoupon.coupon.canUse(totalAmount, totalPoints)) {
            throw new Error('订单不满足优惠券使用条件');
          }
          
          const discount = userCoupon.coupon.calculateDiscount(totalAmount, totalPoints);
          discountAmount = discount.amount;
          discountPoints = discount.points;
        }
        
        const finalAmount = Math.max(0, totalAmount - discountAmount);
        const finalPoints = Math.max(0, totalPoints - discountPoints);
        
        // 检查积分余额
        if (pointsAccount.available_points < finalPoints) {
          throw new Error('积分余额不足');
        }
        
        // 创建订单
        const order = await Order.create({
          user_id: userId,
          order_no: Order.generateOrderNo(),
          status: 'pending_payment',
          type: 'points',
          total_amount: totalAmount,
          total_points: totalPoints,
          discount_amount: discountAmount,
          discount_points: discountPoints,
          final_amount: finalAmount,
          final_points: finalPoints,
          shipping_address: JSON.stringify(shipping_address),
          user_coupon_id: userCoupon?.id || null,
          remark: remark || null
        }, { transaction: t });
        
        // 创建订单项
        const orderItemsData = orderItems.map(item => ({
          ...item,
          order_id: order.id
        }));
        
        await OrderItem.bulkCreate(orderItemsData, { transaction: t });
        
        // 扣减库存
        for (const item of items) {
          if (item.sku_id) {
            await ProductSku.decrement('stock', {
              by: item.quantity,
              where: { id: item.sku_id },
              transaction: t
            });
          } else {
            await Product.decrement('stock', {
              by: item.quantity,
              where: { id: item.product_id },
              transaction: t
            });
          }
        }
        
        // 使用优惠券
        if (userCoupon) {
          await userCoupon.use(order.id, { transaction: t });
        }
        
        return order;
      });
      
      logger.info(`用户 ${userId} 创建订单 ${result.order_no}`, {
        userId,
        orderId: result.id,
        orderNo: result.order_no,
        totalPoints: result.final_points
      });
      
      return successResponse(res, '创建订单成功', result);
    } catch (error) {
      logger.error('创建订单失败:', error);
      return errorResponse(res, error.message || '创建订单失败');
    }
  }
  
  /**
   * 支付订单
   */
  async payOrder(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      
      const order = await Order.findOne({
        where: {
          id: orderId,
          user_id: userId
        },
        include: [
          {
            model: OrderItem,
            as: 'items'
          }
        ]
      });
      
      if (!order) {
        return errorResponse(res, '订单不存在', 404);
      }
      
      if (!order.canPay()) {
        return errorResponse(res, '订单状态不允许支付', 400);
      }
      
      // 获取用户积分账户
      const pointsAccount = await PointsAccount.findOne({ where: { user_id: userId } });
      if (!pointsAccount) {
        return errorResponse(res, '积分账户不存在', 404);
      }
      
      // 检查积分余额
      if (pointsAccount.available_points < order.final_points) {
        return errorResponse(res, '积分余额不足', 400);
      }
      
      // 执行支付
      const result = await transaction(async (t) => {
        // 扣减积分
        await pointsAccount.usePoints(order.final_points, { transaction: t });
        
        // 创建积分交易记录
        await PointsTransaction.create({
          user_id: userId,
          points_account_id: pointsAccount.id,
          transaction_no: PointsTransaction.generateTransactionNo(),
          type: PointsTransaction.TYPES.SPEND,
          source: PointsTransaction.SOURCES.ORDER,
          points: order.final_points,
          balance_after: pointsAccount.available_points - order.final_points,
          description: `订单支付: ${order.order_no}`,
          reference_id: order.id,
          reference_type: 'order',
          status: 'completed'
        }, { transaction: t });
        
        // 更新订单状态
        await order.pay({ transaction: t });
        
        return order;
      });
      
      logger.info(`用户 ${userId} 支付订单 ${order.order_no}`, {
        userId,
        orderId: order.id,
        orderNo: order.order_no,
        points: order.final_points
      });
      
      return successResponse(res, '支付成功', result);
    } catch (error) {
      logger.error('支付订单失败:', error);
      return errorResponse(res, '支付订单失败');
    }
  }
  
  /**
   * 取消订单
   */
  async cancelOrder(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      const { reason } = req.body;
      
      const order = await Order.findOne({
        where: {
          id: orderId,
          user_id: userId
        },
        include: [
          {
            model: OrderItem,
            as: 'items'
          }
        ]
      });
      
      if (!order) {
        return errorResponse(res, '订单不存在', 404);
      }
      
      if (!order.canCancel()) {
        return errorResponse(res, '订单状态不允许取消', 400);
      }
      
      // 执行取消
      await transaction(async (t) => {
        // 取消订单
        await order.cancel(reason, { transaction: t });
        
        // 恢复库存
        for (const item of order.items) {
          if (item.product_sku_id) {
            await ProductSku.increment('stock', {
              by: item.quantity,
              where: { id: item.product_sku_id },
              transaction: t
            });
          } else {
            await Product.increment('stock', {
              by: item.quantity,
              where: { id: item.product_id },
              transaction: t
            });
          }
        }
        
        // 退还优惠券
        if (order.user_coupon_id) {
          const userCoupon = await UserCoupon.findByPk(order.user_coupon_id, { transaction: t });
          if (userCoupon) {
            await userCoupon.refund({ transaction: t });
          }
        }
        
        // 如果已支付，退还积分
        if (order.status === 'paid' && order.final_points > 0) {
          const pointsAccount = await PointsAccount.findOne({
            where: { user_id: userId },
            transaction: t
          });
          
          if (pointsAccount) {
            await pointsAccount.addPoints(order.final_points, { transaction: t });
            
            // 创建积分交易记录
            await PointsTransaction.create({
              user_id: userId,
              points_account_id: pointsAccount.id,
              transaction_no: PointsTransaction.generateTransactionNo(),
              type: PointsTransaction.TYPES.REFUND,
              source: PointsTransaction.SOURCES.ORDER,
              points: order.final_points,
              balance_after: pointsAccount.available_points + order.final_points,
              description: `订单取消退款: ${order.order_no}`,
              reference_id: order.id,
              reference_type: 'order',
              status: 'completed'
            }, { transaction: t });
          }
        }
      });
      
      logger.info(`用户 ${userId} 取消订单 ${order.order_no}`, {
        userId,
        orderId: order.id,
        orderNo: order.order_no,
        reason
      });
      
      return successResponse(res, '取消订单成功');
    } catch (error) {
      logger.error('取消订单失败:', error);
      return errorResponse(res, '取消订单失败');
    }
  }
  
  /**
   * 获取订单列表
   */
  async getOrderList(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        status,
        start_date,
        end_date
      } = req.query;
      
      const offset = (page - 1) * limit;
      const where = { user_id: userId };
      
      // 状态筛选
      if (status) {
        where.status = status;
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
      
      const { count, rows } = await Order.findAndCountAll({
        where,
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'slug']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return successResponse(res, '获取订单列表成功', {
        orders: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('获取订单列表失败:', error);
      return errorResponse(res, '获取订单列表失败');
    }
  }
  
  /**
   * 获取订单详情
   */
  async getOrderDetail(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      
      const order = await Order.findOne({
        where: {
          id: orderId,
          user_id: userId
        },
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'slug']
              },
              {
                model: ProductSku,
                as: 'sku',
                attributes: ['id', 'sku_code', 'specifications']
              }
            ]
          },
          {
            model: UserCoupon,
            as: 'userCoupon',
            include: [
              {
                model: Coupon,
                as: 'coupon',
                attributes: ['id', 'name', 'type', 'value']
              }
            ]
          }
        ]
      });
      
      if (!order) {
        return errorResponse(res, '订单不存在', 404);
      }
      
      return successResponse(res, '获取订单详情成功', order);
    } catch (error) {
      logger.error('获取订单详情失败:', error);
      return errorResponse(res, '获取订单详情失败');
    }
  }
  
  /**
   * 确认收货
   */
  async confirmOrder(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      
      const order = await Order.findOne({
        where: {
          id: orderId,
          user_id: userId
        }
      });
      
      if (!order) {
        return errorResponse(res, '订单不存在', 404);
      }
      
      if (!order.canComplete()) {
        return errorResponse(res, '订单状态不允许确认收货', 400);
      }
      
      await order.complete();
      
      logger.info(`用户 ${userId} 确认收货订单 ${order.order_no}`, {
        userId,
        orderId: order.id,
        orderNo: order.order_no
      });
      
      return successResponse(res, '确认收货成功');
    } catch (error) {
      logger.error('确认收货失败:', error);
      return errorResponse(res, '确认收货失败');
    }
  }
  
  /**
   * 获取订单统计（管理员）
   */
  async getOrderStats(req, res) {
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
      
      const stats = await Order.getStatistics(where);
      
      return successResponse(res, '获取订单统计成功', stats);
    } catch (error) {
      logger.error('获取订单统计失败:', error);
      return errorResponse(res, '获取订单统计失败');
    }
  }
}

module.exports = new OrderController();