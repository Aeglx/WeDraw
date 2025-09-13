const { validationResult, body, param, query } = require('express-validator');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * 验证请求参数中间件
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    logger.warn('Request validation failed', {
      url: req.originalUrl,
      method: req.method,
      errors: errorMessages,
      userId: req.user?.id,
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      code: 'VALIDATION_ERROR',
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * 通用验证规则
 */
const commonValidators = {
  // ID验证
  id: param('id').isInt({ min: 1 }).withMessage('ID必须是正整数'),
  
  // 分页验证
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间').toInt()
  ],
  
  // 日期范围验证
  dateRange: [
    query('startDate').optional().isISO8601().withMessage('开始日期格式无效').toDate(),
    query('endDate').optional().isISO8601().withMessage('结束日期格式无效').toDate()
  ],
  
  // 搜索关键词验证
  search: query('search').optional().isLength({ max: 100 }).withMessage('搜索关键词不能超过100字符').trim(),
  
  // 排序验证
  sort: [
    query('sortBy').optional().isIn(['id', 'createdAt', 'updatedAt', 'name', 'status']).withMessage('排序字段无效'),
    query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('排序方向无效')
  ]
};

/**
 * 用户相关验证规则
 */
const userValidators = {
  // 微信登录验证
  wxLogin: [
    body('code').notEmpty().withMessage('微信授权码不能为空').isLength({ max: 100 }).withMessage('授权码长度无效'),
    body('encryptedData').optional().isString().withMessage('加密数据必须是字符串'),
    body('iv').optional().isString().withMessage('初始向量必须是字符串')
  ],
  
  // 用户信息更新验证
  updateProfile: [
    body('nickname').optional().isLength({ min: 1, max: 50 }).withMessage('昵称长度应在1-50字符之间').trim(),
    body('avatar').optional().isURL().withMessage('头像必须是有效的URL'),
    body('gender').optional().isIn([0, 1, 2]).withMessage('性别值无效').toInt(),
    body('city').optional().isLength({ max: 50 }).withMessage('城市名称过长').trim(),
    body('province').optional().isLength({ max: 50 }).withMessage('省份名称过长').trim(),
    body('country').optional().isLength({ max: 50 }).withMessage('国家名称过长').trim(),
    body('language').optional().isIn(['zh_CN', 'zh_TW', 'en']).withMessage('语言设置无效')
  ],
  
  // 用户状态验证
  userStatus: body('status').isIn(['active', 'inactive', 'banned']).withMessage('用户状态无效'),
  
  // 批量操作验证
  batchUserIds: [
    body('userIds').isArray({ min: 1, max: 100 }).withMessage('用户ID列表不能为空且不超过100个'),
    body('userIds.*').isInt({ min: 1 }).withMessage('用户ID必须是正整数').toInt()
  ]
};

/**
 * 消息相关验证规则
 */
const messageValidators = {
  // 文本消息验证
  textMessage: [
    body('content').notEmpty().withMessage('消息内容不能为空')
      .isLength({ min: 1, max: 1000 }).withMessage('消息内容长度应在1-1000字符之间').trim(),
    body('toUserId').optional().isInt({ min: 1 }).withMessage('接收用户ID必须是正整数').toInt(),
    body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('优先级值无效'),
    body('scheduledAt').optional().isISO8601().withMessage('定时发送时间格式无效').toDate()
  ],
  
  // 模板消息验证
  templateMessage: [
    body('templateId').notEmpty().withMessage('模板ID不能为空').isLength({ max: 100 }).withMessage('模板ID过长'),
    body('data').isObject().withMessage('模板数据必须是对象'),
    body('toUserId').optional().isInt({ min: 1 }).withMessage('接收用户ID必须是正整数').toInt(),
    body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('优先级值无效'),
    body('scheduledAt').optional().isISO8601().withMessage('定时发送时间格式无效').toDate()
  ],
  
  // 批量消息验证
  batchMessages: [
    body('messages').isArray({ min: 1, max: 100 }).withMessage('消息列表不能为空且不超过100条'),
    body('messages.*.type').isIn(['text', 'template']).withMessage('消息类型无效'),
    body('messages.*.content').optional().isLength({ min: 1, max: 1000 }).withMessage('消息内容长度应在1-1000字符之间'),
    body('messages.*.templateId').optional().notEmpty().withMessage('模板ID不能为空'),
    body('messages.*.data').optional().isObject().withMessage('模板数据必须是对象'),
    body('messages.*.toUserId').optional().isInt({ min: 1 }).withMessage('接收用户ID必须是正整数'),
    body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('优先级值无效')
  ],
  
  // 消息状态验证
  messageStatus: query('status').optional().isIn(['pending', 'sent', 'failed', 'recalled']).withMessage('消息状态无效'),
  
  // 消息类型验证
  messageType: query('type').optional().isIn(['text', 'template', 'system']).withMessage('消息类型无效'),
  
  // 撤回原因验证
  recallReason: body('reason').optional().isLength({ max: 200 }).withMessage('撤回原因不超过200字符').trim()
};

/**
 * 自定义验证器
 */
const customValidators = {
  // 验证日期范围
  validateDateRange: (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: '开始日期必须早于结束日期',
          code: 'INVALID_DATE_RANGE'
        });
      }
      
      // 限制查询范围不超过1年
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (end - start > oneYear) {
        return res.status(400).json({
          success: false,
          message: '查询时间范围不能超过1年',
          code: 'DATE_RANGE_TOO_LARGE'
        });
      }
    }
    
    next();
  },
  
  // 验证文件上传
  validateFileUpload: (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
    return (req, res, next) => {
      if (!req.file && !req.files) {
        return next();
      }
      
      const files = req.files || [req.file];
      
      for (const file of files) {
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `不支持的文件类型: ${file.mimetype}`,
            code: 'UNSUPPORTED_FILE_TYPE',
            allowedTypes
          });
        }
        
        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `文件大小超过限制: ${Math.round(maxSize / 1024 / 1024)}MB`,
            code: 'FILE_TOO_LARGE',
            maxSize
          });
        }
      }
      
      next();
    };
  },
  
  // 验证JSON格式
  validateJSON: (field) => {
    return body(field).custom((value) => {
      try {
        if (typeof value === 'string') {
          JSON.parse(value);
        }
        return true;
      } catch (error) {
        throw new Error(`${field}必须是有效的JSON格式`);
      }
    });
  },
  
  // 验证手机号
  validatePhone: body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('手机号格式无效'),
  
  // 验证邮箱
  validateEmail: body('email').optional().isEmail().withMessage('邮箱格式无效').normalizeEmail()
};

/**
 * 清理和转换数据
 */
const sanitizeData = {
  // 清理HTML标签
  stripHtml: (fields) => {
    return (req, res, next) => {
      for (const field of fields) {
        if (req.body[field]) {
          req.body[field] = req.body[field].replace(/<[^>]*>/g, '');
        }
      }
      next();
    };
  },
  
  // 转换为小写
  toLowerCase: (fields) => {
    return (req, res, next) => {
      for (const field of fields) {
        if (req.body[field]) {
          req.body[field] = req.body[field].toLowerCase();
        }
      }
      next();
    };
  },
  
  // 去除前后空格
  trim: (fields) => {
    return (req, res, next) => {
      for (const field of fields) {
        if (typeof req.body[field] === 'string') {
          req.body[field] = req.body[field].trim();
        }
      }
      next();
    };
  }
};

module.exports = {
  validateRequest,
  commonValidators,
  userValidators,
  messageValidators,
  customValidators,
  sanitizeData
};