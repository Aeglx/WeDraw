const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');

/**
 * JWT认证中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '缺少认证令牌',
        code: 'MISSING_TOKEN'
      });
    }
    
    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    // 检查令牌是否在黑名单中
    const isBlacklisted = await cacheService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: '令牌已失效',
        code: 'TOKEN_BLACKLISTED'
      });
    }
    
    // 验证JWT令牌
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 检查令牌是否过期
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({
        success: false,
        message: '令牌已过期',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      permissions: decoded.permissions || [],
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    // 记录认证成功日志
    logger.info('Authentication successful', {
      userId: req.user.id,
      username: req.user.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    next();
  } catch (error) {
    logger.error('Authentication failed:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的令牌',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '认证服务异常',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * 权限检查中间件
 * @param {string|Array} requiredPermissions - 需要的权限
 * @returns {Function} Express中间件函数
 */
const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证',
          code: 'USER_NOT_AUTHENTICATED'
        });
      }
      
      const userPermissions = req.user.permissions || [];
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];
      
      // 检查用户是否具有所需权限
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission) || 
        userPermissions.includes('*') || // 超级管理员权限
        req.user.role === 'admin' // 管理员角色
      );
      
      if (!hasPermission) {
        logger.warn('Authorization failed', {
          userId: req.user.id,
          username: req.user.username,
          requiredPermissions: permissions,
          userPermissions,
          path: req.path,
          method: req.method
        });
        
        return res.status(403).json({
          success: false,
          message: '权限不足',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissions
        });
      }
      
      logger.info('Authorization successful', {
        userId: req.user.id,
        username: req.user.username,
        permissions: permissions,
        path: req.path
      });
      
      next();
    } catch (error) {
      logger.error('Authorization error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        path: req.path
      });
      
      return res.status(500).json({
        success: false,
        message: '权限检查异常',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

/**
 * 角色检查中间件
 * @param {string|Array} requiredRoles - 需要的角色
 * @returns {Function} Express中间件函数
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户未认证',
          code: 'USER_NOT_AUTHENTICATED'
        });
      }
      
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      if (!roles.includes(req.user.role)) {
        logger.warn('Role check failed', {
          userId: req.user.id,
          username: req.user.username,
          userRole: req.user.role,
          requiredRoles: roles,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          message: '角色权限不足',
          code: 'INSUFFICIENT_ROLE',
          required: roles
        });
      }
      
      next();
    } catch (error) {
      logger.error('Role check error:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        path: req.path
      });
      
      return res.status(500).json({
        success: false,
        message: '角色检查异常',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * 可选认证中间件（不强制要求认证）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // 没有令牌，继续执行
    }
    
    const token = authHeader.substring(7);
    
    // 检查令牌是否在黑名单中
    const isBlacklisted = await cacheService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(); // 令牌在黑名单中，继续执行但不设置用户信息
    }
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // 检查令牌是否过期
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return next(); // 令牌过期，继续执行但不设置用户信息
      }
      
      // 设置用户信息
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        permissions: decoded.permissions || [],
        iat: decoded.iat,
        exp: decoded.exp
      };
    } catch (jwtError) {
      // JWT验证失败，继续执行但不设置用户信息
      logger.debug('Optional auth JWT verification failed:', jwtError.message);
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next(); // 出错时继续执行
  }
};

/**
 * 生成JWT令牌
 * @param {Object} payload - 令牌载荷
 * @param {Object} options - 令牌选项
 * @returns {string} JWT令牌
 */
const generateToken = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  };
  
  return jwt.sign(payload, config.jwt.secret, { ...defaultOptions, ...options });
};

/**
 * 将令牌加入黑名单
 * @param {string} token - 要加入黑名单的令牌
 * @param {number} ttl - 过期时间（秒）
 */
const blacklistToken = async (token, ttl = null) => {
  try {
    if (!ttl) {
      // 如果没有指定TTL，从令牌中获取剩余有效时间
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
      } else {
        ttl = 3600; // 默认1小时
      }
    }
    
    await cacheService.set(`blacklist:${token}`, '1', ttl);
    
    logger.info('Token blacklisted', {
      tokenHash: require('crypto').createHash('sha256').update(token).digest('hex').substring(0, 16),
      ttl
    });
  } catch (error) {
    logger.error('Failed to blacklist token:', error);
    throw error;
  }
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  optionalAuth,
  generateToken,
  blacklistToken
};