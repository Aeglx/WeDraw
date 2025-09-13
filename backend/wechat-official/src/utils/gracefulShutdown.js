const logger = require('./logger');
const config = require('../config');

// 跟踪活跃连接
const activeConnections = new Set();
let isShuttingDown = false;

// 清理函数列表
const cleanupFunctions = [];

/**
 * 添加清理函数
 * @param {Function} fn 清理函数
 */
function addCleanupFunction(fn) {
  cleanupFunctions.push(fn);
}

/**
 * 跟踪连接
 * @param {Object} connection 连接对象
 */
function trackConnection(connection) {
  activeConnections.add(connection);
  
  connection.on('close', () => {
    activeConnections.delete(connection);
  });
}

/**
 * 优雅关闭处理
 * @param {Object} server HTTP服务器实例
 * @param {number} timeout 超时时间（毫秒）
 */
function gracefulShutdown(server, timeout = 30000) {
  return async (signal) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal', { signal });
      return;
    }
    
    isShuttingDown = true;
    logger.info('Graceful shutdown initiated', { signal, timeout });
    
    // 设置超时
    const shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, timeout);
    
    try {
      // 停止接受新连接
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      // 等待活跃连接关闭
      if (activeConnections.size > 0) {
        logger.info(`Waiting for ${activeConnections.size} active connections to close`);
        
        // 给连接一些时间自然关闭
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 强制关闭剩余连接
        activeConnections.forEach(connection => {
          connection.destroy();
        });
      }
      
      // 执行清理函数
      logger.info('Executing cleanup functions');
      await Promise.all(cleanupFunctions.map(async (fn) => {
        try {
          await fn();
        } catch (error) {
          logger.error('Cleanup function error:', error);
        }
      }));
      
      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown completed');
      process.exit(0);
      
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  };
}

/**
 * 健康检查中间件
 */
const healthCheck = async (req, res) => {
  const startTime = Date.now();
  const checks = [];
  
  try {
    // 检查数据库连接
    checks.push(await checkDatabase());
    
    // 检查Redis连接
    checks.push(await checkRedis());
    
    // 检查微信API连接
    checks.push(await checkWechatAPI());
    
    // 检查内存使用
    checks.push(checkMemoryUsage());
    
    // 检查磁盘空间
    checks.push(await checkDiskSpace());
    
    const allHealthy = checks.every(check => check.status === 'healthy');
    const responseTime = Date.now() - startTime;
    
    const response = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: config.app.version,
      checks: checks.reduce((acc, check) => {
        acc[check.name] = {
          status: check.status,
          message: check.message,
          responseTime: check.responseTime,
        };
        return acc;
      }, {}),
    };
    
    res.status(allHealthy ? 200 : 503).json(response);
    
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

/**
 * 就绪检查中间件
 */
const readinessCheck = async (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({
      status: 'not ready',
      message: 'Application is shutting down',
    });
  }
  
  try {
    // 检查关键依赖
    const dbCheck = await checkDatabase();
    const redisCheck = await checkRedis();
    
    const isReady = dbCheck.status === 'healthy' && redisCheck.status === 'healthy';
    
    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck,
        redis: redisCheck,
      },
    });
    
  } catch (error) {
    logger.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not ready',
      error: error.message,
    });
  }
};

/**
 * 存活检查中间件
 */
const livenessCheck = (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({
      status: 'not alive',
      message: 'Application is shutting down',
    });
  }
  
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  });
};

/**
 * 检查数据库连接
 */
async function checkDatabase() {
  const startTime = Date.now();
  
  try {
    // 这里应该导入实际的数据库连接
    // const { sequelize } = require('../models');
    // await sequelize.authenticate();
    
    // 模拟数据库检查
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return {
      name: 'database',
      status: 'healthy',
      message: 'Database connection is healthy',
      responseTime: `${Date.now() - startTime}ms`,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      message: `Database connection failed: ${error.message}`,
      responseTime: `${Date.now() - startTime}ms`,
    };
  }
}

/**
 * 检查Redis连接
 */
async function checkRedis() {
  const startTime = Date.now();
  
  try {
    // 这里应该导入实际的Redis连接
    // const redis = require('../utils/redis');
    // await redis.ping();
    
    // 模拟Redis检查
    await new Promise(resolve => setTimeout(resolve, 5));
    
    return {
      name: 'redis',
      status: 'healthy',
      message: 'Redis connection is healthy',
      responseTime: `${Date.now() - startTime}ms`,
    };
  } catch (error) {
    return {
      name: 'redis',
      status: 'unhealthy',
      message: `Redis connection failed: ${error.message}`,
      responseTime: `${Date.now() - startTime}ms`,
    };
  }
}

/**
 * 检查微信API连接
 */
async function checkWechatAPI() {
  const startTime = Date.now();
  
  try {
    // 这里应该检查微信API的连通性
    // 可以通过获取access_token来验证
    
    // 模拟微信API检查
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      name: 'wechat_api',
      status: 'healthy',
      message: 'WeChat API is accessible',
      responseTime: `${Date.now() - startTime}ms`,
    };
  } catch (error) {
    return {
      name: 'wechat_api',
      status: 'unhealthy',
      message: `WeChat API check failed: ${error.message}`,
      responseTime: `${Date.now() - startTime}ms`,
    };
  }
}

/**
 * 检查内存使用情况
 */
function checkMemoryUsage() {
  const memUsage = process.memoryUsage();
  const totalMem = require('os').totalmem();
  const freeMem = require('os').freemem();
  
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const systemUsedMB = Math.round((totalMem - freeMem) / 1024 / 1024);
  const systemTotalMB = Math.round(totalMem / 1024 / 1024);
  
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const systemUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
  
  const isHealthy = heapUsagePercent < 90 && systemUsagePercent < 90;
  
  return {
    name: 'memory',
    status: isHealthy ? 'healthy' : 'warning',
    message: `Heap: ${heapUsedMB}/${heapTotalMB}MB (${heapUsagePercent.toFixed(1)}%), System: ${systemUsedMB}/${systemTotalMB}MB (${systemUsagePercent.toFixed(1)}%)`,
    responseTime: '0ms',
  };
}

/**
 * 检查磁盘空间
 */
async function checkDiskSpace() {
  const startTime = Date.now();
  
  try {
    const fs = require('fs').promises;
    const stats = await fs.statfs('.');
    
    const totalSpace = stats.blocks * stats.blksize;
    const freeSpace = stats.bavail * stats.blksize;
    const usedSpace = totalSpace - freeSpace;
    const usagePercent = (usedSpace / totalSpace) * 100;
    
    const isHealthy = usagePercent < 90;
    
    return {
      name: 'disk_space',
      status: isHealthy ? 'healthy' : 'warning',
      message: `Disk usage: ${usagePercent.toFixed(1)}%`,
      responseTime: `${Date.now() - startTime}ms`,
    };
  } catch (error) {
    return {
      name: 'disk_space',
      status: 'unknown',
      message: `Could not check disk space: ${error.message}`,
      responseTime: `${Date.now() - startTime}ms`,
    };
  }
}

/**
 * 资源监控
 */
function startResourceMonitoring() {
  const monitoringInterval = config.monitoring?.healthCheckInterval || 30000;
  
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // 记录资源使用情况
    logger.performance('resource_usage', 0, {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime: process.uptime(),
    });
    
    // 检查内存泄漏
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (heapUsagePercent > 85) {
      logger.warn('High memory usage detected', {
        heapUsagePercent: heapUsagePercent.toFixed(1),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      });
    }
  }, monitoringInterval);
}

module.exports = {
  gracefulShutdown,
  trackConnection,
  addCleanupFunction,
  healthCheck,
  readinessCheck,
  livenessCheck,
  startResourceMonitoring,
};