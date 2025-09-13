// Jest测试环境设置文件
const { Sequelize } = require('sequelize');
const config = require('../src/config');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_NAME = 'wedraw_miniprogram_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// 全局测试配置
jest.setTimeout(30000);

// Mock外部依赖
jest.mock('axios');
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    hgetall: jest.fn(),
    lpush: jest.fn(),
    rpop: jest.fn(),
    llen: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

// Mock Winston logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn(),
  log: jest.fn(),
  business: jest.fn(),
  structured: jest.fn(),
  conditional: jest.fn(),
  timer: jest.fn(),
  batch: jest.fn(),
  getStats: jest.fn(() => ({
    total: 0,
    byLevel: {}
  }))
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 OK'
    })
  }))
}));

// Mock Bull队列
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(),
    clean: jest.fn().mockResolvedValue(),
    getJobs: jest.fn().mockResolvedValue([]),
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0
    })
  }));
});

// Mock文件上传
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test image data'),
        filename: 'test-file.jpg',
        path: '/tmp/test-file.jpg'
      };
      next();
    },
    array: () => (req, res, next) => {
      req.files = [
        {
          fieldname: 'files',
          originalname: 'test1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from('test image data 1'),
          filename: 'test-file1.jpg',
          path: '/tmp/test-file1.jpg'
        }
      ];
      next();
    }
  });
  
  multer.memoryStorage = jest.fn();
  multer.diskStorage = jest.fn();
  
  return multer;
});

// Mock Sharp图片处理
jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed image')),
    toFile: jest.fn().mockResolvedValue({ size: 1024 }),
    metadata: jest.fn().mockResolvedValue({
      width: 800,
      height: 600,
      format: 'jpeg'
    })
  }));
});

// Mock QR码生成
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test-qr-code'),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('qr code data')),
  toString: jest.fn().mockResolvedValue('ASCII QR CODE')
}));

// Mock微信API
const mockWeChatAPI = {
  getAccessToken: jest.fn().mockResolvedValue('mock_access_token'),
  sendMessage: jest.fn().mockResolvedValue({ errcode: 0, errmsg: 'ok' }),
  sendTemplateMessage: jest.fn().mockResolvedValue({ errcode: 0, errmsg: 'ok', msgid: 'test_msg_id' }),
  getUserInfo: jest.fn().mockResolvedValue({
    openid: 'test_openid',
    nickname: 'Test User',
    avatar: 'https://example.com/avatar.jpg'
  }),
  code2Session: jest.fn().mockResolvedValue({
    openid: 'test_openid',
    session_key: 'test_session_key',
    unionid: 'test_unionid'
  })
};

// 全局变量
global.mockWeChatAPI = mockWeChatAPI;

// 数据库连接管理
let testDatabase;

// 测试前的全局设置
beforeAll(async () => {
  // 创建测试数据库连接
  testDatabase = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
  
  // 设置全局测试数据库
  global.testDatabase = testDatabase;
});

// 每个测试前的设置
beforeEach(async () => {
  // 清理所有mock
  jest.clearAllMocks();
  
  // 重置模块缓存
  jest.resetModules();
});

// 每个测试后的清理
afterEach(async () => {
  // 清理测试数据
  if (testDatabase) {
    try {
      await testDatabase.drop();
    } catch (error) {
      // 忽略清理错误
    }
  }
});

// 测试后的全局清理
afterAll(async () => {
  // 关闭数据库连接
  if (testDatabase) {
    try {
      await testDatabase.close();
    } catch (error) {
      // 忽略关闭错误
    }
  }
});

// 测试工具函数
global.testUtils = {
  // 创建测试用户
  createTestUser: (overrides = {}) => ({
    id: 1,
    openid: 'test_openid',
    unionid: 'test_unionid',
    nickname: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    gender: 1,
    city: 'Beijing',
    province: 'Beijing',
    country: 'China',
    status: 'active',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  // 创建测试消息
  createTestMessage: (overrides = {}) => ({
    id: 1,
    fromUserId: 1,
    toUserId: 2,
    type: 'text',
    content: 'Test message',
    status: 'sent',
    sentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  // 创建测试会话
  createTestSession: (overrides = {}) => ({
    id: 1,
    userId: 1,
    sessionId: 'test_session_id',
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),
  
  // 创建测试JWT令牌
  createTestToken: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({
      userId: 1,
      sessionId: 'test_session_id',
      ...payload
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
  },
  
  // 等待异步操作
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 生成随机字符串
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // 生成随机数字
  randomNumber: (min = 1, max = 1000) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

// 自定义匹配器
expect.extend({
  // 检查是否为有效的JWT令牌
  toBeValidJWT(received) {
    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(received, process.env.JWT_SECRET);
      return {
        message: () => `expected ${received} not to be a valid JWT token`,
        pass: true
      };
    } catch (error) {
      return {
        message: () => `expected ${received} to be a valid JWT token, but got error: ${error.message}`,
        pass: false
      };
    }
  },
  
  // 检查是否为有效的日期
  toBeValidDate(received) {
    const date = new Date(received);
    const isValid = date instanceof Date && !isNaN(date);
    return {
      message: () => `expected ${received} ${isValid ? 'not ' : ''}to be a valid date`,
      pass: isValid
    };
  },
  
  // 检查是否为有效的OpenID
  toBeValidOpenId(received) {
    const isValid = typeof received === 'string' && received.length >= 20 && received.length <= 32;
    return {
      message: () => `expected ${received} ${isValid ? 'not ' : ''}to be a valid OpenID`,
      pass: isValid
    };
  }
});

// 控制台输出抑制（可选）
if (process.env.SUPPRESS_CONSOLE === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});