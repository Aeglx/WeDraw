const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/userController');
const { validateBody, validateQuery } = require('../utils/validator');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * 敏感操作限流
 */
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每个用户最多10次敏感操作
  keyGenerator: (req) => req.user.id, // 按用户ID限流
  message: {
    success: false,
    message: 'Too many sensitive operations, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Sensitive operation rate limit exceeded', {
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many sensitive operations, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * 头像上传配置
 */
const avatarStorage = multer.memoryStorage();
const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

/**
 * 获取个人信息
 * GET /profile
 */
router.get('/', userController.getProfile);

/**
 * 更新个人信息
 * PUT /profile
 */
router.put('/',
  validateBody('updateProfile'),
  userController.updateProfile
);

/**
 * 上传头像
 * POST /profile/avatar
 */
router.post('/avatar',
  avatarUpload.single('avatar'),
  (req, res, next) => {
    // 验证文件是否存在
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar file provided'
      });
    }

    // 验证文件大小
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Avatar file size must not exceed 5MB'
      });
    }

    next();
  },
  userController.uploadAvatar
);

/**
 * 修改密码
 * PUT /profile/password
 */
router.put('/password',
  sensitiveLimiter,
  validateBody('changePassword'),
  userController.changePassword
);

/**
 * 修改邮箱 - 第一步：发送验证码到新邮箱
 * POST /profile/email/request-change
 */
router.post('/email/request-change',
  sensitiveLimiter,
  validateBody({
    newEmail: require('joi').string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'New email is required'
    }),
    password: require('joi').string().required().messages({
      'any.required': 'Current password is required'
    })
  }),
  userController.requestEmailChange
);

/**
 * 修改邮箱 - 第二步：确认邮箱变更
 * POST /profile/email/confirm-change
 */
router.post('/email/confirm-change',
  sensitiveLimiter,
  validateBody({
    token: require('joi').string().required().messages({
      'any.required': 'Verification token is required'
    })
  }),
  userController.confirmEmailChange
);

/**
 * 修改手机号 - 第一步：验证当前手机号
 * POST /profile/phone/verify-current
 */
router.post('/phone/verify-current',
  sensitiveLimiter,
  validateBody({
    code: require('joi').string().length(6).pattern(/^\d{6}$/).required().messages({
      'string.length': 'Verification code must be 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
      'any.required': 'Verification code is required'
    })
  }),
  userController.verifyCurrentPhone
);

/**
 * 修改手机号 - 第二步：设置新手机号
 * POST /profile/phone/set-new
 */
router.post('/phone/set-new',
  sensitiveLimiter,
  validateBody({
    newPhone: require('joi').string().pattern(/^1[3-9]\d{9}$/).required().messages({
      'string.pattern.base': 'Invalid phone number format',
      'any.required': 'New phone number is required'
    }),
    code: require('joi').string().length(6).pattern(/^\d{6}$/).required().messages({
      'string.length': 'Verification code must be 6 digits',
      'string.pattern.base': 'Verification code must contain only numbers',
      'any.required': 'Verification code is required'
    })
  }),
  userController.setNewPhone
);

/**
 * 获取偏好设置
 * GET /profile/preferences
 */
router.get('/preferences', userController.getPreferences);

/**
 * 更新偏好设置
 * PUT /profile/preferences
 */
router.put('/preferences',
  validateBody('updatePreferences'),
  userController.updatePreferences
);

/**
 * 获取安全设置
 * GET /profile/security
 */
router.get('/security', userController.getSecuritySettings);

/**
 * 更新安全设置
 * PUT /profile/security
 */
router.put('/security',
  validateBody({
    twoFactorEnabled: require('joi').boolean().optional(),
    loginNotifications: require('joi').boolean().optional(),
    passwordChangeNotifications: require('joi').boolean().optional(),
    suspiciousActivityNotifications: require('joi').boolean().optional(),
    sessionTimeout: require('joi').number().integer().min(5).max(1440).optional().messages({
      'number.min': 'Session timeout must be at least 5 minutes',
      'number.max': 'Session timeout must not exceed 1440 minutes (24 hours)'
    })
  }),
  userController.updateSecuritySettings
);

/**
 * 获取登录历史
 * GET /profile/login-history
 */
router.get('/login-history',
  validateQuery('pagination'),
  userController.getLoginHistory
);

/**
 * 获取操作日志
 * GET /profile/activity-log
 */
router.get('/activity-log',
  validateQuery({
    page: require('joi').number().integer().min(1).optional().default(1),
    limit: require('joi').number().integer().min(1).max(50).optional().default(20),
    type: require('joi').string().valid(
      'login', 'logout', 'password_change', 'email_change', 'phone_change',
      'profile_update', 'security_update', 'avatar_upload'
    ).optional(),
    startDate: require('joi').date().optional(),
    endDate: require('joi').date().min(require('joi').ref('startDate')).optional()
  }),
  userController.getActivityLog
);

/**
 * 导出个人数据
 * GET /profile/export
 */
router.get('/export',
  sensitiveLimiter,
  userController.exportUserData
);

/**
 * 删除账户 - 第一步：请求删除
 * POST /profile/delete-request
 */
router.post('/delete-request',
  sensitiveLimiter,
  validateBody({
    password: require('joi').string().required().messages({
      'any.required': 'Current password is required'
    }),
    reason: require('joi').string().max(500).optional().messages({
      'string.max': 'Reason must not exceed 500 characters'
    })
  }),
  userController.requestAccountDeletion
);

/**
 * 删除账户 - 第二步：确认删除
 * POST /profile/delete-confirm
 */
router.post('/delete-confirm',
  sensitiveLimiter,
  validateBody({
    token: require('joi').string().required().messages({
      'any.required': 'Confirmation token is required'
    })
  }),
  userController.confirmAccountDeletion
);

/**
 * 取消账户删除请求
 * POST /profile/delete-cancel
 */
router.post('/delete-cancel',
  validateBody({
    token: require('joi').string().required().messages({
      'any.required': 'Cancellation token is required'
    })
  }),
  userController.cancelAccountDeletion
);

/**
 * 获取账户统计信息
 * GET /profile/stats
 */
router.get('/stats', userController.getAccountStats);

/**
 * 获取关注的用户
 * GET /profile/following
 */
router.get('/following',
  validateQuery('pagination'),
  userController.getFollowing
);

/**
 * 获取粉丝
 * GET /profile/followers
 */
router.get('/followers',
  validateQuery('pagination'),
  userController.getFollowers
);

/**
 * 获取收藏的内容
 * GET /profile/favorites
 */
router.get('/favorites',
  validateQuery({
    page: require('joi').number().integer().min(1).optional().default(1),
    limit: require('joi').number().integer().min(1).max(50).optional().default(20),
    type: require('joi').string().valid('post', 'comment', 'user').optional()
  }),
  userController.getFavorites
);

/**
 * 获取草稿
 * GET /profile/drafts
 */
router.get('/drafts',
  validateQuery('pagination'),
  userController.getDrafts
);

/**
 * 获取通知设置
 * GET /profile/notifications
 */
router.get('/notifications', userController.getNotificationSettings);

/**
 * 更新通知设置
 * PUT /profile/notifications
 */
router.put('/notifications',
  validateBody({
    email: require('joi').object({
      enabled: require('joi').boolean().optional(),
      marketing: require('joi').boolean().optional(),
      security: require('joi').boolean().optional(),
      updates: require('joi').boolean().optional(),
      social: require('joi').boolean().optional(),
      comments: require('joi').boolean().optional(),
      mentions: require('joi').boolean().optional(),
      followers: require('joi').boolean().optional()
    }).optional(),
    push: require('joi').object({
      enabled: require('joi').boolean().optional(),
      sound: require('joi').boolean().optional(),
      vibration: require('joi').boolean().optional(),
      badge: require('joi').boolean().optional(),
      comments: require('joi').boolean().optional(),
      mentions: require('joi').boolean().optional(),
      followers: require('joi').boolean().optional(),
      likes: require('joi').boolean().optional()
    }).optional(),
    sms: require('joi').object({
      enabled: require('joi').boolean().optional(),
      security: require('joi').boolean().optional(),
      marketing: require('joi').boolean().optional()
    }).optional()
  }),
  userController.updateNotificationSettings
);

/**
 * 获取隐私设置
 * GET /profile/privacy
 */
router.get('/privacy', userController.getPrivacySettings);

/**
 * 更新隐私设置
 * PUT /profile/privacy
 */
router.put('/privacy',
  validateBody({
    profileVisibility: require('joi').string().valid('public', 'friends', 'private').optional(),
    showEmail: require('joi').boolean().optional(),
    showPhone: require('joi').boolean().optional(),
    showOnlineStatus: require('joi').boolean().optional(),
    allowSearchByEmail: require('joi').boolean().optional(),
    allowSearchByPhone: require('joi').boolean().optional(),
    allowFriendRequests: require('joi').boolean().optional(),
    allowMessages: require('joi').string().valid('everyone', 'friends', 'none').optional(),
    showActivity: require('joi').boolean().optional(),
    showFollowers: require('joi').boolean().optional(),
    showFollowing: require('joi').boolean().optional()
  }),
  userController.updatePrivacySettings
);

module.exports = router;