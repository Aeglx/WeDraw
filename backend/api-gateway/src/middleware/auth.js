const jwt = require('jsonwebtoken');
const redis = require('redis');
const logger = require('../utils/logger');
const config = require('../../../../config.json');

// Redis客户端
let redisClient;

// 初始化Redis连接
const initRedis = async () => {
  try {
    const redisConfig = config.database.redis.instances.gateway;
    redisClient = redis.createClient({
      host: config.database.redis.host,
      port: redisConfig.port,
      db: redisConfig.db,
      password: process.env.REDIS_PASSWORD || ''
    });
    
    await redisClient.connect();
    logger.info('Redis连接成功');
  } catch (error) {
    logger.error('Redis连接失败:', error.message);
  }
};

// 初始化Redis
initRedis();

/**
 * JWT认证中间件
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 获取token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
        data: null,
        timestamp: Date.now()
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证token格式
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '认证令牌格式错误',
        data: null,
        timestamp: Date.now()
      });
    }

    // 检查token是否在黑名单中
    if (redisClient && redisClient.isOpen) {
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          code: 401,
          message: '认证令牌已失效',
          data: null,
          timestamp: Date.now()
        });
      }
    }

    // 验证JWT token
    const jwtSecret = process.env.JWT_SECRET || config.security.jwt.secret;
    const decoded = jwt.verify(token, jwtSecret);

    // 检查token是否过期
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已过期',
        data: null,
        timestamp: Date.now()
      });
    }

    // 从Redis获取用户信息（如果可用）
    let userInfo = decoded;
    if (redisClient && redisClient.isOpen) {
      try {
        const cachedUser = await redisClient.get(`user:${decoded.id}`);
        if (cachedUser) {
          userInfo = { ...decoded, ...JSON.parse(cachedUser) };
        }
      } catch (error) {
        logger.warn('获取缓存用户信息失败:', error.message);
      }
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      role: userInfo.role,
      permissions: userInfo.permissions || [],
      iat: decoded.iat,
      exp: decoded.exp
    };

    // 记录访问日志
    logger.info(`用户认证成功: ${userInfo.username} (${userInfo.id}) 访问 ${req.method} ${req.path}`);

    next();
  } catch (error) {
    logger.error('认证中间件错误:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌无效',
        data: null,
        timestamp: Date.now()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已过期',
        data: null,
        timestamp: Date.now()
      });
    }

    return res.status(500).json({
      code: 500,
      message: '认证服务异常',
      data: null,
      timestamp: Date.now()
    });
  }
};

/**
 * 权限检查中间件
 * @param {string|Array} requiredPermissions 需要的权限
 */
const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: '用户未认证',
          data: null,
          timestamp: Date.now()
        });
      }

      // 超级管理员拥有所有权限
      if (req.user.role === 'super_admin') {
        return next();
      }

      // 检查权限
      const userPermissions = req.user.permissions || [];
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission) || userPermissions.includes('*')
      );

      if (!hasPermission) {
        logger.warn(`用户 ${req.user.username} 尝试访问无权限的资源: ${req.path}`);
        return res.status(403).json({
          code: 403,
          message: '权限不足',
          data: null,
          timestamp: Date.now()
        });
      }

      next();
    } catch (error) {
      logger.error('权限检查中间件错误:', error.message);
      return res.status(500).json({
        code: 500,
        message: '权限检查异常',
        data: null,
        timestamp: Date.now()
      });
    }
  };
};

/**
 * 角色检查中间件
 * @param {string|Array} requiredRoles 需要的角色
 */
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          code: 401,
          message: '用户未认证',
          data: null,
          timestamp: Date.now()
        });
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(req.user.role)) {
        logger.warn(`用户 ${req.user.username} 角色不匹配: 需要 ${roles.join('|')}, 当前 ${req.user.role}`);
        return res.status(403).json({
          code: 403,
          message: '角色权限不足',
          data: null,
          timestamp: Date.now()
        });
      }

      next();
    } catch (error) {
      logger.error('角色检查中间件错误:', error.message);
      return res.status(500).json({
        code: 500,
        message: '角色检查异常',
        data: null,
        timestamp: Date.now()
      });
    }
  };
};

/**
 * 将token加入黑名单
 * @param {string} token JWT token
 * @param {number} expireTime 过期时间（秒）
 */
const blacklistToken = async (token, expireTime) => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(`blacklist:${token}`, expireTime, '1');
      logger.info('Token已加入黑名单');
    }
  } catch (error) {
    logger.error('加入黑名单失败:', error.message);
  }
};

module.exports = {
  authMiddleware,
  checkPermission,
  checkRole,
  blacklistToken
};