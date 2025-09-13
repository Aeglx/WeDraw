'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('points_transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
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
      
      // 交易信息
      type: {
        type: Sequelize.ENUM('earn', 'spend', 'expire', 'freeze', 'unfreeze', 'refund', 'transfer_in', 'transfer_out'),
        allowNull: false
      },
      
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      
      balance_before: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      
      balance_after: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      
      // 来源信息
      source: {
        type: Sequelize.ENUM(
          'register',
          'daily_checkin',
          'task_complete',
          'order_complete',
          'referral',
          'level_up',
          'admin_grant',
          'purchase',
          'exchange',
          'expire',
          'refund',
          'transfer',
          'system_adjust',
          'promotion',
          'compensation'
        ),
        allowNull: false
      },
      
      description: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      
      // 关联信息
      reference_type: {
        type: Sequelize.ENUM(
          'order',
          'product',
          'task',
          'user',
          'coupon',
          'activity',
          'level_up',
          'checkin',
          'admin',
          'system'
        ),
        allowNull: true
      },
      
      reference_id: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      
      // 状态信息
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled', 'expired'),
        defaultValue: 'completed'
      },
      
      // 过期信息
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      expired_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // 操作信息
      operator_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      operator_type: {
        type: Sequelize.ENUM('user', 'admin', 'system'),
        defaultValue: 'user'
      },
      
      // IP和设备信息
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      
      user_agent: {
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
    await queryInterface.addIndex('points_transactions', ['user_id']);
    await queryInterface.addIndex('points_transactions', ['type']);
    await queryInterface.addIndex('points_transactions', ['source']);
    await queryInterface.addIndex('points_transactions', ['status']);
    await queryInterface.addIndex('points_transactions', ['reference_type', 'reference_id']);
    await queryInterface.addIndex('points_transactions', ['created_at']);
    await queryInterface.addIndex('points_transactions', ['expires_at']);
    await queryInterface.addIndex('points_transactions', ['user_id', 'created_at']);
    await queryInterface.addIndex('points_transactions', ['user_id', 'type']);
    await queryInterface.addIndex('points_transactions', ['user_id', 'source']);
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('points_transactions');
  }
};