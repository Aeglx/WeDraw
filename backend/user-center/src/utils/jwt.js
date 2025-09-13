const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('./logger');
const { redisClient } = require('../config/redis');

/**
 * JWT工具类
 */
class JWTUtils {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    this.issuer = process.env.JWT_ISSUER || 'wedraw';
    this.audience = process.env.JWT_AUDIENCE || 'wedraw-users';
  }

  /**
   * 生成访问令牌
   */
  generateAccessToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        jti: this.generateJTI() // JWT ID，用于令牌唯一标识
      };

      return jwt.sign(tokenPayload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        algorithm: 'HS256'
      });
    } catch (error) {
      logger.error('Failed to generate access token:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * 生成刷新令牌
   */
  generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        userId: payload.userId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        jti: this.generateJTI()
      };

      return jwt.sign(tokenPayload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        algorithm: 'HS256'
      });
    } catch (error) {
      logger.error('Failed to generate refresh token:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * 生成令牌对（访问令牌 + 刷新令牌）
   */
  async generateTokenPair(payload) {
    try {
      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload);

      // 将刷新令牌存储到Redis，用于令牌轮换和撤销
      const refreshTokenKey = `refresh_token:${payload.userId}:${this.extractJTI(refreshToken)}`;
      const refreshTokenExpiry = this.getTokenExpiry(this.refreshTokenExpiry);
      
      await redisClient.setex(refreshTokenKey, refreshTokenExpiry, JSON.stringify({
        userId: payload.userId,
        createdAt: new Date().toISOString(),
        userAgent: payload.userAgent || 'unknown',
        ip: payload.ip || 'unknown'
      }));

      // 记录令牌生成日志
      logger.info('Token pair generated', {
        userId: payload.userId,
        userAgent: payload.userAgent,
        ip: payload.ip
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: this.getTokenExpiry(this.accessTokenExpiry),
        tokenType: 'Bearer'
      };
    } catch (error) {
      logger.error('Failed to generate token pair:', error);
      throw error;
    }
  }

  /**
   * 验证访问令牌
   */
  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      });

      // 检查令牌类型
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // 检查令牌是否在黑名单中
      const isBlacklisted = await this.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      return {
        valid: true,
        decoded,
        userId: decoded.userId
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'Token expired',
          expired: true
        };
      } else if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'Invalid token',
          malformed: true
        };
      } else {
        return {
          valid: false,
          error: error.message
        };
      }
    }
  }

  /**
   * 验证刷新令牌
   */
  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      });

      // 检查令牌类型
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // 检查令牌是否存在于Redis中
      const refreshTokenKey = `refresh_token:${decoded.userId}:${decoded.jti}`;
      const tokenData = await redisClient.get(refreshTokenKey);
      
      if (!tokenData) {
        throw new Error('Refresh token not found or expired');
      }

      return {
        valid: true,
        decoded,
        userId: decoded.userId,
        tokenData: JSON.parse(tokenData)
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'Refresh token expired',
          expired: true
        };
      } else if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'Invalid refresh token',
          malformed: true
        };
      } else {
        return {
          valid: false,
          error: error.message
        };
      }
    }
  }

  /**
   * 刷新令牌
   */
  async refreshTokens(refreshToken, newPayload = {}) {
    try {
      // 验证刷新令牌
      const verification = await this.verifyRefreshToken(refreshToken);
      
      if (!verification.valid) {
        throw new Error(verification.error);
      }

      const { decoded, tokenData } = verification;

      // 撤销旧的刷新令牌
      await this.revokeRefreshToken(refreshToken);

      // 生成新的令牌对
      const payload = {
        userId: decoded.userId,
        ...newPayload,
        userAgent: tokenData.userAgent,
        ip: tokenData.ip
      };

      const newTokens = await this.generateTokenPair(payload);

      logger.info('Tokens refreshed', {
        userId: decoded.userId,
        oldJti: decoded.jti
      });

      return newTokens;
    } catch (error) {
      logger.error('Failed to refresh tokens:', error);
      throw error;
    }
  }

  /**
   * 撤销访问令牌（加入黑名单）
   */
  async revokeAccessToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.jti) {
        throw new Error('Invalid token');
      }

      // 计算令牌剩余有效时间
      const now = Math.floor(Date.now() / 1000);
      const remainingTime = decoded.exp - now;

      if (remainingTime > 0) {
        // 将令牌JTI加入黑名单
        const blacklistKey = `token_blacklist:${decoded.jti}`;
        await redisClient.setex(blacklistKey, remainingTime, 'revoked');
      }

      logger.info('Access token revoked', {
        jti: decoded.jti,
        userId: decoded.userId
      });
    } catch (error) {
      logger.error('Failed to revoke access token:', error);
      throw error;
    }
  }

  /**
   * 撤销刷新令牌
   */
  async revokeRefreshToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.jti || !decoded.userId) {
        throw new Error('Invalid refresh token');
      }

      // 从Redis中删除刷新令牌
      const refreshTokenKey = `refresh_token:${decoded.userId}:${decoded.jti}`;
      await redisClient.del(refreshTokenKey);

      logger.info('Refresh token revoked', {
        jti: decoded.jti,
        userId: decoded.userId
      });
    } catch (error) {
      logger.error('Failed to revoke refresh token:', error);
      throw error;
    }
  }

  /**
   * 撤销用户的所有令牌
   */
  async revokeAllUserTokens(userId) {
    try {
      // 删除所有刷新令牌
      const pattern = `refresh_token:${userId}:*`;
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }

      logger.info('All user tokens revoked', {
        userId,
        revokedCount: keys.length
      });

      return {
        revokedRefreshTokens: keys.length
      };
    } catch (error) {
      logger.error('Failed to revoke all user tokens:', error);
      throw error;
    }
  }

  /**
   * 获取用户的活跃会话
   */
  async getUserSessions(userId) {
    try {
      const pattern = `refresh_token:${userId}:*`;
      const keys = await redisClient.keys(pattern);
      
      const sessions = [];
      
      for (const key of keys) {
        const tokenData = await redisClient.get(key);
        if (tokenData) {
          const data = JSON.parse(tokenData);
          const jti = key.split(':')[2];
          
          sessions.push({
            jti,
            createdAt: data.createdAt,
            userAgent: data.userAgent,
            ip: data.ip,
            ttl: await redisClient.ttl(key)
          });
        }
      }
      
      return sessions;
    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      throw error;
    }
  }

  /**
   * 撤销特定会话
   */
  async revokeSession(userId, jti) {
    try {
      const refreshTokenKey = `refresh_token:${userId}:${jti}`;
      const deleted = await redisClient.del(refreshTokenKey);
      
      if (deleted) {
        logger.info('Session revoked', { userId, jti });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      logger.error('Failed to revoke session:', error);
      throw error;
    }
  }

  /**
   * 检查令牌是否在黑名单中
   */
  async isTokenBlacklisted(jti) {
    try {
      const blacklistKey = `token_blacklist:${jti}`;
      const result = await redisClient.get(blacklistKey);
      return !!result;
    } catch (error) {
      logger.error('Failed to check token blacklist:', error);
      return false; // 出错时假设令牌有效
    }
  }

  /**
   * 生成JWT ID
   */
  generateJTI() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 从令牌中提取JTI
   */
  extractJTI(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded?.jti;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取令牌过期时间（秒）
   */
  getTokenExpiry(expiry) {
    if (typeof expiry === 'number') {
      return expiry;
    }
    
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };
    
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (match) {
      const [, value, unit] = match;
      return parseInt(value) * units[unit];
    }
    
    return 900; // 默认15分钟
  }

  /**
   * 解码令牌（不验证）
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取令牌统计信息
   */
  async getTokenStats() {
    try {
      const stats = {
        activeRefreshTokens: 0,
        blacklistedTokens: 0,
        userSessions: {}
      };
      
      // 统计活跃的刷新令牌
      const refreshTokenKeys = await redisClient.keys('refresh_token:*');
      stats.activeRefreshTokens = refreshTokenKeys.length;
      
      // 按用户统计会话
      for (const key of refreshTokenKeys) {
        const userId = key.split(':')[1];
        stats.userSessions[userId] = (stats.userSessions[userId] || 0) + 1;
      }
      
      // 统计黑名单令牌
      const blacklistKeys = await redisClient.keys('token_blacklist:*');
      stats.blacklistedTokens = blacklistKeys.length;
      
      return stats;
    } catch (error) {
      logger.error('Failed to get token stats:', error);
      return null;
    }
  }

  /**
   * 清理过期的黑名单令牌（Redis会自动处理，这里主要用于监控）
   */
  async cleanupExpiredTokens() {
    try {
      // Redis的TTL会自动清理过期键，这里主要用于统计
      const blacklistKeys = await redisClient.keys('token_blacklist:*');
      let expiredCount = 0;
      
      for (const key of blacklistKeys) {
        const ttl = await redisClient.ttl(key);
        if (ttl === -2) { // 键已过期
          expiredCount++;
        }
      }
      
      logger.info('Token cleanup completed', {
        totalBlacklisted: blacklistKeys.length,
        expired: expiredCount
      });
      
      return {
        totalBlacklisted: blacklistKeys.length,
        expired: expiredCount
      };
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error);
      return null;
    }
  }
}

// 创建JWT工具实例
const jwtUtils = new JWTUtils();

// 导出便捷方法
const generateAccessToken = (payload) => jwtUtils.generateAccessToken(payload);
const generateRefreshToken = (payload) => jwtUtils.generateRefreshToken(payload);
const generateTokenPair = (payload) => jwtUtils.generateTokenPair(payload);
const verifyAccessToken = (token) => jwtUtils.verifyAccessToken(token);
const verifyRefreshToken = (token) => jwtUtils.verifyRefreshToken(token);
const refreshTokens = (refreshToken, newPayload) => jwtUtils.refreshTokens(refreshToken, newPayload);
const revokeAccessToken = (token) => jwtUtils.revokeAccessToken(token);
const revokeRefreshToken = (token) => jwtUtils.revokeRefreshToken(token);
const revokeAllUserTokens = (userId) => jwtUtils.revokeAllUserTokens(userId);
const getUserSessions = (userId) => jwtUtils.getUserSessions(userId);
const revokeSession = (userId, jti) => jwtUtils.revokeSession(userId, jti);
const decodeToken = (token) => jwtUtils.decodeToken(token);
const getTokenStats = () => jwtUtils.getTokenStats();

module.exports = {
  jwtUtils,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokens,
  revokeAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getUserSessions,
  revokeSession,
  decodeToken,
  getTokenStats
};