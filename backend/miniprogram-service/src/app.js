const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import configurations
const config = require('./config');
const { connectDatabase } = require('./config/database');

// Import middleware
const { requestLogger, errorLogger } = require('./middleware/logger');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { createRateLimiter } = require('./middleware/rateLimiter');

// Import routes
const routes = require('./routes');

// Import utilities
const logger = require('./utils/logger');
const { setupGracefulShutdown } = require('./utils/gracefulShutdown');

class MiniProgramService {
  constructor() {
    this.app = express();
    this.server = null;
    this.isShuttingDown = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Connect to database
      await this.connectDatabase();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Setup API documentation
      this.setupSwagger();
      
      logger.info('小程序服务初始化完成');
    } catch (error) {
      logger.error('小程序服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * Connect to database
   */
  async connectDatabase() {
    try {
      await connectDatabase();
      logger.info('数据库连接成功');
    } catch (error) {
      logger.error('数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (config.cors.allowedOrigins.includes(origin) || 
            config.cors.allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        
        // Check for development environment
        if (config.env === 'development' && origin.includes('localhost')) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024
    }));

    // Body parsing
    this.app.use(express.json({ 
      limit: config.upload.maxFileSize,
      verify: (req, res, buf) => {
        req.rawBody = buf;
      }
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: config.upload.maxFileSize 
    }));

    // Request logging
    this.app.use(requestLogger);

    // Global rate limiting
    this.app.use(createRateLimiter('global'));

    // Health check endpoint (before other middleware)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'miniprogram-service',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: config.env
      });
    });

    // Graceful shutdown middleware
    this.app.use((req, res, next) => {
      if (this.isShuttingDown) {
        res.status(503).json({
          success: false,
          message: '服务正在关闭中，请稍后重试',
          code: 'SERVICE_SHUTTING_DOWN'
        });
        return;
      }
      next();
    });
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // API routes
    this.app.use('/api', routes);

    // Static file serving (if needed)
    if (config.static && config.static.enabled) {
      this.app.use('/static', express.static(config.static.path, {
        maxAge: config.static.maxAge,
        etag: true,
        lastModified: true
      }));
    }

    // Proxy to other services (if configured)
    if (config.proxy && config.proxy.enabled) {
      Object.entries(config.proxy.routes).forEach(([path, target]) => {
        this.app.use(path, createProxyMiddleware({
          target,
          changeOrigin: true,
          pathRewrite: {
            [`^${path}`]: ''
          },
          onError: (err, req, res) => {
            logger.error(`代理错误 ${path} -> ${target}:`, err);
            res.status(502).json({
              success: false,
              message: '代理服务不可用',
              code: 'PROXY_ERROR'
            });
          }
        }));
      });
    }

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '微信小程序服务运行中',
        service: 'miniprogram-service',
        version: process.env.npm_package_version || '1.0.0',
        documentation: '/api-docs',
        health: '/health'
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Error logging middleware
    this.app.use(errorLogger);

    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(globalErrorHandler);
  }

  /**
   * Setup Swagger API documentation
   */
  setupSwagger() {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: '微信小程序服务 API',
          version: process.env.npm_package_version || '1.0.0',
          description: '微信小程序后端服务API文档',
          contact: {
            name: 'API Support',
            email: 'support@wedraw.com'
          }
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: '开发环境'
          },
          {
            url: config.baseUrl || `http://localhost:${config.port}`,
            description: '生产环境'
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
      apis: [
        './src/routes/*.js',
        './src/controllers/*.js',
        './src/models/*.js'
      ]
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);
    
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: '微信小程序服务 API 文档'
    }));

    // Serve swagger spec as JSON
    this.app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  /**
   * Start the server
   */
  async start() {
    try {
      await this.initialize();
      
      this.server = this.app.listen(config.port, config.host, () => {
        logger.info(`微信小程序服务启动成功`);
        logger.info(`服务地址: http://${config.host}:${config.port}`);
        logger.info(`API文档: http://${config.host}:${config.port}/api-docs`);
        logger.info(`健康检查: http://${config.host}:${config.port}/health`);
        logger.info(`环境: ${config.env}`);
      });

      // Setup graceful shutdown
      setupGracefulShutdown(this.server, async () => {
        this.isShuttingDown = true;
        logger.info('开始优雅关闭服务...');
        
        // Close database connections
        try {
          const { sequelize } = require('./models');
          await sequelize.close();
          logger.info('数据库连接已关闭');
        } catch (error) {
          logger.error('关闭数据库连接时出错:', error);
        }
        
        logger.info('服务已优雅关闭');
      });

      // Handle server errors
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`端口 ${config.port} 已被占用`);
        } else {
          logger.error('服务器错误:', error);
        }
        process.exit(1);
      });

    } catch (error) {
      logger.error('启动服务失败:', error);
      process.exit(1);
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
  }

  /**
   * Get Express app instance
   */
  getApp() {
    return this.app;
  }
}

// Create and export service instance
const miniProgramService = new MiniProgramService();

// Start service if this file is run directly
if (require.main === module) {
  miniProgramService.start().catch((error) => {
    logger.error('启动失败:', error);
    process.exit(1);
  });
}

module.exports = miniProgramService;

// Export app for testing
module.exports.app = miniProgramService.getApp();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
  logger.error('Promise:', promise);
  process.exit(1);
});

// Handle process signals
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，开始优雅关闭...');
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，开始优雅关闭...');
});