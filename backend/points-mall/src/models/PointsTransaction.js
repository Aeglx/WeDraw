module.exports = (sequelize, DataTypes) => {
  const PointsTransaction = sequelize.define('PointsTransaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '交易记录ID'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    points_account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '积分账户ID'
    },
    transaction_no: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '交易流水号'
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '交易类型：1-获得，2-消费，3-冻结，4-解冻，5-过期，6-退还'
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '积分来源：sign_in-签到，purchase-购买，refund-退款，admin-管理员操作，task-任务奖励，invite-邀请奖励'
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '积分数量（正数为增加，负数为减少）'
    },
    balance_before: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '交易前余额'
    },
    balance_after: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '交易后余额'
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联订单ID'
    },
    related_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联业务ID（如商品ID、任务ID等）'
    },
    related_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '关联业务类型'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '交易描述'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注信息'
    },
    expire_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '积分过期时间'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '交易状态：0-失败，1-成功，2-处理中'
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作员ID（管理员操作时）'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP地址'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户代理'
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
    tableName: 'points_transactions',
    comment: '积分交易记录表',
    indexes: [
      {
        name: 'idx_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_points_account_id',
        fields: ['points_account_id']
      },
      {
        name: 'idx_transaction_no',
        unique: true,
        fields: ['transaction_no']
      },
      {
        name: 'idx_type',
        fields: ['type']
      },
      {
        name: 'idx_source',
        fields: ['source']
      },
      {
        name: 'idx_order_id',
        fields: ['order_id']
      },
      {
        name: 'idx_related',
        fields: ['related_id', 'related_type']
      },
      {
        name: 'idx_status',
        fields: ['status']
      },
      {
        name: 'idx_expire_time',
        fields: ['expire_time']
      },
      {
        name: 'idx_created_at',
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeUpdate: (transaction) => {
        transaction.updated_at = new Date();
      }
    }
  });

  // 交易类型常量
  const TRANSACTION_TYPES = {
    EARN: 1,      // 获得
    SPEND: 2,     // 消费
    FREEZE: 3,    // 冻结
    UNFREEZE: 4,  // 解冻
    EXPIRE: 5,    // 过期
    REFUND: 6     // 退还
  };

  // 积分来源常量
  const POINT_SOURCES = {
    SIGN_IN: 'sign_in',           // 签到
    PURCHASE: 'purchase',         // 购买
    REFUND: 'refund',            // 退款
    ADMIN: 'admin',              // 管理员操作
    TASK: 'task',                // 任务奖励
    INVITE: 'invite',            // 邀请奖励
    SHARE: 'share',              // 分享奖励
    REVIEW: 'review',            // 评价奖励
    BIRTHDAY: 'birthday',        // 生日奖励
    ACTIVITY: 'activity',        // 活动奖励
    COMPENSATION: 'compensation'  // 补偿
  };

  // 实例方法
  PointsTransaction.prototype.isSuccess = function() {
    return this.status === 1;
  };

  PointsTransaction.prototype.isEarn = function() {
    return this.type === TRANSACTION_TYPES.EARN;
  };

  PointsTransaction.prototype.isSpend = function() {
    return this.type === TRANSACTION_TYPES.SPEND;
  };

  PointsTransaction.prototype.isExpired = function() {
    return this.expire_time && new Date() > this.expire_time;
  };

  PointsTransaction.prototype.getTypeText = function() {
    const typeMap = {
      [TRANSACTION_TYPES.EARN]: '获得',
      [TRANSACTION_TYPES.SPEND]: '消费',
      [TRANSACTION_TYPES.FREEZE]: '冻结',
      [TRANSACTION_TYPES.UNFREEZE]: '解冻',
      [TRANSACTION_TYPES.EXPIRE]: '过期',
      [TRANSACTION_TYPES.REFUND]: '退还'
    };
    return typeMap[this.type] || '未知';
  };

  PointsTransaction.prototype.getSourceText = function() {
    const sourceMap = {
      [POINT_SOURCES.SIGN_IN]: '签到奖励',
      [POINT_SOURCES.PURCHASE]: '购买商品',
      [POINT_SOURCES.REFUND]: '订单退款',
      [POINT_SOURCES.ADMIN]: '管理员操作',
      [POINT_SOURCES.TASK]: '任务奖励',
      [POINT_SOURCES.INVITE]: '邀请奖励',
      [POINT_SOURCES.SHARE]: '分享奖励',
      [POINT_SOURCES.REVIEW]: '评价奖励',
      [POINT_SOURCES.BIRTHDAY]: '生日奖励',
      [POINT_SOURCES.ACTIVITY]: '活动奖励',
      [POINT_SOURCES.COMPENSATION]: '系统补偿'
    };
    return sourceMap[this.source] || this.source;
  };

  // 类方法
  PointsTransaction.generateTransactionNo = function() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PT${timestamp}${random}`;
  };

  PointsTransaction.createTransaction = async function(data, transaction = null) {
    const options = transaction ? { transaction } : {};
    
    const transactionData = {
      ...data,
      transaction_no: data.transaction_no || this.generateTransactionNo(),
      status: data.status || 1
    };
    
    return this.create(transactionData, options);
  };

  PointsTransaction.findByUserId = function(userId, options = {}) {
    return this.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  PointsTransaction.findByOrderId = function(orderId, options = {}) {
    return this.findAll({
      where: { order_id: orderId },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  PointsTransaction.findBySource = function(source, options = {}) {
    return this.findAll({
      where: { source },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  PointsTransaction.findExpiredPoints = function(options = {}) {
    return this.findAll({
      where: {
        type: TRANSACTION_TYPES.EARN,
        status: 1,
        expire_time: {
          [sequelize.Sequelize.Op.lte]: new Date()
        }
      },
      order: [['expire_time', 'ASC']],
      ...options
    });
  };

  PointsTransaction.getUserStatistics = async function(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const stats = await this.findAll({
      attributes: [
        'type',
        'source',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('points')), 'totalPoints']
      ],
      where: {
        user_id: userId,
        status: 1,
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      },
      group: ['type', 'source'],
      raw: true
    });
    
    const result = {
      earned: { count: 0, points: 0, sources: {} },
      spent: { count: 0, points: 0, sources: {} }
    };
    
    stats.forEach(stat => {
      const points = parseInt(stat.totalPoints) || 0;
      const count = parseInt(stat.count) || 0;
      
      if (stat.type === TRANSACTION_TYPES.EARN) {
        result.earned.count += count;
        result.earned.points += points;
        result.earned.sources[stat.source] = {
          count,
          points
        };
      } else if (stat.type === TRANSACTION_TYPES.SPEND) {
        result.spent.count += count;
        result.spent.points += Math.abs(points);
        result.spent.sources[stat.source] = {
          count,
          points: Math.abs(points)
        };
      }
    });
    
    return result;
  };

  PointsTransaction.getSystemStatistics = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const stats = await this.findAll({
      attributes: [
        'type',
        'source',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('points')), 'totalPoints'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('user_id'))), 'uniqueUsers']
      ],
      where: {
        status: 1,
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      },
      group: ['type', 'source'],
      raw: true
    });
    
    const dailyStats = await this.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('points')), 'totalPoints']
      ],
      where: {
        status: 1,
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at')), 'type'],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });
    
    return {
      summary: stats,
      daily: dailyStats
    };
  };

  // 常量导出
  PointsTransaction.TRANSACTION_TYPES = TRANSACTION_TYPES;
  PointsTransaction.POINT_SOURCES = POINT_SOURCES;

  return PointsTransaction;
};