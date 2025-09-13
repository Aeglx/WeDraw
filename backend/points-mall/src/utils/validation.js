/**
 * 验证工具函数
 * 提供各种数据验证功能
 */

/**
 * 验证规则类型
 */
const VALIDATION_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  BOOLEAN: 'boolean',
  EMAIL: 'email',
  PHONE: 'phone',
  URL: 'url',
  DATE: 'date',
  ARRAY: 'array',
  OBJECT: 'object',
  ENUM: 'enum'
};

/**
 * 验证单个字段
 * @param {*} value - 要验证的值
 * @param {Object} rule - 验证规则
 * @returns {Object} 验证结果
 */
const validateField = (value, rule) => {
  const result = {
    isValid: true,
    message: null
  };
  
  // 检查必填项
  if (rule.required !== false && (value === undefined || value === null || value === '')) {
    result.isValid = false;
    result.message = `${rule.name || '字段'}不能为空`;
    return result;
  }
  
  // 如果值为空且非必填，跳过验证
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return result;
  }
  
  // 根据类型进行验证
  switch (rule.type) {
    case VALIDATION_TYPES.STRING:
      if (typeof value !== 'string') {
        result.isValid = false;
        result.message = `${rule.name || '字段'}必须是字符串`;
        break;
      }
      
      if (rule.minLength && value.length < rule.minLength) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}长度不能少于${rule.minLength}个字符`;
        break;
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}长度不能超过${rule.maxLength}个字符`;
        break;
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}格式不正确`;
        break;
      }
      break;
      
    case VALIDATION_TYPES.NUMBER:
      const numValue = Number(value);
      if (isNaN(numValue)) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}必须是数字`;
        break;
      }
      
      if (rule.min !== undefined && numValue < rule.min) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}不能小于${rule.min}`;
        break;
      }
      
      if (rule.max !== undefined && numValue > rule.max) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}不能大于${rule.max}`;
        break;
      }
      break;
      
    case VALIDATION_TYPES.INTEGER:
      const intValue = parseInt(value);
      if (isNaN(intValue) || intValue !== Number(value)) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}必须是整数`;
        break;
      }
      
      if (rule.min !== undefined && intValue < rule.min) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}不能小于${rule.min}`;
        break;
      }
      
      if (rule.max !== undefined && intValue > rule.max) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}不能大于${rule.max}`;
        break;
      }
      break;
      
    case VALIDATION_TYPES.BOOLEAN:
      if (typeof value !== 'boolean') {
        result.isValid = false;
        result.message = `${rule.name || '字段'}必须是布尔值`;
      }
      break;
      
    case VALIDATION_TYPES.EMAIL:
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}邮箱格式不正确`;
      }
      break;
      
    case VALIDATION_TYPES.PHONE:
      const phonePattern = /^1[3-9]\d{9}$/;
      if (!phonePattern.test(value)) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}手机号格式不正确`;
      }
      break;
      
    case VALIDATION_TYPES.URL:
      try {
        new URL(value);
      } catch {
        result.isValid = false;
        result.message = `${rule.name || '字段'}URL格式不正确`;
      }
      break;
      
    case VALIDATION_TYPES.DATE:
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}日期格式不正确`;
      }
      break;
      
    case VALIDATION_TYPES.ARRAY:
      if (!Array.isArray(value)) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}必须是数组`;
        break;
      }
      
      if (rule.minLength && value.length < rule.minLength) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}数组长度不能少于${rule.minLength}`;
        break;
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}数组长度不能超过${rule.maxLength}`;
        break;
      }
      break;
      
    case VALIDATION_TYPES.OBJECT:
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}必须是对象`;
      }
      break;
      
    case VALIDATION_TYPES.ENUM:
      if (!rule.enum || !rule.enum.includes(value)) {
        result.isValid = false;
        result.message = `${rule.name || '字段'}值必须是: ${rule.enum?.join(', ')}`;
      }
      break;
      
    default:
      result.isValid = false;
      result.message = `未知的验证类型: ${rule.type}`;
  }
  
  return result;
};

/**
 * 验证输入数据
 * @param {Object} data - 要验证的数据对象
 * @param {Object} rules - 验证规则对象
 * @returns {Object} 验证结果
 */
const validateInput = (data, rules = null) => {
  const result = {
    isValid: true,
    message: null,
    errors: {}
  };
  
  // 如果传入的是规则对象（新格式）
  if (rules === null && typeof data === 'object') {
    rules = data;
    data = {};
    
    // 提取值
    for (const [key, rule] of Object.entries(rules)) {
      data[key] = rule.value;
    }
  }
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const fieldRule = {
      name: field,
      ...rule
    };
    
    const fieldResult = validateField(value, fieldRule);
    
    if (!fieldResult.isValid) {
      result.isValid = false;
      result.errors[field] = fieldResult.message;
      
      // 设置第一个错误消息
      if (!result.message) {
        result.message = fieldResult.message;
      }
    }
  }
  
  return result;
};

/**
 * 验证分页参数
 * @param {Object} query - 查询参数
 * @returns {Object} 验证结果和处理后的参数
 */
const validatePagination = (query) => {
  const { page = 1, limit = 20 } = query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const result = {
    isValid: true,
    message: null,
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)),
    offset: 0
  };
  
  if (isNaN(pageNum) || pageNum < 1) {
    result.isValid = false;
    result.message = '页码必须是大于0的整数';
    return result;
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    result.isValid = false;
    result.message = '每页数量必须是1-100之间的整数';
    return result;
  }
  
  result.offset = (result.page - 1) * result.limit;
  
  return result;
};

/**
 * 验证排序参数
 * @param {Object} query - 查询参数
 * @param {Array} allowedFields - 允许排序的字段
 * @returns {Object} 验证结果和处理后的参数
 */
const validateSort = (query, allowedFields = []) => {
  const { sort = 'created_at', order = 'DESC' } = query;
  
  const result = {
    isValid: true,
    message: null,
    sort: 'created_at',
    order: 'DESC'
  };
  
  if (allowedFields.length > 0 && !allowedFields.includes(sort)) {
    result.isValid = false;
    result.message = `排序字段必须是: ${allowedFields.join(', ')}`;
    return result;
  }
  
  if (!['ASC', 'DESC'].includes(order.toUpperCase())) {
    result.isValid = false;
    result.message = '排序方向必须是ASC或DESC';
    return result;
  }
  
  result.sort = sort;
  result.order = order.toUpperCase();
  
  return result;
};

/**
 * 验证日期范围
 * @param {Object} query - 查询参数
 * @returns {Object} 验证结果和处理后的参数
 */
const validateDateRange = (query) => {
  const { start_date, end_date } = query;
  
  const result = {
    isValid: true,
    message: null,
    startDate: null,
    endDate: null
  };
  
  if (start_date) {
    const startDate = new Date(start_date);
    if (isNaN(startDate.getTime())) {
      result.isValid = false;
      result.message = '开始日期格式不正确';
      return result;
    }
    result.startDate = startDate;
  }
  
  if (end_date) {
    const endDate = new Date(end_date);
    if (isNaN(endDate.getTime())) {
      result.isValid = false;
      result.message = '结束日期格式不正确';
      return result;
    }
    result.endDate = endDate;
  }
  
  if (result.startDate && result.endDate && result.startDate > result.endDate) {
    result.isValid = false;
    result.message = '开始日期不能大于结束日期';
    return result;
  }
  
  return result;
};

/**
 * 清理和验证字符串
 * @param {string} str - 要清理的字符串
 * @param {Object} options - 选项
 * @returns {string} 清理后的字符串
 */
const sanitizeString = (str, options = {}) => {
  if (typeof str !== 'string') {
    return '';
  }
  
  let result = str;
  
  // 去除首尾空格
  if (options.trim !== false) {
    result = result.trim();
  }
  
  // 转义HTML字符
  if (options.escapeHtml) {
    result = result
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  // 移除特殊字符
  if (options.removeSpecialChars) {
    result = result.replace(/[^\w\s\u4e00-\u9fff]/g, '');
  }
  
  return result;
};

module.exports = {
  VALIDATION_TYPES,
  validateField,
  validateInput,
  validatePagination,
  validateSort,
  validateDateRange,
  sanitizeString
};