const express = require('express');
const UserController = require('../controllers/UserController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { body, param, query } = require('express-validator');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const userController = new UserController();

// 微信登录（无需认证）
router.post('/login',
  rateLimiter.login,
  [
    body('code').notEmpty().withMessage('微信授权码不能为空'),
    body('encryptedData').optional().isString(),
    body('iv').optional().isString()
  ],
  validateRequest,
  userController.wxLogin.bind(userController)
);

// 获取当前用户信息
router.get('/profile',
  authenticateToken,
  userController.getUserInfo.bind(userController)
);

// 更新用户信息
router.put('/profile',
  authenticateToken,
  rateLimiter.updateProfile,
  [
    body('nickname').optional().isLength({ min: 1, max: 50 }).withMessage('昵称长度应在1-50字符之间'),
    body('avatar').optional().isURL().withMessage('头像必须是有效的URL'),
    body('gender').optional().isIn([0, 1, 2]).withMessage('性别值无效'),
    body('city').optional().isLength({ max: 50 }).withMessage('城市名称过长'),
    body('province').optional().isLength({ max: 50 }).withMessage('省份名称过长'),
    body('country').optional().isLength({ max: 50 }).withMessage('国家名称过长')
  ],
  validateRequest,
  userController.updateUserInfo.bind(userController)
);

// 用户注销
router.post('/logout',
  authenticateToken,
  userController.logout.bind(userController)
);

// 销毁所有会话
router.post('/logout-all',
  authenticateToken,
  rateLimiter.logoutAll,
  userController.destroyAllSessions.bind(userController)
);

// 获取用户会话列表
router.get('/sessions',
  authenticateToken,
  userController.getUserSessions.bind(userController)
);

// 刷新会话
router.post('/refresh-session',
  authenticateToken,
  rateLimiter.refreshSession,
  userController.refreshSession.bind(userController)
);

// 获取用户统计信息
router.get('/stats',
  authenticateToken,
  userController.getUserStats.bind(userController)
);

// 管理员接口
// 获取用户列表（管理员）
router.get('/',
  authenticateToken,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(['active', 'inactive', 'banned']).withMessage('状态值无效'),
    query('search').optional().isLength({ max: 100 }).withMessage('搜索关键词过长')
  ],
  validateRequest,
  userController.getUserList.bind(userController)
);

// 获取用户详情（管理员）
router.get('/:id',
  authenticateToken,
  requireAdmin,
  [
    param('id').isInt({ min: 1 }).withMessage('用户ID必须是正整数')
  ],
  validateRequest,
  userController.getUserDetail.bind(userController)
);

// 批量更新用户状态（管理员）
router.patch('/batch-status',
  authenticateToken,
  requireAdmin,
  rateLimiter.adminAction,
  [
    body('userIds').isArray({ min: 1 }).withMessage('用户ID列表不能为空'),
    body('userIds.*').isInt({ min: 1 }).withMessage('用户ID必须是正整数'),
    body('status').isIn(['active', 'inactive', 'banned']).withMessage('状态值无效'),
    body('reason').optional().isLength({ max: 200 }).withMessage('操作原因过长')
  ],
  validateRequest,
  userController.batchUpdateUserStatus.bind(userController)
);

module.exports = router;