/**
 * 基础控制器
 */

class BaseController {
  constructor() {
    this.name = this.constructor.name;
  }

  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 响应数据
   * @param {string} message - 响应消息
   * @param {number} code - 状态码
   */
  success(res, data = null, message = '操作成功', code = 200) {
    const response = {
      success: true,
      code,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    // 如果data为null，则不包含data字段
    if (data === null) {
      delete response.data;
    }

    return res.status(code).json(response);
  }

  /**
   * 错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {number} code - 状态码
   * @param {*} errors - 详细错误信息
   */
  error(res, message = '操作失败', code = 500, errors = null) {
    const response = {
      success: false,
      code,
      message,
      timestamp: new Date().toISOString()
    };

    // 如果有详细错误信息，则包含errors字段
    if (errors) {
      response.errors = errors;
    }

    // 记录错误日志
    if (code >= 500) {
      console.error(`[${this.name}] ${message}`, errors);
    }

    return res.status(code).json(response);
  }

  /**
   * 分页响应
   * @param {Object} res - Express响应对象
   * @param {Array} data - 数据列表
   * @param {Object} pagination - 分页信息
   * @param {string} message - 响应消息
   */
  paginate(res, data, pagination, message = '获取成功') {
    return this.success(res, {
      list: data,
      pagination: {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        pages: pagination.pages,
        has_next: pagination.page < pagination.pages,
        has_prev: pagination.page > 1
      }
    }, message);
  }

  /**
   * 验证请求参数
   * @param {Object} req - Express请求对象
   * @param {Array} requiredFields - 必需字段列表
   * @returns {Object} 验证结果
   */
  validateRequired(req, requiredFields) {
    const errors = [];
    const data = { ...req.body, ...req.query, ...req.params };

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push(`${field} 是必需的`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data
    };
  }

  /**
   * 验证分页参数
   * @param {Object} query - 查询参数
   * @returns {Object} 分页参数
   */
  validatePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    
    return { page, limit };
  }

  /**
   * 验证ID参数
   * @param {string} id - ID字符串
   * @returns {Object} 验证结果
   */
  validateId(id) {
    const numId = parseInt(id);
    
    if (isNaN(numId) || numId <= 0) {
      return {
        isValid: false,
        error: 'ID必须是正整数'
      };
    }
    
    return {
      isValid: true,
      id: numId
    };
  }

  /**
   * 验证日期范围
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Object} 验证结果
   */
  validateDateRange(startDate, endDate) {
    const errors = [];
    let start = null;
    let end = null;

    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        errors.push('开始日期格式无效');
      }
    }

    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        errors.push('结束日期格式无效');
      }
    }

    if (start && end && start > end) {
      errors.push('开始日期不能晚于结束日期');
    }

    return {
      isValid: errors.length === 0,
      errors,
      startDate: start,
      endDate: end
    };
  }

  /**
   * 异步错误处理包装器
   * @param {Function} fn - 异步函数
   * @returns {Function} 包装后的函数
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * 提取用户信息
   * @param {Object} req - Express请求对象
   * @returns {Object} 用户信息
   */
  getCurrentUser(req) {
    return req.user || null;
  }

  /**
   * 检查用户权限
   * @param {Object} user - 用户对象
   * @param {string|Array} permissions - 权限列表
   * @returns {boolean} 是否有权限
   */
  hasPermission(user, permissions) {
    if (!user) return false;
    
    // 如果是管理员，拥有所有权限
    if (user.role === 'admin') return true;
    
    const userPermissions = user.permissions || [];
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  }

  /**
   * 权限检查中间件
   * @param {string|Array} permissions - 所需权限
   * @returns {Function} 中间件函数
   */
  requirePermission(permissions) {
    return (req, res, next) => {
      const user = this.getCurrentUser(req);
      
      if (!this.hasPermission(user, permissions)) {
        return this.error(res, '权限不足', 403);
      }
      
      next();
    };
  }

  /**
   * 管理员权限检查中间件
   * @returns {Function} 中间件函数
   */
  requireAdmin() {
    return (req, res, next) => {
      const user = this.getCurrentUser(req);
      
      if (!user || user.role !== 'admin') {
        return this.error(res, '需要管理员权限', 403);
      }
      
      next();
    };
  }

  /**
   * 格式化查询条件
   * @param {Object} query - 查询参数
   * @param {Array} allowedFields - 允许的字段
   * @returns {Object} 格式化后的查询条件
   */
  formatQuery(query, allowedFields = []) {
    const formatted = {};
    
    for (const field of allowedFields) {
      if (query[field] !== undefined && query[field] !== '') {
        formatted[field] = query[field];
      }
    }
    
    return formatted;
  }

  /**
   * 构建排序条件
   * @param {string} sortBy - 排序字段
   * @param {string} sortOrder - 排序方向
   * @param {Array} allowedFields - 允许排序的字段
   * @returns {Array} Sequelize排序条件
   */
  buildSort(sortBy = 'created_at', sortOrder = 'DESC', allowedFields = []) {
    // 验证排序字段
    if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      sortBy = 'created_at';
    }
    
    // 验证排序方向
    if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      sortOrder = 'DESC';
    }
    
    return [[sortBy, sortOrder.toUpperCase()]];
  }

  /**
   * 构建搜索条件
   * @param {string} search - 搜索关键词
   * @param {Array} searchFields - 搜索字段
   * @param {Object} Sequelize - Sequelize实例
   * @returns {Object} 搜索条件
   */
  buildSearch(search, searchFields = [], Sequelize) {
    if (!search || !searchFields.length || !Sequelize) {
      return {};
    }
    
    const conditions = searchFields.map(field => ({
      [field]: {
        [Sequelize.Op.like]: `%${search}%`
      }
    }));
    
    return {
      [Sequelize.Op.or]: conditions
    };
  }

  /**
   * 记录操作日志
   * @param {Object} req - Express请求对象
   * @param {string} action - 操作类型
   * @param {Object} details - 操作详情
   */
  logAction(req, action, details = {}) {
    const user = this.getCurrentUser(req);
    const logData = {
      user_id: user?.id || null,
      action,
      controller: this.name,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      user_agent: req.get('User-Agent'),
      details,
      timestamp: new Date().toISOString()
    };
    
    // 这里可以将日志写入数据库或日志文件
    console.log('[ACTION LOG]', JSON.stringify(logData));
  }

  /**
   * 缓存响应
   * @param {string} key - 缓存键
   * @param {*} data - 缓存数据
   * @param {number} ttl - 过期时间（秒）
   */
  async cacheResponse(key, data, ttl = 3600) {
    try {
      // 这里可以使用Redis等缓存服务
      // await redis.setex(key, ttl, JSON.stringify(data));
      console.log(`[CACHE] Set ${key} with TTL ${ttl}`);
    } catch (error) {
      console.error('[CACHE ERROR]', error);
    }
  }

  /**
   * 获取缓存响应
   * @param {string} key - 缓存键
   * @returns {*} 缓存数据
   */
  async getCachedResponse(key) {
    try {
      // 这里可以使用Redis等缓存服务
      // const cached = await redis.get(key);
      // return cached ? JSON.parse(cached) : null;
      console.log(`[CACHE] Get ${key}`);
      return null;
    } catch (error) {
      console.error('[CACHE ERROR]', error);
      return null;
    }
  }
}

module.exports = BaseController;