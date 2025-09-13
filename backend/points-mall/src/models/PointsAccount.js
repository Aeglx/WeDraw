module.exports = (sequelize, DataTypes) => {
  const PointsAccount = sequelize.define('PointsAccount', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '积分账户ID'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: '用户ID'
    },
    total_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '总积分（累计获得）'
    },
    available_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '可用积分'
    },
    frozen_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '冻结积分'
    },
    used_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '已使用积分'
    },
    expired_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '已过期积分'
    },
    level: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '积分等级：1-青铜，2-白银，3-黄金，4-铂金，5-钻石'
    },
    level_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '当前等级积分'
    },
    next_level_points: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '下一等级所需积分'
    },
    last_earn_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后获得积分时间'
    },
    last_use_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后使用积分时间'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '账户状态：0-冻结，1-正常'
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '版本号（乐观锁）'
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
    tableName: 'points_accounts',
    comment: '积分账户表',
    indexes: [
      {
        name: 'idx_user_id',
        unique: true,
        fields: ['user_id']
      },
      {
        name: 'idx_level',
        fields: ['level']
      },
      {
        name: 'idx_status',
        fields: ['status']
      },
      {
        name: 'idx_available_points',
        fields: ['available_points']
      }
    ],
    hooks: {
      beforeUpdate: (account) => {
        account.updated_at = new Date();
        account.version += 1;
      },
      afterUpdate: (account) => {
        // 更新积分等级
        account.updateLevel();
      }
    }
  });

  // 积分等级配置
  const LEVEL_CONFIG = {
    1: { name: '青铜', minPoints: 0, maxPoints: 999, color: '#CD7F32' },
    2: { name: '白银', minPoints: 1000, maxPoints: 4999, color: '#C0C0C0' },
    3: { name: '黄金', minPoints: 5000, maxPoints: 19999, color: '#FFD700' },
    4: { name: '铂金', minPoints: 20000, maxPoints: 49999, color: '#E5E4E2' },
    5: { name: '钻石', minPoints: 50000, maxPoints: null, color: '#B9F2FF' }
  };

  // 实例方法
  PointsAccount.prototype.isActive = function() {
    return this.status === 1;
  };

  PointsAccount.prototype.hasEnoughPoints = function(points) {
    return this.available_points >= points;
  };

  PointsAccount.prototype.updateLevel = function() {
    const totalPoints = this.total_points;
    let newLevel = 1;
    
    for (const [level, config] of Object.entries(LEVEL_CONFIG)) {
      if (totalPoints >= config.minPoints && 
          (config.maxPoints === null || totalPoints <= config.maxPoints)) {
        newLevel = parseInt(level);
        break;
      }
    }
    
    if (newLevel !== this.level) {
      this.level = newLevel;
      this.level_points = totalPoints;
      
      // 计算下一等级所需积分
      const nextLevelConfig = LEVEL_CONFIG[newLevel + 1];
      this.next_level_points = nextLevelConfig ? nextLevelConfig.minPoints : null;
    }
  };

  PointsAccount.prototype.getLevelInfo = function() {
    const config = LEVEL_CONFIG[this.level];
    return {
      level: this.level,
      name: config.name,
      color: config.color,
      currentPoints: this.total_points,
      minPoints: config.minPoints,
      maxPoints: config.maxPoints,
      nextLevelPoints: this.next_level_points,
      progress: this.next_level_points ? 
        ((this.total_points - config.minPoints) / (this.next_level_points - config.minPoints) * 100).toFixed(2) : 100
    };
  };

  PointsAccount.prototype.addPoints = async function(points, transaction = null) {
    if (points <= 0) {
      throw new Error('积分数量必须大于0');
    }
    
    if (!this.isActive()) {
      throw new Error('积分账户已冻结');
    }

    const options = transaction ? { transaction } : {};
    
    await this.increment({
      total_points: points,
      available_points: points
    }, options);
    
    this.last_earn_time = new Date();
    await this.save(options);
    
    return this.reload();
  };

  PointsAccount.prototype.usePoints = async function(points, transaction = null) {
    if (points <= 0) {
      throw new Error('积分数量必须大于0');
    }
    
    if (!this.isActive()) {
      throw new Error('积分账户已冻结');
    }
    
    if (!this.hasEnoughPoints(points)) {
      throw new Error('积分余额不足');
    }

    const options = transaction ? { transaction } : {};
    
    await this.decrement({
      available_points: points
    }, options);
    
    await this.increment({
      used_points: points
    }, options);
    
    this.last_use_time = new Date();
    await this.save(options);
    
    return this.reload();
  };

  PointsAccount.prototype.freezePoints = async function(points, transaction = null) {
    if (points <= 0) {
      throw new Error('积分数量必须大于0');
    }
    
    if (!this.hasEnoughPoints(points)) {
      throw new Error('可用积分不足');
    }

    const options = transaction ? { transaction } : {};
    
    await this.decrement({
      available_points: points
    }, options);
    
    await this.increment({
      frozen_points: points
    }, options);
    
    await this.save(options);
    
    return this.reload();
  };

  PointsAccount.prototype.unfreezePoints = async function(points, transaction = null) {
    if (points <= 0) {
      throw new Error('积分数量必须大于0');
    }
    
    if (this.frozen_points < points) {
      throw new Error('冻结积分不足');
    }

    const options = transaction ? { transaction } : {};
    
    await this.decrement({
      frozen_points: points
    }, options);
    
    await this.increment({
      available_points: points
    }, options);
    
    await this.save(options);
    
    return this.reload();
  };

  PointsAccount.prototype.expirePoints = async function(points, transaction = null) {
    if (points <= 0) {
      throw new Error('积分数量必须大于0');
    }
    
    if (!this.hasEnoughPoints(points)) {
      throw new Error('可用积分不足');
    }

    const options = transaction ? { transaction } : {};
    
    await this.decrement({
      available_points: points
    }, options);
    
    await this.increment({
      expired_points: points
    }, options);
    
    await this.save(options);
    
    return this.reload();
  };

  // 类方法
  PointsAccount.findByUserId = function(userId) {
    return this.findOne({ where: { user_id: userId } });
  };

  PointsAccount.createForUser = async function(userId, transaction = null) {
    const options = transaction ? { transaction } : {};
    
    return this.create({
      user_id: userId,
      total_points: 0,
      available_points: 0,
      frozen_points: 0,
      used_points: 0,
      expired_points: 0,
      level: 1,
      level_points: 0,
      next_level_points: LEVEL_CONFIG[2].minPoints,
      status: 1
    }, options);
  };

  PointsAccount.getTopUsers = function(limit = 10) {
    return this.findAll({
      where: { status: 1 },
      order: [['total_points', 'DESC']],
      limit,
      include: [{
        association: 'user',
        attributes: ['id', 'nickname', 'avatar']
      }]
    });
  };

  PointsAccount.getStatistics = async function() {
    const total = await this.count();
    const active = await this.count({ where: { status: 1 } });
    
    const pointsStats = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_points')), 'totalPoints'],
        [sequelize.fn('SUM', sequelize.col('available_points')), 'availablePoints'],
        [sequelize.fn('SUM', sequelize.col('used_points')), 'usedPoints'],
        [sequelize.fn('SUM', sequelize.col('expired_points')), 'expiredPoints']
      ],
      where: { status: 1 },
      raw: true
    });
    
    const levelStats = await this.findAll({
      attributes: [
        'level',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { status: 1 },
      group: ['level'],
      raw: true
    });

    return {
      accounts: {
        total,
        active,
        inactive: total - active
      },
      points: {
        total: parseInt(pointsStats?.totalPoints || 0),
        available: parseInt(pointsStats?.availablePoints || 0),
        used: parseInt(pointsStats?.usedPoints || 0),
        expired: parseInt(pointsStats?.expiredPoints || 0)
      },
      levels: levelStats.reduce((acc, item) => {
        const config = LEVEL_CONFIG[item.level];
        acc[config.name] = parseInt(item.count);
        return acc;
      }, {})
    };
  };

  PointsAccount.LEVEL_CONFIG = LEVEL_CONFIG;

  return PointsAccount;
};