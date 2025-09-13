const Joi = require('joi');
const { ValidationError } = require('../middleware/errorHandler');
const logger = require('./logger');

/**
 * 通用验证中间件
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // 返回所有错误
      allowUnknown: false, // 不允许未知字段
      stripUnknown: true // 移除未知字段
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation failed:', {
        property,
        errors: details,
        url: req.originalUrl,
        method: req.method
      });

      return next(new ValidationError('Validation failed', details));
    }

    // 将验证后的值赋回请求对象
    req[property] = value;
    next();
  };
};

/**
 * 常用验证规则
 */
const commonRules = {
  // ID验证
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ID format'),
  uuid: Joi.string().uuid().message('Invalid UUID format'),
  
  // 字符串验证
  name: Joi.string().min(1).max(100).trim(),
  title: Joi.string().min(1).max(200).trim(),
  description: Joi.string().max(1000).trim().allow(''),
  content: Joi.string().max(10000).trim(),
  
  // 数字验证
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  
  // 日期验证
  date: Joi.date().iso(),
  dateRange: Joi.object({
    start: Joi.date().iso().required(),
    end: Joi.date().iso().min(Joi.ref('start')).required()
  }),
  
  // 联系方式验证
  email: Joi.string().email().lowercase().trim(),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).message('Invalid phone number'),
  
  // 密码验证
  password: Joi.string().min(6).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).message('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // URL验证
  url: Joi.string().uri({ scheme: ['http', 'https'] }),
  
  // 状态验证
  status: Joi.string().valid('active', 'inactive', 'pending', 'deleted'),
  
  // 排序验证
  sort: Joi.string().pattern(/^[a-zA-Z_][a-zA-Z0-9_]*:(asc|desc)$/).message('Sort format should be field:asc or field:desc'),
  
  // 文件验证
  fileType: Joi.string().valid('image', 'document', 'video', 'audio'),
  mimeType: Joi.string().pattern(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/),
  
  // 微信相关
  openid: Joi.string().pattern(/^[a-zA-Z0-9_-]{28}$/).message('Invalid WeChat OpenID'),
  unionid: Joi.string().pattern(/^[a-zA-Z0-9_-]{28}$/).message('Invalid WeChat UnionID'),
  
  // 企业微信相关
  userid: Joi.string().min(1).max(64).pattern(/^[a-zA-Z0-9._-]+$/).message('Invalid WeCom UserID'),
  
  // 积分相关
  points: Joi.number().integer().min(0).max(999999999),
  
  // 地理位置
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  
  // 颜色
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).message('Invalid color format'),
  
  // JSON字符串
  jsonString: Joi.string().custom((value, helpers) => {
    try {
      JSON.parse(value);
      return value;
    } catch (error) {
      return helpers.error('any.invalid');
    }
  }).message('Invalid JSON string')
};

/**
 * 分页验证模式
 */
const paginationSchema = Joi.object({
  page: commonRules.page,
  limit: commonRules.limit,
  offset: commonRules.offset,
  sort: commonRules.sort.optional()
});

/**
 * 搜索验证模式
 */
const searchSchema = Joi.object({
  q: Joi.string().min(1).max(100).trim().required(),
  type: Joi.string().valid('user', 'product', 'order', 'message').optional(),
  ...paginationSchema.extract(['page', 'limit', 'sort'])
});

/**
 * 用户相关验证模式
 */
const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: commonRules.email.required(),
    password: commonRules.password.required(),
    phone: commonRules.phone.optional(),
    nickname: commonRules.name.optional()
  }),
  
  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    captcha: Joi.string().length(4).optional()
  }),
  
  updateProfile: Joi.object({
    nickname: commonRules.name.optional(),
    email: commonRules.email.optional(),
    phone: commonRules.phone.optional(),
    avatar: commonRules.url.optional(),
    bio: commonRules.description.optional()
  }),
  
  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: commonRules.password.required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords do not match'
    })
  })
};

/**
 * 消息相关验证模式
 */
const messageSchemas = {
  send: Joi.object({
    type: Joi.string().valid('text', 'image', 'video', 'file', 'template').required(),
    content: Joi.string().when('type', {
      is: 'text',
      then: Joi.required().max(2000),
      otherwise: Joi.optional()
    }),
    mediaUrl: Joi.string().uri().when('type', {
      is: Joi.valid('image', 'video', 'file'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    templateId: Joi.string().when('type', {
      is: 'template',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    templateData: Joi.object().when('type', {
      is: 'template',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    recipients: Joi.array().items(Joi.string()).min(1).max(1000).required(),
    scheduled: Joi.date().iso().min('now').optional()
  }),
  
  template: Joi.object({
    name: commonRules.name.required(),
    content: commonRules.content.required(),
    variables: Joi.array().items(Joi.string()).optional(),
    type: Joi.string().valid('wechat', 'wecom', 'sms', 'email').required()
  })
};

/**
 * 积分商城相关验证模式
 */
const pointsSchemas = {
  product: Joi.object({
    name: commonRules.name.required(),
    description: commonRules.description.required(),
    price: commonRules.points.required(),
    stock: Joi.number().integer().min(0).required(),
    category: Joi.string().required(),
    images: Joi.array().items(commonRules.url).min(1).max(10).required(),
    status: commonRules.status.default('active')
  }),
  
  order: Joi.object({
    productId: commonRules.id.required(),
    quantity: Joi.number().integer().min(1).max(999).required(),
    address: Joi.object({
      name: commonRules.name.required(),
      phone: commonRules.phone.required(),
      province: Joi.string().required(),
      city: Joi.string().required(),
      district: Joi.string().required(),
      detail: Joi.string().max(200).required()
    }).optional()
  }),
  
  exchange: Joi.object({
    type: Joi.string().valid('signin', 'task', 'invite', 'purchase', 'admin').required(),
    points: commonRules.points.required(),
    description: commonRules.description.required(),
    userId: commonRules.id.required()
  })
};

/**
 * 文件上传验证模式
 */
const uploadSchema = Joi.object({
  type: commonRules.fileType.required(),
  maxSize: Joi.number().integer().min(1).max(100 * 1024 * 1024).default(10 * 1024 * 1024), // 默认10MB
  allowedTypes: Joi.array().items(commonRules.mimeType).optional()
});

/**
 * 自定义验证函数
 */
const customValidators = {
  /**
   * 验证中国身份证号
   */
  idCard: (value, helpers) => {
    const pattern = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    if (!pattern.test(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  },
  
  /**
   * 验证银行卡号
   */
  bankCard: (value, helpers) => {
    const pattern = /^[1-9]\d{12,19}$/;
    if (!pattern.test(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  },
  
  /**
   * 验证IP地址
   */
  ipAddress: (value, helpers) => {
    const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (!ipv4Pattern.test(value) && !ipv6Pattern.test(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }
};

/**
 * 验证请求参数
 */
const validateParams = (schema) => validate(schema, 'params');

/**
 * 验证查询参数
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * 验证请求体
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * 验证请求头
 */
const validateHeaders = (schema) => validate(schema, 'headers');

/**
 * 组合验证器
 */
const validateAll = (schemas) => {
  return (req, res, next) => {
    const validators = [];
    
    if (schemas.params) validators.push(validateParams(schemas.params));
    if (schemas.query) validators.push(validateQuery(schemas.query));
    if (schemas.body) validators.push(validateBody(schemas.body));
    if (schemas.headers) validators.push(validateHeaders(schemas.headers));
    
    // 依次执行所有验证器
    const runValidators = (index) => {
      if (index >= validators.length) {
        return next();
      }
      
      validators[index](req, res, (err) => {
        if (err) return next(err);
        runValidators(index + 1);
      });
    };
    
    runValidators(0);
  };
};

module.exports = {
  validate,
  validateParams,
  validateQuery,
  validateBody,
  validateHeaders,
  validateAll,
  commonRules,
  paginationSchema,
  searchSchema,
  userSchemas,
  messageSchemas,
  pointsSchemas,
  uploadSchema,
  customValidators,
  Joi
};