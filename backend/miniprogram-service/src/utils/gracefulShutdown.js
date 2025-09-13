const logger = require('./logger');

/**
 * 设置优雅关闭处理
 * @param {Object} server - HTTP服务器实例
 * @param {Function} cleanup - 清理函数
 */
function setupGracefulShutdown(server, cleanup) {
  let isShuttingDown = false;
  const connections = new Set();
  
  // 跟踪活跃连接
  server.on('connection', (connection) => {
    connections.add(connection);
    
    connection.on('close', () => {
      connections.delete(connection);
    });
  });

  /**
   * 优雅关闭处理函数
   * @param {string} signal - 信号名称
   */
  async function gracefulShutdown(signal) {
    if (isShuttingDown) {
      logger.warn(`收到重复的${signal}信号，强制退出`);
      process.exit(1);
    }
    
    isShuttingDown = true;
    logger.info(`收到${signal}信号，开始优雅关闭...`);
    
    // 设置超时，防止无限等待
    const shutdownTimeout = setTimeout(() => {
      logger.error('优雅关闭超时，强制退出');
      process.exit(1);
    }, 30000); // 30秒超时
    
    try {
      // 停止接受新连接
      server.close(async (err) => {
        if (err) {
          logger.error('关闭服务器时出错:', err);
        } else {
          logger.info('服务器已停止接受新连接');
        }
        
        try {
          // 关闭现有连接
          logger.info(`正在关闭 ${connections.size} 个活跃连接...`);
          for (const connection of connections) {
            connection.destroy();
          }
          
          // 执行清理函数
          if (cleanup && typeof cleanup === 'function') {
            await cleanup();
          }
          
          clearTimeout(shutdownTimeout);
          logger.info('优雅关闭完成');
          process.exit(0);
        } catch (cleanupError) {
          logger.error('清理过程中出错:', cleanupError);
          clearTimeout(shutdownTimeout);
          process.exit(1);
        }
      });
    } catch (error) {
      logger.error('优雅关闭过程中出错:', error);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  }
  
  // 监听进程信号
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // 监听未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', error);
    gracefulShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝:', reason);
    logger.error('Promise:', promise);
    gracefulShutdown('unhandledRejection');
  });
  
  logger.info('优雅关闭处理已设置');
}

/**
 * 创建健康检查中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Express中间件
 */
function createHealthCheck(options = {}) {
  const {
    path = '/health',
    checks = [],
    timeout = 5000
  } = options;
  
  return async (req, res, next) => {
    if (req.path !== path) {
      return next();
    }
    
    const startTime = Date.now();
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {}
    };
    
    try {
      // 执行健康检查
      const checkPromises = checks.map(async (check) => {
        const checkStartTime = Date.now();
        try {
          const result = await Promise.race([
            check.fn(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Health check timeout')), timeout)
            )
          ]);
          
          results.checks[check.name] = {
            status: 'healthy',
            responseTime: Date.now() - checkStartTime,
            result
          };
        } catch (error) {
          results.checks[check.name] = {
            status: 'unhealthy',
            responseTime: Date.now() - checkStartTime,
            error: error.message
          };
          results.status = 'unhealthy';
        }
      });
      
      await Promise.all(checkPromises);
      
      results.responseTime = Date.now() - startTime;
      
      const statusCode = results.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(results);
      
    } catch (error) {
      logger.error('健康检查失败:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime
      });
    }
  };
}

/**
 * 创建就绪检查中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Express中间件
 */
function createReadinessCheck(options = {}) {
  const {
    path = '/ready',
    checks = []
  } = options;
  
  return async (req, res, next) => {
    if (req.path !== path) {
      return next();
    }
    
    try {
      // 执行就绪检查
      const checkResults = await Promise.all(
        checks.map(async (check) => {
          try {
            await check.fn();
            return { name: check.name, ready: true };
          } catch (error) {
            return { name: check.name, ready: false, error: error.message };
          }
        })
      );
      
      const allReady = checkResults.every(result => result.ready);
      
      res.status(allReady ? 200 : 503).json({
        ready: allReady,
        timestamp: new Date().toISOString(),
        checks: checkResults
      });
      
    } catch (error) {
      logger.error('就绪检查失败:', error);
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  };
}

/**
 * 创建存活检查中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Express中间件
 */
function createLivenessCheck(options = {}) {
  const {
    path = '/live'
  } = options;
  
  return (req, res, next) => {
    if (req.path !== path) {
      return next();
    }
    
    // 简单的存活检查，只要进程还在运行就返回成功
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime()
    });
  };
}

/**
 * 监控资源使用情况
 * @param {Object} options - 配置选项
 */
function monitorResources(options = {}) {
  const {
    interval = 60000, // 1分钟
    memoryThreshold = 0.9, // 90%
    cpuThreshold = 0.8 // 80%
  } = options;
  
  let lastCpuUsage = process.cpuUsage();
  
  setInterval(() => {
    try {
      // 内存使用情况
      const memUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const memoryUsagePercent = memUsage.rss / totalMemory;
      
      if (memoryUsagePercent > memoryThreshold) {
        logger.warn(`内存使用率过高: ${(memoryUsagePercent * 100).toFixed(2)}%`, {
          rss: memUsage.rss,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external
        });
      }
      
      // CPU使用情况
      const currentCpuUsage = process.cpuUsage(lastCpuUsage);
      const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / (interval * 1000);
      
      if (cpuPercent > cpuThreshold) {
        logger.warn(`CPU使用率过高: ${(cpuPercent * 100).toFixed(2)}%`, {
          user: currentCpuUsage.user,
          system: currentCpuUsage.system
        });
      }
      
      lastCpuUsage = process.cpuUsage();
      
      // 记录资源使用情况（调试级别）
      logger.debug('资源使用情况', {
        memory: {
          usage: `${(memoryUsagePercent * 100).toFixed(2)}%`,
          rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
          heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`
        },
        cpu: {
          usage: `${(cpuPercent * 100).toFixed(2)}%`
        },
        uptime: `${Math.floor(process.uptime())}s`
      });
      
    } catch (error) {
      logger.error('资源监控出错:', error);
    }
  }, interval);
  
  logger.info('资源监控已启动', { interval, memoryThreshold, cpuThreshold });
}

module.exports = {
  setupGracefulShutdown,
  createHealthCheck,
  createReadinessCheck,
  createLivenessCheck,
  monitorResources
};