'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
      // 订单编号
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
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
      
      // 订单状态
      status: {
        type: Sequelize.ENUM(
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'delivered',
          'completed',
          'cancelled',
          'refunded'
        ),
        defaultValue: 'pending'
      },
      
      // 价格信息
      total_points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      total_cash: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      shipping_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      final_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      // 收货信息
      shipping_address: {
        type: Sequelize.JSON,
        allowNull: true
      },
      
      shipping_method: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      
      tracking_number: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      
      // 优惠券信息
      coupon_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'coupons',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      coupon_code: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      
      coupon_discount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      // 备注信息
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // 时间信息
      confirmed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      shipped_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // 取消原因
      cancel_reason: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      
      cancelled_by: {
        type: Sequelize.ENUM('user', 'admin', 'system'),
        allowNull: true
      },
      
      // 退款信息
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      refund_points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      refunded_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('orders', ['order_number'], { unique: true });
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['coupon_id']);
    await queryInterface.addIndex('orders', ['created_at']);
    await queryInterface.addIndex('orders', ['confirmed_at']);
    await queryInterface.addIndex('orders', ['shipped_at']);
    await queryInterface.addIndex('orders', ['delivered_at']);
    await queryInterface.addIndex('orders', ['completed_at']);
    await queryInterface.addIndex('orders', ['cancelled_at']);
    await queryInterface.addIndex('orders', ['user_id', 'status']);
    await queryInterface.addIndex('orders', ['user_id', 'created_at']);
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('orders');
  }
};