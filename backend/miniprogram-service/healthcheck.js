#!/usr/bin/env node

/**
 * Docker健康检查脚本
 * 用于检查应用程序是否正常运行
 */

const http = require('http');
const process = require('process');

// 配置
const config = {
  host: process.env.HEALTH_CHECK_HOST || 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  timeout: 5000
};

/**
 * 执行健康检查
 */
function healthCheck() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: config.path,
      method: 'GET',
      timeout: config.timeout,
      headers: {
        'User-Agent': 'Docker-HealthCheck/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.status === 'ok') {
              resolve({
                status: 'healthy',
                statusCode: res.statusCode,
                response: response
              });
            } else {
              reject(new Error(`Health check failed: ${response.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });

    req.setTimeout(config.timeout);
    req.end();
  });
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log(`[${new Date().toISOString()}] Starting health check...`);
    console.log(`Checking: http://${config.host}:${config.port}${config.path}`);
    
    const result = await healthCheck();
    
    console.log(`[${new Date().toISOString()}] Health check passed:`, {
      status: result.status,
      statusCode: result.statusCode,
      uptime: result.response.uptime,
      timestamp: result.response.timestamp
    });
    
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Health check failed:`, error.message);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error(`[${new Date().toISOString()}] Uncaught exception:`, error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled rejection at:`, promise, 'reason:', reason);
  process.exit(1);
});

// 处理信号
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] Received SIGTERM, exiting...`);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] Received SIGINT, exiting...`);
  process.exit(0);
});

// 运行健康检查
if (require.main === module) {
  main();
}

module.exports = { healthCheck, config };