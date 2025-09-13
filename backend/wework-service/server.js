/**
 * WeDraw 企业微信服务
 * 提供企业微信通讯录、群聊、机器人管理等功能
 */

require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

// 导入配置和工具
const config = require('./src/config/database');
const logger = require('./src/utils/logger');
const { connectRedis } = require('./src/utils/redis');
const errorHandler = require('./src/middleware/errorHandler');
const authMiddleware = require('./src/middleware/auth');
const validationMiddleware = require('./src/middleware/validation');

// 导入路由
const contactRoutes = require('./src/routes/contacts');
const departmentRoutes = require('./src/routes/departments');
const groupRoutes = require('./src/routes/groups');
const botRoutes = require('./src/routes/bots');
const messageRoutes = require('./src/routes/messages');
const webhookRoutes = require('./src/routes/webhooks');
const authRoutes = require('./src/routes/auth');
const healthRoutes = require('./src/routes/health');

// 创建 Express 应用
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// 全局中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: process.env.RATE_LIMIT_MAX || 1000, // 限制每个IP 15分钟内最多1000个请求
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/contacts', authMiddleware, contactRoutes);
app.use('/api/departments', authMiddleware, departmentRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/bots', authMiddleware, botRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/webhooks', webhookRoutes); // Webhook 不需要认证
app.use('/health', healthRoutes);

// Socket.IO 连接处理
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  // 加入企业微信群组房间
  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`);
    logger.info(`Socket ${socket.id} joined group ${groupId}`);
  });
  
  // 离开企业微信群组房间
  socket.on('leave-group', (groupId) => {
    socket.leave(`group-${groupId}`);
    logger.info(`Socket ${socket.id} left group ${groupId}`);
  });
  
  // 处理断开连接
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// 将 io 实例添加到 app 中，供其他模块使用
app.set('io', io);

// 根路径
app.get('/', (req, res) => {
  res.json({
    service: 'WeDraw WeWork Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs'
    }
  });
});

// API 文档
if (process.env.NODE_ENV !== 'production') {
  const swaggerJsdoc = require('swagger-jsdoc');
  const swaggerUi = require('swagger-ui-express');
  
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'WeDraw WeWork Service API',
        version: '1.0.0',
        description: '企业微信服务API文档',
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3002}`,
          description: '开发服务器',
        },
      ],
    },
    apis: ['./src/routes/*.js'],
  };
  
  const specs = swaggerJsdoc(options);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    // 连接数据库
    const { sequelize } = require('./src/models');
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    // 连接 Redis
    await connectRedis();
    logger.info('Redis connection established successfully.');
    
    // 启动服务器
    server.listen(PORT, HOST, () => {
      logger.info(`🚀 WeWork Service is running on http://${HOST}:${PORT}`);
      logger.info(`📚 API Documentation: http://${HOST}:${PORT}/api/docs`);
      logger.info(`🏥 Health Check: http://${HOST}:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    logger.info('HTTP server closed.');
  });
  
  // 关闭数据库连接
  try {
    const { sequelize } = require('./src/models');
    await sequelize.close();
    logger.info('Database connection closed.');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    logger.info('HTTP server closed.');
  });
  
  process.exit(0);
});

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 启动服务器
startServer();

module.exports = { app, server, io };