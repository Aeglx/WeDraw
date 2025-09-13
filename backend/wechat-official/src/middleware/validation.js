const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 验证请求参数中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const validateRequest = (req, res, next) => {
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorDetails = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
        location: error.location
      }));
      
      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors: errorDetails,
        body: req.body,
        query: req.query,
        params: req.params,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        code: 'VALIDATION_ERROR',
        errors: errorDetails
      });
    }
    
    next();
  } catch (error) {
    logger.error('Validation middleware error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });
    
    return res.status(500).json({
      success: false,
      message: '参数验证服务异常',
      code: 'VALIDATION_SERVICE_ERROR'
    });
  }
};

/**
 * 自定义验证器：检查微信OpenID格式
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidOpenId = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  
  // OpenID通常是28个字符的字符串，包含字母、数字、下划线和连字符
  const openIdRegex = /^[a-zA-Z0-9_-]{28}$/;
  return openIdRegex.test(value);
};

/**
 * 自定义验证器：检查微信UnionID格式
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidUnionId = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  
  // UnionID通常是28个字符的字符串
  const unionIdRegex = /^[a-zA-Z0-9_-]{28}$/;
  return unionIdRegex.test(value);
};

/**
 * 自定义验证器：检查微信媒体ID格式
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidMediaId = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  
  // 媒体ID通常是64个字符的字符串
  const mediaIdRegex = /^[a-zA-Z0-9_-]{1,128}$/;
  return mediaIdRegex.test(value);
};

/**
 * 自定义验证器：检查微信消息类型
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidMessageType = (value) => {
  const validTypes = [
    'text', 'image', 'voice', 'video', 'shortvideo',
    'location', 'link', 'music', 'news', 'mpnews',
    'msgmenu', 'wxcard', 'miniprogrampage'
  ];
  return validTypes.includes(value);
};

/**
 * 自定义验证器：检查微信事件类型
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidEventType = (value) => {
  const validEvents = [
    'subscribe', 'unsubscribe', 'SCAN', 'LOCATION',
    'CLICK', 'VIEW', 'scancode_push', 'scancode_waitmsg',
    'pic_sysphoto', 'pic_photo_or_album', 'pic_weixin',
    'location_select', 'enter_agent', 'batch_job_result'
  ];
  return validEvents.includes(value);
};

/**
 * 自定义验证器：检查手机号格式
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidPhoneNumber = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  
  // 中国大陆手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(value);
};

/**
 * 自定义验证器：检查邮箱格式
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidEmail = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

/**
 * 自定义验证器：检查URL格式
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidUrl = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * 自定义验证器：检查日期格式
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidDate = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * 自定义验证器：检查JSON格式
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidJSON = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * 自定义验证器：检查颜色值格式（十六进制）
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidHexColor = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(value);
};

/**
 * 自定义验证器：检查IP地址格式
 * @param {string} value - 要验证的值
 * @returns {boolean} 验证结果
 */
const isValidIP = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  
  // IPv4格式
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6格式（简化版）
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(value) || ipv6Regex.test(value);
};

/**
 * 数据清理中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const sanitizeInput = (req, res, next) => {
  try {
    // 清理字符串类型的输入
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      
      // 移除潜在的XSS攻击字符
      return str
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // 移除script标签
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/javascript:/gi, '') // 移除javascript协议
        .replace(/on\w+\s*=/gi, '') // 移除事件处理器
        .trim(); // 移除首尾空格
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
    
    // 清理请求体
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // 清理查询参数
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // 清理路径参数
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('Input sanitization error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });
    
    return res.status(500).json({
      success: false,
      message: '输入数据处理异常',
      code: 'SANITIZATION_ERROR'
    });
  }
};

module.exports = {
  validateRequest,
  sanitizeInput,
  // 自定义验证器
  isValidOpenId,
  isValidUnionId,
  isValidMediaId,
  isValidMessageType,
  isValidEventType,
  isValidPhoneNumber,
  isValidEmail,
  isValidUrl,
  isValidDate,
  isValidJSON,
  isValidHexColor,
  isValidIP
};