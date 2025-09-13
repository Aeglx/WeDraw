const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');
const { CacheHelper } = require('../utils/cache');

/**
 * 认证中间件
 * 验证JWT token并获取用户信息
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('缺少认证令牌');
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    if (!token) {
      throw new UnauthorizedError('认证令牌无效');
    }

    // 验证JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('认证令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('认证令牌无效');
      } else {
        throw new UnauthorizedError('认证失败');
      }
    }

    // 从缓存或数据库获取用户信息
    let user;
    const cacheKey = CacheHelper.getUserKey(decoded.userId);
    
    try {
      user = await CacheHelper.get(cacheKey);
    } catch (error) {
      logger.logError('auth_cache_error', error, { userId: decoded.userId });
    }

    if (!user) {
      user = await User.findByPk(decoded.userId, {
        attributes: {
          exclude: ['password', 'passwordResetToken', 'passwordResetExpires']
        }
      });

      if (!user) {
        throw new UnauthorizedError('用户不存在');
      }

      // 缓存用户信息
      try {
        await CacheHelper.set(cacheKey, user, 300); // 缓存5分钟
      } catch (error) {
        logger.logError('auth_cache_set_error', error, { userId: decoded.userId });
      }
    }

    // 检查用户状态
    if (user.status === 'inactive') {
      throw new UnauthorizedError('账户已被禁用');
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedError('账户已被暂停');
    }

    // 检查token版本（用于强制登出）
    if (decoded.tokenVersion && user.tokenVersion && decoded.tokenVersion < user.tokenVersion) {
      throw new UnauthorizedError('认证令牌已失效，请重新登录');
    }

    // 将用户信息添加到请求对象
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;

    // 记录认证日志
    logger.logHttpRequest(req, {
      userId: user.id,
      username: user.username,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    next();
  } catch (error) {
    logger.logError('authentication_error', error, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    next(error);
  }
};

/**
 * 可选认证中间件
 * 如果有token则验证，没有则跳过
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // 有token则进行认证
    return authenticate(req, res, next);
  } catch (error) {
    // 认证失败也继续执行，但不设置用户信息
    logger.logError('optional_authentication_error', error, {
      path: req.path,
      method: req.method
    });
    next();
  }
};

/**
 * 权限验证中间件
 * @param {string|string[]} roles - 允许的角色列表
 * @param {object} options - 选项配置
 */
const authorize = (roles = [], options = {}) => {
  // 确保roles是数组
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      // 检查是否已认证
      if (!req.user) {
        throw new UnauthorizedError('需要登录后访问');
      }

      const user = req.user;

      // 超级管理员拥有所有权限
      if (user.role === 'super_admin') {
        return next();
      }

      // 检查角色权限
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        throw new ForbiddenError('权限不足');
      }

      // 检查用户等级限制
      if (options.minLevel && user.level < options.minLevel) {
        throw new ForbiddenError(`需要${options.minLevel}级以上用户`);
      }

      // 检查VIP权限
      if (options.requireVip && !user.isVip) {
        throw new ForbiddenError('需要VIP权限');
      }

      // 检查实名认证
      if (options.requireVerified && !user.isVerified) {
        throw new ForbiddenError('需要完成实名认证');
      }

      // 检查资源所有权
      if (options.checkOwnership && req.params.id) {
        const resourceId = parseInt(req.params.id);
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          // 这里可以根据具体业务逻辑检查资源所有权
          // 例如检查订单是否属于当前用户等
        }
      }

      logger.logBusinessOperation('auth', 'authorize_success', {
        userId: user.id,
        userRole: user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      logger.logError('authorization_error', error, {
        userId: req.user?.id,
        userRole: req.user?.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method
      });
      next(error);
    }
  };
};

/**
 * 检查资源所有权中间件
 * @param {string} resourceModel - 资源模型名称
 * @param {string} userIdField - 用户ID字段名，默认为'userId'
 */
const checkOwnership = (resourceModel, userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('需要登录后访问');
      }

      const user = req.user;
      const resourceId = req.params.id;

      // 管理员跳过所有权检查
      if (user.role === 'admin' || user.role === 'super_admin') {
        return next();
      }

      if (!resourceId) {
        throw new ValidationError('缺少资源ID');
      }

      // 动态导入模型
      const models = require('../models');
      const Model = models[resourceModel];
      
      if (!Model) {
        throw new Error(`模型 ${resourceModel} 不存在`);
      }

      const resource = await Model.findByPk(resourceId);
      if (!resource) {
        throw new NotFoundError('资源不存在');
      }

      if (resource[userIdField] !== user.id) {
        throw new ForbiddenError('无权访问此资源');
      }

      // 将资源添加到请求对象中，避免重复查询
      req.resource = resource;

      next();
    } catch (error) {
      logger.logError('ownership_check_error', error, {
        userId: req.user?.id,
        resourceModel,
        resourceId: req.params.id,
        userIdField
      });
      next(error);
    }
  };
};

/**
 * API密钥认证中间件
 * 用于第三方服务调用
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      throw new UnauthorizedError('缺少API密钥');
    }

    // 验证API密钥
    const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
    
    if (!validApiKeys.includes(apiKey)) {
      throw new UnauthorizedError('API密钥无效');
    }

    // 记录API调用
    logger.logBusinessOperation('api', 'api_key_auth', {
      apiKey: apiKey.substring(0, 8) + '***', // 只记录前8位
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    req.apiAuthenticated = true;
    next();
  } catch (error) {
    logger.logError('api_key_authentication_error', error, {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    next(error);
  }
};

/**
 * 刷新token中间件
 * 检查token是否即将过期，如果是则生成新token
 */
const refreshTokenIfNeeded = (req, res, next) => {
  try {
    if (!req.user || !req.tokenPayload) {
      return next();
    }

    const { exp } = req.tokenPayload;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = exp - now;

    // 如果token在30分钟内过期，生成新token
    if (timeUntilExpiry < 1800) {
      const newToken = jwt.sign(
        {
          userId: req.user.id,
          username: req.user.username,
          role: req.user.role,
          tokenVersion: req.user.tokenVersion || 1
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // 在响应头中返回新token
      res.setHeader('X-New-Token', newToken);
      
      logger.logBusinessOperation('auth', 'token_refreshed', {
        userId: req.user.id,
        oldTokenExp: exp,
        timeUntilExpiry
      });
    }

    next();
  } catch (error) {
    logger.logError('token_refresh_error', error, {
      userId: req.user?.id
    });
    next(); // 刷新失败不影响正常流程
  }
};

/**
 * 限制同一用户并发请求中间件
 */
const limitConcurrentRequests = (maxConcurrent = 10) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const currentCount = userRequests.get(userId) || 0;

    if (currentCount >= maxConcurrent) {
      logger.logBusinessOperation('auth', 'concurrent_limit_exceeded', {
        userId,
        currentCount,
        maxConcurrent,
        path: req.path
      });
      throw new ForbiddenError('并发请求数量超限');
    }

    // 增加计数
    userRequests.set(userId, currentCount + 1);

    // 请求结束时减少计数
    const originalEnd = res.end;
    res.end = function(...args) {
      const newCount = userRequests.get(userId) - 1;
      if (newCount <= 0) {
        userRequests.delete(userId);
      } else {
        userRequests.set(userId, newCount);
      }
      originalEnd.apply(this, args);
    };

    next();
  };
};

/**
 * 验证用户状态中间件
 */
const validateUserStatus = (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const user = req.user;

    // 检查账户状态
    if (user.status === 'deleted') {
      throw new UnauthorizedError('账户已被删除');
    }

    if (user.status === 'locked') {
      throw new UnauthorizedError('账户已被锁定，请联系客服');
    }

    // 检查账户过期
    if (user.expiresAt && new Date() > user.expiresAt) {
      throw new UnauthorizedError('账户已过期');
    }

    // 检查密码是否需要更新
    if (user.passwordExpired) {
      res.setHeader('X-Password-Expired', 'true');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  checkOwnership,
  authenticateApiKey,
  refreshTokenIfNeeded,
  limitConcurrentRequests,
  validateUserStatus
};