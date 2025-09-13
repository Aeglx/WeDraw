const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

// 不需要认证的路径
const PUBLIC_PATHS = [
  '/health',
  '/api/user/login',
  '/api/user/register',
  '/api/user/refresh-token',
  '/api/wechat/webhook',
  '/api/wecom/webhook',
  '/api/miniprogram/webhook'
];

// 需要特殊处理的路径（如文件上传、下载）
const SPECIAL_PATHS = [
  '/api/upload',
  '/api/download'
];

/**
 * JWT认证中间件
 */
const authMiddleware = async (req, res, next) => {
  try {
    const path = req.path;
    const method = req.method;
    
    // 记录请求
    logger.request(req, `${method} ${path}`);
    
    // 检查是否为公开路径
    if (isPublicPath(path)) {
      return next();
    }
    
    // 获取token
    const token = extractToken(req);
    if (!token) {
      logger.security('Missing authentication token', {
        path,
        method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_TOKEN_MISSING',
        message: 'Please provide a valid authentication token'
      });
    }
    
    // 验证token
    const decoded = await verifyToken(token);
    if (!decoded) {
      logger.security('Invalid authentication token', {
        path,
        method,
        ip: req.ip,
        token: token.substring(0, 20) + '...'
      });
      
      return res.status(401).json({
        error: 'Invalid authentication token',
        code: 'AUTH_TOKEN_INVALID',
        message: 'The provided token is invalid or expired'
      });
    }
    
    // 检查token是否在黑名单中
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      logger.security('Blacklisted token used', {
        path,
        method,
        userId: decoded.id,
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Token has been revoked',
        code: 'AUTH_TOKEN_REVOKED',
        message: 'This token has been revoked, please login again'
      });
    }
    
    // 检查用户权限
    const hasPermission = await checkPermission(decoded, path, method);
    if (!hasPermission) {
      logger.security('Insufficient permissions', {
        path,
        method,
        userId: decoded.id,
        role: decoded.role,
        ip: req.ip
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'AUTH_PERMISSION_DENIED',
        message: 'You do not have permission to access this resource'
      });
    }
    
    // 更新用户最后活动时间
    await updateLastActivity(decoded.id);
    
    // 将用户信息添加到请求对象
    req.user = decoded;
    req.token = token;
    
    // 记录成功认证
    logger.audit('Authentication successful', decoded.id, {
      path,
      method,
      role: decoded.role
    });
    
    next();
    
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    
    return res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * 检查是否为公开路径
 */
function isPublicPath(path) {
  return PUBLIC_PATHS.some(publicPath => {
    if (publicPath.endsWith('*')) {
      return path.startsWith(publicPath.slice(0, -1));
    }
    return path === publicPath || path.startsWith(publicPath + '/');
  });
}

/**
 * 从请求中提取token
 */
function extractToken(req) {
  // 从Authorization header中提取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 从query参数中提取（用于特殊情况，如文件下载）
  if (req.query.token) {
    return req.query.token;
  }
  
  // 从cookie中提取（如果配置了）
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
}

/**
 * 验证JWT token
 */
async function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    const decoded = jwt.verify(token, secret);
    
    // 检查token是否过期
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.security('Invalid JWT token', { error: error.message });
    } else if (error.name === 'TokenExpiredError') {
      logger.security('Expired JWT token', { error: error.message });
    } else {
      logger.error('JWT verification error:', error);
    }
    return null;
  }
}

/**
 * 检查token是否在黑名单中
 */
async function isTokenBlacklisted(token) {
  try {
    if (!redisClient.isReady()) {
      return false; // 如果Redis不可用，不阻止访问
    }
    
    const key = `blacklist:token:${token}`;
    const result = await redisClient.get(key);
    return result !== null;
  } catch (error) {
    logger.error('Error checking token blacklist:', error);
    return false; // 出错时不阻止访问
  }
}

/**
 * 检查用户权限
 */
async function checkPermission(user, path, method) {
  try {
    // 超级管理员拥有所有权限
    if (user.role === 'super_admin') {
      return true;
    }
    
    // 管理员拥有大部分权限
    if (user.role === 'admin') {
      // 管理员不能访问系统管理相关接口
      if (path.startsWith('/api/user/admin') || path.startsWith('/api/system')) {
        return false;
      }
      return true;
    }
    
    // 普通用户权限检查
    if (user.role === 'user') {
      // 只能访问自己的数据
      if (path.includes('/profile') || path.includes('/settings')) {
        return true;
      }
      
      // 可以访问公共数据（只读）
      if (method === 'GET' && (
        path.startsWith('/api/wechat/public') ||
        path.startsWith('/api/points/goods') ||
        path.startsWith('/api/miniprogram/public')
      )) {
        return true;
      }
      
      return false;
    }
    
    // 默认拒绝
    return false;
  } catch (error) {
    logger.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * 更新用户最后活动时间
 */
async function updateLastActivity(userId) {
  try {
    if (!redisClient.isReady()) {
      return;
    }
    
    const key = `user:activity:${userId}`;
    const timestamp = Date.now();
    await redisClient.set(key, timestamp, 3600); // 1小时过期
  } catch (error) {
    logger.error('Error updating last activity:', error);
  }
}

/**
 * 将token加入黑名单
 */
const blacklistToken = async (token, expiresIn = 3600) => {
  try {
    if (!redisClient.isReady()) {
      return false;
    }
    
    const key = `blacklist:token:${token}`;
    await redisClient.set(key, '1', expiresIn);
    return true;
  } catch (error) {
    logger.error('Error blacklisting token:', error);
    return false;
  }
};

/**
 * 生成新的JWT token
 */
const generateToken = (payload, expiresIn = '2h') => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    return jwt.sign(payload, secret, { expiresIn });
  } catch (error) {
    logger.error('Error generating token:', error);
    return null;
  }
};

module.exports = {
  authMiddleware,
  blacklistToken,
  generateToken,
  verifyToken,
  isPublicPath
};