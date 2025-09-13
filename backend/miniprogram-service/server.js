/**
 * 微信小程序服务主文件
 * 提供用户管理和消息推送功能
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const statusMonitor = require('express-status-monitor');
const path = require('path');

// 导入中间件和路由
const {
  cors: corsMiddleware,
  helmet: helmetMiddleware,
  compression: compressionMiddleware,
  requestLogger,
  errorHandler,
  notFoundHandler,
  apiRateLimit
} = require('./src/middleware');

const routes = require('./src/routes');
const { sequelize } = require('./src/models');
const { redisClient } = require('./src/utils');

// 创建Express应用
const app = express();
const server = http.createServer(app);

// 创建Socket.IO实例
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// 将io实例添加到app中，供其他模块使用
app.set('io', io);

// 基础中间件
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(compressionMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// 状态监控
if (process.env.NODE_ENV === 'development') {
  app.use(statusMonitor({
    title: '小程序服务监控',
    path: '/status',
    spans: [
      {
        interval: 1,
        retention: 60
      },
      {
        interval: 5,
        retention: 60
      },
      {
        interval: 15,
        retention: 60
      }
    ],
    chartVisibility: {
      cpu: true,
      mem: true,
      load: true,
      responseTime: true,
      rps: true,
      statusCodes: true
    },
    healthChecks: [
      {
        protocol: 'http',
        host: 'localhost',
        path: '/api/health',
        port: process.env.PORT || 3004
      }
    ]
  }));
}

// API速率限制
app.use('/api', apiRateLimit);

// Swagger API文档配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '微信小程序服务 API',
      version: '1.0.0',
      description: '微信小程序用户管理和消息推送服务API文档',
      contact: {
        name: 'WeDraw Team',
        email: 'support@wedraw.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3004}`,
        description: '开发环境'
      },
      {
        url: 'https://api.wedraw.com/miniprogram',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '小程序服务 API 文档'
}));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    // 检查数据库连接
    await sequelize.authenticate();
    
    // 检查Redis连接
    const redisStatus = redisClient.isConnected;
    
    res.json({
      success: true,
      message: '服务运行正常',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
      redis: redisStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务异常',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API路由
app.use('/api', routes);

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log(`用户连接: ${socket.id}`);
  
  // 用户加入房间（用于个人消息推送）
  socket.on('join-user-room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`用户 ${userId} 加入个人房间`);
  });
  
  // 用户离开房间
  socket.on('leave-user-room', (userId) => {
    socket.leave(`user:${userId}`);
    console.log(`用户 ${userId} 离开个人房间`);
  });
  
  // 小程序页面访问统计
  socket.on('page-view', (data) => {
    const { userId, page, timestamp } = data;
    console.log(`页面访问统计: 用户${userId} 访问页面${page}`);
    
    // 广播页面访问事件（可用于实时统计）
    socket.broadcast.emit('page-view-update', {
      userId,
      page,
      timestamp
    });
  });
  
  // 用户在线状态更新
  socket.on('user-online', (userId) => {
    socket.broadcast.emit('user-status-change', {
      userId,
      status: 'online',
      timestamp: new Date().toISOString()
    });
  });
  
  // 处理断开连接
  socket.on('disconnect', (reason) => {
    console.log(`用户断开连接: ${socket.id}, 原因: ${reason}`);
  });
  
  // 错误处理
  socket.on('error', (error) => {
    console.error('Socket错误:', error);
  });
});

// 消息推送辅助函数
app.pushToUser = (userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

app.broadcast = (event, data) => {
  io.emit(event, data);
};

// 404处理
app.use(notFoundHandler);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3004;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, async () => {
  console.log(`🚀 小程序服务启动成功`);
  console.log(`📍 服务地址: http://${HOST}:${PORT}`);
  console.log(`📚 API文档: http://${HOST}:${PORT}/api-docs`);
  console.log(`📊 监控面板: http://${HOST}:${PORT}/status`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步数据库表结构（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ 数据库表结构同步完成');
    }
    
    // 连接Redis
    await redisClient.connect();
    console.log('✅ Redis连接成功');
    
  } catch (error) {
    console.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
});

// 优雅关闭
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n收到 ${signal} 信号，开始优雅关闭...`);
  
  // 停止接收新请求
  server.close(async () => {
    console.log('HTTP服务器已关闭');
    
    try {
      // 关闭Socket.IO
      io.close();
      console.log('Socket.IO已关闭');
      
      // 关闭数据库连接
      await sequelize.close();
      console.log('数据库连接已关闭');
      
      // 关闭Redis连接
      await redisClient.disconnect();
      console.log('Redis连接已关闭');
      
      console.log('✅ 服务已优雅关闭');
      process.exit(0);
    } catch (error) {
      console.error('❌ 关闭过程中出现错误:', error);
      process.exit(1);
    }
  });
  
  // 强制关闭超时
  setTimeout(() => {
    console.error('❌ 强制关闭服务');
    process.exit(1);
  }, 10000);
}

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

module.exports = app;