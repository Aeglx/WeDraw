const express = require('express');
const MessageController = require('../controllers/MessageController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { body, param, query } = require('express-validator');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const messageController = new MessageController();

// 发送文本消息
router.post('/text',
  authenticateToken,
  rateLimiter.sendMessage,
  [
    body('content').notEmpty().isLength({ max: 1000 }).withMessage('消息内容不能为空且不超过1000字符'),
    body('toUserId').optional().isInt({ min: 1 }).withMessage('接收用户ID必须是正整数'),
    body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('优先级值无效'),
    body('scheduledAt').optional().isISO8601().withMessage('定时发送时间格式无效')
  ],
  validateRequest,
  messageController.sendTextMessage.bind(messageController)
);

// 发送模板消息
router.post('/template',
  authenticateToken,
  rateLimiter.sendMessage,
  [
    body('templateId').notEmpty().withMessage('模板ID不能为空'),
    body('data').isObject().withMessage('模板数据必须是对象'),
    body('toUserId').optional().isInt({ min: 1 }).withMessage('接收用户ID必须是正整数'),
    body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('优先级值无效'),
    body('scheduledAt').optional().isISO8601().withMessage('定时发送时间格式无效')
  ],
  validateRequest,
  messageController.sendTemplateMessage.bind(messageController)
);

// 批量发送消息
router.post('/batch',
  authenticateToken,
  requireAdmin,
  rateLimiter.batchSendMessage,
  [
    body('messages').isArray({ min: 1, max: 100 }).withMessage('消息列表不能为空且不超过100条'),
    body('messages.*.type').isIn(['text', 'template']).withMessage('消息类型无效'),
    body('messages.*.content').optional().isLength({ max: 1000 }).withMessage('消息内容不超过1000字符'),
    body('messages.*.templateId').optional().notEmpty().withMessage('模板ID不能为空'),
    body('messages.*.data').optional().isObject().withMessage('模板数据必须是对象'),
    body('messages.*.toUserId').optional().isInt({ min: 1 }).withMessage('接收用户ID必须是正整数'),
    body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('优先级值无效')
  ],
  validateRequest,
  messageController.batchSendMessages.bind(messageController)
);

// 获取消息列表
router.get('/',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('type').optional().isIn(['text', 'template', 'system']).withMessage('消息类型无效'),
    query('status').optional().isIn(['pending', 'sent', 'failed', 'recalled']).withMessage('消息状态无效'),
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效')
  ],
  validateRequest,
  messageController.getMessageList.bind(messageController)
);

// 获取消息详情
router.get('/:id',
  authenticateToken,
  [
    param('id').isInt({ min: 1 }).withMessage('消息ID必须是正整数')
  ],
  validateRequest,
  messageController.getMessageDetail.bind(messageController)
);

// 撤回消息
router.post('/:id/recall',
  authenticateToken,
  rateLimiter.recallMessage,
  [
    param('id').isInt({ min: 1 }).withMessage('消息ID必须是正整数'),
    body('reason').optional().isLength({ max: 200 }).withMessage('撤回原因不超过200字符')
  ],
  validateRequest,
  messageController.recallMessage.bind(messageController)
);

// 重试发送消息
router.post('/:id/retry',
  authenticateToken,
  rateLimiter.retryMessage,
  [
    param('id').isInt({ min: 1 }).withMessage('消息ID必须是正整数')
  ],
  validateRequest,
  messageController.retryMessage.bind(messageController)
);

// 获取消息统计
router.get('/stats/user',
  authenticateToken,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效')
  ],
  validateRequest,
  messageController.getMessageStats.bind(messageController)
);

// 管理员接口
// 获取系统消息统计（管理员）
router.get('/stats/system',
  authenticateToken,
  requireAdmin,
  [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效'),
    query('groupBy').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('分组方式无效')
  ],
  validateRequest,
  messageController.getSystemMessageStats.bind(messageController)
);

// 清理过期消息（管理员）
router.delete('/cleanup',
  authenticateToken,
  requireAdmin,
  rateLimiter.adminAction,
  [
    body('days').optional().isInt({ min: 1, max: 365 }).withMessage('保留天数必须在1-365之间'),
    body('types').optional().isArray().withMessage('消息类型必须是数组'),
    body('types.*').optional().isIn(['text', 'template', 'system']).withMessage('消息类型无效')
  ],
  validateRequest,
  messageController.cleanupExpiredMessages.bind(messageController)
);

module.exports = router;