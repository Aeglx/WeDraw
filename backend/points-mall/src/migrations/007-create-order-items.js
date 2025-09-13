'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
      // 订单信息
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // 商品信息
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // 商品快照信息（防止商品信息变更影响历史订单）
      product_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      
      product_image: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      product_sku: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      
      // 价格信息
      unit_points_price: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      
      unit_cash_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      original_unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      
      // 数量信息
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      
      // 总价信息
      total_points: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      
      total_cash: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      // 折扣信息
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      discount_type: {
        type: Sequelize.ENUM('none', 'percentage', 'fixed', 'member'),
        defaultValue: 'none'
      },
      
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      // 商品属性（规格、颜色等）
      product_attributes: {
        type: Sequelize.JSON,
        defaultValue: '{}'
      },
      
      // 状态信息
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
      
      // 退款信息
      refund_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      refund_points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      refund_cash: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      
      refund_reason: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      
      refunded_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // 备注信息
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
    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['product_id']);
    await queryInterface.addIndex('order_items', ['status']);
    await queryInterface.addIndex('order_items', ['created_at']);
    await queryInterface.addIndex('order_items', ['refunded_at']);
    await queryInterface.addIndex('order_items', ['order_id', 'product_id']);
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('order_items');
  }
};