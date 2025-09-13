'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      
      // 基本信息
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
      },
      
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      
      // 个人信息
      nickname: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      
      avatar: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      gender: {
        type: Sequelize.ENUM('male', 'female', 'unknown'),
        defaultValue: 'unknown'
      },
      
      birthday: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // 状态信息
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended', 'deleted'),
        defaultValue: 'active'
      },
      
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      // 登录信息
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      last_login_ip: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      
      login_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      // 安全信息
      password_changed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      failed_login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      locked_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // 第三方登录
      wechat_openid: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      
      wechat_unionid: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      
      qq_openid: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      
      // 偏好设置
      preferences: {
        type: Sequelize.JSON,
        defaultValue: '{}'
      },
      
      // 统计信息
      total_orders: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      total_spent: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      
      // 会员信息
      member_level: {
        type: Sequelize.ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond'),
        defaultValue: 'bronze'
      },
      
      member_points: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      member_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // 推荐信息
      referrer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      referral_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
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
    await queryInterface.addIndex('users', ['username'], { unique: true });
    await queryInterface.addIndex('users', ['email'], { 
      unique: true,
      where: { email: { [Sequelize.Op.ne]: null } }
    });
    await queryInterface.addIndex('users', ['phone'], { 
      unique: true,
      where: { phone: { [Sequelize.Op.ne]: null } }
    });
    await queryInterface.addIndex('users', ['status']);
    await queryInterface.addIndex('users', ['member_level']);
    await queryInterface.addIndex('users', ['created_at']);
    await queryInterface.addIndex('users', ['last_login_at']);
    await queryInterface.addIndex('users', ['wechat_openid'], { 
      unique: true,
      where: { wechat_openid: { [Sequelize.Op.ne]: null } }
    });
    await queryInterface.addIndex('users', ['referral_code'], { 
      unique: true,
      where: { referral_code: { [Sequelize.Op.ne]: null } }
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};