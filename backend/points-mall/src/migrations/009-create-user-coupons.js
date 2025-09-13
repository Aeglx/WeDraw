'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_coupons', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
      // 用户信息
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // 优惠券信息
      coupon_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'coupons',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // 获取方式
      source: {
        type: Sequelize.ENUM(
          'manual',      // 手动发放
          'register',    // 注册赠送
          'purchase',    // 购买赠送
          'activity',    // 活动获得
          'referral',    // 推荐获得
          'birthday',    // 生日礼品
          'compensation' // 补偿发放
        ),
        allowNull: false
      },
      
      // 状态
      status: {
        type: Sequelize.ENUM('unused', 'used', 'expired'),
        defaultValue: 'unused'
      },
      
      // 使用信息
      used_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      // 过期时间（可以覆盖优惠券的默认过期时间）
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // 发放者
      issued_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      // 发放原因
      issue_reason: {
        type: Sequelize.STRING(500),
        allowNull: true
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
      }
    });
    
    // 创建索引
    await queryInterface.addIndex('user_coupons', ['user_id']);
    await queryInterface.addIndex('user_coupons', ['coupon_id']);
    await queryInterface.addIndex('user_coupons', ['status']);
    await queryInterface.addIndex('user_coupons', ['source']);
    await queryInterface.addIndex('user_coupons', ['used_at']);
    await queryInterface.addIndex('user_coupons', ['expires_at']);
    await queryInterface.addIndex('user_coupons', ['order_id']);
    await queryInterface.addIndex('user_coupons', ['issued_by']);
    await queryInterface.addIndex('user_coupons', ['user_id', 'status']);
    await queryInterface.addIndex('user_coupons', ['user_id', 'coupon_id']);
    await queryInterface.addIndex('user_coupons', ['coupon_id', 'status']);
    
    // 创建唯一约束（防止同一用户重复获得同一优惠券）
    await queryInterface.addConstraint('user_coupons', {
      fields: ['user_id', 'coupon_id'],
      type: 'unique',
      name: 'unique_user_coupon'
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_coupons');
  }
};