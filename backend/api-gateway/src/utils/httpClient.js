const axios = require('axios');
const logger = require('./logger');
const { ServiceUnavailableError, AppError } = require('../middleware/errorHandler');

/**
 * HTTP客户端配置
 */
const defaultConfig = {
  timeout: 30000, // 30秒超时
  maxRedirects: 5,
  validateStatus: (status) => status < 500, // 只有5xx状态码才认为是错误
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'WeDraw-Gateway/1.0.0'
  }
};

/**
 * 创建HTTP客户端实例
 */
class HttpClient {
  constructor(baseURL, config = {}) {
    this.baseURL = baseURL;
    this.config = { ...defaultConfig, ...config, baseURL };
    this.client = axios.create(this.config);
    
    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加请求ID
        config.metadata = {
          startTime: Date.now(),
          requestId: this.generateRequestId()
        };
        
        // 添加请求头
        config.headers['X-Request-ID'] = config.metadata.requestId;
        config.headers['X-Gateway-Timestamp'] = new Date().toISOString();
        
        // 记录请求日志
        logger.info('HTTP Request:', {
          requestId: config.metadata.requestId,
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: this.sanitizeHeaders(config.headers),
          timeout: config.timeout
        });
        
        return config;
      },
      (error) => {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        
        // 记录响应日志
        logger.info('HTTP Response:', {
          requestId: response.config.metadata.requestId,
          status: response.status,
          statusText: response.statusText,
          duration,
          url: response.config.url,
          headers: this.sanitizeHeaders(response.headers)
        });
        
        return response;
      },
      (error) => {
        const duration = error.config?.metadata ? 
          Date.now() - error.config.metadata.startTime : 0;
        
        // 记录错误日志
        logger.error('HTTP Error:', {
          requestId: error.config?.metadata?.requestId,
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          duration,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        });
        
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * 生成请求ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理敏感头信息
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * 处理HTTP错误
   */
  handleError(error) {
    if (error.code === 'ECONNREFUSED') {
      return new ServiceUnavailableError('Service connection refused');
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return new ServiceUnavailableError('Service request timeout');
    }
    
    if (error.response) {
      const { status, data } = error.response;
      
      // 根据HTTP状态码创建相应的错误
      switch (status) {
        case 400:
          return new AppError(data?.message || 'Bad Request', 400, 'BAD_REQUEST');
        case 401:
          return new AppError(data?.message || 'Unauthorized', 401, 'UNAUTHORIZED');
        case 403:
          return new AppError(data?.message || 'Forbidden', 403, 'FORBIDDEN');
        case 404:
          return new AppError(data?.message || 'Not Found', 404, 'NOT_FOUND');
        case 409:
          return new AppError(data?.message || 'Conflict', 409, 'CONFLICT');
        case 429:
          return new AppError(data?.message || 'Too Many Requests', 429, 'TOO_MANY_REQUESTS');
        case 500:
          return new ServiceUnavailableError(data?.message || 'Internal Server Error');
        case 502:
        case 503:
        case 504:
          return new ServiceUnavailableError(data?.message || 'Service Unavailable');
        default:
          return new AppError(data?.message || 'HTTP Error', status, 'HTTP_ERROR');
      }
    }
    
    return new ServiceUnavailableError(error.message || 'Unknown HTTP error');
  }

  /**
   * GET请求
   */
  async get(url, config = {}) {
    const response = await this.client.get(url, config);
    return response.data;
  }

  /**
   * POST请求
   */
  async post(url, data = {}, config = {}) {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  /**
   * PUT请求
   */
  async put(url, data = {}, config = {}) {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  /**
   * PATCH请求
   */
  async patch(url, data = {}, config = {}) {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  /**
   * DELETE请求
   */
  async delete(url, config = {}) {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  /**
   * HEAD请求
   */
  async head(url, config = {}) {
    const response = await this.client.head(url, config);
    return response.headers;
  }

  /**
   * 健康检查
   */
  async healthCheck(path = '/health') {
    try {
      const response = await this.client.get(path, { timeout: 5000 });
      return {
        healthy: response.status === 200,
        status: response.status,
        data: response.data,
        responseTime: Date.now() - response.config.metadata.startTime
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * 批量请求
   */
  async batch(requests) {
    const promises = requests.map(request => {
      const { method, url, data, config } = request;
      return this.client[method](url, data, config).catch(error => ({ error }));
    });
    
    return Promise.all(promises);
  }

  /**
   * 重试请求
   */
  async retry(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (i === maxRetries) {
          break;
        }
        
        // 指数退避
        const waitTime = delay * Math.pow(2, i);
        logger.warn(`Request failed, retrying in ${waitTime}ms (attempt ${i + 1}/${maxRetries + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  }

  /**
   * 设置默认头信息
   */
  setDefaultHeader(name, value) {
    this.client.defaults.headers.common[name] = value;
  }

  /**
   * 移除默认头信息
   */
  removeDefaultHeader(name) {
    delete this.client.defaults.headers.common[name];
  }

  /**
   * 设置认证头
   */
  setAuth(token, type = 'Bearer') {
    this.setDefaultHeader('Authorization', `${type} ${token}`);
  }

  /**
   * 清除认证头
   */
  clearAuth() {
    this.removeDefaultHeader('Authorization');
  }
}

/**
 * 微服务客户端管理器
 */
class ServiceClientManager {
  constructor() {
    this.clients = new Map();
    this.initializeClients();
  }

  /**
   * 初始化微服务客户端
   */
  initializeClients() {
    const services = {
      'user-center': process.env.USER_CENTER_URL || 'http://localhost:3001',
      'wechat-official': process.env.WECHAT_OFFICIAL_URL || 'http://localhost:3002',
      'wecom': process.env.WECOM_URL || 'http://localhost:3003',
      'miniprogram': process.env.MINIPROGRAM_URL || 'http://localhost:3004',
      'points-mall': process.env.POINTS_MALL_URL || 'http://localhost:3005',
      'message-center': process.env.MESSAGE_CENTER_URL || 'http://localhost:3006',
      'data-analytics': process.env.DATA_ANALYTICS_URL || 'http://localhost:3007'
    };

    for (const [serviceName, baseURL] of Object.entries(services)) {
      this.clients.set(serviceName, new HttpClient(baseURL, {
        timeout: parseInt(process.env.SERVICE_TIMEOUT) || 30000
      }));
    }
  }

  /**
   * 获取服务客户端
   */
  getClient(serviceName) {
    const client = this.clients.get(serviceName);
    if (!client) {
      throw new Error(`Service client '${serviceName}' not found`);
    }
    return client;
  }

  /**
   * 检查所有服务健康状态
   */
  async checkAllServices() {
    const results = {};
    
    for (const [serviceName, client] of this.clients) {
      results[serviceName] = await client.healthCheck();
    }
    
    return results;
  }

  /**
   * 为所有客户端设置认证
   */
  setAuthForAll(token, type = 'Bearer') {
    for (const client of this.clients.values()) {
      client.setAuth(token, type);
    }
  }

  /**
   * 清除所有客户端认证
   */
  clearAuthForAll() {
    for (const client of this.clients.values()) {
      client.clearAuth();
    }
  }
}

// 创建全局服务客户端管理器实例
const serviceClients = new ServiceClientManager();

module.exports = {
  HttpClient,
  ServiceClientManager,
  serviceClients
};