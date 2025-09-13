module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '订单ID'
    },
    order_no: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      comment: '订单号'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    order_type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '订单类型：1-积分兑换，2-现金购买，3-积分+现金'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '订单状态：1-待支付，2-已支付，3-已发货，4-已完成，5-已取消，6-已退款'
    },
    payment_status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '支付状态：0-未支付，1-已支付，2-部分退款，3-全额退款'
    },
    shipping_status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '发货状态：0-未发货，1-已发货，2-已收货，3-已退货'
    },
    total_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '总积分'
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '总金额'
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '优惠金额'
    },
    shipping_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '运费'
    },
    final_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '实付积分'
    },
    final_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '实付金额'
    },
    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '使用的优惠券ID'
    },
    coupon_discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '优惠券折扣金额'
    },
    shipping_address: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '收货地址信息'
    },
    contact_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '联系人信息'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '订单备注'
    },
    admin_remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '管理员备注'
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '支付方式'
    },
    payment_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '支付流水号'
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '支付时间'
    },
    shipped_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发货时间'
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '收货时间'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '完成时间'
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '取消时间'
    },
    cancel_reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '取消原因'
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '退款金额'
    },
    refund_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '退款积分'
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '退款时间'
    },
    tracking_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '物流单号'
    },
    logistics_company: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '物流公司'
    },
    logistics_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '物流信息'
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'miniprogram',
      comment: '订单来源：miniprogram-小程序，wechat-公众号，admin-后台'
    },
    extra_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '扩展数据'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    tableName: 'orders',
    comment: '订单表',
    indexes: [
      {
        name: 'idx_order_no',
        unique: true,
        fields: ['order_no']
      },
      {
        name: 'idx_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_status',
        fields: ['status']
      },
      {
        name: 'idx_payment_status',
        fields: ['payment_status']
      },
      {
        name: 'idx_shipping_status',
        fields: ['shipping_status']
      },
      {
        name: 'idx_order_type',
        fields: ['order_type']
      },
      {
        name: 'idx_payment_no',
        fields: ['payment_no']
      },
      {
        name: 'idx_tracking_no',
        fields: ['tracking_no']
      },
      {
        name: 'idx_created_at',
        fields: ['created_at']
      },
      {
        name: 'idx_paid_at',
        fields: ['paid_at']
      },
      {
        name: 'idx_source',
        fields: ['source']
      }
    ],
    hooks: {
      beforeUpdate: (order) => {
        order.updated_at = new Date();
      },
      beforeCreate: async (order) => {
        // 自动生成订单号
        if (!order.order_no) {
          order.order_no = await Order.generateOrderNo();
        }
      }
    }
  });

  // 订单状态常量
  Order.STATUS = {
    PENDING_PAYMENT: 1,
    PAID: 2,
    SHIPPED: 3,
    COMPLETED: 4,
    CANCELLED: 5,
    REFUNDED: 6
  };

  // 支付状态常量
  Order.PAYMENT_STATUS = {
    UNPAID: 0,
    PAID: 1,
    PARTIAL_REFUND: 2,
    FULL_REFUND: 3
  };

  // 发货状态常量
  Order.SHIPPING_STATUS = {
    UNSHIPPED: 0,
    SHIPPED: 1,
    DELIVERED: 2,
    RETURNED: 3
  };

  // 订单类型常量
  Order.ORDER_TYPE = {
    POINTS_ONLY: 1,
    CASH_ONLY: 2,
    POINTS_AND_CASH: 3
  };

  // 实例方法
  Order.prototype.isPendingPayment = function() {
    return this.status === Order.STATUS.PENDING_PAYMENT;
  };

  Order.prototype.isPaid = function() {
    return this.payment_status === Order.PAYMENT_STATUS.PAID;
  };

  Order.prototype.isShipped = function() {
    return this.shipping_status >= Order.SHIPPING_STATUS.SHIPPED;
  };

  Order.prototype.isCompleted = function() {
    return this.status === Order.STATUS.COMPLETED;
  };

  Order.prototype.isCancelled = function() {
    return this.status === Order.STATUS.CANCELLED;
  };

  Order.prototype.isRefunded = function() {
    return this.status === Order.STATUS.REFUNDED;
  };

  Order.prototype.canCancel = function() {
    return this.status === Order.STATUS.PENDING_PAYMENT || 
           (this.status === Order.STATUS.PAID && this.shipping_status === Order.SHIPPING_STATUS.UNSHIPPED);
  };

  Order.prototype.canRefund = function() {
    return this.isPaid() && !this.isRefunded();
  };

  Order.prototype.canShip = function() {
    return this.isPaid() && this.shipping_status === Order.SHIPPING_STATUS.UNSHIPPED;
  };

  Order.prototype.canComplete = function() {
    return this.isShipped() && this.shipping_status === Order.SHIPPING_STATUS.DELIVERED;
  };

  Order.prototype.getStatusText = function() {
    const statusMap = {
      [Order.STATUS.PENDING_PAYMENT]: '待支付',
      [Order.STATUS.PAID]: '已支付',
      [Order.STATUS.SHIPPED]: '已发货',
      [Order.STATUS.COMPLETED]: '已完成',
      [Order.STATUS.CANCELLED]: '已取消',
      [Order.STATUS.REFUNDED]: '已退款'
    };
    return statusMap[this.status] || '未知状态';
  };

  Order.prototype.getPaymentStatusText = function() {
    const statusMap = {
      [Order.PAYMENT_STATUS.UNPAID]: '未支付',
      [Order.PAYMENT_STATUS.PAID]: '已支付',
      [Order.PAYMENT_STATUS.PARTIAL_REFUND]: '部分退款',
      [Order.PAYMENT_STATUS.FULL_REFUND]: '全额退款'
    };
    return statusMap[this.payment_status] || '未知状态';
  };

  Order.prototype.getShippingStatusText = function() {
    const statusMap = {
      [Order.SHIPPING_STATUS.UNSHIPPED]: '未发货',
      [Order.SHIPPING_STATUS.SHIPPED]: '已发货',
      [Order.SHIPPING_STATUS.DELIVERED]: '已收货',
      [Order.SHIPPING_STATUS.RETURNED]: '已退货'
    };
    return statusMap[this.shipping_status] || '未知状态';
  };

  Order.prototype.getOrderTypeText = function() {
    const typeMap = {
      [Order.ORDER_TYPE.POINTS_ONLY]: '积分兑换',
      [Order.ORDER_TYPE.CASH_ONLY]: '现金购买',
      [Order.ORDER_TYPE.POINTS_AND_CASH]: '积分+现金'
    };
    return typeMap[this.order_type] || '未知类型';
  };

  Order.prototype.calculateTotalSavings = function() {
    return this.discount_amount + this.coupon_discount;
  };

  Order.prototype.pay = async function(paymentMethod, paymentNo, transaction = null) {
    if (!this.isPendingPayment()) {
      throw new Error('订单状态不允许支付');
    }

    const options = transaction ? { transaction } : {};

    await this.update({
      status: Order.STATUS.PAID,
      payment_status: Order.PAYMENT_STATUS.PAID,
      payment_method: paymentMethod,
      payment_no: paymentNo,
      paid_at: new Date()
    }, options);

    return this.reload(options);
  };

  Order.prototype.ship = async function(trackingNo, logisticsCompany, transaction = null) {
    if (!this.canShip()) {
      throw new Error('订单状态不允许发货');
    }

    const options = transaction ? { transaction } : {};

    await this.update({
      status: Order.STATUS.SHIPPED,
      shipping_status: Order.SHIPPING_STATUS.SHIPPED,
      tracking_no: trackingNo,
      logistics_company: logisticsCompany,
      shipped_at: new Date()
    }, options);

    return this.reload(options);
  };

  Order.prototype.deliver = async function(transaction = null) {
    if (!this.isShipped()) {
      throw new Error('订单未发货，无法确认收货');
    }

    const options = transaction ? { transaction } : {};

    await this.update({
      shipping_status: Order.SHIPPING_STATUS.DELIVERED,
      delivered_at: new Date()
    }, options);

    return this.reload(options);
  };

  Order.prototype.complete = async function(transaction = null) {
    if (!this.canComplete()) {
      throw new Error('订单状态不允许完成');
    }

    const options = transaction ? { transaction } : {};

    await this.update({
      status: Order.STATUS.COMPLETED,
      completed_at: new Date()
    }, options);

    return this.reload(options);
  };

  Order.prototype.cancel = async function(reason, transaction = null) {
    if (!this.canCancel()) {
      throw new Error('订单状态不允许取消');
    }

    const options = transaction ? { transaction } : {};

    await this.update({
      status: Order.STATUS.CANCELLED,
      cancel_reason: reason,
      cancelled_at: new Date()
    }, options);

    return this.reload(options);
  };

  Order.prototype.refund = async function(refundAmount, refundPoints, transaction = null) {
    if (!this.canRefund()) {
      throw new Error('订单状态不允许退款');
    }

    const options = transaction ? { transaction } : {};

    const isFullRefund = refundAmount >= this.final_amount && refundPoints >= this.final_points;

    await this.update({
      status: isFullRefund ? Order.STATUS.REFUNDED : this.status,
      payment_status: isFullRefund ? Order.PAYMENT_STATUS.FULL_REFUND : Order.PAYMENT_STATUS.PARTIAL_REFUND,
      refund_amount: this.refund_amount + refundAmount,
      refund_points: this.refund_points + refundPoints,
      refunded_at: new Date()
    }, options);

    return this.reload(options);
  };

  Order.prototype.updateLogistics = async function(logisticsInfo, transaction = null) {
    const options = transaction ? { transaction } : {};

    await this.update({
      logistics_info: logisticsInfo
    }, options);

    return this.reload(options);
  };

  // 类方法
  Order.generateOrderNo = async function() {
    const now = new Date();
    const dateStr = now.getFullYear().toString() + 
                   (now.getMonth() + 1).toString().padStart(2, '0') + 
                   now.getDate().toString().padStart(2, '0');
    const timeStr = now.getHours().toString().padStart(2, '0') + 
                   now.getMinutes().toString().padStart(2, '0') + 
                   now.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `ORD${dateStr}${timeStr}${random}`;
  };

  Order.findByOrderNo = function(orderNo) {
    return this.findOne({ where: { order_no: orderNo } });
  };

  Order.findByPaymentNo = function(paymentNo) {
    return this.findOne({ where: { payment_no: paymentNo } });
  };

  Order.findByTrackingNo = function(trackingNo) {
    return this.findOne({ where: { tracking_no: trackingNo } });
  };

  Order.findByUserId = function(userId, options = {}) {
    return this.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  Order.findByStatus = function(status, options = {}) {
    return this.findAll({
      where: { status },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  Order.findPendingPayment = function(options = {}) {
    return this.findAll({
      where: { status: Order.STATUS.PENDING_PAYMENT },
      order: [['created_at', 'ASC']],
      ...options
    });
  };

  Order.findPendingShipment = function(options = {}) {
    return this.findAll({
      where: {
        status: Order.STATUS.PAID,
        shipping_status: Order.SHIPPING_STATUS.UNSHIPPED
      },
      order: [['paid_at', 'ASC']],
      ...options
    });
  };

  Order.findOverduePayment = function(minutes = 30, options = {}) {
    const overdueTime = new Date(Date.now() - minutes * 60 * 1000);
    
    return this.findAll({
      where: {
        status: Order.STATUS.PENDING_PAYMENT,
        created_at: {
          [sequelize.Sequelize.Op.lt]: overdueTime
        }
      },
      order: [['created_at', 'ASC']],
      ...options
    });
  };

  Order.findByDateRange = function(startDate, endDate, options = {}) {
    const where = {};
    
    if (startDate) {
      where.created_at = { [sequelize.Sequelize.Op.gte]: startDate };
    }
    
    if (endDate) {
      where.created_at = {
        ...where.created_at,
        [sequelize.Sequelize.Op.lte]: endDate
      };
    }
    
    return this.findAll({
      where,
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  Order.getStatsByDateRange = async function(startDate, endDate) {
    const where = {};
    
    if (startDate) {
      where.created_at = { [sequelize.Sequelize.Op.gte]: startDate };
    }
    
    if (endDate) {
      where.created_at = {
        ...where.created_at,
        [sequelize.Sequelize.Op.lte]: endDate
      };
    }
    
    const stats = await this.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.col('total_points')), 'totalPoints'],
        [sequelize.fn('SUM', sequelize.col('final_amount')), 'finalAmount'],
        [sequelize.fn('SUM', sequelize.col('final_points')), 'finalPoints'],
        [sequelize.fn('AVG', sequelize.col('final_amount')), 'avgAmount']
      ],
      where,
      raw: true
    });
    
    const statusStats = await this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where,
      group: ['status'],
      raw: true
    });
    
    const statusCounts = {};
    statusStats.forEach(stat => {
      statusCounts[stat.status] = parseInt(stat.count);
    });
    
    return {
      totalOrders: parseInt(stats?.totalOrders || 0),
      totalAmount: parseFloat(stats?.totalAmount || 0),
      totalPoints: parseInt(stats?.totalPoints || 0),
      finalAmount: parseFloat(stats?.finalAmount || 0),
      finalPoints: parseInt(stats?.finalPoints || 0),
      avgAmount: parseFloat(stats?.avgAmount || 0),
      statusCounts
    };
  };

  Order.getUserOrderStats = async function(userId) {
    const stats = await this.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('final_amount')), 'totalAmount'],
        [sequelize.fn('SUM', sequelize.col('final_points')), 'totalPoints']
      ],
      where: { user_id: userId },
      raw: true
    });
    
    const statusStats = await this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { user_id: userId },
      group: ['status'],
      raw: true
    });
    
    const statusCounts = {};
    statusStats.forEach(stat => {
      statusCounts[stat.status] = parseInt(stat.count);
    });
    
    return {
      totalOrders: parseInt(stats?.totalOrders || 0),
      totalAmount: parseFloat(stats?.totalAmount || 0),
      totalPoints: parseInt(stats?.totalPoints || 0),
      statusCounts
    };
  };

  Order.cancelOverdueOrders = async function(minutes = 30) {
    const overdueTime = new Date(Date.now() - minutes * 60 * 1000);
    
    const overdueOrders = await this.findAll({
      where: {
        status: Order.STATUS.PENDING_PAYMENT,
        created_at: {
          [sequelize.Sequelize.Op.lt]: overdueTime
        }
      }
    });
    
    const cancelPromises = overdueOrders.map(order => 
      order.cancel('支付超时自动取消')
    );
    
    await Promise.all(cancelPromises);
    
    return overdueOrders.length;
  };

  return Order;
};