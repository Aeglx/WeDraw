/**
 * 数据库配置
 */

require('dotenv').config();

const config = {
  development: {
    username: process.env.DB_USER || 'wedraw_wework',
    password: process.env.DB_PASSWORD || 'wedraw_wework_123',
    database: process.env.DB_NAME || 'wedraw_wework',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+08:00',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true
    }
  },
  test: {
    username: process.env.DB_USER || 'wedraw_wework',
    password: process.env.DB_PASSWORD || 'wedraw_wework_123',
    database: process.env.DB_NAME ? `${process.env.DB_NAME}_test` : 'wedraw_wework_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+08:00',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+08:00',
    logging: false,
    pool: {
      max: 30,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true,
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};

module.exports = config;