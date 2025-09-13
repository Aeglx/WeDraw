const jwt = require('jsonwebtoken');
const { User, Session } = require('../models');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * JWT令牌认证中间件
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失',
        code: 'TOKEN_MISSING'
      });
    }

    // 验证JWT令牌
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 检查会话是否存在且有效
    const session = await Session.findOne({
      where: {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        isActive: true
      }
    });

    if (!session || !session.isValid()) {
      return res.status(401).json({
        success: false,
        message: '会话已过期或无效',
        code: 'SESSION_INVALID'
      });
    }

    // 获取用户信息
    const user = await User.findByPk(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用',
        code: 'USER_INVALID'
      });
    }

    // 更新会话最后活动时间
    await session.refresh();

    // 将用户信息和会话信息添加到请求对象
    req.user = user;
    req.session = session;
    req.token = token;

    next();
  } catch (error) {
    logger.error('Token authentication failed:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      success: false,
      message: '认证服务异常',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * 管理员权限检查中间件
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    if (req.user.role !== 'admin') {
      logger.warn(`User ${req.user.id} attempted to access admin endpoint`, {
        userId: req.user.id,
        role: req.user.role,
        endpoint: req.originalUrl
      });
      
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  } catch (error) {
    logger.error('Admin permission check failed:', error);
    return res.status(500).json({
      success: false,
      message: '权限检查异常',
      code: 'PERMISSION_CHECK_ERROR'
    });
  }
};

/**
 * 可选认证中间件（不强制要求认证）
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const session = await Session.findOne({
      where: {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        isActive: true
      }
    });

    if (session && session.isValid()) {
      const user = await User.findByPk(decoded.userId);
      if (user && user.status === 'active') {
        req.user = user;
        req.session = session;
        req.token = token;
        await session.refresh();
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    logger.debug('Optional authentication failed:', error);
    next();
  }
};

/**
 * 检查用户状态中间件
 */
const checkUserStatus = (allowedStatuses = ['active']) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    if (!allowedStatuses.includes(req.user.status)) {
      return res.status(403).json({
        success: false,
        message: '用户状态不允许访问此资源',
        code: 'USER_STATUS_FORBIDDEN',
        userStatus: req.user.status
      });
    }

    next();
  };
};

/**
 * 检查用户角色中间件
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`User ${req.user.id} with role ${req.user.role} attempted to access endpoint requiring roles: ${allowedRoles.join(', ')}`, {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl
      });
      
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'INSUFFICIENT_ROLE_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  checkUserStatus,
  requireRole
};