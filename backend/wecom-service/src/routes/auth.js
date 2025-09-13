const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 登录速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP 15分钟内最多5次登录尝试
  message: {
    success: false,
    message: '登录尝试过于频繁，请稍后再试',
    code: 'TOO_MANY_LOGIN_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post('/login', 
  loginLimiter,
  [
    body('username')
      .notEmpty()
      .withMessage('用户名不能为空')
      .isLength({ min: 3, max: 50 })
      .withMessage('用户名长度必须在3-50个字符之间'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空')
      .isLength({ min: 6 })
      .withMessage('密码长度至少6个字符')
  ],
  async (req, res) => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      // 这里应该从数据库查询用户信息
      // 暂时使用硬编码的管理员账户
      const adminUser = {
        id: 1,
        username: 'admin',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'admin',
        name: '系统管理员',
        email: 'admin@wedraw.com'
      };

      // 验证用户名
      if (username !== adminUser.username) {
        logger.warn('Login failed: Invalid username', {
          username,
          ip: req.ip
        });
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, adminUser.password);
      if (!isValidPassword) {
        logger.warn('Login failed: Invalid password', {
          username,
          ip: req.ip
        });
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // 生成JWT令牌
      const tokenPayload = {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        name: adminUser.name
      };

      const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
        issuer: config.jwt.issuer
      });

      // 生成刷新令牌
      const refreshToken = jwt.sign(
        { id: adminUser.id, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: '7d', issuer: config.jwt.issuer }
      );

      logger.info('User login successful', {
        userId: adminUser.id,
        username: adminUser.username,
        ip: req.ip
      });

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: adminUser.id,
            username: adminUser.username,
            name: adminUser.name,
            role: adminUser.role,
            email: adminUser.email
          },
          accessToken,
          refreshToken,
          expiresIn: config.jwt.expiresIn
        }
      });
    } catch (error) {
      logger.error('Login error:', {
        error: error.message,
        stack: error.stack,
        ip: req.ip
      });
      res.status(500).json({
        success: false,
        message: '登录失败',
        code: 'LOGIN_ERROR'
      });
    }
  }
);

/**
 * @route POST /api/auth/refresh
 * @desc 刷新访问令牌
 * @access Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: '刷新令牌缺失',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // 验证刷新令牌
    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: '无效的刷新令牌',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // 这里应该从数据库获取用户信息
    const user = {
      id: decoded.id,
      username: 'admin',
      role: 'admin',
      name: '系统管理员'
    };

    // 生成新的访问令牌
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
        issuer: config.jwt.issuer
      }
    );

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: {
        accessToken: newAccessToken,
        expiresIn: config.jwt.expiresIn
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', {
      error: error.message,
      stack: error.stack
    });
    
    const message = error.name === 'TokenExpiredError' ? '刷新令牌已过期' : '无效的刷新令牌';
    res.status(401).json({
      success: false,
      message,
      code: 'REFRESH_TOKEN_ERROR'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc 用户登出
 * @access Private
 */
router.post('/logout', authenticateToken, (req, res) => {
  // 在实际应用中，这里应该将令牌加入黑名单
  logger.info('User logout', {
    userId: req.user.id,
    username: req.user.username,
    ip: req.ip
  });

  res.json({
    success: true,
    message: '登出成功'
  });
});

/**
 * @route GET /api/auth/profile
 * @desc 获取当前用户信息
 * @access Private
 */
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '获取用户信息成功',
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        name: req.user.name,
        role: req.user.role
      }
    }
  });
});

/**
 * @route PUT /api/auth/password
 * @desc 修改密码
 * @access Private
 */
router.put('/password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('当前密码不能为空'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('新密码长度至少6个字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      .withMessage('新密码必须包含大小写字母和数字')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      // 这里应该从数据库获取用户当前密码进行验证
      // 暂时返回成功响应
      logger.info('Password change request', {
        userId: req.user.id,
        username: req.user.username,
        ip: req.ip
      });

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      logger.error('Password change error:', {
        error: error.message,
        userId: req.user.id
      });
      res.status(500).json({
        success: false,
        message: '密码修改失败',
        code: 'PASSWORD_CHANGE_ERROR'
      });
    }
  }
);

module.exports = router;