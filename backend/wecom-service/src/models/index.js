const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

// 创建数据库连接
const sequelize = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: config.database.pool.max,
      min: config.database.pool.min,
      acquire: config.database.pool.acquire,
      idle: config.database.pool.idle
    },
    timezone: '+08:00',
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

// 导入模型
const User = require('./User')(sequelize, DataTypes);
const Department = require('./Department')(sequelize, DataTypes);

// 定义模型关联
// 用户属于部门
User.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'departmentInfo'
});

// 部门有多个用户
Department.hasMany(User, {
  foreignKey: 'department_id',
  as: 'users'
});

// 部门自关联（父子关系）
Department.belongsTo(Department, {
  foreignKey: 'parent_id',
  as: 'parent'
});

Department.hasMany(Department, {
  foreignKey: 'parent_id',
  as: 'children'
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
};

// 同步数据库模型
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    logger.info('Database synchronized successfully');
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  User,
  Department,
  testConnection,
  syncDatabase
};