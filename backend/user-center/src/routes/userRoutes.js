const express = require('express');
const UserController = require('../controllers/userController');
const { authenticate, authorize, requireOwnership, optionalAuth } = require('../middleware/auth');
const { validate } = require('../utils/validator');
const { createRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// 验证规则
const validationRules = {
  register: {
    username: {
      notEmpty: { errorMessage: 'Username is required' },
      isLength: { options: { min: 3, max: 50 }, errorMessage: 'Username must be 3-50 characters' },
      isAlphanumeric: { errorMessage: 'Username can only contain letters and numbers' }
    },
    email: {
      isEmail: { errorMessage: 'Invalid email format' },
      normalizeEmail: true
    },
    password: {
      isLength: { options: { min: 6 }, errorMessage: 'Password must be at least 6 characters' },
      matches: {
        options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        errorMessage: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      }
    },
    nickname: {
      optional: true,
      isLength: { options: { max: 100 }, errorMessage: 'Nickname must be less than 100 characters' }
    },
    phone: {
      optional: true,
      isMobilePhone: { errorMessage: 'Invalid phone number format' }
    }
  },
  
  login: {
    identifier: {
      notEmpty: { errorMessage: 'Email or username is required' }
    },
    password: {
      notEmpty: { errorMessage: 'Password is required' }
    },
    rememberMe: {
      optional: true,
      isBoolean: { errorMessage: 'Remember me must be a boolean' }
    }
  },
  
  refreshToken: {
    refreshToken: {
      optional: true,
      isLength: { options: { min: 1 }, errorMessage: 'Invalid refresh token' }
    }
  },
  
  updateProfile: {
    nickname: {
      optional: true,
      isLength: { options: { max: 100 }, errorMessage: 'Nickname must be less than 100 characters' }
    },
    bio: {
      optional: true,
      isLength: { options: { max: 500 }, errorMessage: 'Bio must be less than 500 characters' }
    },
    location: {
      optional: true,
      isLength: { options: { max: 100 }, errorMessage: 'Location must be less than 100 characters' }
    },
    website: {
      optional: true,
      isURL: { errorMessage: 'Invalid website URL' }
    },
    phone: {
      optional: true,
      isMobilePhone: { errorMessage: 'Invalid phone number format' }
    },
    birthday: {
      optional: true,
      isISO8601: { errorMessage: 'Invalid birthday format' }
    },
    gender: {
      optional: true,
      isIn: {
        options: [['male', 'female', 'other', 'prefer_not_to_say']],
        errorMessage: 'Invalid gender value'
      }
    }
  },
  
  changePassword: {
    currentPassword: {
      notEmpty: { errorMessage: 'Current password is required' }
    },
    newPassword: {
      isLength: { options: { min: 6 }, errorMessage: 'New password must be at least 6 characters' },
      matches: {
        options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        errorMessage: 'New password must contain at least one lowercase letter, one uppercase letter, and one number'
      }
    }
  },
  
  forgotPassword: {
    email: {
      isEmail: { errorMessage: 'Invalid email format' },
      normalizeEmail: true
    }
  },
  
  resetPassword: {
    token: {
      notEmpty: { errorMessage: 'Reset token is required' }
    },
    newPassword: {
      isLength: { options: { min: 6 }, errorMessage: 'New password must be at least 6 characters' },
      matches: {
        options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        errorMessage: 'New password must contain at least one lowercase letter, one uppercase letter, and one number'
      }
    }
  },
  
  verifyEmail: {
    token: {
      notEmpty: { errorMessage: 'Verification token is required' }
    }
  },
  
  resendVerification: {
    email: {
      isEmail: { errorMessage: 'Invalid email format' },
      normalizeEmail: true
    }
  },
  
  updatePreferences: {
    preferences: {
      notEmpty: { errorMessage: 'Preferences data is required' },
      isObject: { errorMessage: 'Preferences must be an object' }
    }
  },
  
  deleteAccount: {
    password: {
      notEmpty: { errorMessage: 'Password is required for account deletion' }
    }
  }
};

// 速率限制配置
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次尝试
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// ==================== 认证相关路由 ====================

/**
 * @route   POST /api/v1/users/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  validate(validationRules.register),
  UserController.register
);

/**
 * @route   POST /api/v1/users/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login',
  authLimiter,
  validate(validationRules.login),
  UserController.login
);

/**
 * @route   POST /api/v1/users/refresh-token
 * @desc    刷新访问令牌
 * @access  Public
 */
router.post('/refresh-token',
  generalLimiter,
  validate(validationRules.refreshToken),
  UserController.refreshToken
);

/**
 * @route   POST /api/v1/users/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout',
  authenticate,
  UserController.logout
);

// ==================== 密码相关路由 ====================

/**
 * @route   POST /api/v1/users/forgot-password
 * @desc    忘记密码
 * @access  Public
 */
router.post('/forgot-password',
  strictLimiter,
  validate(validationRules.forgotPassword),
  UserController.forgotPassword
);

/**
 * @route   POST /api/v1/users/reset-password
 * @desc    重置密码
 * @access  Public
 */
router.post('/reset-password',
  authLimiter,
  validate(validationRules.resetPassword),
  UserController.resetPassword
);

/**
 * @route   PUT /api/v1/users/change-password
 * @desc    更改密码
 * @access  Private
 */
router.put('/change-password',
  authenticate,
  authLimiter,
  validate(validationRules.changePassword),
  UserController.changePassword
);

// ==================== 邮箱验证相关路由 ====================

/**
 * @route   POST /api/v1/users/verify-email
 * @desc    验证邮箱
 * @access  Public
 */
router.post('/verify-email',
  generalLimiter,
  validate(validationRules.verifyEmail),
  UserController.verifyEmail
);

/**
 * @route   POST /api/v1/users/resend-verification
 * @desc    重新发送验证邮件
 * @access  Public
 */
router.post('/resend-verification',
  strictLimiter,
  validate(validationRules.resendVerification),
  UserController.resendVerificationEmail
);

// ==================== 用户信息相关路由 ====================

/**
 * @route   GET /api/v1/users/profile
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/profile',
  authenticate,
  UserController.getProfile
);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    更新用户信息
 * @access  Private
 */
router.put('/profile',
  authenticate,
  generalLimiter,
  validate(validationRules.updateProfile),
  UserController.updateProfile
);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    更新用户偏好设置
 * @access  Private
 */
router.put('/preferences',
  authenticate,
  generalLimiter,
  validate(validationRules.updatePreferences),
  UserController.updatePreferences
);

/**
 * @route   GET /api/v1/users/:userId
 * @desc    获取用户公开信息
 * @access  Public (with optional auth)
 */
router.get('/:userId',
  optionalAuth,
  generalLimiter,
  UserController.getUserById
);

/**
 * @route   GET /api/v1/users
 * @desc    搜索用户
 * @access  Public (with optional auth)
 */
router.get('/',
  optionalAuth,
  generalLimiter,
  UserController.searchUsers
);

// ==================== 账户管理相关路由 ====================

/**
 * @route   DELETE /api/v1/users/account
 * @desc    删除账户
 * @access  Private
 */
router.delete('/account',
  authenticate,
  strictLimiter,
  validate(validationRules.deleteAccount),
  UserController.deleteAccount
);

// ==================== 管理员路由 ====================

/**
 * @route   GET /api/v1/users/admin/stats
 * @desc    获取用户统计信息
 * @access  Private (Admin only)
 */
router.get('/admin/stats',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const stats = await User.getStats();
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/users/admin/list
 * @desc    获取用户列表（管理员）
 * @access  Private (Admin only)
 */
router.get('/admin/list',
  authenticate,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status, role, search } = req.query;
      const offset = (page - 1) * limit;
      
      const where = {};
      if (status) where.status = status;
      if (role) where.role = role;
      if (search) {
        where[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { nickname: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const { count, rows: users } = await User.findAndCountAll({
        where,
        attributes: {
          exclude: ['password', 'passwordResetToken', 'emailVerificationToken', 'refreshToken']
        },
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });
      
      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/v1/users/admin/:userId/status
 * @desc    更新用户状态（管理员）
 * @access  Private (Admin only)
 */
router.put('/admin/:userId/status',
  authenticate,
  authorize('admin'),
  validate({
    status: {
      isIn: {
        options: [['pending', 'active', 'inactive', 'locked', 'banned']],
        errorMessage: 'Invalid status value'
      }
    }
  }),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const oldStatus = user.status;
      user.status = status;
      await user.save();
      
      // 清除用户缓存
      await clearUserCache(userId);
      
      // 记录管理员操作
      logger.userAction(req.user.id, 'ADMIN_UPDATE_USER_STATUS', 'user', {
        targetUserId: userId,
        oldStatus,
        newStatus: status
      });
      
      res.json({
        success: true,
        message: 'User status updated successfully',
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/v1/users/admin/:userId/role
 * @desc    更新用户角色（管理员）
 * @access  Private (Admin only)
 */
router.put('/admin/:userId/role',
  authenticate,
  authorize('admin'),
  validate({
    role: {
      isIn: {
        options: [['user', 'moderator', 'admin']],
        errorMessage: 'Invalid role value'
      }
    }
  }),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      // 防止管理员修改自己的角色
      if (userId === req.user.id) {
        throw new ValidationError('Cannot modify your own role');
      }
      
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      const oldRole = user.role;
      user.role = role;
      await user.save();
      
      // 清除用户缓存
      await clearUserCache(userId);
      
      // 记录管理员操作
      logger.userAction(req.user.id, 'ADMIN_UPDATE_USER_ROLE', 'user', {
        targetUserId: userId,
        oldRole,
        newRole: role
      });
      
      res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          user: user.getPublicProfile()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;