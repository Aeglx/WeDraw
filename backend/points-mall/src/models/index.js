const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging ? (msg) => logger.debug(msg) : false,
    pool: config.database.pool,
    timezone: config.database.timezone,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true
    }
  }
);

// 导入模型
const User = require('./User')(sequelize, Sequelize.DataTypes);
const PointsAccount = require('./PointsAccount')(sequelize, Sequelize.DataTypes);
const PointsTransaction = require('./PointsTransaction')(sequelize, Sequelize.DataTypes);
const Category = require('./Category')(sequelize, Sequelize.DataTypes);
const Product = require('./Product')(sequelize, Sequelize.DataTypes);
const ProductImage = require('./ProductImage')(sequelize, Sequelize.DataTypes);
const ProductSku = require('./ProductSku')(sequelize, Sequelize.DataTypes);
const Order = require('./Order')(sequelize, Sequelize.DataTypes);
const OrderItem = require('./OrderItem')(sequelize, Sequelize.DataTypes);
const Coupon = require('./Coupon')(sequelize, Sequelize.DataTypes);
const UserCoupon = require('./UserCoupon')(sequelize, Sequelize.DataTypes);
const Payment = require('./Payment')(sequelize, Sequelize.DataTypes);
const Address = require('./Address')(sequelize, Sequelize.DataTypes);
const Cart = require('./Cart')(sequelize, Sequelize.DataTypes);
const Favorite = require('./Favorite')(sequelize, Sequelize.DataTypes);
const Review = require('./Review')(sequelize, Sequelize.DataTypes);

// 定义模型关联关系
const defineAssociations = () => {
  // 用户与积分账户关系（一对一）
  User.hasOne(PointsAccount, {
    foreignKey: 'user_id',
    as: 'pointsAccount',
    onDelete: 'CASCADE'
  });
  PointsAccount.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  // 用户与积分交易记录关系（一对多）
  User.hasMany(PointsTransaction, {
    foreignKey: 'user_id',
    as: 'pointsTransactions',
    onDelete: 'CASCADE'
  });
  PointsTransaction.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  // 积分账户与积分交易记录关系（一对多）
  PointsAccount.hasMany(PointsTransaction, {
    foreignKey: 'points_account_id',
    as: 'transactions',
    onDelete: 'CASCADE'
  });
  PointsTransaction.belongsTo(PointsAccount, {
    foreignKey: 'points_account_id',
    as: 'pointsAccount'
  });
  
  // 分类与产品关系（一对多）
  Category.hasMany(Product, {
    foreignKey: 'category_id',
    as: 'products',
    onDelete: 'SET NULL'
  });
  Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category'
  });
  
  // 分类自关联（父子分类）
  Category.hasMany(Category, {
    foreignKey: 'parent_id',
    as: 'children',
    onDelete: 'CASCADE'
  });
  Category.belongsTo(Category, {
    foreignKey: 'parent_id',
    as: 'parent'
  });
  
  // 产品与产品图片关系（一对多）
  Product.hasMany(ProductImage, {
    foreignKey: 'product_id',
    as: 'images',
    onDelete: 'CASCADE'
  });
  ProductImage.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
  
  // 产品与产品SKU关系（一对多）
  Product.hasMany(ProductSku, {
    foreignKey: 'product_id',
    as: 'skus',
    onDelete: 'CASCADE'
  });
  ProductSku.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
  
  // 用户与订单关系（一对多）
  User.hasMany(Order, {
    foreignKey: 'user_id',
    as: 'orders',
    onDelete: 'CASCADE'
  });
  Order.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  // 订单与订单项关系（一对多）
  Order.hasMany(OrderItem, {
    foreignKey: 'order_id',
    as: 'items',
    onDelete: 'CASCADE'
  });
  OrderItem.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order'
  });
  
  // 产品SKU与订单项关系（一对多）
  ProductSku.hasMany(OrderItem, {
    foreignKey: 'product_sku_id',
    as: 'orderItems',
    onDelete: 'RESTRICT'
  });
  OrderItem.belongsTo(ProductSku, {
    foreignKey: 'product_sku_id',
    as: 'productSku'
  });
  
  // 用户与优惠券关系（多对多）
  User.belongsToMany(Coupon, {
    through: UserCoupon,
    foreignKey: 'user_id',
    otherKey: 'coupon_id',
    as: 'coupons'
  });
  Coupon.belongsToMany(User, {
    through: UserCoupon,
    foreignKey: 'coupon_id',
    otherKey: 'user_id',
    as: 'users'
  });
  
  // 用户优惠券直接关联
  User.hasMany(UserCoupon, {
    foreignKey: 'user_id',
    as: 'userCoupons',
    onDelete: 'CASCADE'
  });
  UserCoupon.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  Coupon.hasMany(UserCoupon, {
    foreignKey: 'coupon_id',
    as: 'userCoupons',
    onDelete: 'CASCADE'
  });
  UserCoupon.belongsTo(Coupon, {
    foreignKey: 'coupon_id',
    as: 'coupon'
  });
  
  // 订单与优惠券关系（多对一）
  Order.belongsTo(UserCoupon, {
    foreignKey: 'user_coupon_id',
    as: 'userCoupon'
  });
  UserCoupon.hasMany(Order, {
    foreignKey: 'user_coupon_id',
    as: 'orders'
  });
  
  // 订单与支付记录关系（一对多）
  Order.hasMany(Payment, {
    foreignKey: 'order_id',
    as: 'payments',
    onDelete: 'CASCADE'
  });
  Payment.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order'
  });
  
  // 用户与地址关系（一对多）
  User.hasMany(Address, {
    foreignKey: 'user_id',
    as: 'addresses',
    onDelete: 'CASCADE'
  });
  Address.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  // 订单与地址关系（多对一）
  Order.belongsTo(Address, {
    foreignKey: 'address_id',
    as: 'address'
  });
  Address.hasMany(Order, {
    foreignKey: 'address_id',
    as: 'orders'
  });
  
  // 用户与购物车关系（一对多）
  User.hasMany(Cart, {
    foreignKey: 'user_id',
    as: 'cartItems',
    onDelete: 'CASCADE'
  });
  Cart.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  // 产品SKU与购物车关系（一对多）
  ProductSku.hasMany(Cart, {
    foreignKey: 'product_sku_id',
    as: 'cartItems',
    onDelete: 'CASCADE'
  });
  Cart.belongsTo(ProductSku, {
    foreignKey: 'product_sku_id',
    as: 'productSku'
  });
  
  // 用户与收藏关系（一对多）
  User.hasMany(Favorite, {
    foreignKey: 'user_id',
    as: 'favorites',
    onDelete: 'CASCADE'
  });
  Favorite.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  // 产品与收藏关系（一对多）
  Product.hasMany(Favorite, {
    foreignKey: 'product_id',
    as: 'favorites',
    onDelete: 'CASCADE'
  });
  Favorite.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
  
  // 用户与评价关系（一对多）
  User.hasMany(Review, {
    foreignKey: 'user_id',
    as: 'reviews',
    onDelete: 'CASCADE'
  });
  Review.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  // 产品与评价关系（一对多）
  Product.hasMany(Review, {
    foreignKey: 'product_id',
    as: 'reviews',
    onDelete: 'CASCADE'
  });
  Review.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
  });
  
  // 订单与评价关系（一对一）
  Order.hasOne(Review, {
    foreignKey: 'order_id',
    as: 'review',
    onDelete: 'CASCADE'
  });
  Review.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order'
  });
};

// 执行关联定义
defineAssociations();

// 数据库连接测试
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

// 同步数据库
const sync = async (options = {}) => {
  try {
    await sequelize.sync(options);
    logger.info('Database synchronized successfully.');
    return true;
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    throw error;
  }
};

// 关闭数据库连接
const close = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed.');
    return true;
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

// 健康检查
const healthCheck = async () => {
  try {
    await sequelize.authenticate();
    const stats = await getConnectionStats();
    return {
      status: 'healthy',
      database: 'connected',
      stats
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    };
  }
};

// 获取连接统计信息
const getConnectionStats = async () => {
  try {
    const pool = sequelize.connectionManager.pool;
    return {
      total: pool.size,
      used: pool.used,
      waiting: pool.pending
    };
  } catch (error) {
    logger.warn('Failed to get connection stats:', error.message);
    return null;
  }
};

// 执行原始查询
const query = async (sql, options = {}) => {
  try {
    const result = await sequelize.query(sql, {
      type: Sequelize.QueryTypes.SELECT,
      ...options
    });
    return result;
  } catch (error) {
    logger.error('Query execution failed:', { sql, error: error.message });
    throw error;
  }
};

// 事务处理
const transaction = async (callback) => {
  const t = await sequelize.transaction();
  try {
    const result = await callback(t);
    await t.commit();
    return result;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  
  // 模型
  User,
  PointsAccount,
  PointsTransaction,
  Category,
  Product,
  ProductImage,
  ProductSku,
  Order,
  OrderItem,
  Coupon,
  UserCoupon,
  Payment,
  Address,
  Cart,
  Favorite,
  Review,
  
  // 工具函数
  testConnection,
  sync,
  close,
  healthCheck,
  getConnectionStats,
  query,
  transaction
};