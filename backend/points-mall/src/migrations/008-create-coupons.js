'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('coupons', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
      // 优惠券基本信息
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // 优惠券类型
      type: {
        type: Sequelize.ENUM(
          'percentage',  // 百分比折扣
          'fixed',       // 固定金额
          'points',      // 积分抵扣
          'shipping',    // 免运费
          'gift'         // 赠品
        ),
        allowNull: false
      },
      
      // 折扣值
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      
      // 最大折扣金额（百分比折扣时使用）
      max_discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      
      // 使用条件
      min_order_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      min_points_amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      // 适用范围
      applicable_products: {
        type: Sequelize.JSON,
        defaultValue: '[]'  // 空数组表示适用于所有商品
      },
      
      applicable_categories: {
        type: Sequelize.JSON,
        defaultValue: '[]'  // 空数组表示适用于所有分类
      },
      
      excluded_products: {
        type: Sequelize.JSON,
        defaultValue: '[]'  // 排除的商品
      },
      
      excluded_categories: {
        type: Sequelize.JSON,
        defaultValue: '[]'  // 排除的分类
      },
      
      // 用户限制
      user_type: {
        type: Sequelize.ENUM('all', 'new', 'vip', 'specific'),
        defaultValue: 'all'
      },
      
      applicable_users: {
        type: Sequelize.JSON,
        defaultValue: '[]'  // 特定用户ID列表
      },
      
      // 使用限制
      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: true  // null表示无限制
      },
      
      usage_limit_per_user: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      
      used_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      // 时间限制
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      
      // 状态
      status: {
        type: Sequelize.ENUM('draft', 'active', 'paused', 'expired', 'disabled'),
        defaultValue: 'draft'
      },
      
      // 优先级
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      // 是否可与其他优惠券叠加
      stackable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      // 创建者
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      // 备注
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // 扩展信息
      metadata: {
        type: Sequelize.JSON,
        defaultValue: '{}'
      },
      
      // 时间戳
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
    
    // 创建索引
    await queryInterface.addIndex('coupons', ['code'], { unique: true });
    await queryInterface.addIndex('coupons', ['type']);
    await queryInterface.addIndex('coupons', ['status']);
    await queryInterface.addIndex('coupons', ['start_date']);
    await queryInterface.addIndex('coupons', ['end_date']);
    await queryInterface.addIndex('coupons', ['created_by']);
    await queryInterface.addIndex('coupons', ['priority']);
    await queryInterface.addIndex('coupons', ['status', 'start_date', 'end_date']);
    await queryInterface.addIndex('coupons', ['type', 'status']);
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('coupons');
  }
};