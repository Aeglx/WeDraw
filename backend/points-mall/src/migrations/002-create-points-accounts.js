'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('points_accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // 积分余额
      balance: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      // 冻结积分
      frozen_balance: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      // 统计信息
      total_earned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      total_spent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      total_expired: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      // 等级信息
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      
      level_progress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      
      // 状态信息
      status: {
        type: Sequelize.ENUM('active', 'frozen', 'closed'),
        defaultValue: 'active'
      },
      
      // 最后活动时间
      last_earned_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      last_spent_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('points_accounts', ['user_id'], { unique: true });
    await queryInterface.addIndex('points_accounts', ['status']);
    await queryInterface.addIndex('points_accounts', ['level']);
    await queryInterface.addIndex('points_accounts', ['balance']);
    await queryInterface.addIndex('points_accounts', ['created_at']);
    await queryInterface.addIndex('points_accounts', ['last_earned_at']);
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('points_accounts');
  }
};