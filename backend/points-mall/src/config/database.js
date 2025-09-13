const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// 加载环境变量
require('dotenv').config();

/**
 * 数据库配置
 */
const config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'points_mall_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? (msg) => logger.logDatabaseOperation('query', { query: msg }) : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true, // 软删除
      freezeTableName: true, // 不自动复数化表名
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    dialectOptions: {
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: true,
      typeCast: true
    },
    timezone: '+08:00'
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || 'password',
    database: process.env.TEST_DB_NAME || 'points_mall_test',
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || process.env.DB_PORT || 5432,
    dialect: process.env.TEST_DB_DIALECT || process.env.DB_DIALECT || 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    dialectOptions: {
      charset: 'utf8mb4'
    },
    timezone: '+08:00'
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 50,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 60000,
      idle: parseInt(process.env.DB_POOL_IDLE) || 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    dialectOptions: {
      charset: 'utf8mb4',
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    timezone: '+08:00'
  }
};

// 获取当前环境配置
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

/**
 * 创建Sequelize实例
 */
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions,
    timezone: dbConfig.timezone,
    
    // 重试配置
    retry: {
      max: 3,
      timeout: 60000,
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /TIMEOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    },
    
    // 钩子函数
    hooks: {
      beforeConnect: (config) => {
        logger.logDatabaseOperation('connecting', {
          host: config.host,
          database: config.database,
          username: config.username
        });
      },
      afterConnect: (connection, config) => {
        logger.logDatabaseOperation('connected', {
          host: config.host,
          database: config.database
        });
      },
      beforeDisconnect: (connection) => {
        logger.logDatabaseOperation('disconnecting');
      },
      afterDisconnect: (connection) => {
        logger.logDatabaseOperation('disconnected');
      }
    }
  }
);

/**
 * 数据库连接管理类
 */
class DatabaseManager {
  constructor() {
    this.sequelize = sequelize;
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
  }

  /**
   * 测试数据库连接
   */
  async testConnection() {
    try {
      await this.sequelize.authenticate();
      this.isConnected = true;
      logger.logDatabaseOperation('test_connection_success', {
        database: dbConfig.database,
        host: dbConfig.host
      });
      return true;
    } catch (error) {
      this.isConnected = false;
      logger.logError('database_connection_test_failed', error, {
        database: dbConfig.database,
        host: dbConfig.host
      });
      throw error;
    }
  }

  /**
   * 连接数据库（带重试机制）
   */
  async connect() {
    while (this.connectionRetries < this.maxRetries) {
      try {
        await this.testConnection();
        this.connectionRetries = 0;
        return true;
      } catch (error) {
        this.connectionRetries++;
        logger.logError('database_connection_retry', error, {
          attempt: this.connectionRetries,
          maxRetries: this.maxRetries
        });

        if (this.connectionRetries >= this.maxRetries) {
          logger.logError('database_connection_failed', new Error('达到最大重试次数'));
          throw error;
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect() {
    try {
      await this.sequelize.close();
      this.isConnected = false;
      logger.logDatabaseOperation('disconnected');
    } catch (error) {
      logger.logError('database_disconnection_error', error);
      throw error;
    }
  }

  /**
   * 同步数据库模型
   */
  async sync(options = {}) {
    try {
      const defaultOptions = {
        force: false,
        alter: env === 'development',
        logging: dbConfig.logging
      };
      
      const syncOptions = { ...defaultOptions, ...options };
      
      logger.logDatabaseOperation('sync_start', syncOptions);
      await this.sequelize.sync(syncOptions);
      logger.logDatabaseOperation('sync_completed');
    } catch (error) {
      logger.logError('database_sync_error', error);
      throw error;
    }
  }

  /**
   * 执行原始SQL查询
   */
  async query(sql, options = {}) {
    try {
      const startTime = Date.now();
      const result = await this.sequelize.query(sql, options);
      const duration = Date.now() - startTime;
      
      logger.logDatabaseOperation('raw_query', {
        sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
        duration,
        rowCount: Array.isArray(result[0]) ? result[0].length : 'unknown'
      });
      
      return result;
    } catch (error) {
      logger.logError('database_query_error', error, { sql });
      throw error;
    }
  }

  /**
   * 开始事务
   */
  async transaction(callback, options = {}) {
    const transaction = await this.sequelize.transaction(options);
    
    try {
      logger.logDatabaseOperation('transaction_start', {
        isolationLevel: options.isolationLevel
      });
      
      const result = await callback(transaction);
      
      await transaction.commit();
      logger.logDatabaseOperation('transaction_committed');
      
      return result;
    } catch (error) {
      await transaction.rollback();
      logger.logError('transaction_rollback', error);
      throw error;
    }
  }

  /**
   * 获取数据库状态
   */
  async getStatus() {
    try {
      const [results] = await this.query('SELECT version() as version');
      const version = results[0]?.version || 'unknown';
      
      const poolStatus = {
        total: this.sequelize.connectionManager.pool.size,
        used: this.sequelize.connectionManager.pool.used,
        waiting: this.sequelize.connectionManager.pool.pending
      };
      
      return {
        connected: this.isConnected,
        version,
        pool: poolStatus,
        config: {
          database: dbConfig.database,
          host: dbConfig.host,
          port: dbConfig.port,
          dialect: dbConfig.dialect
        }
      };
    } catch (error) {
      logger.logError('database_status_error', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取Sequelize实例
   */
  getSequelize() {
    return this.sequelize;
  }

  /**
   * 获取查询接口
   */
  getQueryInterface() {
    return this.sequelize.getQueryInterface();
  }
}

// 创建数据库管理器实例
const dbManager = new DatabaseManager();

// 导出配置和实例
module.exports = {
  config,
  sequelize,
  dbManager,
  Sequelize,
  
  // 便捷方法
  testConnection: () => dbManager.testConnection(),
  connect: () => dbManager.connect(),
  disconnect: () => dbManager.disconnect(),
  sync: (options) => dbManager.sync(options),
  query: (sql, options) => dbManager.query(sql, options),
  transaction: (callback, options) => dbManager.transaction(callback, options),
  getStatus: () => dbManager.getStatus(),
  healthCheck: () => dbManager.healthCheck()
};