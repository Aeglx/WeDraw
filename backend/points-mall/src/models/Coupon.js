module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '优惠券ID'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '优惠券名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '优惠券代码'
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '优惠券类型：1-满减券，2-折扣券，3-积分抵扣券，4-免邮券'
    },
    discount_type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '折扣类型：1-固定金额，2-百分比折扣'
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '折扣值（金额或百分比）'
    },
    min_order_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '最低订单金额'
    },
    min_order_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '最低订单积分'
    },
    max_discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '最大折扣金额（用于百分比折扣）'
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '发放总数量（0表示无限制）'
    },
    used_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '已使用数量'
    },
    per_user_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '每用户限领数量'
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '有效期开始时间'
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '有效期结束时间'
    },
    valid_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '领取后有效天数（优先级高于固定有效期）'
    },
    applicable_products: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '适用商品ID列表（null表示全部商品）'
    },
    applicable_categories: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '适用分类ID列表（null表示全部分类）'
    },
    excluded_products: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '排除商品ID列表'
    },
    excluded_categories: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '排除分类ID列表'
    },
    user_level_limit: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '用户等级限制'
    },
    source_limit: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '来源限制（小程序、公众号等）'
    },
    stackable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否可叠加使用'
    },
    auto_apply: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否自动应用'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：0-禁用，1-启用，2-已结束'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '优惠券描述'
    },
    usage_rules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '使用规则说明'
    },
    extra_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '扩展数据'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '创建人ID'
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
    tableName: 'coupons',
    comment: '优惠券表',
    indexes: [
      {
        name: 'idx_code',
        unique: true,
        fields: ['code']
      },
      {
        name: 'idx_type',
        fields: ['type']
      },
      {
        name: 'idx_status',
        fields: ['status']
      },
      {
        name: 'idx_valid_period',
        fields: ['valid_from', 'valid_until']
      },
      {
        name: 'idx_auto_apply',
        fields: ['auto_apply']
      },
      {
        name: 'idx_created_at',
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeUpdate: (coupon) => {
        coupon.updated_at = new Date();
      },
      beforeCreate: async (coupon) => {
        // 自动生成优惠券代码
        if (!coupon.code) {
          coupon.code = await Coupon.generateCouponCode();
        }
      }
    }
  });

  // 优惠券类型常量
  Coupon.TYPE = {
    FULL_REDUCTION: 1,    // 满减券
    DISCOUNT: 2,          // 折扣券
    POINTS_DEDUCTION: 3,  // 积分抵扣券
    FREE_SHIPPING: 4      // 免邮券
  };

  // 折扣类型常量
  Coupon.DISCOUNT_TYPE = {
    FIXED_AMOUNT: 1,      // 固定金额
    PERCENTAGE: 2         // 百分比折扣
  };

  // 状态常量
  Coupon.STATUS = {
    DISABLED: 0,
    ENABLED: 1,
    ENDED: 2
  };

  // 实例方法
  Coupon.prototype.isActive = function() {
    return this.status === Coupon.STATUS.ENABLED;
  };

  Coupon.prototype.isValid = function() {
    if (!this.isActive()) return false;
    
    const now = new Date();
    return now >= this.valid_from && now <= this.valid_until;
  };

  Coupon.prototype.isAvailable = function() {
    if (!this.isValid()) return false;
    
    // 检查库存
    if (this.total_quantity > 0 && this.used_quantity >= this.total_quantity) {
      return false;
    }
    
    return true;
  };

  Coupon.prototype.getRemainingQuantity = function() {
    if (this.total_quantity === 0) return Infinity;
    return Math.max(0, this.total_quantity - this.used_quantity);
  };

  Coupon.prototype.getUsageRate = function() {
    if (this.total_quantity === 0) return 0;
    return (this.used_quantity / this.total_quantity * 100).toFixed(2);
  };

  Coupon.prototype.getTypeText = function() {
    const typeMap = {
      [Coupon.TYPE.FULL_REDUCTION]: '满减券',
      [Coupon.TYPE.DISCOUNT]: '折扣券',
      [Coupon.TYPE.POINTS_DEDUCTION]: '积分抵扣券',
      [Coupon.TYPE.FREE_SHIPPING]: '免邮券'
    };
    return typeMap[this.type] || '未知类型';
  };

  Coupon.prototype.getDiscountText = function() {
    switch (this.type) {
      case Coupon.TYPE.FULL_REDUCTION:
        return `满${this.min_order_amount}减${this.discount_value}`;
      case Coupon.TYPE.DISCOUNT:
        if (this.discount_type === Coupon.DISCOUNT_TYPE.PERCENTAGE) {
          return `${this.discount_value}折`;
        } else {
          return `立减${this.discount_value}元`;
        }
      case Coupon.TYPE.POINTS_DEDUCTION:
        return `积分抵扣${this.discount_value}元`;
      case Coupon.TYPE.FREE_SHIPPING:
        return '免邮券';
      default:
        return '优惠券';
    }
  };

  Coupon.prototype.canApplyToOrder = function(orderData) {
    if (!this.isAvailable()) return false;
    
    // 检查最低订单金额
    if (orderData.totalAmount < this.min_order_amount) return false;
    
    // 检查最低订单积分
    if (orderData.totalPoints < this.min_order_points) return false;
    
    // 检查适用商品
    if (this.applicable_products && this.applicable_products.length > 0) {
      const hasApplicableProduct = orderData.items.some(item => 
        this.applicable_products.includes(item.product_id)
      );
      if (!hasApplicableProduct) return false;
    }
    
    // 检查适用分类
    if (this.applicable_categories && this.applicable_categories.length > 0) {
      const hasApplicableCategory = orderData.items.some(item => 
        this.applicable_categories.includes(item.category_id)
      );
      if (!hasApplicableCategory) return false;
    }
    
    // 检查排除商品
    if (this.excluded_products && this.excluded_products.length > 0) {
      const hasExcludedProduct = orderData.items.some(item => 
        this.excluded_products.includes(item.product_id)
      );
      if (hasExcludedProduct) return false;
    }
    
    // 检查排除分类
    if (this.excluded_categories && this.excluded_categories.length > 0) {
      const hasExcludedCategory = orderData.items.some(item => 
        this.excluded_categories.includes(item.category_id)
      );
      if (hasExcludedCategory) return false;
    }
    
    // 检查用户等级限制
    if (this.user_level_limit && orderData.userLevel) {
      if (!this.user_level_limit.includes(orderData.userLevel)) return false;
    }
    
    // 检查来源限制
    if (this.source_limit && orderData.source) {
      if (!this.source_limit.includes(orderData.source)) return false;
    }
    
    return true;
  };

  Coupon.prototype.calculateDiscount = function(orderData) {
    if (!this.canApplyToOrder(orderData)) {
      return { discountAmount: 0, finalAmount: orderData.totalAmount };
    }
    
    let discountAmount = 0;
    
    switch (this.type) {
      case Coupon.TYPE.FULL_REDUCTION:
        discountAmount = this.discount_value;
        break;
        
      case Coupon.TYPE.DISCOUNT:
        if (this.discount_type === Coupon.DISCOUNT_TYPE.PERCENTAGE) {
          discountAmount = orderData.totalAmount * (this.discount_value / 100);
          if (this.max_discount_amount) {
            discountAmount = Math.min(discountAmount, this.max_discount_amount);
          }
        } else {
          discountAmount = this.discount_value;
        }
        break;
        
      case Coupon.TYPE.POINTS_DEDUCTION:
        discountAmount = this.discount_value;
        break;
        
      case Coupon.TYPE.FREE_SHIPPING:
        discountAmount = orderData.shippingFee || 0;
        break;
        
      default:
        discountAmount = 0;
    }
    
    // 确保折扣金额不超过订单金额
    discountAmount = Math.min(discountAmount, orderData.totalAmount);
    discountAmount = Math.max(0, discountAmount);
    
    const finalAmount = Math.max(0, orderData.totalAmount - discountAmount);
    
    return {
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2))
    };
  };

  Coupon.prototype.use = async function(transaction = null) {
    if (!this.isAvailable()) {
      throw new Error('优惠券不可用');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.increment('used_quantity', { by: 1, ...options });
    return this.reload(options);
  };

  Coupon.prototype.refund = async function(transaction = null) {
    if (this.used_quantity <= 0) {
      throw new Error('优惠券使用数量为0，无法退还');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.decrement('used_quantity', { by: 1, ...options });
    return this.reload(options);
  };

  // 类方法
  Coupon.generateCouponCode = async function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    let exists = true;
    
    while (exists) {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const existing = await this.findOne({ where: { code } });
      exists = !!existing;
    }
    
    return code;
  };

  Coupon.findByCode = function(code) {
    return this.findOne({ where: { code: code.toUpperCase() } });
  };

  Coupon.findAvailable = function(options = {}) {
    const now = new Date();
    
    return this.findAll({
      where: {
        status: Coupon.STATUS.ENABLED,
        valid_from: { [sequelize.Sequelize.Op.lte]: now },
        valid_until: { [sequelize.Sequelize.Op.gte]: now },
        [sequelize.Sequelize.Op.or]: [
          { total_quantity: 0 },
          {
            used_quantity: {
              [sequelize.Sequelize.Op.lt]: sequelize.col('total_quantity')
            }
          }
        ]
      },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  Coupon.findAutoApply = function(orderData, options = {}) {
    return this.findAvailable({
      where: {
        auto_apply: true,
        min_order_amount: { [sequelize.Sequelize.Op.lte]: orderData.totalAmount },
        min_order_points: { [sequelize.Sequelize.Op.lte]: orderData.totalPoints || 0 }
      },
      order: [['discount_value', 'DESC']],
      ...options
    });
  };

  Coupon.findByType = function(type, options = {}) {
    return this.findAll({
      where: { type },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  Coupon.findExpiring = function(days = 7, options = {}) {
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + days);
    
    return this.findAll({
      where: {
        status: Coupon.STATUS.ENABLED,
        valid_until: {
          [sequelize.Sequelize.Op.between]: [new Date(), expiringDate]
        }
      },
      order: [['valid_until', 'ASC']],
      ...options
    });
  };

  Coupon.findExpired = function(options = {}) {
    return this.findAll({
      where: {
        status: Coupon.STATUS.ENABLED,
        valid_until: { [sequelize.Sequelize.Op.lt]: new Date() }
      },
      order: [['valid_until', 'DESC']],
      ...options
    });
  };

  Coupon.getStats = async function(startDate = null, endDate = null) {
    const where = {};
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[sequelize.Sequelize.Op.gte] = startDate;
      if (endDate) where.created_at[sequelize.Sequelize.Op.lte] = endDate;
    }
    
    const total = await this.count({ where });
    const active = await this.count({ 
      where: { 
        ...where, 
        status: Coupon.STATUS.ENABLED 
      } 
    });
    
    const now = new Date();
    const available = await this.count({
      where: {
        ...where,
        status: Coupon.STATUS.ENABLED,
        valid_from: { [sequelize.Sequelize.Op.lte]: now },
        valid_until: { [sequelize.Sequelize.Op.gte]: now },
        [sequelize.Sequelize.Op.or]: [
          { total_quantity: 0 },
          {
            used_quantity: {
              [sequelize.Sequelize.Op.lt]: sequelize.col('total_quantity')
            }
          }
        ]
      }
    });
    
    const expired = await this.count({
      where: {
        ...where,
        valid_until: { [sequelize.Sequelize.Op.lt]: now }
      }
    });
    
    const usageStats = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_quantity')), 'totalIssued'],
        [sequelize.fn('SUM', sequelize.col('used_quantity')), 'totalUsed']
      ],
      where,
      raw: true
    });
    
    const totalIssued = parseInt(usageStats?.totalIssued || 0);
    const totalUsed = parseInt(usageStats?.totalUsed || 0);
    const usageRate = totalIssued > 0 ? ((totalUsed / totalIssued) * 100).toFixed(2) : 0;
    
    return {
      total,
      active,
      available,
      expired,
      disabled: total - active,
      totalIssued,
      totalUsed,
      usageRate: parseFloat(usageRate)
    };
  };

  Coupon.createBatch = async function(couponData, quantity, transaction = null) {
    const options = transaction ? { transaction } : {};
    
    const coupons = [];
    for (let i = 0; i < quantity; i++) {
      const code = await this.generateCouponCode();
      coupons.push({
        ...couponData,
        code
      });
    }
    
    return this.bulkCreate(coupons, options);
  };

  Coupon.expireOverdue = async function() {
    const expiredCount = await this.update(
      { status: Coupon.STATUS.ENDED },
      {
        where: {
          status: Coupon.STATUS.ENABLED,
          valid_until: { [sequelize.Sequelize.Op.lt]: new Date() }
        }
      }
    );
    
    return expiredCount[0];
  };

  return Coupon;
};