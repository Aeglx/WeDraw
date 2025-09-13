const express = require('express');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const adminRoutes = require('./adminRoutes');
const healthRoutes = require('./healthRoutes');
const databaseRoutes = require('./databaseRoutes');
const logger = require('../utils/logger');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * API版本信息
 */
router.get('/', (req, res) => {
  res.json({
    service: 'User Center Service',
    version: '1.0.0',
    description: 'WeDraw用户中心服务 - 提供用户认证、授权和个人信息管理功能',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      profile: '/api/v1/profile',
      admin: '/api/v1/admin',
      health: '/api/v1/health'
    },
    documentation: '/api/v1/docs',
    timestamp: new Date().toISOString()
  });
});

/**
 * 全局限流配置
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000次请求
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * 认证相关限流（更严格）
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 50, // 每个IP最多50次认证请求
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * 敏感操作限流（最严格）
 */
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每个IP最多10次敏感操作
  message: {
    success: false,
    message: 'Too many sensitive operations, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Sensitive operation rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      userId: req.user?.id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many sensitive operations, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * 请求日志中间件
 */
router.use((req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.info('API Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    requestId: req.id
  });
  
  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('API Response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      requestId: req.id
    });
  });
  
  next();
});

/**
 * 应用全局限流
 */
router.use(globalLimiter);

/**
 * 健康检查路由（无需认证和限流）
 */
router.use('/health', healthRoutes);

/**
 * 认证相关路由
 */
router.use('/auth', authLimiter, authRoutes);

/**
 * 用户相关路由
 */
router.use('/users', userRoutes);

/**
 * 个人资料路由（需要认证）
 */
router.use('/profile', authenticate, profileRoutes);

/**
 * 管理员路由（需要管理员权限）
 */
router.use('/admin', authenticate, adminRoutes);

/**
 * 数据库管理路由（需要管理员权限）
 */
router.use('/database', authenticate, databaseRoutes);

/**
 * API文档路由
 */
router.get('/docs', (req, res) => {
  res.json({
    title: 'WeDraw User Center API Documentation',
    version: '1.0.0',
    description: 'WeDraw用户中心服务API文档',
    baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
    endpoints: {
      authentication: {
        description: '用户认证相关接口',
        baseUrl: '/auth',
        endpoints: {
          'POST /register': '用户注册',
          'POST /login': '用户登录',
          'POST /login/phone': '手机验证码登录',
          'POST /logout': '用户登出',
          'POST /refresh': '刷新令牌',
          'POST /forgot-password': '忘记密码',
          'POST /reset-password': '重置密码',
          'POST /send-verification': '发送验证码',
          'POST /verify-email': '验证邮箱',
          'GET /sessions': '获取用户会话',
          'DELETE /sessions/:jti': '撤销特定会话'
        }
      },
      users: {
        description: '用户管理相关接口',
        baseUrl: '/users',
        endpoints: {
          'GET /': '获取用户列表（分页）',
          'GET /search': '搜索用户',
          'GET /:id': '获取用户公开信息',
          'GET /:id/posts': '获取用户发布的内容',
          'GET /:id/followers': '获取用户粉丝',
          'GET /:id/following': '获取用户关注',
          'POST /:id/follow': '关注用户',
          'DELETE /:id/follow': '取消关注用户'
        }
      },
      profile: {
        description: '个人资料管理接口',
        baseUrl: '/profile',
        endpoints: {
          'GET /': '获取个人信息',
          'PUT /': '更新个人信息',
          'POST /avatar': '上传头像',
          'PUT /password': '修改密码',
          'PUT /email': '修改邮箱',
          'PUT /phone': '修改手机号',
          'GET /preferences': '获取偏好设置',
          'PUT /preferences': '更新偏好设置',
          'GET /security': '获取安全设置',
          'PUT /security': '更新安全设置',
          'DELETE /': '删除账户'
        }
      },
      admin: {
        description: '管理员接口',
        baseUrl: '/admin',
        endpoints: {
          'GET /users': '管理员获取用户列表',
          'GET /users/:id': '管理员获取用户详情',
          'PUT /users/:id/status': '管理员更新用户状态',
          'DELETE /users/:id': '管理员删除用户',
          'GET /stats': '获取系统统计信息',
          'GET /logs': '获取系统日志',
          'POST /broadcast': '发送系统广播'
        }
      },
      health: {
        description: '健康检查接口',
        baseUrl: '/health',
        endpoints: {
          'GET /': '基础健康检查',
          'GET /detailed': '详细健康检查',
          'GET /ready': '就绪状态检查',
          'GET /live': '存活状态检查'
        }
      }
    },
    authentication: {
      type: 'Bearer Token',
      description: '大部分接口需要在请求头中包含 Authorization: Bearer <access_token>',
      tokenEndpoint: '/auth/login',
      refreshEndpoint: '/auth/refresh'
    },
    rateLimit: {
      global: '1000 requests per 15 minutes per IP',
      auth: '50 requests per 15 minutes per IP',
      sensitive: '10 requests per 1 hour per IP'
    },
    errorCodes: {
      400: 'Bad Request - 请求参数错误',
      401: 'Unauthorized - 未认证或令牌无效',
      403: 'Forbidden - 权限不足',
      404: 'Not Found - 资源不存在',
      409: 'Conflict - 资源冲突',
      422: 'Unprocessable Entity - 数据验证失败',
      429: 'Too Many Requests - 请求频率超限',
      500: 'Internal Server Error - 服务器内部错误'
    },
    responseFormat: {
      success: {
        success: true,
        message: 'Success message',
        data: 'Response data'
      },
      error: {
        success: false,
        message: 'Error message',
        errors: 'Detailed error information (optional)'
      }
    }
  });
});

/**
 * 404处理
 */
router.use('*', (req, res) => {
  logger.warn('API endpoint not found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/profile',
      '/api/v1/admin',
      '/api/v1/health',
      '/api/v1/docs'
    ]
  });
});

/**
 * 错误处理中间件
 */
router.use((error, req, res, next) => {
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id,
    requestId: req.id
  });

  // 数据库错误
  if (error.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  // 数据库唯一约束错误
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      field: error.errors[0]?.path
    });
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // 默认错误
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
});

module.exports = router;