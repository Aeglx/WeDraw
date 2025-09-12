import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import winston from 'winston';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 配置日志
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'user-center',
    timestamp: new Date().toISOString()
  });
});

// 认证路由
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 临时的登录逻辑 - 后续需要连接数据库
    if (username === 'admin' && password === 'admin123') {
      const token = 'mock-jwt-token-' + Date.now();
      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: 1,
            username: 'admin',
            name: '管理员',
            role: 'admin'
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 用户信息路由
app.get('/user', (req, res) => {
  // 临时返回模拟用户信息
  res.json({
    success: true,
    data: {
      id: 1,
      username: 'admin',
      name: '管理员',
      role: 'admin',
      avatar: null
    }
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`User Center Service is running on port ${PORT}`);
  console.log(`🚀 User Center Service is running on http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});