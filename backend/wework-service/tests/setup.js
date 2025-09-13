/**
 * 测试环境设置
 */

const { sequelize } = require('../src/models');
const { redisClient } = require('../src/utils');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'wework_service_test';
process.env.REDIS_DB = '1';

/**
 * 测试前的全局设置
 */
beforeAll(async () => {
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('测试数据库连接成功');
    
    // 同步数据库表结构
    await sequelize.sync({ force: true });
    console.log('测试数据库表结构同步完成');
    
    // 连接Redis
    await redisClient.connect();
    console.log('测试Redis连接成功');
    
  } catch (error) {
    console.error('测试环境初始化失败:', error);
    process.exit(1);
  }
});

/**
 * 每个测试前的设置
 */
beforeEach(async () => {
  // 清空所有表数据
  await sequelize.truncate({ cascade: true, restartIdentity: true });
  
  // 清空Redis缓存
  const client = await redisClient.getClient();
  await client.flushdb();
});

/**
 * 测试后的全局清理
 */
afterAll(async () => {
  try {
    // 关闭数据库连接
    await sequelize.close();
    console.log('测试数据库连接已关闭');
    
    // 关闭Redis连接
    await redisClient.disconnect();
    console.log('测试Redis连接已关闭');
    
  } catch (error) {
    console.error('测试环境清理失败:', error);
  }
});

/**
 * 测试工具函数
 */
global.testUtils = {
  /**
   * 创建测试用户数据
   */
  createTestContact: (overrides = {}) => {
    return {
      userId: 'test_user_001',
      name: '测试用户',
      mobile: '13800138000',
      email: 'test@example.com',
      department: [1],
      position: '测试工程师',
      gender: '1',
      avatar: 'https://example.com/avatar.jpg',
      status: 1,
      isLeader: false,
      ...overrides
    };
  },
  
  /**
   * 创建测试部门数据
   */
  createTestDepartment: (overrides = {}) => {
    return {
      departmentId: 1,
      name: '测试部门',
      parentId: 0,
      order: 1,
      ...overrides
    };
  },
  
  /**
   * 创建测试群组数据
   */
  createTestGroup: (overrides = {}) => {
    return {
      chatId: 'test_chat_001',
      name: '测试群组',
      type: 'group',
      owner: 'test_user_001',
      ...overrides
    };
  },
  
  /**
   * 创建测试机器人数据
   */
  createTestBot: (overrides = {}) => {
    return {
      name: '测试机器人',
      description: '这是一个测试机器人',
      webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=test',
      webhookKey: 'test_webhook_key',
      isActive: true,
      ...overrides
    };
  },
  
  /**
   * 创建测试消息数据
   */
  createTestMessage: (overrides = {}) => {
    return {
      messageId: 'test_msg_001',
      chatId: 'test_chat_001',
      senderId: 'test_user_001',
      messageType: 'text',
      content: '这是一条测试消息',
      timestamp: new Date(),
      ...overrides
    };
  },
  
  /**
   * 等待异步操作
   */
  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * 生成随机字符串
   */
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  /**
   * 生成随机数字
   */
  randomNumber: (min = 1, max = 1000) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

/**
 * Jest配置
 */
jest.setTimeout(30000); // 30秒超时

/**
 * 模拟企业微信API响应
 */
global.mockWeworkApi = {
  /**
   * 模拟获取访问令牌
   */
  mockGetAccessToken: () => {
    return {
      errcode: 0,
      errmsg: 'ok',
      access_token: 'mock_access_token_123456',
      expires_in: 7200
    };
  },
  
  /**
   * 模拟获取部门列表
   */
  mockGetDepartments: () => {
    return {
      errcode: 0,
      errmsg: 'ok',
      department: [
        {
          id: 1,
          name: '总公司',
          parentid: 0,
          order: 1
        },
        {
          id: 2,
          name: '技术部',
          parentid: 1,
          order: 1
        }
      ]
    };
  },
  
  /**
   * 模拟获取部门成员
   */
  mockGetDepartmentUsers: () => {
    return {
      errcode: 0,
      errmsg: 'ok',
      userlist: [
        {
          userid: 'zhangsan',
          name: '张三',
          mobile: '13800138000',
          department: [1, 2],
          position: '后端工程师',
          gender: '1',
          email: 'zhangsan@example.com',
          status: 1,
          isleader: 0,
          avatar: 'https://example.com/avatar1.jpg'
        }
      ]
    };
  },
  
  /**
   * 模拟发送消息
   */
  mockSendMessage: () => {
    return {
      errcode: 0,
      errmsg: 'ok',
      msgid: 'mock_msg_id_123456'
    };
  }
};

/**
 * HTTP请求模拟
 */
const request = require('supertest');
const app = require('../server');

global.request = request(app);

/**
 * 认证令牌生成
 */
const jwt = require('jsonwebtoken');

global.generateAuthToken = (payload = {}) => {
  const defaultPayload = {
    userId: 'test_user_001',
    name: '测试用户',
    role: 'user'
  };
  
  return jwt.sign(
    { ...defaultPayload, ...payload },
    process.env.JWT_SECRET || 'wework-service-secret',
    { expiresIn: '1h' }
  );
};

/**
 * API密钥生成
 */
global.generateApiKey = () => {
  return 'test_api_key_123456';
};

/**
 * 数据库事务测试辅助
 */
global.withTransaction = async (callback) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * 错误断言辅助
 */
global.expectError = (response, code, message) => {
  expect(response.body.success).toBe(false);
  expect(response.body.code).toBe(code);
  if (message) {
    expect(response.body.message).toContain(message);
  }
};

/**
 * 成功响应断言辅助
 */
global.expectSuccess = (response, data) => {
  expect(response.body.success).toBe(true);
  expect(response.body.code).toBe(200);
  if (data) {
    expect(response.body.data).toMatchObject(data);
  }
};

console.log('测试环境设置完成');