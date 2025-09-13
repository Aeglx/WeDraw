const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('express-async-errors');

const config = require('./config');
const logger = require('./utils/logger');
const { gracefulShutdown, healthCheck, readinessCheck } = require('./utils/gracefulShutdown');
const db = require('./models');

// 导入路由
const pointsRoutes = require('./routes/points');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const categoriesRoutes = require('./routes/categories');
const couponsRoutes = require('./routes/coupons');
const paymentsRoutes = require('./routes/payments');
const statisticsRoutes = require('./routes/statistics');
const authRoutes = require('./routes/auth');

const app = express();

// 信任代理
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = config.cors.allowedOrigins || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://wedraw.com',
      'https://admin.wedraw.com'
    ];
    
    // 开发环境允许所有来源
    if (config.env === 'development' && !origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('不允许的CORS来源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// 压缩中间件
app.use(compression());

// 请求日志
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 全局限流
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP每15分钟最多1000个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过健康检查和静态资源
    return req.path === '/health' || req.path === '/ready' || req.path.startsWith('/static/');
  }
});

app.use(globalLimiter);

// 健康检查端点
app.get('/health', async (req, res) => {
  const health = await healthCheck();
  const status = health.status === 'healthy' ? 200 : 503;
  res.status(status).json(health);
});

// 就绪检查端点
app.get('/ready', async (req, res) => {
  const readiness = await readinessCheck();
  const status = readiness.status === 'ready' ? 200 : 503;
  res.status(status).json(readiness);
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/statistics', statisticsRoutes);

// Swagger API文档配置
if (config.env === 'development') {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'WeDraw积分商城API',
        version: '1.0.0',
        description: '积分商城服务API文档',
        contact: {
          name: 'WeDraw Team',
          email: 'support@wedraw.com'
        }
      },
      servers: [
        {
          url: `http://localhost:${config.server.port}`,
          description: '开发环境'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
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
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WeDraw积分商城API文档'
  }));
  
  // API规范JSON端点
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// 代理中间件（可选，用于开发环境）
if (config.env === 'development' && config.proxy?.enabled) {
  app.use('/api/proxy', createProxyMiddleware({
    target: config.proxy.target,
    changeOrigin: true,
    pathRewrite: {
      '^/api/proxy': ''
    },
    onError: (err, req, res) => {
      logger.error('Proxy error:', err);
      res.status(500).json({
        success: false,
        message: '代理服务错误'
      });
    }
  }));
}

// 静态文件服务
app.use('/static', express.static('uploads', {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// 404处理
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    code: 'RESOURCE_NOT_FOUND',
    path: req.originalUrl
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  });
  
  // 数据库错误
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      code: 'VALIDATION_ERROR',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: '数据已存在',
      code: 'DUPLICATE_ERROR',
      field: error.errors[0]?.path
    });
  }
  
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: '关联数据不存在',
      code: 'FOREIGN_KEY_ERROR'
    });
  }
  
  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '访问令牌已过期',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // CORS错误
  if (error.message === '不允许的CORS来源') {
    return res.status(403).json({
      success: false,
      message: '跨域请求被拒绝',
      code: 'CORS_ERROR'
    });
  }
  
  // 默认错误响应
  const statusCode = error.statusCode || error.status || 500;
  const message = config.env === 'production' ? '服务器内部错误' : error.message;
  
  res.status(statusCode).json({
    success: false,
    message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(config.env !== 'production' && { stack: error.stack })
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await db.testConnection();
    logger.info('Database connection established successfully');
    
    // 同步数据库模型（仅开发环境）
    if (config.env === 'development') {
      await db.sync({ alter: true });
      logger.info('Database models synchronized');
    }
    
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`积分商城服务启动成功`, {
        port: config.server.port,
        host: config.server.host,
        env: config.env,
        pid: process.pid
      });
      
      if (config.env === 'development') {
        logger.info(`API文档地址: http://${config.server.host}:${config.server.port}/api-docs`);
        logger.info(`健康检查: http://${config.server.host}:${config.server.port}/health`);
      }
    });
    
    // 优雅关闭处理
    gracefulShutdown(server, 'SIGTERM');
    gracefulShutdown(server, 'SIGINT');
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// 启动应用
if (require.main === module) {
  startServer();
}

module.exports = app;