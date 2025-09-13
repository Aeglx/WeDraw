const { ValidationError } = require('../utils/errors');
const { validateInput } = require('../utils/validation');
const logger = require('../utils/logger');

/**
 * 请求验证中间件
 * @param {object} schema - 验证规则
 * @param {object} options - 验证选项
 */
const validateRequest = (schema = {}, options = {}) => {
  return (req, res, next) => {
    try {
      const errors = [];

      // 验证请求体
      if (schema.body) {
        const bodyErrors = validateInput(req.body || {}, schema.body);
        if (bodyErrors.length > 0) {
          errors.push(...bodyErrors.map(err => ({ field: `body.${err.field}`, message: err.message })));
        }
      }

      // 验证查询参数
      if (schema.query) {
        const queryErrors = validateInput(req.query || {}, schema.query);
        if (queryErrors.length > 0) {
          errors.push(...queryErrors.map(err => ({ field: `query.${err.field}`, message: err.message })));
        }
      }

      // 验证路径参数
      if (schema.params) {
        const paramsErrors = validateInput(req.params || {}, schema.params);
        if (paramsErrors.length > 0) {
          errors.push(...paramsErrors.map(err => ({ field: `params.${err.field}`, message: err.message })));
        }
      }

      // 验证请求头
      if (schema.headers) {
        const headersErrors = validateInput(req.headers || {}, schema.headers);
        if (headersErrors.length > 0) {
          errors.push(...headersErrors.map(err => ({ field: `headers.${err.field}`, message: err.message })));
        }
      }

      if (errors.length > 0) {
        logger.logError('validation_error', new Error('Request validation failed'), {
          path: req.path,
          method: req.method,
          errors,
          body: req.body,
          query: req.query,
          params: req.params
        });

        throw new ValidationError('请求参数验证失败', { details: errors });
      }

      // 数据清理和转换
      if (options.sanitize !== false) {
        sanitizeRequest(req, schema);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 文件上传验证中间件
 * @param {object} options - 上传选项
 */
const validateFileUpload = (options = {}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    maxFiles = 1,
    fieldName = 'file'
  } = options;

  return (req, res, next) => {
    try {
      const files = req.files;
      const file = req.file;

      // 检查是否必须上传文件
      if (required && !files && !file) {
        throw new ValidationError('缺少必需的文件');
      }

      // 如果没有文件且不是必需的，直接通过
      if (!files && !file) {
        return next();
      }

      // 处理单文件上传
      if (file) {
        validateSingleFile(file, { maxSize, allowedTypes });
        return next();
      }

      // 处理多文件上传
      if (files) {
        const fileArray = Array.isArray(files) ? files : 
                         files[fieldName] ? files[fieldName] : 
                         Object.values(files).flat();

        if (fileArray.length > maxFiles) {
          throw new ValidationError(`最多只能上传${maxFiles}个文件`);
        }

        for (const uploadedFile of fileArray) {
          validateSingleFile(uploadedFile, { maxSize, allowedTypes });
        }
      }

      next();
    } catch (error) {
      logger.logError('file_validation_error', error, {
        path: req.path,
        method: req.method,
        fileInfo: {
          hasFile: !!req.file,
          hasFiles: !!req.files,
          fileCount: req.files ? Object.keys(req.files).length : 0
        }
      });
      next(error);
    }
  };
};

/**
 * 验证单个文件
 */
const validateSingleFile = (file, options) => {
  const { maxSize, allowedTypes } = options;

  if (!file) {
    throw new ValidationError('文件不存在');
  }

  // 检查文件大小
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    throw new ValidationError(`文件大小不能超过${maxSizeMB}MB`);
  }

  // 检查文件类型
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    throw new ValidationError(`不支持的文件类型，支持的类型：${allowedTypes.join(', ')}`);
  }

  // 检查文件名
  if (!file.originalname || file.originalname.length > 255) {
    throw new ValidationError('文件名无效或过长');
  }

  // 检查危险文件扩展名
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.jar'];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (dangerousExtensions.includes(fileExtension)) {
    throw new ValidationError('不允许上传可执行文件');
  }
};

/**
 * 分页参数验证中间件
 */
const validatePagination = (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort, order = 'DESC' } = req.query;

    // 验证页码
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      throw new ValidationError('页码必须是大于0的整数');
    }
    if (pageNum > 10000) {
      throw new ValidationError('页码不能超过10000');
    }

    // 验证每页数量
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      throw new ValidationError('每页数量必须是大于0的整数');
    }
    if (limitNum > 100) {
      throw new ValidationError('每页数量不能超过100');
    }

    // 验证排序方向
    if (order && !['ASC', 'DESC', 'asc', 'desc'].includes(order)) {
      throw new ValidationError('排序方向只能是ASC或DESC');
    }

    // 验证排序字段（如果提供）
    if (sort) {
      const allowedSortFields = req.allowedSortFields || [];
      if (allowedSortFields.length > 0 && !allowedSortFields.includes(sort)) {
        throw new ValidationError(`不支持的排序字段，支持的字段：${allowedSortFields.join(', ')}`);
      }
    }

    // 将验证后的参数添加到请求对象
    req.pagination = {
      page: pageNum,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      sort: sort || 'createdAt',
      order: order.toUpperCase()
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 日期范围验证中间件
 */
const validateDateRange = (startField = 'startDate', endField = 'endDate', options = {}) => {
  return (req, res, next) => {
    try {
      const startDate = req.query[startField];
      const endDate = req.query[endField];
      const { maxDays = 365, required = false } = options;

      if (required && (!startDate || !endDate)) {
        throw new ValidationError(`${startField}和${endField}是必需的`);
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // 验证日期格式
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new ValidationError('日期格式无效');
        }

        // 验证日期范围
        if (start > end) {
          throw new ValidationError('开始日期不能晚于结束日期');
        }

        // 验证最大天数
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (daysDiff > maxDays) {
          throw new ValidationError(`日期范围不能超过${maxDays}天`);
        }

        // 验证日期不能是未来
        const now = new Date();
        if (start > now || end > now) {
          throw new ValidationError('日期不能是未来时间');
        }

        // 将验证后的日期添加到请求对象
        req.dateRange = { start, end, daysDiff };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * ID参数验证中间件
 */
const validateId = (paramName = 'id', options = {}) => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      const { required = true, min = 1, max = Number.MAX_SAFE_INTEGER } = options;

      if (!id && required) {
        throw new ValidationError(`缺少必需的参数：${paramName}`);
      }

      if (id) {
        const numId = parseInt(id);
        
        if (isNaN(numId)) {
          throw new ValidationError(`${paramName}必须是数字`);
        }

        if (numId < min || numId > max) {
          throw new ValidationError(`${paramName}必须在${min}到${max}之间`);
        }

        // 将验证后的ID添加到请求对象
        req.validatedId = numId;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 请求体大小验证中间件
 */
const validateRequestSize = (maxSize = '1mb') => {
  return (req, res, next) => {
    try {
      const contentLength = req.headers['content-length'];
      
      if (contentLength) {
        const sizeInBytes = parseInt(contentLength);
        const maxSizeInBytes = parseSize(maxSize);
        
        if (sizeInBytes > maxSizeInBytes) {
          throw new ValidationError(`请求体大小不能超过${maxSize}`);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * 解析大小字符串为字节数
 */
const parseSize = (size) => {
  if (typeof size === 'number') return size;
  
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) throw new Error('Invalid size format');
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
};

/**
 * 数据清理函数
 */
const sanitizeRequest = (req, schema) => {
  // 清理请求体
  if (schema.body && req.body) {
    req.body = sanitizeObject(req.body, schema.body);
  }

  // 清理查询参数
  if (schema.query && req.query) {
    req.query = sanitizeObject(req.query, schema.query);
  }

  // 清理路径参数
  if (schema.params && req.params) {
    req.params = sanitizeObject(req.params, schema.params);
  }
};

/**
 * 清理对象数据
 */
const sanitizeObject = (obj, rules) => {
  const sanitized = {};
  
  for (const [key, rule] of Object.entries(rules)) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key];
      
      // 字符串清理
      if (typeof value === 'string') {
        value = value.trim();
        
        // HTML转义
        if (rule.escapeHtml !== false) {
          value = escapeHtml(value);
        }
        
        // 移除特殊字符
        if (rule.removeSpecialChars) {
          value = value.replace(/[<>"'&]/g, '');
        }
      }
      
      // 数字转换
      if (rule.type === 'number' && typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          value = num;
        }
      }
      
      // 布尔转换
      if (rule.type === 'boolean' && typeof value === 'string') {
        value = value.toLowerCase() === 'true';
      }
      
      // 数组转换
      if (rule.type === 'array' && typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = value.split(',').map(item => item.trim());
        }
      }
      
      sanitized[key] = value;
    } else if (rule.default !== undefined) {
      sanitized[key] = rule.default;
    }
  }
  
  return sanitized;
};

/**
 * HTML转义函数
 */
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * 自定义验证器中间件
 */
const customValidator = (validatorFn, errorMessage = '验证失败') => {
  return async (req, res, next) => {
    try {
      const isValid = await validatorFn(req);
      
      if (!isValid) {
        throw new ValidationError(errorMessage);
      }
      
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
      } else {
        logger.logError('custom_validation_error', error, {
          path: req.path,
          method: req.method
        });
        next(new ValidationError(errorMessage));
      }
    }
  };
};

/**
 * 条件验证中间件
 */
const conditionalValidation = (condition, validator) => {
  return (req, res, next) => {
    try {
      const shouldValidate = typeof condition === 'function' ? 
                           condition(req) : 
                           condition;
      
      if (shouldValidate) {
        return validator(req, res, next);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validateRequest,
  validateFileUpload,
  validatePagination,
  validateDateRange,
  validateId,
  validateRequestSize,
  customValidator,
  conditionalValidation,
  sanitizeObject,
  escapeHtml
};