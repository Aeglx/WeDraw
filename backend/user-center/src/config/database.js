const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 数据库配置
 */
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'wedraw_user_center',
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  dialect: process.env.DB_DIALECT || 'mysql',
  timezone: process.env.DB_TIMEZONE || '+08:00',
  
  // 连接池配置
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 5,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000
  },
  
  // 日志配置
  logging: process.env.DB_LOGGING === 'true' ? 
    (sql, timing) => logger.debug('SQL Query:', { sql, timing }) : false,
  
  // 基准测试
  benchmark: process.env.NODE_ENV === 'development',
  
  // 定义配置
  define: {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
    paranoid: true,   // 软删除（添加 deletedAt）
    underscored: true, // 使用下划线命名
    freezeTableName: true, // 禁用表名复数化
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  
  // 查询配置
  query: {
    raw: false,
    nest: false
  },
  
  // 事务隔离级别
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  
  // 重试配置
  retry: {
    max: 3,
    match: [
      Sequelize.ConnectionError,
      Sequelize.ConnectionTimedOutError,
      Sequelize.TimeoutError,
      /SQLITE_BUSY/
    ]
  },
  
  // SSL配置（生产环境）
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
};

/**
 * 创建Sequelize实例
 */
const sequelize = new Sequelize(config.database, config.username, config.password, config);

/**
 * 数据库连接测试
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    return false;
  }
};

/**
 * 数据库健康检查
 */
const healthCheck = async () => {
  try {
    const startTime = Date.now();
    await sequelize.authenticate();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      connection: {
        host: config.host,
        port: config.port,
        database: config.database,
        dialect: config.dialect
      },
      pool: {
        total: sequelize.connectionManager.pool.size,
        used: sequelize.connectionManager.pool.used,
        waiting: sequelize.connectionManager.pool.pending
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      connection: {
        host: config.host,
        port: config.port,
        database: config.database,
        dialect: config.dialect
      }
    };
  }
};

/**
 * 数据库同步
 */
const syncDatabase = async (options = {}) => {
  try {
    const defaultOptions = {
      force: false,
      alter: process.env.NODE_ENV === 'development',
      logging: (sql) => logger.info('Sync SQL:', sql)
    };
    
    await sequelize.sync({ ...defaultOptions, ...options });
    logger.info('Database synchronized successfully');
    return true;
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    return false;
  }
};

/**
 * 执行原始SQL查询
 */
const executeRawQuery = async (sql, options = {}) => {
  try {
    const startTime = Date.now();
    const result = await sequelize.query(sql, {
      type: Sequelize.QueryTypes.SELECT,
      logging: (sql, timing) => logger.debug('Raw Query:', { sql, timing }),
      ...options
    });
    const duration = Date.now() - startTime;
    
    logger.info('Raw query executed:', { duration, rowCount: result.length });
    return result;
  } catch (error) {
    logger.error('Raw query failed:', { sql, error: error.message });
    throw error;
  }
};

/**
 * 获取数据库统计信息
 */
const getDatabaseStats = async () => {
  try {
    const stats = {};
    
    // 获取所有表的统计信息
    const tables = await sequelize.getQueryInterface().showAllTables();
    
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(
          `SELECT COUNT(*) as count FROM \`${table}\``,
          { type: Sequelize.QueryTypes.SELECT }
        );
        stats[table] = result.count;
      } catch (error) {
        stats[table] = 'error';
      }
    }
    
    return {
      tables: stats,
      totalTables: tables.length,
      connectionPool: {
        total: sequelize.connectionManager.pool.size,
        used: sequelize.connectionManager.pool.used,
        waiting: sequelize.connectionManager.pool.pending
      }
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return { error: error.message };
  }
};

/**
 * 事务包装器
 */
const withTransaction = async (callback, options = {}) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    ...options
  });
  
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
 * 批量操作包装器
 */
const bulkOperation = async (model, operation, data, options = {}) => {
  const startTime = Date.now();
  
  try {
    let result;
    
    switch (operation) {
      case 'create':
        result = await model.bulkCreate(data, {
          validate: true,
          individualHooks: true,
          ...options
        });
        break;
      case 'update':
        result = await model.update(data.values, {
          where: data.where,
          individualHooks: true,
          ...options
        });
        break;
      case 'destroy':
        result = await model.destroy({
          where: data.where,
          individualHooks: true,
          ...options
        });
        break;
      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }
    
    const duration = Date.now() - startTime;
    logger.info(`Bulk ${operation} completed:`, { 
      model: model.name, 
      duration, 
      affected: Array.isArray(result) ? result.length : result 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Bulk ${operation} failed:`, { 
      model: model.name, 
      duration, 
      error: error.message 
    });
    throw error;
  }
};

// 监听连接事件
sequelize.addHook('afterConnect', (connection) => {
  logger.debug('Database connection established:', {
    threadId: connection.threadId,
    host: config.host,
    database: config.database
  });
});

sequelize.addHook('beforeDisconnect', (connection) => {
  logger.debug('Database connection closing:', {
    threadId: connection.threadId
  });
});

// 导出
module.exports = {
  sequelize,
  Sequelize,
  config,
  testConnection,
  healthCheck,
  syncDatabase,
  executeRawQuery,
  getDatabaseStats,
  withTransaction,
  bulkOperation
};

// 默认导出sequelize实例
module.exports.default = sequelize;