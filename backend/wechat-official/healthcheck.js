const http = require('http');
const config = require('./src/config');

/**
 * Docker健康检查脚本
 * 用于检查应用程序是否正常运行
 */
const healthCheck = () => {
  const options = {
    hostname: 'localhost',
    port: config.server.port || 3000,
    path: '/health',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('Health check passed');
      process.exit(0);
    } else {
      console.error(`Health check failed with status: ${res.statusCode}`);
      process.exit(1);
    }
  });

  req.on('error', (error) => {
    console.error('Health check request failed:', error.message);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('Health check request timed out');
    req.destroy();
    process.exit(1);
  });

  req.setTimeout(3000);
  req.end();
};

// 执行健康检查
healthCheck();