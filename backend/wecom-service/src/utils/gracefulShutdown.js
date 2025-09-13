const logger = require('./logger');

/**
 * 优雅关闭处理器
 * 确保服务在关闭时能够正确清理资源
 */
class GracefulShutdown {
  constructor() {
    this.shutdownHandlers = [];
    this.isShuttingDown = false;
    this.shutdownTimeout = 30000; // 30秒超时
  }

  /**
   * 添加关闭处理器
   * @param {Function} handler - 关闭处理函数
   * @param {string} name - 处理器名称
   */
  addHandler(handler, name = 'Unknown') {
    this.shutdownHandlers.push({ handler, name });
  }

  /**
   * 设置关闭超时时间
   * @param {number} timeout - 超时时间（毫秒）
   */
  setTimeout(timeout) {
    this.shutdownTimeout = timeout;
  }

  /**
   * 执行优雅关闭
   * @param {string} signal - 关闭信号
   */
  async shutdown(signal = 'UNKNOWN') {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal:', signal);
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    // 设置强制退出超时
    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // 执行所有关闭处理器
      for (const { handler, name } of this.shutdownHandlers) {
        try {
          logger.info(`Executing shutdown handler: ${name}`);
          await Promise.resolve(handler());
          logger.info(`Shutdown handler completed: ${name}`);
        } catch (error) {
          logger.error(`Shutdown handler failed: ${name}`, {
            error: error.message,
            stack: error.stack
          });
        }
      }

      logger.info('Graceful shutdown completed successfully');
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', {
        error: error.message,
        stack: error.stack
      });
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  }

  /**
   * 初始化信号监听
   */
  init() {
    // 监听进程信号
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGUSR2', () => this.shutdown('SIGUSR2')); // nodemon restart

    // 监听未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack
      });
      this.shutdown('UNCAUGHT_EXCEPTION');
    });

    // 监听未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise
      });
      this.shutdown('UNHANDLED_REJECTION');
    });

    logger.info('Graceful shutdown handlers initialized');
  }
}

// 创建全局实例
const gracefulShutdown = new GracefulShutdown();

/**
 * 便捷函数：添加数据库连接关闭处理器
 * @param {Object} sequelize - Sequelize实例
 */
const addDatabaseShutdown = (sequelize) => {
  gracefulShutdown.addHandler(async () => {
    if (sequelize) {
      await sequelize.close();
      logger.info('Database connections closed');
    }
  }, 'Database');
};

/**
 * 便捷函数：添加Redis连接关闭处理器
 * @param {Object} redis - Redis客户端实例
 */
const addRedisShutdown = (redis) => {
  gracefulShutdown.addHandler(async () => {
    if (redis && redis.status === 'ready') {
      await redis.quit();
      logger.info('Redis connection closed');
    }
  }, 'Redis');
};

/**
 * 便捷函数：添加HTTP服务器关闭处理器
 * @param {Object} server - HTTP服务器实例
 */
const addServerShutdown = (server) => {
  gracefulShutdown.addHandler(async () => {
    return new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          logger.error('Error closing HTTP server:', err);
        } else {
          logger.info('HTTP server closed');
        }
        resolve();
      });
    });
  }, 'HTTP Server');
};

// 健康检查函数
const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
};

const readinessCheck = (req, res) => {
  // 检查服务是否准备好接收请求
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
};

const livenessCheck = (req, res) => {
  // 检查服务是否存活
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  gracefulShutdown,
  addDatabaseShutdown,
  addRedisShutdown,
  addServerShutdown,
  healthCheck,
  readinessCheck,
  livenessCheck
};