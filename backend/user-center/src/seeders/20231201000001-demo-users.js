'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    await queryInterface.bulkInsert('Users', [
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@wedraw.com',
        phone: '13800138000',
        password: hashedPassword,
        nickname: '系统管理员',
        bio: 'WeDraw系统管理员账户',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        preferences: JSON.stringify({
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: true
          }
        }),
        metadata: JSON.stringify({
          source: 'seed',
          createdBy: 'system'
        }),
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        username: 'demo_user',
        email: 'demo@wedraw.com',
        phone: '13800138001',
        password: await bcrypt.hash('Demo123!', 12),
        nickname: '演示用户',
        bio: '这是一个演示用户账户',
        role: 'user',
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
        preferences: JSON.stringify({
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          theme: 'light',
          notifications: {
            email: true,
            push: false,
            sms: false
          }
        }),
        metadata: JSON.stringify({
          source: 'seed',
          createdBy: 'system'
        }),
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        username: 'moderator',
        email: 'moderator@wedraw.com',
        phone: '13800138002',
        password: await bcrypt.hash('Mod123!', 12),
        nickname: '内容审核员',
        bio: 'WeDraw内容审核员',
        role: 'moderator',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        preferences: JSON.stringify({
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          theme: 'dark',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }),
        metadata: JSON.stringify({
          source: 'seed',
          createdBy: 'system'
        }),
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        username: 'test_user_1',
        email: 'test1@wedraw.com',
        phone: '13800138003',
        password: await bcrypt.hash('Test123!', 12),
        nickname: '测试用户1',
        bio: '用于测试的用户账户',
        role: 'user',
        status: 'active',
        emailVerified: false,
        phoneVerified: false,
        preferences: JSON.stringify({
          language: 'en-US',
          timezone: 'America/New_York',
          theme: 'light',
          notifications: {
            email: false,
            push: false,
            sms: false
          }
        }),
        metadata: JSON.stringify({
          source: 'seed',
          createdBy: 'system',
          testAccount: true
        }),
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        username: 'test_user_2',
        email: 'test2@wedraw.com',
        phone: '13800138004',
        password: await bcrypt.hash('Test123!', 12),
        nickname: '测试用户2',
        bio: '另一个测试用户账户',
        role: 'user',
        status: 'inactive',
        emailVerified: true,
        phoneVerified: false,
        preferences: JSON.stringify({
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          theme: 'dark',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }),
        metadata: JSON.stringify({
          source: 'seed',
          createdBy: 'system',
          testAccount: true
        }),
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: {
        [Sequelize.Op.in]: [
          'admin@wedraw.com',
          'demo@wedraw.com',
          'moderator@wedraw.com',
          'test1@wedraw.com',
          'test2@wedraw.com'
        ]
      }
    }, {});
  }
};