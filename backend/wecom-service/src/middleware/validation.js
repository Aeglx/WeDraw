const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 验证请求参数中间件
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {Function} next 下一个中间件
 */
const validateRequest = (req, res, next) => {
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value,
      }));
      
      logger.warn('Request validation failed', {
        url: req.originalUrl,
        method: req.method,
        errors: errorMessages,
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors: errorMessages,
      });
    }
    
    next();
  } catch (error) {
    logger.error('Validation middleware error:', error);
    res.status(500).json({
      success: false,
      message: '参数验证过程中发生错误',
      error: error.message,
    });
  }
};

/**
 * 自定义验证器：检查企业微信用户ID格式
 * @param {string} value 用户ID
 * @returns {boolean} 是否有效
 */
const isValidWecomUserid = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  // 企业微信用户ID规则：1-64个字符，支持字母、数字、下划线、减号、点号
  const regex = /^[a-zA-Z0-9._-]{1,64}$/;
  return regex.test(value);
};

/**
 * 自定义验证器：检查企业微信部门ID格式
 * @param {number} value 部门ID
 * @returns {boolean} 是否有效
 */
const isValidWecomDepartmentId = (value) => {
  const id = parseInt(value);
  return !isNaN(id) && id > 0 && id <= 2147483647; // 32位正整数
};

/**
 * 自定义验证器：检查手机号格式
 * @param {string} value 手机号
 * @returns {boolean} 是否有效
 */
const isValidMobile = (value) => {
  if (!value) return true; // 允许为空
  
  // 中国大陆手机号格式
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(value);
};

/**
 * 自定义验证器：检查邮箱格式
 * @param {string} value 邮箱
 * @returns {boolean} 是否有效
 */
const isValidEmail = (value) => {
  if (!value) return true; // 允许为空
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value);
};

/**
 * 自定义验证器：检查用户状态
 * @param {number} value 状态值
 * @returns {boolean} 是否有效
 */
const isValidUserStatus = (value) => {
  const validStatuses = [1, 2, 4, 5]; // 已激活、已禁用、未激活、退出企业
  return validStatuses.includes(parseInt(value));
};

/**
 * 自定义验证器：检查性别
 * @param {number} value 性别值
 * @returns {boolean} 是否有效
 */
const isValidGender = (value) => {
  const validGenders = [0, 1, 2]; // 未定义、男、女
  return validGenders.includes(parseInt(value));
};

/**
 * 自定义验证器：检查部门ID数组
 * @param {Array} value 部门ID数组
 * @returns {boolean} 是否有效
 */
const isValidDepartmentArray = (value) => {
  if (!Array.isArray(value)) {
    return false;
  }
  
  if (value.length === 0 || value.length > 20) {
    return false; // 部门数量限制
  }
  
  return value.every(id => isValidWecomDepartmentId(id));
};

/**
 * 自定义验证器：检查导出格式
 * @param {string} value 格式
 * @returns {boolean} 是否有效
 */
const isValidExportFormat = (value) => {
  const validFormats = ['csv', 'xlsx'];
  return validFormats.includes(value);
};

/**
 * 自定义验证器：检查分页参数
 * @param {number} value 页码或每页数量
 * @param {Object} options 选项
 * @returns {boolean} 是否有效
 */
const isValidPagination = (value, { min = 1, max = 1000 } = {}) => {
  const num = parseInt(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * 自定义验证器：检查搜索关键词
 * @param {string} value 关键词
 * @returns {boolean} 是否有效
 */
const isValidSearchKeyword = (value) => {
  if (!value) return true; // 允许为空
  
  // 长度限制和特殊字符检查
  if (value.length > 100) {
    return false;
  }
  
  // 禁止SQL注入相关字符
  const dangerousChars = /[';"\\<>]/;
  return !dangerousChars.test(value);
};

/**
 * 参数清理中间件
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {Function} next 下一个中间件
 */
const sanitizeRequest = (req, res, next) => {
  try {
    // 清理字符串参数
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      return str.trim().replace(/[\x00-\x1f\x7f-\x9f]/g, ''); // 移除控制字符
    };
    
    // 递归清理对象
    const sanitizeObject = (obj) => {
      if (obj === null || obj === undefined) return obj;
      
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      
      return obj;
    };
    
    // 清理请求参数
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    
    next();
  } catch (error) {
    logger.error('Request sanitization error:', error);
    res.status(500).json({
      success: false,
      message: '请求参数处理失败',
      error: error.message,
    });
  }
};

/**
 * 创建通用验证规则
 * @param {string} field 字段名
 * @param {Object} options 验证选项
 * @returns {Array} 验证规则数组
 */
const createValidationRules = (field, options = {}) => {
  const {
    required = false,
    type = 'string',
    min,
    max,
    custom,
    sanitize = true,
  } = options;
  
  const rules = [];
  
  // 基础验证
  if (required) {
    rules.push(`${field}().notEmpty().withMessage('${field} 不能为空')`);
  } else {
    rules.push(`${field}().optional()`);
  }
  
  // 类型验证
  switch (type) {
    case 'string':
      rules.push(`${field}().isString().withMessage('${field} 必须是字符串')`);
      if (min !== undefined) {
        rules.push(`${field}().isLength({ min: ${min} }).withMessage('${field} 长度不能少于 ${min} 个字符')`);
      }
      if (max !== undefined) {
        rules.push(`${field}().isLength({ max: ${max} }).withMessage('${field} 长度不能超过 ${max} 个字符')`);
      }
      if (sanitize) {
        rules.push(`${field}().trim()`);
      }
      break;
      
    case 'int':
      rules.push(`${field}().isInt().withMessage('${field} 必须是整数')`);
      if (min !== undefined) {
        rules.push(`${field}().isInt({ min: ${min} }).withMessage('${field} 不能小于 ${min}')`);
      }
      if (max !== undefined) {
        rules.push(`${field}().isInt({ max: ${max} }).withMessage('${field} 不能大于 ${max}')`);
      }
      rules.push(`${field}().toInt()`);
      break;
      
    case 'boolean':
      rules.push(`${field}().isBoolean().withMessage('${field} 必须是布尔值')`);
      rules.push(`${field}().toBoolean()`);
      break;
      
    case 'email':
      rules.push(`${field}().isEmail().withMessage('${field} 格式不正确')`);
      if (sanitize) {
        rules.push(`${field}().normalizeEmail()`);
      }
      break;
      
    case 'array':
      rules.push(`${field}().isArray().withMessage('${field} 必须是数组')`);
      if (min !== undefined) {
        rules.push(`${field}().isArray({ min: ${min} }).withMessage('${field} 至少包含 ${min} 个元素')`);
      }
      if (max !== undefined) {
        rules.push(`${field}().isArray({ max: ${max} }).withMessage('${field} 最多包含 ${max} 个元素')`);
      }
      break;
  }
  
  // 自定义验证
  if (custom) {
    rules.push(`${field}().custom(${custom.toString()}).withMessage('${field} 格式不正确')`);
  }
  
  return rules;
};

module.exports = {
  validateRequest,
  sanitizeRequest,
  createValidationRules,
  // 自定义验证器
  isValidWecomUserid,
  isValidWecomDepartmentId,
  isValidMobile,
  isValidEmail,
  isValidUserStatus,
  isValidGender,
  isValidDepartmentArray,
  isValidExportFormat,
  isValidPagination,
  isValidSearchKeyword,
};