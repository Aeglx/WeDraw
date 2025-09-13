#!/usr/bin/env node

/**
 * 服务器启动文件
 * 用于启动WeDraw小程序服务
 */

const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { setupGracefulShutdown } = require('./src/utils/gracefulShutdown');

// 获取端口配置
const port = normalizePort(process.env.PORT || config.server.port || 3001);
const host = process.env.HOST || config.server.host || '0.0.0.0';

// 设置应用端口
app.set('port', port);
app.set('host', host);

// 创建HTTP服务器
const http = require('http');
const server = http.createServer(app);

// 配置服务器
server.listen(port, host);
server.on('error', onError);
server.on('listening', onListening);

// 设置优雅关闭
setupGracefulShutdown(server, {
  logger,
  timeout: 30000,
  cleanup: async () => {
    logger.info('Performing cleanup tasks...');
    
    // 关闭数据库连接
    if (global.sequelize) {
      try {
        await global.sequelize.close();
        logger.info('Database connection closed');
      } catch (error) {
        logger.error('Error closing database connection:', error);
      }
    }
    
    // 关闭Redis连接
    if (global.redisClient) {
      try {
        await global.redisClient.quit();
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error('Error closing Redis connection:', error);
      }
    }
    
    // 清理其他资源
    logger.info('Cleanup completed');
  }
});

/**
 * 标准化端口号
 * @param {string|number} val - 端口值
 * @returns {number|string|boolean} 标准化后的端口
 */
function normalizePort(val) {
  const port = parseInt(val, 10);
  
  if (isNaN(port)) {
    // 命名管道
    return val;
  }
  
  if (port >= 0) {
    // 端口号
    return port;
  }
  
  return false;
}

/**
 * HTTP服务器错误事件监听器
 * @param {Error} error - 错误对象
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  
  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;
  
  // 处理特定的监听错误
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    case 'ENOTFOUND':
      logger.error(`Host ${host} not found`);
      process.exit(1);
      break;
    default:
      logger.error('Server error:', error);
      throw error;
  }
}

/**
 * HTTP服务器监听事件监听器
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  
  logger.info(`🚀 Server listening on ${bind}`);
  logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API Base URL: http://${host}:${port}`);
  
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`📚 API Documentation: http://${host}:${port}/api-docs`);
    logger.info(`❤️  Health Check: http://${host}:${port}/health`);
  }
  
  // 发送就绪信号给PM2
  if (process.send) {
    process.send('ready');
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  
  // 优雅关闭服务器
  server.close(() => {
    process.exit(1);
  });
  
  // 强制退出（如果优雅关闭失败）
  setTimeout(() => {
    process.exit(1);
  }, 5000);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // 优雅关闭服务器
  server.close(() => {
    process.exit(1);
  });
  
  // 强制退出（如果优雅关闭失败）
  setTimeout(() => {
    process.exit(1);
  }, 5000);
});

// 处理警告
process.on('warning', (warning) => {
  logger.warn('Process Warning:', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// 导出服务器实例（用于测试）
module.exports = server;