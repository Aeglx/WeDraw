#!/usr/bin/env node

/**
 * WeDraw积分商城服务器启动文件
 * 负责启动Express应用服务器
 */

const { createApp, initializeApp } = require('./src/app');
const logger = require('./src/utils/logger');

// 加载环境变量
require('dotenv').config();

/**
 * 获取端口号
 */
const normalizePort = (val) => {
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
};

/**
 * 启动服务器
 */
const startServer = async () => {
  try {
    // 初始化应用
    await initializeApp();

    // 创建Express应用
    const app = createApp();

    // 获取端口配置
    const port = normalizePort(process.env.PORT || '3000');
    const host = process.env.HOST || 'localhost';

    app.set('port', port);

    // 启动HTTP服务器
    const server = app.listen(port, host, () => {
      logger.logBusinessOperation('server', 'started', {
        port,
        host,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
        timestamp: new Date().toISOString()
      });

      // 开发环境输出有用信息
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🚀 WeDraw积分商城服务已启动!');
        console.log(`📍 服务地址: http://${host}:${port}`);
        console.log(`🏥 健康检查: http://${host}:${port}/health`);
        console.log(`📚 API文档: http://${host}:${port}/api/docs`);
        console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🆔 进程ID: ${process.pid}\n`);
      }
    });

    // 服务器错误处理
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

      // 处理特定的监听错误
      switch (error.code) {
        case 'EACCES':
          logger.logError('server_permission_error', new Error(`${bind} 需要提升权限`));
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.logError('server_port_in_use', new Error(`${bind} 已被占用`));
          process.exit(1);
          break;
        default:
          logger.logError('server_error', error);
          throw error;
      }
    });

    // 服务器开始监听
    server.on('listening', () => {
      const addr = server.address();
      const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
      logger.logBusinessOperation('server', 'listening', { bind });
    });

    // 处理服务器关闭
    const gracefulShutdown = (signal) => {
      logger.logBusinessOperation('server', 'shutdown_signal_received', { signal });
      
      server.close((err) => {
        if (err) {
          logger.logError('server_shutdown_error', err);
          return process.exit(1);
        }
        
        logger.logBusinessOperation('server', 'shutdown_completed');
        process.exit(0);
      });

      // 强制关闭超时
      setTimeout(() => {
        logger.logError('server_shutdown_timeout', new Error('强制关闭服务器'));
        process.exit(1);
      }, 10000);
    };

    // 监听进程信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.logError('server_startup_error', error);
    process.exit(1);
  }
};

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.logError('uncaught_exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.logError('unhandled_rejection', new Error(reason), { promise });
  process.exit(1);
});

// 启动服务器
if (require.main === module) {
  startServer().catch((error) => {
    logger.logError('startup_error', error);
    process.exit(1);
  });
}

module.exports = { startServer };