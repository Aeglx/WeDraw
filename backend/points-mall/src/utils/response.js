/**
 * 响应工具函数
 * 统一API响应格式
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 响应消息
 * @param {*} data - 响应数据
 * @param {number} code - 状态码
 * @returns {Object} 响应结果
 */
const successResponse = (res, message = '操作成功', data = null, code = 200) => {
  const response = {
    success: true,
    code,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(code).json(response);
};

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} code - 状态码
 * @param {*} errors - 详细错误信息
 * @returns {Object} 响应结果
 */
const errorResponse = (res, message = '操作失败', code = 500, errors = null) => {
  const response = {
    success: false,
    code,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (errors !== null) {
    response.errors = errors;
  }
  
  return res.status(code).json(response);
};

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 响应消息
 * @param {Array} data - 数据列表
 * @param {Object} pagination - 分页信息
 * @param {number} code - 状态码
 * @returns {Object} 响应结果
 */
const paginatedResponse = (res, message = '获取成功', data = [], pagination = {}, code = 200) => {
  const response = {
    success: true,
    code,
    message,
    data,
    pagination: {
      total: pagination.total || 0,
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      pages: pagination.pages || 0,
      ...pagination
    },
    timestamp: new Date().toISOString()
  };
  
  return res.status(code).json(response);
};

/**
 * 验证错误响应
 * @param {Object} res - Express响应对象
 * @param {Array|Object} errors - 验证错误信息
 * @returns {Object} 响应结果
 */
const validationErrorResponse = (res, errors) => {
  return errorResponse(res, '输入验证失败', 400, errors);
};

/**
 * 未授权响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @returns {Object} 响应结果
 */
const unauthorizedResponse = (res, message = '未授权访问') => {
  return errorResponse(res, message, 401);
};

/**
 * 禁止访问响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @returns {Object} 响应结果
 */
const forbiddenResponse = (res, message = '禁止访问') => {
  return errorResponse(res, message, 403);
};

/**
 * 资源不存在响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @returns {Object} 响应结果
 */
const notFoundResponse = (res, message = '资源不存在') => {
  return errorResponse(res, message, 404);
};

/**
 * 服务器错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {*} error - 错误对象
 * @returns {Object} 响应结果
 */
const serverErrorResponse = (res, message = '服务器内部错误', error = null) => {
  const response = {
    success: false,
    code: 500,
    message,
    timestamp: new Date().toISOString()
  };
  
  // 开发环境下返回详细错误信息
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = {
      message: error.message,
      stack: error.stack
    };
  }
  
  return res.status(500).json(response);
};

/**
 * 创建响应中间件
 * 为res对象添加响应方法
 */
const responseMiddleware = (req, res, next) => {
  res.success = (message, data, code) => successResponse(res, message, data, code);
  res.error = (message, code, errors) => errorResponse(res, message, code, errors);
  res.paginated = (message, data, pagination, code) => paginatedResponse(res, message, data, pagination, code);
  res.validationError = (errors) => validationErrorResponse(res, errors);
  res.unauthorized = (message) => unauthorizedResponse(res, message);
  res.forbidden = (message) => forbiddenResponse(res, message);
  res.notFound = (message) => notFoundResponse(res, message);
  res.serverError = (message, error) => serverErrorResponse(res, message, error);
  
  next();
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  responseMiddleware
};