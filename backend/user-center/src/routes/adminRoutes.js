const express = require('express');
const rateLimit = require('express-rate-limit');
const userController = require('../controllers/userController');
const { validateBody, validateQuery } = require('../utils/validator');
const { requireAuth, requireRole, requirePermission } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * 管理员操作限流
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 每分钟最多100次操作
  keyGenerator: (req) => req.user.id,
  message: {
    success: false,
    message: 'Too many admin operations, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Admin operation rate limit exceeded', {
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many admin operations, please try again later.',
      retryAfter: '1 minute'
    });
  }
});

/**
 * 敏感管理操作限流
 */
const sensitiveAdminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 每小时最多20次敏感操作
  keyGenerator: (req) => req.user.id,
  message: {
    success: false,
    message: 'Too many sensitive admin operations, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 所有管理员路由都需要认证和管理员权限
router.use(requireAuth);
router.use(adminLimiter);

/**
 * 用户管理
 */

/**
 * 获取用户列表
 * GET /admin/users
 */
router.get('/users',
  requireRole('admin'),
  validateQuery({
    page: require('joi').number().integer().min(1).optional().default(1),
    limit: require('joi').number().integer().min(1).max(100).optional().default(20),
    search: require('joi').string().max(100).optional(),
    status: require('joi').string().valid('active', 'inactive', 'suspended', 'deleted').optional(),
    role: require('joi').string().valid('user', 'admin', 'moderator').optional(),
    verified: require('joi').boolean().optional(),
    sortBy: require('joi').string().valid('createdAt', 'lastLoginAt', 'username', 'email').optional().default('createdAt'),
    sortOrder: require('joi').string().valid('asc', 'desc').optional().default('desc'),
    startDate: require('joi').date().optional(),
    endDate: require('joi').date().min(require('joi').ref('startDate')).optional()
  }),
  userController.getUserList
);

/**
 * 获取用户详情
 * GET /admin/users/:id
 */
router.get('/users/:id',
  requireRole('admin'),
  userController.getUserDetails
);

/**
 * 创建用户
 * POST /admin/users
 */
router.post('/users',
  requirePermission('user:create'),
  validateBody({
    username: require('joi').string().alphanum().min(3).max(30).required(),
    email: require('joi').string().email().required(),
    password: require('joi').string().min(8).required(),
    phone: require('joi').string().pattern(/^1[3-9]\d{9}$/).optional(),
    role: require('joi').string().valid('user', 'admin', 'moderator').optional().default('user'),
    status: require('joi').string().valid('active', 'inactive').optional().default('active'),
    verified: require('joi').boolean().optional().default(false),
    profile: require('joi').object({
      nickname: require('joi').string().max(50).optional(),
      avatar: require('joi').string().uri().optional(),
      bio: require('joi').string().max(500).optional(),
      location: require('joi').string().max(100).optional(),
      website: require('joi').string().uri().optional(),
      birthday: require('joi').date().optional(),
      gender: require('joi').string().valid('male', 'female', 'other').optional()
    }).optional()
  }),
  userController.createUser
);

/**
 * 更新用户信息
 * PUT /admin/users/:id
 */
router.put('/users/:id',
  requirePermission('user:update'),
  validateBody({
    username: require('joi').string().alphanum().min(3).max(30).optional(),
    email: require('joi').string().email().optional(),
    phone: require('joi').string().pattern(/^1[3-9]\d{9}$/).optional(),
    role: require('joi').string().valid('user', 'admin', 'moderator').optional(),
    status: require('joi').string().valid('active', 'inactive', 'suspended').optional(),
    verified: require('joi').boolean().optional(),
    profile: require('joi').object({
      nickname: require('joi').string().max(50).optional(),
      avatar: require('joi').string().uri().optional(),
      bio: require('joi').string().max(500).optional(),
      location: require('joi').string().max(100).optional(),
      website: require('joi').string().uri().optional(),
      birthday: require('joi').date().optional(),
      gender: require('joi').string().valid('male', 'female', 'other').optional()
    }).optional()
  }),
  userController.updateUser
);

/**
 * 重置用户密码
 * POST /admin/users/:id/reset-password
 */
router.post('/users/:id/reset-password',
  sensitiveAdminLimiter,
  requirePermission('user:reset-password'),
  validateBody({
    newPassword: require('joi').string().min(8).optional(),
    sendEmail: require('joi').boolean().optional().default(true)
  }),
  userController.adminResetPassword
);

/**
 * 锁定/解锁用户
 * POST /admin/users/:id/lock
 * POST /admin/users/:id/unlock
 */
router.post('/users/:id/lock',
  sensitiveAdminLimiter,
  requirePermission('user:lock'),
  validateBody({
    reason: require('joi').string().max(500).required(),
    duration: require('joi').number().integer().min(1).max(365).optional() // 天数
  }),
  userController.lockUser
);

router.post('/users/:id/unlock',
  sensitiveAdminLimiter,
  requirePermission('user:unlock'),
  validateBody({
    reason: require('joi').string().max(500).optional()
  }),
  userController.unlockUser
);

/**
 * 删除用户
 * DELETE /admin/users/:id
 */
router.delete('/users/:id',
  sensitiveAdminLimiter,
  requirePermission('user:delete'),
  validateBody({
    reason: require('joi').string().max(500).required(),
    hardDelete: require('joi').boolean().optional().default(false)
  }),
  userController.deleteUser
);

/**
 * 恢复已删除用户
 * POST /admin/users/:id/restore
 */
router.post('/users/:id/restore',
  sensitiveAdminLimiter,
  requirePermission('user:restore'),
  validateBody({
    reason: require('joi').string().max(500).optional()
  }),
  userController.restoreUser
);

/**
 * 批量操作用户
 * POST /admin/users/batch
 */
router.post('/users/batch',
  sensitiveAdminLimiter,
  requirePermission('user:batch'),
  validateBody({
    userIds: require('joi').array().items(require('joi').string()).min(1).max(100).required(),
    action: require('joi').string().valid('activate', 'deactivate', 'lock', 'unlock', 'delete', 'verify').required(),
    reason: require('joi').string().max(500).optional(),
    data: require('joi').object().optional()
  }),
  userController.batchUpdateUsers
);

/**
 * 获取用户登录历史
 * GET /admin/users/:id/login-history
 */
router.get('/users/:id/login-history',
  requireRole('admin'),
  validateQuery({
    page: require('joi').number().integer().min(1).optional().default(1),
    limit: require('joi').number().integer().min(1).max(100).optional().default(20),
    startDate: require('joi').date().optional(),
    endDate: require('joi').date().min(require('joi').ref('startDate')).optional()
  }),
  userController.getUserLoginHistory
);

/**
 * 获取用户操作日志
 * GET /admin/users/:id/activity-log
 */
router.get('/users/:id/activity-log',
  requireRole('admin'),
  validateQuery({
    page: require('joi').number().integer().min(1).optional().default(1),
    limit: require('joi').number().integer().min(1).max(100).optional().default(20),
    type: require('joi').string().optional(),
    startDate: require('joi').date().optional(),
    endDate: require('joi').date().min(require('joi').ref('startDate')).optional()
  }),
  userController.getUserActivityLog
);

/**
 * 系统统计
 */

/**
 * 获取用户统计信息
 * GET /admin/stats/users
 */
router.get('/stats/users',
  requireRole('admin'),
  validateQuery({
    period: require('joi').string().valid('day', 'week', 'month', 'year').optional().default('month'),
    startDate: require('joi').date().optional(),
    endDate: require('joi').date().min(require('joi').ref('startDate')).optional()
  }),
  userController.getUserStats
);

/**
 * 获取登录统计信息
 * GET /admin/stats/logins
 */
router.get('/stats/logins',
  requireRole('admin'),
  validateQuery({
    period: require('joi').string().valid('day', 'week', 'month', 'year').optional().default('month'),
    startDate: require('joi').date().optional(),
    endDate: require('joi').date().min(require('joi').ref('startDate')).optional()
  }),
  userController.getLoginStats
);

/**
 * 获取系统概览
 * GET /admin/stats/overview
 */
router.get('/stats/overview',
  requireRole('admin'),
  userController.getSystemOverview
);

/**
 * 系统配置
 */

/**
 * 获取系统配置
 * GET /admin/config
 */
router.get('/config',
  requirePermission('system:config:read'),
  userController.getSystemConfig
);

/**
 * 更新系统配置
 * PUT /admin/config
 */
router.put('/config',
  sensitiveAdminLimiter,
  requirePermission('system:config:write'),
  validateBody({
    registration: require('joi').object({
      enabled: require('joi').boolean().optional(),
      requireEmailVerification: require('joi').boolean().optional(),
      requirePhoneVerification: require('joi').boolean().optional(),
      allowedDomains: require('joi').array().items(require('joi').string()).optional(),
      blockedDomains: require('joi').array().items(require('joi').string()).optional()
    }).optional(),
    security: require('joi').object({
      passwordMinLength: require('joi').number().integer().min(6).max(128).optional(),
      passwordRequireUppercase: require('joi').boolean().optional(),
      passwordRequireLowercase: require('joi').boolean().optional(),
      passwordRequireNumbers: require('joi').boolean().optional(),
      passwordRequireSymbols: require('joi').boolean().optional(),
      maxLoginAttempts: require('joi').number().integer().min(3).max(20).optional(),
      lockoutDuration: require('joi').number().integer().min(5).max(1440).optional(),
      sessionTimeout: require('joi').number().integer().min(5).max(1440).optional(),
      twoFactorRequired: require('joi').boolean().optional()
    }).optional(),
    email: require('joi').object({
      enabled: require('joi').boolean().optional(),
      provider: require('joi').string().valid('smtp', 'sendgrid', 'mailgun').optional(),
      settings: require('joi').object().optional()
    }).optional(),
    sms: require('joi').object({
      enabled: require('joi').boolean().optional(),
      provider: require('joi').string().valid('aliyun', 'tencent', 'huawei').optional(),
      settings: require('joi').object().optional()
    }).optional()
  }),
  userController.updateSystemConfig
);

/**
 * 日志管理
 */

/**
 * 获取系统日志
 * GET /admin/logs
 */
router.get('/logs',
  requirePermission('system:logs:read'),
  validateQuery({
    page: require('joi').number().integer().min(1).optional().default(1),
    limit: require('joi').number().integer().min(1).max(100).optional().default(20),
    level: require('joi').string().valid('error', 'warn', 'info', 'debug').optional(),
    module: require('joi').string().optional(),
    startDate: require('joi').date().optional(),
    endDate: require('joi').date().min(require('joi').ref('startDate')).optional(),
    search: require('joi').string().max(100).optional()
  }),
  userController.getSystemLogs
);

/**
 * 获取审计日志
 * GET /admin/audit-logs
 */
router.get('/audit-logs',
  requirePermission('system:audit:read'),
  validateQuery({
    page: require('joi').number().integer().min(1).optional().default(1),
    limit: require('joi').number().integer().min(1).max(100).optional().default(20),
    userId: require('joi').string().optional(),
    action: require('joi').string().optional(),
    resource: require('joi').string().optional(),
    startDate: require('joi').date().optional(),
    endDate: require('joi').date().min(require('joi').ref('startDate')).optional()
  }),
  userController.getAuditLogs
);

/**
 * 权限管理
 */

/**
 * 获取角色列表
 * GET /admin/roles
 */
router.get('/roles',
  requirePermission('role:read'),
  userController.getRoles
);

/**
 * 创建角色
 * POST /admin/roles
 */
router.post('/roles',
  sensitiveAdminLimiter,
  requirePermission('role:create'),
  validateBody({
    name: require('joi').string().min(2).max(50).required(),
    description: require('joi').string().max(200).optional(),
    permissions: require('joi').array().items(require('joi').string()).required()
  }),
  userController.createRole
);

/**
 * 更新角色
 * PUT /admin/roles/:id
 */
router.put('/roles/:id',
  sensitiveAdminLimiter,
  requirePermission('role:update'),
  validateBody({
    name: require('joi').string().min(2).max(50).optional(),
    description: require('joi').string().max(200).optional(),
    permissions: require('joi').array().items(require('joi').string()).optional()
  }),
  userController.updateRole
);

/**
 * 删除角色
 * DELETE /admin/roles/:id
 */
router.delete('/roles/:id',
  sensitiveAdminLimiter,
  requirePermission('role:delete'),
  userController.deleteRole
);

/**
 * 获取权限列表
 * GET /admin/permissions
 */
router.get('/permissions',
  requirePermission('permission:read'),
  userController.getPermissions
);

/**
 * 分配用户角色
 * POST /admin/users/:id/roles
 */
router.post('/users/:id/roles',
  sensitiveAdminLimiter,
  requirePermission('user:assign-role'),
  validateBody({
    roles: require('joi').array().items(require('joi').string()).min(1).required()
  }),
  userController.assignUserRoles
);

/**
 * 移除用户角色
 * DELETE /admin/users/:id/roles
 */
router.delete('/users/:id/roles',
  sensitiveAdminLimiter,
  requirePermission('user:remove-role'),
  validateBody({
    roles: require('joi').array().items(require('joi').string()).min(1).required()
  }),
  userController.removeUserRoles
);

/**
 * 系统维护
 */

/**
 * 清理过期数据
 * POST /admin/maintenance/cleanup
 */
router.post('/maintenance/cleanup',
  sensitiveAdminLimiter,
  requirePermission('system:maintenance'),
  validateBody({
    type: require('joi').string().valid('sessions', 'logs', 'tokens', 'all').required(),
    olderThan: require('joi').number().integer().min(1).max(365).optional().default(30) // 天数
  }),
  userController.cleanupExpiredData
);

/**
 * 系统健康检查
 * GET /admin/health
 */
router.get('/health',
  requireRole('admin'),
  userController.getSystemHealth
);

/**
 * 导出用户数据
 * GET /admin/export/users
 */
router.get('/export/users',
  sensitiveAdminLimiter,
  requirePermission('user:export'),
  validateQuery({
    format: require('joi').string().valid('csv', 'json', 'xlsx').optional().default('csv'),
    fields: require('joi').array().items(require('joi').string()).optional(),
    filters: require('joi').object().optional()
  }),
  userController.exportUsers
);

module.exports = router;