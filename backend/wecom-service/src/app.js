const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { validateRequest } = require('./middleware/validation');
const { authenticateToken } = require('./middleware/auth');
const { healthCheck, readinessCheck, livenessCheck } = require('./utils/gracefulShutdown');

// 路由导入
const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const departmentRoutes = require('./routes/department');
const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/message');
const applicationRoutes = require('./routes/application');
const webhookRoutes = require('./routes/webhook');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');

const app = express();

// 信任代理
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS配置
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// 压缩中间件
app.use(compression());

// 请求日志
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// 自定义请求日志
app.use(requestLogger);

// 解析中间件
app.use(express.json({ limit: config.server.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.server.bodyLimit }));

// 速率限制
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 慢速限制
const speedLimiter = slowDown({
  windowMs: config.slowDown.windowMs,
  delayAfter: config.slowDown.delayAfter,
  delayMs: config.slowDown.delayMs,
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// 健康检查端点
app.get('/health', healthCheck);
app.get('/ready', readinessCheck);
app.get('/live', livenessCheck);

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/contacts', authenticateToken, contactsRoutes);
app.use('/api/departments', authenticateToken, departmentRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/applications', authenticateToken, applicationRoutes);
app.use('/api/webhook', webhookRoutes); // 企业微信回调不需要认证
app.use('/api/stats', authenticateToken, statsRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Swagger文档 (仅开发环境)
if (config.env === 'development') {
  const swaggerJsdoc = require('swagger-jsdoc');
  const swaggerUi = require('swagger-ui-express');
  
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'WeCom Service API',
        version: '1.0.0',
        description: '企业微信服务API文档',
      },
      servers: [
        {
          url: `http://localhost:${config.server.port}`,
          description: 'Development server',
        },
      ],
    },
    apis: ['./src/routes/*.js', './src/models/*.js'],
  };
  
  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  
  logger.info(`Swagger documentation available at http://localhost:${config.server.port}/api-docs`);
}

// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
const PORT = config.server.port || 3003;
const server = app.listen(PORT, () => {
  logger.info(`WeCom Service is running on port ${PORT}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`Process ID: ${process.pid}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// 未捕获异常处理
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;