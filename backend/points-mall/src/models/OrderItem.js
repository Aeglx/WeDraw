module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '订单商品ID'
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '订单ID'
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '商品ID'
    },
    sku_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'SKU ID'
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '商品名称（快照）'
    },
    sku_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'SKU名称（快照）'
    },
    sku_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'SKU编码（快照）'
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '规格属性（快照）'
    },
    product_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '商品图片（快照）'
    },
    unit_points_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '单价积分（快照）'
    },
    unit_cash_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '单价现金（快照）'
    },
    original_unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '原价（快照）'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '购买数量'
    },
    total_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '小计积分'
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '小计金额'
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '优惠金额'
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
    weight: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
      comment: '重量（kg）'
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '尺寸信息'
    },
    refund_status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '退款状态：0-无退款，1-部分退款，2-全额退款'
    },
    refunded_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '已退款数量'
    },
    refunded_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '已退款积分'
    },
    refunded_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '已退款金额'
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
    tableName: 'order_items',
    comment: '订单商品表',
    indexes: [
      {
        name: 'idx_order_id',
        fields: ['order_id']
      },
      {
        name: 'idx_product_id',
        fields: ['product_id']
      },
      {
        name: 'idx_sku_id',
        fields: ['sku_id']
      },
      {
        name: 'idx_sku_code',
        fields: ['sku_code']
      },
      {
        name: 'idx_refund_status',
        fields: ['refund_status']
      }
    ],
    hooks: {
      beforeUpdate: (orderItem) => {
        orderItem.updated_at = new Date();
      },
      beforeCreate: (orderItem) => {
        // 计算小计
        orderItem.total_points = orderItem.unit_points_price * orderItem.quantity;
        orderItem.total_amount = orderItem.unit_cash_price * orderItem.quantity;
        
        // 计算实付金额（减去优惠）
        orderItem.final_points = Math.max(0, orderItem.total_points);
        orderItem.final_amount = Math.max(0, orderItem.total_amount - orderItem.discount_amount);
      },
      beforeUpdate: (orderItem) => {
        // 如果数量或单价发生变化，重新计算小计
        if (orderItem.changed('quantity') || orderItem.changed('unit_points_price') || orderItem.changed('unit_cash_price')) {
          orderItem.total_points = orderItem.unit_points_price * orderItem.quantity;
          orderItem.total_amount = orderItem.unit_cash_price * orderItem.quantity;
        }
        
        // 如果优惠金额发生变化，重新计算实付金额
        if (orderItem.changed('discount_amount') || orderItem.changed('total_points') || orderItem.changed('total_amount')) {
          orderItem.final_points = Math.max(0, orderItem.total_points);
          orderItem.final_amount = Math.max(0, orderItem.total_amount - orderItem.discount_amount);
        }
      }
    }
  });

  // 退款状态常量
  OrderItem.REFUND_STATUS = {
    NO_REFUND: 0,
    PARTIAL_REFUND: 1,
    FULL_REFUND: 2
  };

  // 实例方法
  OrderItem.prototype.getSpecificationText = function() {
    if (!this.specifications) return '';
    
    return Object.entries(this.specifications)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  OrderItem.prototype.getDiscountPercentage = function() {
    if (!this.original_unit_price || this.original_unit_price <= this.unit_cash_price) {
      return 0;
    }
    
    return Math.round((1 - this.unit_cash_price / this.original_unit_price) * 100);
  };

  OrderItem.prototype.getTotalWeight = function() {
    return this.weight ? this.weight * this.quantity : 0;
  };

  OrderItem.prototype.canRefund = function() {
    return this.refunded_quantity < this.quantity;
  };

  OrderItem.prototype.getRefundableQuantity = function() {
    return this.quantity - this.refunded_quantity;
  };

  OrderItem.prototype.getRefundablePoints = function() {
    const refundableQuantity = this.getRefundableQuantity();
    return Math.floor((this.final_points / this.quantity) * refundableQuantity);
  };

  OrderItem.prototype.getRefundableAmount = function() {
    const refundableQuantity = this.getRefundableQuantity();
    return parseFloat(((this.final_amount / this.quantity) * refundableQuantity).toFixed(2));
  };

  OrderItem.prototype.isFullyRefunded = function() {
    return this.refund_status === OrderItem.REFUND_STATUS.FULL_REFUND;
  };

  OrderItem.prototype.isPartiallyRefunded = function() {
    return this.refund_status === OrderItem.REFUND_STATUS.PARTIAL_REFUND;
  };

  OrderItem.prototype.hasRefund = function() {
    return this.refund_status > OrderItem.REFUND_STATUS.NO_REFUND;
  };

  OrderItem.prototype.refund = async function(refundQuantity, transaction = null) {
    if (!this.canRefund()) {
      throw new Error('该商品不能退款');
    }
    
    if (refundQuantity <= 0 || refundQuantity > this.getRefundableQuantity()) {
      throw new Error('退款数量无效');
    }
    
    const options = transaction ? { transaction } : {};
    
    // 计算退款金额
    const unitRefundPoints = Math.floor(this.final_points / this.quantity);
    const unitRefundAmount = parseFloat((this.final_amount / this.quantity).toFixed(2));
    
    const refundPoints = unitRefundPoints * refundQuantity;
    const refundAmount = parseFloat((unitRefundAmount * refundQuantity).toFixed(2));
    
    // 更新退款信息
    const newRefundedQuantity = this.refunded_quantity + refundQuantity;
    const newRefundedPoints = this.refunded_points + refundPoints;
    const newRefundedAmount = parseFloat((this.refunded_amount + refundAmount).toFixed(2));
    
    let refundStatus = OrderItem.REFUND_STATUS.PARTIAL_REFUND;
    if (newRefundedQuantity >= this.quantity) {
      refundStatus = OrderItem.REFUND_STATUS.FULL_REFUND;
    }
    
    await this.update({
      refund_status: refundStatus,
      refunded_quantity: newRefundedQuantity,
      refunded_points: newRefundedPoints,
      refunded_amount: newRefundedAmount
    }, options);
    
    return {
      refundPoints,
      refundAmount,
      refundQuantity
    };
  };

  OrderItem.prototype.updateQuantity = async function(newQuantity, transaction = null) {
    if (newQuantity <= 0) {
      throw new Error('数量必须大于0');
    }
    
    if (this.refunded_quantity > 0 && newQuantity < this.refunded_quantity) {
      throw new Error('新数量不能小于已退款数量');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.update({ quantity: newQuantity }, options);
    return this.reload(options);
  };

  OrderItem.prototype.applyDiscount = async function(discountAmount, transaction = null) {
    if (discountAmount < 0 || discountAmount > this.total_amount) {
      throw new Error('优惠金额无效');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.update({ discount_amount: discountAmount }, options);
    return this.reload(options);
  };

  // 类方法
  OrderItem.findByOrderId = function(orderId, options = {}) {
    return this.findAll({
      where: { order_id: orderId },
      order: [['created_at', 'ASC']],
      ...options
    });
  };

  OrderItem.findByProductId = function(productId, options = {}) {
    return this.findAll({
      where: { product_id: productId },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  OrderItem.findBySkuId = function(skuId, options = {}) {
    return this.findAll({
      where: { sku_id: skuId },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  OrderItem.findBySkuCode = function(skuCode, options = {}) {
    return this.findAll({
      where: { sku_code: skuCode },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  OrderItem.findRefundable = function(options = {}) {
    return this.findAll({
      where: {
        refund_status: {
          [sequelize.Sequelize.Op.in]: [OrderItem.REFUND_STATUS.NO_REFUND, OrderItem.REFUND_STATUS.PARTIAL_REFUND]
        },
        refunded_quantity: {
          [sequelize.Sequelize.Op.lt]: sequelize.col('quantity')
        }
      },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  OrderItem.getOrderSummary = async function(orderId) {
    const items = await this.findAll({
      where: { order_id: orderId },
      raw: true
    });
    
    if (items.length === 0) {
      return {
        totalItems: 0,
        totalQuantity: 0,
        totalPoints: 0,
        totalAmount: 0,
        totalDiscount: 0,
        finalPoints: 0,
        finalAmount: 0,
        totalWeight: 0
      };
    }
    
    const summary = items.reduce((acc, item) => {
      acc.totalItems += 1;
      acc.totalQuantity += item.quantity;
      acc.totalPoints += item.total_points;
      acc.totalAmount += parseFloat(item.total_amount);
      acc.totalDiscount += parseFloat(item.discount_amount);
      acc.finalPoints += item.final_points;
      acc.finalAmount += parseFloat(item.final_amount);
      acc.totalWeight += item.weight ? parseFloat(item.weight) * item.quantity : 0;
      return acc;
    }, {
      totalItems: 0,
      totalQuantity: 0,
      totalPoints: 0,
      totalAmount: 0,
      totalDiscount: 0,
      finalPoints: 0,
      finalAmount: 0,
      totalWeight: 0
    });
    
    // 保留两位小数
    summary.totalAmount = parseFloat(summary.totalAmount.toFixed(2));
    summary.totalDiscount = parseFloat(summary.totalDiscount.toFixed(2));
    summary.finalAmount = parseFloat(summary.finalAmount.toFixed(2));
    summary.totalWeight = parseFloat(summary.totalWeight.toFixed(3));
    
    return summary;
  };

  OrderItem.getProductSalesStats = async function(productId, startDate = null, endDate = null) {
    const where = { product_id: productId };
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[sequelize.Sequelize.Op.gte] = startDate;
      if (endDate) where.created_at[sequelize.Sequelize.Op.lte] = endDate;
    }
    
    const stats = await this.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('final_points')), 'totalPoints'],
        [sequelize.fn('SUM', sequelize.col('final_amount')), 'totalAmount'],
        [sequelize.fn('AVG', sequelize.col('unit_cash_price')), 'avgPrice']
      ],
      where,
      raw: true
    });
    
    return {
      totalOrders: parseInt(stats?.totalOrders || 0),
      totalQuantity: parseInt(stats?.totalQuantity || 0),
      totalPoints: parseInt(stats?.totalPoints || 0),
      totalAmount: parseFloat(stats?.totalAmount || 0),
      avgPrice: parseFloat(stats?.avgPrice || 0)
    };
  };

  OrderItem.getSkuSalesStats = async function(skuId, startDate = null, endDate = null) {
    const where = { sku_id: skuId };
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[sequelize.Sequelize.Op.gte] = startDate;
      if (endDate) where.created_at[sequelize.Sequelize.Op.lte] = endDate;
    }
    
    const stats = await this.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('final_points')), 'totalPoints'],
        [sequelize.fn('SUM', sequelize.col('final_amount')), 'totalAmount']
      ],
      where,
      raw: true
    });
    
    return {
      totalOrders: parseInt(stats?.totalOrders || 0),
      totalQuantity: parseInt(stats?.totalQuantity || 0),
      totalPoints: parseInt(stats?.totalPoints || 0),
      totalAmount: parseFloat(stats?.totalAmount || 0)
    };
  };

  OrderItem.getTopSellingProducts = async function(limit = 10, startDate = null, endDate = null) {
    const where = {};
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[sequelize.Sequelize.Op.gte] = startDate;
      if (endDate) where.created_at[sequelize.Sequelize.Op.lte] = endDate;
    }
    
    return this.findAll({
      attributes: [
        'product_id',
        'product_name',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('final_amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      where,
      group: ['product_id', 'product_name'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit,
      raw: true
    });
  };

  OrderItem.createBatch = async function(orderId, items, transaction = null) {
    const options = transaction ? { transaction } : {};
    
    const orderItems = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      sku_id: item.sku_id,
      product_name: item.product_name,
      sku_name: item.sku_name,
      sku_code: item.sku_code,
      specifications: item.specifications,
      product_image: item.product_image,
      unit_points_price: item.unit_points_price || 0,
      unit_cash_price: item.unit_cash_price || 0,
      original_unit_price: item.original_unit_price,
      quantity: item.quantity,
      discount_amount: item.discount_amount || 0,
      weight: item.weight,
      dimensions: item.dimensions
    }));
    
    return this.bulkCreate(orderItems, options);
  };

  return OrderItem;
};