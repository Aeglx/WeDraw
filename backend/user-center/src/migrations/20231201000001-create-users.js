'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
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
      nickname: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      avatar: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      birthday: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other'),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('user', 'admin', 'moderator'),
        allowNull: false,
        defaultValue: 'user'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended', 'deleted'),
        allowNull: false,
        defaultValue: 'active'
      },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      phoneVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      twoFactorEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      twoFactorSecret: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastLoginIp: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      loginAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lockedUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      passwordChangedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // 创建索引
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['phone']);
    await queryInterface.addIndex('Users', ['username']);
    await queryInterface.addIndex('Users', ['status']);
    await queryInterface.addIndex('Users', ['role']);
    await queryInterface.addIndex('Users', ['emailVerified']);
    await queryInterface.addIndex('Users', ['phoneVerified']);
    await queryInterface.addIndex('Users', ['lastLoginAt']);
    await queryInterface.addIndex('Users', ['createdAt']);
    await queryInterface.addIndex('Users', ['deletedAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};