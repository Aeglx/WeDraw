const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * JWT认证中间件
 * 验证请求头中的访问令牌
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn('Authentication failed: No token provided', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });
    
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      logger.warn('Authentication failed: Invalid token', {
        error: err.message,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method
      });
      
      const message = err.name === 'TokenExpiredError' ? '访问令牌已过期' : '无效的访问令牌';
      const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
      
      return res.status(401).json({
        success: false,
        message,
        code
      });
    }

    req.user = user;
    logger.debug('Authentication successful', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });
    
    next();
  });
};

/**
 * 角色权限验证中间件
 * @param {Array} allowedRoles - 允许的角色列表
 */
const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role];
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user.id,
        userRoles,
        requiredRoles: allowedRoles,
        ip: req.ip,
        url: req.originalUrl
      });
      
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续执行
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

/**
 * API密钥认证中间件
 * 用于内部服务间调用
 */
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API密钥缺失',
      code: 'API_KEY_MISSING'
    });
  }

  if (!validApiKeys.includes(apiKey)) {
    logger.warn('API Key authentication failed', {
      providedKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      url: req.originalUrl
    });
    
    return res.status(401).json({
      success: false,
      message: '无效的API密钥',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRoles,
  optionalAuth,
  authenticateApiKey
};