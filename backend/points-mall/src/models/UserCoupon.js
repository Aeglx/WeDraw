module.exports = (sequelize, DataTypes) => {
  const UserCoupon = sequelize.define('UserCoupon', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户优惠券ID'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '优惠券ID'
    },
    coupon_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '优惠券代码（快照）'
    },
    coupon_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '优惠券名称（快照）'
    },
    coupon_type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '优惠券类型（快照）'
    },
    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '折扣值（快照）'
    },
    min_order_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '最低订单金额（快照）'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态：1-未使用，2-已使用，3-已过期，4-已作废'
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'manual',
      comment: '获取来源：manual-手动发放，activity-活动获得，register-注册赠送，purchase-购买赠送'
    },
    obtained_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '获得时间'
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
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '使用时间'
    },
    used_order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '使用的订单ID'
    },
    used_order_no: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '使用的订单号'
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: '实际折扣金额'
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '过期时间'
    },
    voided_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '作废时间'
    },
    void_reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '作废原因'
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
    tableName: 'user_coupons',
    comment: '用户优惠券表',
    indexes: [
      {
        name: 'idx_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_coupon_id',
        fields: ['coupon_id']
      },
      {
        name: 'idx_coupon_code',
        fields: ['coupon_code']
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
        name: 'idx_used_order',
        fields: ['used_order_id']
      },
      {
        name: 'idx_source',
        fields: ['source']
      },
      {
        name: 'idx_obtained_at',
        fields: ['obtained_at']
      }
    ],
    hooks: {
      beforeUpdate: (userCoupon) => {
        userCoupon.updated_at = new Date();
      }
    }
  });

  // 状态常量
  UserCoupon.STATUS = {
    UNUSED: 1,
    USED: 2,
    EXPIRED: 3,
    VOIDED: 4
  };

  // 来源常量
  UserCoupon.SOURCE = {
    MANUAL: 'manual',
    ACTIVITY: 'activity',
    REGISTER: 'register',
    PURCHASE: 'purchase',
    SIGN_IN: 'sign_in',
    SHARE: 'share',
    INVITE: 'invite'
  };

  // 实例方法
  UserCoupon.prototype.isUnused = function() {
    return this.status === UserCoupon.STATUS.UNUSED;
  };

  UserCoupon.prototype.isUsed = function() {
    return this.status === UserCoupon.STATUS.USED;
  };

  UserCoupon.prototype.isExpired = function() {
    return this.status === UserCoupon.STATUS.EXPIRED;
  };

  UserCoupon.prototype.isVoided = function() {
    return this.status === UserCoupon.STATUS.VOIDED;
  };

  UserCoupon.prototype.isValid = function() {
    if (!this.isUnused()) return false;
    
    const now = new Date();
    return now >= this.valid_from && now <= this.valid_until;
  };

  UserCoupon.prototype.isExpiring = function(days = 3) {
    if (!this.isUnused()) return false;
    
    const now = new Date();
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + days);
    
    return this.valid_until <= expiringDate && this.valid_until > now;
  };

  UserCoupon.prototype.getDaysUntilExpiry = function() {
    if (!this.isUnused()) return 0;
    
    const now = new Date();
    const diffTime = this.valid_until - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  UserCoupon.prototype.getStatusText = function() {
    const statusMap = {
      [UserCoupon.STATUS.UNUSED]: '未使用',
      [UserCoupon.STATUS.USED]: '已使用',
      [UserCoupon.STATUS.EXPIRED]: '已过期',
      [UserCoupon.STATUS.VOIDED]: '已作废'
    };
    return statusMap[this.status] || '未知状态';
  };

  UserCoupon.prototype.getSourceText = function() {
    const sourceMap = {
      [UserCoupon.SOURCE.MANUAL]: '手动发放',
      [UserCoupon.SOURCE.ACTIVITY]: '活动获得',
      [UserCoupon.SOURCE.REGISTER]: '注册赠送',
      [UserCoupon.SOURCE.PURCHASE]: '购买赠送',
      [UserCoupon.SOURCE.SIGN_IN]: '签到获得',
      [UserCoupon.SOURCE.SHARE]: '分享获得',
      [UserCoupon.SOURCE.INVITE]: '邀请获得'
    };
    return sourceMap[this.source] || '未知来源';
  };

  UserCoupon.prototype.getCouponTypeText = function() {
    const typeMap = {
      1: '满减券',
      2: '折扣券',
      3: '积分抵扣券',
      4: '免邮券'
    };
    return typeMap[this.coupon_type] || '未知类型';
  };

  UserCoupon.prototype.getDiscountText = function() {
    switch (this.coupon_type) {
      case 1: // 满减券
        return `满${this.min_order_amount}减${this.discount_value}`;
      case 2: // 折扣券
        return `${this.discount_value}折`;
      case 3: // 积分抵扣券
        return `积分抵扣${this.discount_value}元`;
      case 4: // 免邮券
        return '免邮券';
      default:
        return '优惠券';
    }
  };

  UserCoupon.prototype.use = async function(orderId, orderNo, discountAmount, transaction = null) {
    if (!this.isValid()) {
      throw new Error('优惠券不可用');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.update({
      status: UserCoupon.STATUS.USED,
      used_at: new Date(),
      used_order_id: orderId,
      used_order_no: orderNo,
      discount_amount: discountAmount
    }, options);
    
    return this.reload(options);
  };

  UserCoupon.prototype.refund = async function(transaction = null) {
    if (!this.isUsed()) {
      throw new Error('优惠券未使用，无法退还');
    }
    
    const options = transaction ? { transaction } : {};
    
    // 检查是否还在有效期内
    const now = new Date();
    const status = now <= this.valid_until ? UserCoupon.STATUS.UNUSED : UserCoupon.STATUS.EXPIRED;
    
    await this.update({
      status,
      used_at: null,
      used_order_id: null,
      used_order_no: null,
      discount_amount: 0
    }, options);
    
    return this.reload(options);
  };

  UserCoupon.prototype.expire = async function(transaction = null) {
    if (!this.isUnused()) {
      throw new Error('只能将未使用的优惠券设为过期');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.update({
      status: UserCoupon.STATUS.EXPIRED,
      expired_at: new Date()
    }, options);
    
    return this.reload(options);
  };

  UserCoupon.prototype.void = async function(reason, transaction = null) {
    if (this.isUsed()) {
      throw new Error('已使用的优惠券不能作废');
    }
    
    const options = transaction ? { transaction } : {};
    
    await this.update({
      status: UserCoupon.STATUS.VOIDED,
      voided_at: new Date(),
      void_reason: reason
    }, options);
    
    return this.reload(options);
  };

  // 类方法
  UserCoupon.findByUserId = function(userId, options = {}) {
    return this.findAll({
      where: { user_id: userId },
      order: [['obtained_at', 'DESC']],
      ...options
    });
  };

  UserCoupon.findUserValidCoupons = function(userId, options = {}) {
    const now = new Date();
    
    return this.findAll({
      where: {
        user_id: userId,
        status: UserCoupon.STATUS.UNUSED,
        valid_from: { [sequelize.Sequelize.Op.lte]: now },
        valid_until: { [sequelize.Sequelize.Op.gte]: now }
      },
      order: [['valid_until', 'ASC']],
      ...options
    });
  };

  UserCoupon.findUserExpiring = function(userId, days = 3, options = {}) {
    const now = new Date();
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + days);
    
    return this.findAll({
      where: {
        user_id: userId,
        status: UserCoupon.STATUS.UNUSED,
        valid_until: {
          [sequelize.Sequelize.Op.between]: [now, expiringDate]
        }
      },
      order: [['valid_until', 'ASC']],
      ...options
    });
  };

  UserCoupon.findByCouponId = function(couponId, options = {}) {
    return this.findAll({
      where: { coupon_id: couponId },
      order: [['obtained_at', 'DESC']],
      ...options
    });
  };

  UserCoupon.findByOrderId = function(orderId) {
    return this.findOne({ where: { used_order_id: orderId } });
  };

  UserCoupon.findByStatus = function(status, options = {}) {
    return this.findAll({
      where: { status },
      order: [['obtained_at', 'DESC']],
      ...options
    });
  };

  UserCoupon.findBySource = function(source, options = {}) {
    return this.findAll({
      where: { source },
      order: [['obtained_at', 'DESC']],
      ...options
    });
  };

  UserCoupon.findExpired = function(options = {}) {
    return this.findAll({
      where: {
        status: UserCoupon.STATUS.UNUSED,
        valid_until: { [sequelize.Sequelize.Op.lt]: new Date() }
      },
      order: [['valid_until', 'DESC']],
      ...options
    });
  };

  UserCoupon.getUserCouponCount = async function(userId, couponId) {
    return this.count({
      where: {
        user_id: userId,
        coupon_id: couponId
      }
    });
  };

  UserCoupon.getUserValidCouponCount = async function(userId, couponId) {
    const now = new Date();
    
    return this.count({
      where: {
        user_id: userId,
        coupon_id: couponId,
        status: UserCoupon.STATUS.UNUSED,
        valid_from: { [sequelize.Sequelize.Op.lte]: now },
        valid_until: { [sequelize.Sequelize.Op.gte]: now }
      }
    });
  };

  UserCoupon.grantCoupon = async function(userId, coupon, source = 'manual', transaction = null) {
    const options = transaction ? { transaction } : {};
    
    // 计算有效期
    let validFrom = coupon.valid_from;
    let validUntil = coupon.valid_until;
    
    // 如果优惠券设置了领取后有效天数，则重新计算有效期
    if (coupon.valid_days) {
      validFrom = new Date();
      validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + coupon.valid_days);
    }
    
    const userCoupon = await this.create({
      user_id: userId,
      coupon_id: coupon.id,
      coupon_code: coupon.code,
      coupon_name: coupon.name,
      coupon_type: coupon.type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      source,
      valid_from: validFrom,
      valid_until: validUntil
    }, options);
    
    return userCoupon;
  };

  UserCoupon.batchGrant = async function(userIds, coupon, source = 'manual', transaction = null) {
    const options = transaction ? { transaction } : {};
    
    const userCoupons = userIds.map(userId => {
      // 计算有效期
      let validFrom = coupon.valid_from;
      let validUntil = coupon.valid_until;
      
      if (coupon.valid_days) {
        validFrom = new Date();
        validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + coupon.valid_days);
      }
      
      return {
        user_id: userId,
        coupon_id: coupon.id,
        coupon_code: coupon.code,
        coupon_name: coupon.name,
        coupon_type: coupon.type,
        discount_value: coupon.discount_value,
        min_order_amount: coupon.min_order_amount,
        source,
        valid_from: validFrom,
        valid_until: validUntil
      };
    });
    
    return this.bulkCreate(userCoupons, options);
  };

  UserCoupon.expireOverdue = async function() {
    const expiredCount = await this.update(
      { 
        status: UserCoupon.STATUS.EXPIRED,
        expired_at: new Date()
      },
      {
        where: {
          status: UserCoupon.STATUS.UNUSED,
          valid_until: { [sequelize.Sequelize.Op.lt]: new Date() }
        }
      }
    );
    
    return expiredCount[0];
  };

  UserCoupon.getUserStats = async function(userId) {
    const total = await this.count({ where: { user_id: userId } });
    const unused = await this.count({ 
      where: { 
        user_id: userId, 
        status: UserCoupon.STATUS.UNUSED 
      } 
    });
    const used = await this.count({ 
      where: { 
        user_id: userId, 
        status: UserCoupon.STATUS.USED 
      } 
    });
    const expired = await this.count({ 
      where: { 
        user_id: userId, 
        status: UserCoupon.STATUS.EXPIRED 
      } 
    });
    
    const now = new Date();
    const valid = await this.count({
      where: {
        user_id: userId,
        status: UserCoupon.STATUS.UNUSED,
        valid_from: { [sequelize.Sequelize.Op.lte]: now },
        valid_until: { [sequelize.Sequelize.Op.gte]: now }
      }
    });
    
    const expiring = await this.count({
      where: {
        user_id: userId,
        status: UserCoupon.STATUS.UNUSED,
        valid_until: {
          [sequelize.Sequelize.Op.between]: [
            now,
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3天后
          ]
        }
      }
    });
    
    const totalSavings = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('discount_amount')), 'totalSavings']
      ],
      where: {
        user_id: userId,
        status: UserCoupon.STATUS.USED
      },
      raw: true
    });
    
    return {
      total,
      unused,
      used,
      expired,
      valid,
      expiring,
      totalSavings: parseFloat(totalSavings?.totalSavings || 0)
    };
  };

  UserCoupon.getCouponStats = async function(couponId) {
    const total = await this.count({ where: { coupon_id: couponId } });
    const used = await this.count({ 
      where: { 
        coupon_id: couponId, 
        status: UserCoupon.STATUS.USED 
      } 
    });
    const expired = await this.count({ 
      where: { 
        coupon_id: couponId, 
        status: UserCoupon.STATUS.EXPIRED 
      } 
    });
    
    const totalSavings = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('discount_amount')), 'totalSavings']
      ],
      where: {
        coupon_id: couponId,
        status: UserCoupon.STATUS.USED
      },
      raw: true
    });
    
    const usageRate = total > 0 ? ((used / total) * 100).toFixed(2) : 0;
    
    return {
      total,
      used,
      unused: total - used - expired,
      expired,
      usageRate: parseFloat(usageRate),
      totalSavings: parseFloat(totalSavings?.totalSavings || 0)
    };
  };

  UserCoupon.getSystemStats = async function(startDate = null, endDate = null) {
    const where = {};
    
    if (startDate || endDate) {
      where.obtained_at = {};
      if (startDate) where.obtained_at[sequelize.Sequelize.Op.gte] = startDate;
      if (endDate) where.obtained_at[sequelize.Sequelize.Op.lte] = endDate;
    }
    
    const total = await this.count({ where });
    const used = await this.count({ 
      where: { 
        ...where, 
        status: UserCoupon.STATUS.USED 
      } 
    });
    const expired = await this.count({ 
      where: { 
        ...where, 
        status: UserCoupon.STATUS.EXPIRED 
      } 
    });
    
    const totalSavings = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('discount_amount')), 'totalSavings']
      ],
      where: {
        ...where,
        status: UserCoupon.STATUS.USED
      },
      raw: true
    });
    
    const usageRate = total > 0 ? ((used / total) * 100).toFixed(2) : 0;
    
    return {
      total,
      used,
      unused: total - used - expired,
      expired,
      usageRate: parseFloat(usageRate),
      totalSavings: parseFloat(totalSavings?.totalSavings || 0)
    };
  };

  return UserCoupon;
};