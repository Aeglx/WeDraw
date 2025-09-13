/**
 * 基础控制器类
 */

class BaseController {
  constructor() {
    this.successResponse = this.successResponse.bind(this);
    this.errorResponse = this.errorResponse.bind(this);
    this.validationErrorResponse = this.validationErrorResponse.bind(this);
    this.notFoundResponse = this.notFoundResponse.bind(this);
    this.unauthorizedResponse = this.unauthorizedResponse.bind(this);
    this.forbiddenResponse = this.forbiddenResponse.bind(this);
  }

  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 响应数据
   * @param {string} message - 响应消息
   * @param {number} code - 状态码
   */
  successResponse(res, data = null, message = '操作成功', code = 200) {
    const response = {
      success: true,
      code: code,
      message: message,
      data: data,
      timestamp: new Date().toISOString()
    };

    return res.status(code).json(response);
  }

  /**
   * 错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {number} code - 状态码
   * @param {*} error - 错误详情
   */
  errorResponse(res, message = '操作失败', code = 500, error = null) {
    const response = {
      success: false,
      code: code,
      message: message,
      timestamp: new Date().toISOString()
    };

    if (error && process.env.NODE_ENV === 'development') {
      response.error = error;
    }

    return res.status(code).json(response);
  }

  /**
   * 验证错误响应
   * @param {Object} res - Express响应对象
   * @param {Array} errors - 验证错误列表
   * @param {string} message - 错误消息
   */
  validationErrorResponse(res, errors = [], message = '参数验证失败') {
    const response = {
      success: false,
      code: 400,
      message: message,
      errors: errors,
      timestamp: new Date().toISOString()
    };

    return res.status(400).json(response);
  }

  /**
   * 未找到响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  notFoundResponse(res, message = '资源未找到') {
    return this.errorResponse(res, message, 404);
  }

  /**
   * 未授权响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  unauthorizedResponse(res, message = '未授权访问') {
    return this.errorResponse(res, message, 401);
  }

  /**
   * 禁止访问响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  forbiddenResponse(res, message = '禁止访问') {
    return this.errorResponse(res, message, 403);
  }

  /**
   * 分页响应
   * @param {Object} res - Express响应对象
   * @param {Array} data - 数据列表
   * @param {Object} pagination - 分页信息
   * @param {string} message - 响应消息
   */
  paginatedResponse(res, data = [], pagination = {}, message = '获取成功') {
    const response = {
      success: true,
      code: 200,
      message: message,
      data: data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: pagination.total || 0,
        totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(response);
  }

  /**
   * 异步错误处理包装器
   * @param {Function} fn - 异步函数
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * 获取分页参数
   * @param {Object} query - 查询参数
   * @returns {Object} 分页参数
   */
  getPaginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * 获取排序参数
   * @param {Object} query - 查询参数
   * @param {Array} allowedFields - 允许排序的字段
   * @param {string} defaultField - 默认排序字段
   * @param {string} defaultOrder - 默认排序方向
   * @returns {Array} 排序参数
   */
  getSortParams(query, allowedFields = [], defaultField = 'created_at', defaultOrder = 'DESC') {
    const sortBy = query.sort_by || defaultField;
    const sortOrder = (query.sort_order || defaultOrder).toUpperCase();

    // 验证排序字段
    if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      return [[defaultField, defaultOrder]];
    }

    // 验证排序方向
    if (!['ASC', 'DESC'].includes(sortOrder)) {
      return [[sortBy, defaultOrder]];
    }

    return [[sortBy, sortOrder]];
  }

  /**
   * 获取搜索参数
   * @param {Object} query - 查询参数
   * @param {Array} searchFields - 搜索字段
   * @returns {Object} 搜索条件
   */
  getSearchParams(query, searchFields = []) {
    const { Op } = require('sequelize');
    const search = query.search || query.q;
    
    if (!search || searchFields.length === 0) {
      return {};
    }

    const searchConditions = searchFields.map(field => ({
      [field]: {
        [Op.like]: `%${search}%`
      }
    }));

    return {
      [Op.or]: searchConditions
    };
  }

  /**
   * 获取日期范围参数
   * @param {Object} query - 查询参数
   * @param {string} field - 日期字段名
   * @returns {Object} 日期范围条件
   */
  getDateRangeParams(query, field = 'created_at') {
    const { Op } = require('sequelize');
    const startDate = query.start_date;
    const endDate = query.end_date;

    if (!startDate && !endDate) {
      return {};
    }

    const dateCondition = {};

    if (startDate && endDate) {
      dateCondition[field] = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      dateCondition[field] = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      dateCondition[field] = {
        [Op.lte]: new Date(endDate)
      };
    }

    return dateCondition;
  }

  /**
   * 验证必需参数
   * @param {Object} data - 数据对象
   * @param {Array} requiredFields - 必需字段列表
   * @returns {Array} 错误列表
   */
  validateRequired(data, requiredFields) {
    const errors = [];

    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push({
          field: field,
          message: `${field} 是必需的`
        });
      }
    });

    return errors;
  }

  /**
   * 验证字段长度
   * @param {Object} data - 数据对象
   * @param {Object} lengthRules - 长度规则
   * @returns {Array} 错误列表
   */
  validateLength(data, lengthRules) {
    const errors = [];

    Object.keys(lengthRules).forEach(field => {
      const value = data[field];
      const rule = lengthRules[field];

      if (value && typeof value === 'string') {
        if (rule.min && value.length < rule.min) {
          errors.push({
            field: field,
            message: `${field} 长度不能少于 ${rule.min} 个字符`
          });
        }

        if (rule.max && value.length > rule.max) {
          errors.push({
            field: field,
            message: `${field} 长度不能超过 ${rule.max} 个字符`
          });
        }
      }
    });

    return errors;
  }

  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式
   * @param {string} mobile - 手机号
   * @returns {boolean} 是否有效
   */
  validateMobile(mobile) {
    const mobileRegex = /^1[3-9]\d{9}$/;
    return mobileRegex.test(mobile);
  }

  /**
   * 记录操作日志
   * @param {string} action - 操作类型
   * @param {Object} data - 操作数据
   * @param {Object} req - 请求对象
   */
  logAction(action, data, req) {
    const logData = {
      action: action,
      data: data,
      user_id: req.user?.id,
      ip: req.ip,
      user_agent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    console.log('Action Log:', JSON.stringify(logData));
    // 这里可以集成到日志系统中
  }
}

module.exports = BaseController;