const express = require('express');
const rateLimit = require('express-rate-limit');
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../utils/validator');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * 登录限流 - 更严格的限制
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 每个IP最多10次登录尝试
  skipSuccessfulRequests: true, // 成功的请求不计入限制
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      identifier: req.body?.identifier
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * 注册限流
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 每个IP最多5次注册尝试
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Registration rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many registration attempts, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * 密码重置限流
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 每个IP最多3次密码重置请求
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * 验证码发送限流
 */
const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每个IP最多10次验证码请求
  message: {
    success: false,
    message: 'Too many verification code requests, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Verification code rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      phone: req.body?.phone
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many verification code requests, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * 用户注册
 * POST /auth/register
 */
router.post('/register',
  registerLimiter,
  validateBody('userRegister'),
  userController.register
);

/**
 * 用户登录
 * POST /auth/login
 */
router.post('/login',
  loginLimiter,
  validateBody('userLogin'),
  userController.login
);

/**
 * 手机验证码登录
 * POST /auth/login/phone
 */
router.post('/login/phone',
  loginLimiter,
  validateBody('phoneLogin'),
  userController.phoneLogin
);

/**
 * 用户登出
 * POST /auth/logout
 */
router.post('/logout',
  authenticate,
  userController.logout
);

/**
 * 刷新令牌
 * POST /auth/refresh
 */
router.post('/refresh',
  validateBody({
    refreshToken: require('joi').string().required().messages({
      'any.required': 'Refresh token is required'
    })
  }),
  userController.refreshToken
);

/**
 * 忘记密码
 * POST /auth/forgot-password
 */
router.post('/forgot-password',
  passwordResetLimiter,
  validateBody('forgotPassword'),
  userController.forgotPassword
);

/**
 * 重置密码
 * POST /auth/reset-password
 */
router.post('/reset-password',
  passwordResetLimiter,
  validateBody('resetPassword'),
  userController.resetPassword
);

/**
 * 发送验证码
 * POST /auth/send-verification
 */
router.post('/send-verification',
  verificationLimiter,
  validateBody('sendVerificationCode'),
  userController.sendVerificationCode
);

/**
 * 验证邮箱
 * POST /auth/verify-email
 */
router.post('/verify-email',
  validateBody('emailVerification'),
  userController.verifyEmail
);

/**
 * 重新发送邮箱验证
 * POST /auth/resend-email-verification
 */
router.post('/resend-email-verification',
  verificationLimiter,
  authenticate,
  userController.resendEmailVerification
);

/**
 * 获取用户会话列表
 * GET /auth/sessions
 */
router.get('/sessions',
  authenticate,
  userController.getUserSessions
);

/**
 * 撤销特定会话
 * DELETE /auth/sessions/:jti
 */
router.delete('/sessions/:jti',
  authenticate,
  validateParams({
    jti: require('joi').string().required().messages({
      'any.required': 'Session ID is required'
    })
  }),
  userController.revokeSession
);

/**
 * 撤销所有会话（除当前会话）
 * DELETE /auth/sessions
 */
router.delete('/sessions',
  authenticate,
  userController.revokeAllSessions
);

/**
 * 检查用户名是否可用
 * GET /auth/check-username
 */
router.get('/check-username',
  validateQuery({
    username: require('joi').string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': 'Username must only contain alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required'
    })
  }),
  userController.checkUsernameAvailability
);

/**
 * 检查邮箱是否可用
 * GET /auth/check-email
 */
router.get('/check-email',
  validateQuery({
    email: require('joi').string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  }),
  userController.checkEmailAvailability
);

/**
 * 检查手机号是否可用
 * GET /auth/check-phone
 */
router.get('/check-phone',
  validateQuery({
    phone: require('joi').string().pattern(/^1[3-9]\d{9}$/).required().messages({
      'string.pattern.base': 'Invalid phone number format',
      'any.required': 'Phone number is required'
    })
  }),
  userController.checkPhoneAvailability
);

/**
 * 获取认证状态
 * GET /auth/status
 */
router.get('/status',
  optionalAuth,
  (req, res) => {
    if (req.user) {
      res.json({
        success: true,
        authenticated: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          emailVerified: req.user.emailVerified,
          role: req.user.role,
          status: req.user.status,
          lastLoginAt: req.user.lastLoginAt
        }
      });
    } else {
      res.json({
        success: true,
        authenticated: false,
        user: null
      });
    }
  }
);

/**
 * 获取认证配置信息
 * GET /auth/config
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      registration: {
        enabled: process.env.REGISTRATION_ENABLED !== 'false',
        requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
        allowedDomains: process.env.ALLOWED_EMAIL_DOMAINS ? 
          process.env.ALLOWED_EMAIL_DOMAINS.split(',') : null
      },
      login: {
        methods: {
          password: true,
          phone: process.env.SMS_ENABLED === 'true',
          wechat: process.env.WECHAT_LOGIN_ENABLED === 'true',
          wecom: process.env.WECOM_LOGIN_ENABLED === 'true'
        },
        rememberMe: {
          enabled: true,
          maxDuration: process.env.REMEMBER_ME_DURATION || '30d'
        }
      },
      password: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      verification: {
        email: {
          enabled: process.env.EMAIL_ENABLED === 'true',
          expiryMinutes: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY) || 1440 // 24小时
        },
        sms: {
          enabled: process.env.SMS_ENABLED === 'true',
          expiryMinutes: parseInt(process.env.SMS_VERIFICATION_EXPIRY) || 5
        }
      },
      rateLimit: {
        login: {
          maxAttempts: 10,
          windowMinutes: 15
        },
        registration: {
          maxAttempts: 5,
          windowMinutes: 60
        },
        passwordReset: {
          maxAttempts: 3,
          windowMinutes: 60
        },
        verification: {
          maxAttempts: 10,
          windowMinutes: 60
        }
      }
    }
  });
});

/**
 * 认证统计信息（需要管理员权限）
 * GET /auth/stats
 */
router.get('/stats',
  authenticate,
  async (req, res, next) => {
    try {
      // 检查管理员权限
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { jwtUtils } = require('../utils/jwt');
      const stats = await jwtUtils.getTokenStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;