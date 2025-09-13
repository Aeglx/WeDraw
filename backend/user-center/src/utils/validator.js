const Joi = require('joi');
const logger = require('./logger');

/**
 * 验证工具类
 */
class Validator {
  constructor() {
    // 自定义验证规则
    this.customJoi = Joi.extend({
      type: 'phone',
      base: Joi.string(),
      messages: {
        'phone.invalid': 'Invalid phone number format'
      },
      validate(value, helpers) {
        // 中国大陆手机号验证
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(value)) {
          return { value, errors: helpers.error('phone.invalid') };
        }
        return { value };
      }
    }, {
      type: 'password',
      base: Joi.string(),
      messages: {
        'password.weak': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      },
      validate(value, helpers) {
        // 密码强度验证：至少包含大小写字母、数字和特殊字符
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(value)) {
          return { value, errors: helpers.error('password.weak') };
        }
        return { value };
      }
    });

    // 预定义的验证模式
    this.schemas = {
      // 用户注册
      userRegister: this.customJoi.object({
        username: this.customJoi.string()
          .alphanum()
          .min(3)
          .max(30)
          .required()
          .messages({
            'string.alphanum': 'Username must only contain alphanumeric characters',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username must not exceed 30 characters'
          }),
        email: this.customJoi.string()
          .email()
          .required()
          .messages({
            'string.email': 'Please provide a valid email address'
          }),
        password: this.customJoi.password()
          .min(8)
          .max(128)
          .required()
          .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password must not exceed 128 characters'
          }),
        phone: this.customJoi.phone().optional(),
        nickname: this.customJoi.string()
          .min(1)
          .max(50)
          .optional()
          .messages({
            'string.min': 'Nickname must be at least 1 character long',
            'string.max': 'Nickname must not exceed 50 characters'
          }),
        avatar: this.customJoi.string().uri().optional(),
        acceptTerms: this.customJoi.boolean().valid(true).required().messages({
          'any.only': 'You must accept the terms and conditions'
        })
      }),

      // 用户登录
      userLogin: this.customJoi.object({
        identifier: this.customJoi.string().required().messages({
          'any.required': 'Username, email, or phone is required'
        }),
        password: this.customJoi.string().required().messages({
          'any.required': 'Password is required'
        }),
        rememberMe: this.customJoi.boolean().optional().default(false)
      }),

      // 手机验证码登录
      phoneLogin: this.customJoi.object({
        phone: this.customJoi.phone().required(),
        code: this.customJoi.string().length(6).pattern(/^\d{6}$/).required().messages({
          'string.length': 'Verification code must be 6 digits',
          'string.pattern.base': 'Verification code must contain only numbers'
        })
      }),

      // 发送验证码
      sendVerificationCode: this.customJoi.object({
        phone: this.customJoi.phone().required(),
        type: this.customJoi.string().valid('register', 'login', 'reset_password', 'change_phone').required()
      }),

      // 邮箱验证
      emailVerification: this.customJoi.object({
        token: this.customJoi.string().required().messages({
          'any.required': 'Verification token is required'
        })
      }),

      // 忘记密码
      forgotPassword: this.customJoi.object({
        email: this.customJoi.string().email().required().messages({
          'string.email': 'Please provide a valid email address'
        })
      }),

      // 重置密码
      resetPassword: this.customJoi.object({
        token: this.customJoi.string().required().messages({
          'any.required': 'Reset token is required'
        }),
        password: this.customJoi.password().min(8).max(128).required().messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.max': 'Password must not exceed 128 characters'
        }),
        confirmPassword: this.customJoi.string().valid(this.customJoi.ref('password')).required().messages({
          'any.only': 'Passwords do not match'
        })
      }),

      // 更改密码
      changePassword: this.customJoi.object({
        currentPassword: this.customJoi.string().required().messages({
          'any.required': 'Current password is required'
        }),
        newPassword: this.customJoi.password().min(8).max(128).required().messages({
          'string.min': 'New password must be at least 8 characters long',
          'string.max': 'New password must not exceed 128 characters'
        }),
        confirmPassword: this.customJoi.string().valid(this.customJoi.ref('newPassword')).required().messages({
          'any.only': 'Passwords do not match'
        })
      }),

      // 更新用户信息
      updateProfile: this.customJoi.object({
        nickname: this.customJoi.string().min(1).max(50).optional(),
        avatar: this.customJoi.string().uri().optional(),
        bio: this.customJoi.string().max(500).optional().messages({
          'string.max': 'Bio must not exceed 500 characters'
        }),
        website: this.customJoi.string().uri().optional(),
        location: this.customJoi.string().max(100).optional(),
        birthday: this.customJoi.date().max('now').optional().messages({
          'date.max': 'Birthday cannot be in the future'
        }),
        gender: this.customJoi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional()
      }),

      // 更新偏好设置
      updatePreferences: this.customJoi.object({
        language: this.customJoi.string().valid('zh-CN', 'en-US', 'ja-JP', 'ko-KR').optional(),
        timezone: this.customJoi.string().optional(),
        theme: this.customJoi.string().valid('light', 'dark', 'auto').optional(),
        emailNotifications: this.customJoi.object({
          marketing: this.customJoi.boolean().optional(),
          security: this.customJoi.boolean().optional(),
          updates: this.customJoi.boolean().optional(),
          social: this.customJoi.boolean().optional()
        }).optional(),
        pushNotifications: this.customJoi.object({
          enabled: this.customJoi.boolean().optional(),
          sound: this.customJoi.boolean().optional(),
          vibration: this.customJoi.boolean().optional()
        }).optional(),
        privacy: this.customJoi.object({
          profileVisibility: this.customJoi.string().valid('public', 'friends', 'private').optional(),
          showOnlineStatus: this.customJoi.boolean().optional(),
          allowSearchByEmail: this.customJoi.boolean().optional(),
          allowSearchByPhone: this.customJoi.boolean().optional()
        }).optional()
      }),

      // 分页参数
      pagination: this.customJoi.object({
        page: this.customJoi.number().integer().min(1).optional().default(1),
        limit: this.customJoi.number().integer().min(1).max(100).optional().default(20),
        sort: this.customJoi.string().optional().default('createdAt'),
        order: this.customJoi.string().valid('asc', 'desc').optional().default('desc')
      }),

      // 搜索参数
      search: this.customJoi.object({
        q: this.customJoi.string().min(1).max(100).required().messages({
          'string.min': 'Search query must be at least 1 character long',
          'string.max': 'Search query must not exceed 100 characters'
        }),
        type: this.customJoi.string().valid('users', 'posts', 'all').optional().default('all'),
        page: this.customJoi.number().integer().min(1).optional().default(1),
        limit: this.customJoi.number().integer().min(1).max(50).optional().default(20)
      }),

      // ID参数
      id: this.customJoi.object({
        id: this.customJoi.string().guid({ version: 'uuidv4' }).required().messages({
          'string.guid': 'Invalid ID format'
        })
      }),

      // 批量操作
      batchIds: this.customJoi.object({
        ids: this.customJoi.array()
          .items(this.customJoi.string().guid({ version: 'uuidv4' }))
          .min(1)
          .max(100)
          .required()
          .messages({
            'array.min': 'At least one ID is required',
            'array.max': 'Cannot process more than 100 IDs at once'
          })
      }),

      // 文件上传
      fileUpload: this.customJoi.object({
        filename: this.customJoi.string().required(),
        mimetype: this.customJoi.string().valid(
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ).required(),
        size: this.customJoi.number().max(10 * 1024 * 1024).required().messages({
          'number.max': 'File size must not exceed 10MB'
        })
      })
    };
  }

  /**
   * 验证数据
   */
  validate(data, schema, options = {}) {
    try {
      const validationOptions = {
        abortEarly: false, // 返回所有错误
        allowUnknown: false, // 不允许未知字段
        stripUnknown: true, // 移除未知字段
        ...options
      };

      let validationSchema;
      
      if (typeof schema === 'string') {
        // 使用预定义的模式
        validationSchema = this.schemas[schema];
        if (!validationSchema) {
          throw new Error(`Validation schema '${schema}' not found`);
        }
      } else {
        // 使用自定义模式
        validationSchema = schema;
      }

      const { error, value } = validationSchema.validate(data, validationOptions);

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        return {
          valid: false,
          errors,
          data: null
        };
      }

      return {
        valid: true,
        errors: null,
        data: value
      };
    } catch (error) {
      logger.error('Validation error:', error);
      return {
        valid: false,
        errors: [{ field: 'general', message: 'Validation failed', type: 'validation.error' }],
        data: null
      };
    }
  }

  /**
   * 验证中间件
   */
  validateMiddleware(schema, source = 'body') {
    return (req, res, next) => {
      try {
        let data;
        
        switch (source) {
          case 'body':
            data = req.body;
            break;
          case 'query':
            data = req.query;
            break;
          case 'params':
            data = req.params;
            break;
          case 'headers':
            data = req.headers;
            break;
          default:
            data = req.body;
        }

        const result = this.validate(data, schema);

        if (!result.valid) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: result.errors
          });
        }

        // 将验证后的数据附加到请求对象
        req.validated = req.validated || {};
        req.validated[source] = result.data;

        next();
      } catch (error) {
        logger.error('Validation middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal validation error'
        });
      }
    };
  }

  /**
   * 验证请求体
   */
  validateBody(schema) {
    return this.validateMiddleware(schema, 'body');
  }

  /**
   * 验证查询参数
   */
  validateQuery(schema) {
    return this.validateMiddleware(schema, 'query');
  }

  /**
   * 验证路径参数
   */
  validateParams(schema) {
    return this.validateMiddleware(schema, 'params');
  }

  /**
   * 验证请求头
   */
  validateHeaders(schema) {
    return this.validateMiddleware(schema, 'headers');
  }

  /**
   * 组合验证中间件
   */
  validateRequest(schemas) {
    const middlewares = [];
    
    if (schemas.body) {
      middlewares.push(this.validateBody(schemas.body));
    }
    
    if (schemas.query) {
      middlewares.push(this.validateQuery(schemas.query));
    }
    
    if (schemas.params) {
      middlewares.push(this.validateParams(schemas.params));
    }
    
    if (schemas.headers) {
      middlewares.push(this.validateHeaders(schemas.headers));
    }

    return middlewares;
  }

  /**
   * 添加自定义验证模式
   */
  addSchema(name, schema) {
    this.schemas[name] = schema;
  }

  /**
   * 获取验证模式
   */
  getSchema(name) {
    return this.schemas[name];
  }

  /**
   * 验证邮箱格式
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式
   */
  isValidPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证密码强度
   */
  isStrongPassword(password) {
    // 至少8位，包含大小写字母、数字和特殊字符
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  /**
   * 验证用户名格式
   */
  isValidUsername(username) {
    // 3-30位字母数字组合
    const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
    return usernameRegex.test(username);
  }

  /**
   * 验证URL格式
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证UUID格式
   */
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * 清理和规范化数据
   */
  sanitize(data, options = {}) {
    const {
      trim = true,
      lowercase = false,
      removeHtml = false,
      maxLength = null
    } = options;

    if (typeof data !== 'string') {
      return data;
    }

    let result = data;

    if (trim) {
      result = result.trim();
    }

    if (lowercase) {
      result = result.toLowerCase();
    }

    if (removeHtml) {
      result = result.replace(/<[^>]*>/g, '');
    }

    if (maxLength && result.length > maxLength) {
      result = result.substring(0, maxLength);
    }

    return result;
  }

  /**
   * 批量清理数据
   */
  sanitizeObject(obj, fieldOptions = {}) {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const options = fieldOptions[key] || {};
      result[key] = this.sanitize(value, options);
    }
    
    return result;
  }
}

// 创建验证器实例
const validator = new Validator();

// 导出便捷方法
const validate = (data, schema, options) => validator.validate(data, schema, options);
const validateBody = (schema) => validator.validateBody(schema);
const validateQuery = (schema) => validator.validateQuery(schema);
const validateParams = (schema) => validator.validateParams(schema);
const validateHeaders = (schema) => validator.validateHeaders(schema);
const validateRequest = (schemas) => validator.validateRequest(schemas);
const isValidEmail = (email) => validator.isValidEmail(email);
const isValidPhone = (phone) => validator.isValidPhone(phone);
const isStrongPassword = (password) => validator.isStrongPassword(password);
const isValidUsername = (username) => validator.isValidUsername(username);
const isValidUrl = (url) => validator.isValidUrl(url);
const isValidUUID = (uuid) => validator.isValidUUID(uuid);
const sanitize = (data, options) => validator.sanitize(data, options);
const sanitizeObject = (obj, fieldOptions) => validator.sanitizeObject(obj, fieldOptions);

module.exports = {
  validator,
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  validateRequest,
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  isValidUsername,
  isValidUrl,
  isValidUUID,
  sanitize,
  sanitizeObject,
  Joi: validator.customJoi
};