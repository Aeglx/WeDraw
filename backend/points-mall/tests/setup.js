const { sequelize } = require('../src/config/database');
const redis = require('../src/config/redis');

// 测试环境变量设置
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'points_mall_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REDIS_DB = '1';

// 全局测试钩子
beforeAll(async () => {
  // 等待数据库连接
  try {
    await sequelize.authenticate();
    console.log('Test database connected successfully.');
  } catch (error) {
    console.error('Unable to connect to test database:', error);
    throw error;
  }

  // 同步数据库表结构
  await sequelize.sync({ force: true });
  console.log('Test database synchronized.');
});

beforeEach(async () => {
  // 清理Redis缓存
  if (redis.status === 'ready') {
    await redis.flushdb();
  }
});

afterEach(async () => {
  // 清理数据库数据（保留表结构）
  const models = Object.values(sequelize.models);
  for (const model of models) {
    await model.destroy({ where: {}, force: true });
  }
});

afterAll(async () => {
  // 关闭数据库连接
  await sequelize.close();
  console.log('Test database connection closed.');

  // 关闭Redis连接
  if (redis.status === 'ready') {
    redis.disconnect();
    console.log('Test Redis connection closed.');
  }
});

// 全局测试工具函数
global.createTestUser = async () => {
  const { User } = require('../src/models');
  const bcrypt = require('bcrypt');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  return await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: hashedPassword,
    phone: '13800138000',
    status: 'active'
  });
};

global.createTestProduct = async () => {
  const { Product, Category } = require('../src/models');
  
  const category = await Category.create({
    name: '测试分类',
    description: '测试分类描述',
    status: 'active'
  });
  
  return await Product.create({
    name: '测试商品',
    description: '测试商品描述',
    price: 100,
    points_price: 1000,
    stock: 50,
    category_id: category.id,
    status: 'active'
  });
};

global.generateTestToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});