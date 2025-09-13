const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

/**
 * 公开路径配置
 */
const publicPaths = [
  '/health',
  '/api/docs',
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh-token',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/resend-verification'
];

/**
 * 检查路径是否为公开路径
 */
function isPublicPath(path) {
  return publicPaths.some(publicPath => {
    if (publicPath.includes('*')) {
      const regex = new RegExp(publicPath.replace('*', '.*'));
      return regex.test(path);
    }
    return path === publicPath || path.startsWith(publicPath);
  });
}

/**
 * JWT认证中间件
 */
const authenticate = async (req, res, next) => {
  try {
    // 检查是否为公开路径
    if (isPublicPath(req.path)) {
      return next();
    }

    // 获取token
    const token = extractToken(req);
    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    // 检查token是否在黑名单中
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked', 401);
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 尝试从缓存获取用户信息
    let user = await getUserFromCache(decoded.id);
    
    if (!user) {
      // 从数据库获取用户信息
      user = await User.findByPk(decoded.id);
      if (!user) {
        throw new AppError('User not found', 401);
      }
      
      // 缓存用户信息
      await cacheUser(user);
    }

    // 检查用户状态
    if (user.status !== 'active') {
      throw new AppError('Account is not active', 401);
    }

    // 将用户信息添加到请求对象
    req.user = user;
    req.token = token;
    
    // 记录访问日志
    logger.debug('User authenticated', {
      userId: user.id,
      username: user.username,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired', 401));
    }
    next(error);
  }
};

/**
 * 可选认证中间件（不强制要求登录）
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      // 检查token是否在黑名单中
      const isBlacklisted = await isTokenBlacklisted(token);
      if (!isBlacklisted) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // 获取用户信息
          let user = await getUserFromCache(decoded.id);
          if (!user) {
            user = await User.findByPk(decoded.id);
            if (user && user.status === 'active') {
              await cacheUser(user);
            }
          }
          
          if (user && user.status === 'active') {
            req.user = user;
            req.token = token;
          }
        } catch (error) {
          // 忽略token验证错误，继续处理请求
          logger.debug('Optional auth failed:', error.message);
        }
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败不应该阻止请求
    logger.debug('Optional auth error:', error.message);
    next();
  }
};

/**
 * 权限验证中间件
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      if (roles.length > 0 && !roles.includes(req.user.role)) {
        logger.security('UNAUTHORIZED_ACCESS', req, {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles
        });
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 权限检查中间件（基于具体权限）
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      if (!req.user.hasPermission(permission)) {
        logger.security('PERMISSION_DENIED', req, {
          userId: req.user.id,
          userRole: req.user.role,
          requiredPermission: permission
        });
        throw new AppError('Permission denied', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 资源所有者验证中间件
 */
const requireOwnership = (resourceIdParam = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // 管理员可以访问所有资源
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // 如果资源ID就是用户ID，直接比较
      if (resourceIdParam === 'userId' || resourceIdParam === 'id') {
        if (resourceId !== userId) {
          throw new AppError('Access denied', 403);
        }
        return next();
      }

      // 这里可以根据具体业务逻辑检查资源所有权
      // 例如：检查文章、评论等是否属于当前用户
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 提取请求中的token
 */
function extractToken(req) {
  let token = null;

  // 从Authorization header获取
  const authHeader = req.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 从查询参数获取（不推荐，仅用于特殊情况）
  if (!token && req.query.token) {
    token = req.query.token;
  }

  return token;
}

/**
 * 检查token是否在黑名单中
 */
async function isTokenBlacklisted(token) {
  try {
    const blacklistKey = `blacklist:${token}`;
    const result = await redisClient.exists(blacklistKey);
    return result === 1;
  } catch (error) {
    logger.error('Error checking token blacklist:', error);
    return false;
  }
}

/**
 * 将token加入黑名单
 */
async function blacklistToken(token, expiresIn = null) {
  try {
    const blacklistKey = `blacklist:${token}`;
    
    if (expiresIn) {
      await redisClient.set(blacklistKey, '1', expiresIn);
    } else {
      // 如果没有指定过期时间，使用token的剩余有效期
      try {
        const decoded = jwt.decode(token);
        const now = Math.floor(Date.now() / 1000);
        const ttl = decoded.exp - now;
        
        if (ttl > 0) {
          await redisClient.set(blacklistKey, '1', ttl);
        }
      } catch (error) {
        // 如果无法解析token，设置默认过期时间
        await redisClient.set(blacklistKey, '1', 7 * 24 * 3600); // 7天
      }
    }
    
    logger.info('Token blacklisted:', { token: token.substring(0, 20) + '...' });
  } catch (error) {
    logger.error('Error blacklisting token:', error);
  }
}

/**
 * 从缓存获取用户信息
 */
async function getUserFromCache(userId) {
  try {
    const cacheKey = `user:${userId}`;
    const userData = await redisClient.get(cacheKey);
    
    if (userData) {
      // 创建User实例
      const user = new User(userData);
      user.isNewRecord = false;
      return user;
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting user from cache:', error);
    return null;
  }
}

/**
 * 缓存用户信息
 */
async function cacheUser(user) {
  try {
    const cacheKey = `user:${user.id}`;
    const userData = user.getFullProfile();
    await redisClient.set(cacheKey, userData, 3600); // 1小时
  } catch (error) {
    logger.error('Error caching user:', error);
  }
}

/**
 * 清除用户缓存
 */
async function clearUserCache(userId) {
  try {
    const cacheKey = `user:${userId}`;
    await redisClient.del(cacheKey);
  } catch (error) {
    logger.error('Error clearing user cache:', error);
  }
}

/**
 * 生成JWT token
 */
function generateToken(payload, options = {}) {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'wedraw-user-center',
    audience: 'wedraw-app'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    ...defaultOptions,
    ...options
  });
}

/**
 * 验证JWT token
 */
function verifyToken(token, options = {}) {
  const defaultOptions = {
    issuer: 'wedraw-user-center',
    audience: 'wedraw-app'
  };

  return jwt.verify(token, process.env.JWT_SECRET, {
    ...defaultOptions,
    ...options
  });
}

/**
 * 解码JWT token（不验证）
 */
function decodeToken(token) {
  return jwt.decode(token, { complete: true });
}

/**
 * 检查token是否即将过期
 */
function isTokenExpiringSoon(token, thresholdMinutes = 30) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const threshold = thresholdMinutes * 60;
    
    return (decoded.exp - now) <= threshold;
  } catch (error) {
    return false;
  }
}

/**
 * 刷新token中间件
 */
const refreshTokenIfNeeded = async (req, res, next) => {
  try {
    if (req.token && req.user && isTokenExpiringSoon(req.token)) {
      const newToken = generateToken({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status
      });
      
      // 将新token添加到响应头
      res.set('X-New-Token', newToken);
      
      logger.debug('Token refreshed for user:', {
        userId: req.user.id,
        username: req.user.username
      });
    }
    
    next();
  } catch (error) {
    // 刷新失败不应该阻止请求
    logger.error('Token refresh failed:', error);
    next();
  }
};

/**
 * API密钥认证中间件（用于服务间调用）
 */
const authenticateApiKey = (req, res, next) => {
  try {
    const apiKey = req.get('X-API-Key');
    
    if (!apiKey) {
      throw new AppError('API key is required', 401);
    }
    
    const validApiKeys = (process.env.API_KEYS || '').split(',');
    
    if (!validApiKeys.includes(apiKey)) {
      logger.security('INVALID_API_KEY', req, {
        apiKey: apiKey.substring(0, 8) + '...'
      });
      throw new AppError('Invalid API key', 401);
    }
    
    // 标记为API调用
    req.isApiCall = true;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 速率限制豁免中间件（为认证用户提供更高的限制）
 */
const rateLimitExemption = (req, res, next) => {
  if (req.user) {
    // 为认证用户设置更高的速率限制
    req.rateLimitMultiplier = req.user.role === 'admin' ? 10 : 3;
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requirePermission,
  requireOwnership,
  blacklistToken,
  clearUserCache,
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpiringSoon,
  refreshTokenIfNeeded,
  authenticateApiKey,
  rateLimitExemption,
  isPublicPath
};