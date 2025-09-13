const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

/**
 * 缓存工具
 * 基于Redis的缓存管理器
 */

class CacheManager {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.keyPrefix = config.cache.keyPrefix || 'points-mall:';
    this.defaultTTL = config.cache.defaultTTL || 3600; // 1小时
  }

  /**
   * 初始化Redis连接
   */
  async init() {
    try {
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      });

      // 连接事件监听
      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error', { error: error.message });
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.redis.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // 建立连接
      await this.redis.connect();
      
      logger.info('Cache manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize cache manager', { error: error.message });
      throw error;
    }
  }

  /**
   * 生成缓存键
   * @param {string} key - 原始键
   * @returns {string} 带前缀的键
   */
  getKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<boolean>} 是否成功
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache set', { key });
      return false;
    }

    try {
      const cacheKey = this.getKey(key);
      const serializedValue = JSON.stringify(value);
      
      if (ttl > 0) {
        await this.redis.setex(cacheKey, ttl, serializedValue);
      } else {
        await this.redis.set(cacheKey, serializedValue);
      }
      
      logger.debug('Cache set successfully', { key: cacheKey, ttl });
      return true;
    } catch (error) {
      logger.error('Failed to set cache', { key, error: error.message });
      return false;
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {Promise<*>} 缓存值
   */
  async get(key) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache get', { key });
      return null;
    }

    try {
      const cacheKey = this.getKey(key);
      const value = await this.redis.get(cacheKey);
      
      if (value === null) {
        logger.debug('Cache miss', { key: cacheKey });
        return null;
      }
      
      const parsedValue = JSON.parse(value);
      logger.debug('Cache hit', { key: cacheKey });
      return parsedValue;
    } catch (error) {
      logger.error('Failed to get cache', { key, error: error.message });
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>} 是否成功
   */
  async del(key) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache delete', { key });
      return false;
    }

    try {
      const cacheKey = this.getKey(key);
      const result = await this.redis.del(cacheKey);
      
      logger.debug('Cache deleted', { key: cacheKey, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logger.error('Failed to delete cache', { key, error: error.message });
      return false;
    }
  }

  /**
   * 批量删除缓存
   * @param {string[]} keys - 缓存键数组
   * @returns {Promise<number>} 删除的数量
   */
  async delMany(keys) {
    if (!this.isConnected || !keys.length) {
      return 0;
    }

    try {
      const cacheKeys = keys.map(key => this.getKey(key));
      const result = await this.redis.del(...cacheKeys);
      
      logger.debug('Batch cache deleted', { keys: cacheKeys, deleted: result });
      return result;
    } catch (error) {
      logger.error('Failed to delete cache batch', { keys, error: error.message });
      return 0;
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const cacheKey = this.getKey(key);
      const result = await this.redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error('Failed to check cache existence', { key, error: error.message });
      return false;
    }
  }

  /**
   * 设置缓存过期时间
   * @param {string} key - 缓存键
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<boolean>} 是否成功
   */
  async expire(key, ttl) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const cacheKey = this.getKey(key);
      const result = await this.redis.expire(cacheKey, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Failed to set cache expiration', { key, ttl, error: error.message });
      return false;
    }
  }

  /**
   * 获取缓存剩余过期时间
   * @param {string} key - 缓存键
   * @returns {Promise<number>} 剩余时间（秒），-1表示永不过期，-2表示不存在
   */
  async ttl(key) {
    if (!this.isConnected) {
      return -2;
    }

    try {
      const cacheKey = this.getKey(key);
      return await this.redis.ttl(cacheKey);
    } catch (error) {
      logger.error('Failed to get cache TTL', { key, error: error.message });
      return -2;
    }
  }

  /**
   * 清空所有缓存
   * @returns {Promise<boolean>} 是否成功
   */
  async flush() {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      logger.info('Cache flushed', { deletedKeys: keys.length });
      return true;
    } catch (error) {
      logger.error('Failed to flush cache', { error: error.message });
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info('memory');
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      
      return {
        connected: this.isConnected,
        totalKeys: keys.length,
        keyPrefix: this.keyPrefix,
        memoryInfo: info
      };
    } catch (error) {
      logger.error('Failed to get cache stats', { error: error.message });
      return { connected: false, error: error.message };
    }
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('Cache manager closed');
    }
  }
}

// 创建缓存管理器实例
const cacheManager = new CacheManager();

/**
 * 缓存装饰器
 * @param {string} keyTemplate - 缓存键模板
 * @param {number} ttl - 过期时间
 * @returns {Function} 装饰器函数
 */
const cacheDecorator = (keyTemplate, ttl = 3600) => {
  return (target, propertyName, descriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function(...args) {
      // 生成缓存键
      let cacheKey = keyTemplate;
      args.forEach((arg, index) => {
        cacheKey = cacheKey.replace(`{${index}}`, arg);
      });
      
      // 尝试从缓存获取
      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      // 执行原方法
      const result = await method.apply(this, args);
      
      // 缓存结果
      if (result !== null && result !== undefined) {
        await cacheManager.set(cacheKey, result, ttl);
      }
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * 缓存辅助函数
 */
const CacheHelper = {
  /**
   * 用户相关缓存键
   */
  userKeys: {
    profile: (userId) => `user:profile:${userId}`,
    points: (userId) => `user:points:${userId}`,
    coupons: (userId) => `user:coupons:${userId}`,
    orders: (userId, page = 1) => `user:orders:${userId}:${page}`
  },
  
  /**
   * 商品相关缓存键
   */
  productKeys: {
    detail: (productId) => `product:detail:${productId}`,
    list: (categoryId, page = 1) => `product:list:${categoryId}:${page}`,
    hot: () => 'product:hot',
    recommended: () => 'product:recommended',
    search: (keyword, page = 1) => `product:search:${keyword}:${page}`
  },
  
  /**
   * 分类相关缓存键
   */
  categoryKeys: {
    tree: () => 'category:tree',
    list: () => 'category:list',
    detail: (categoryId) => `category:detail:${categoryId}`
  },
  
  /**
   * 订单相关缓存键
   */
  orderKeys: {
    detail: (orderId) => `order:detail:${orderId}`,
    list: (userId, status, page = 1) => `order:list:${userId}:${status}:${page}`,
    stats: (userId) => `order:stats:${userId}`
  },
  
  /**
   * 优惠券相关缓存键
   */
  couponKeys: {
    available: (userId) => `coupon:available:${userId}`,
    detail: (couponId) => `coupon:detail:${couponId}`,
    userCoupons: (userId) => `coupon:user:${userId}`
  },
  
  /**
   * 系统相关缓存键
   */
  systemKeys: {
    config: () => 'system:config',
    stats: () => 'system:stats',
    banners: () => 'system:banners'
  }
};

// 导出
module.exports = {
  cacheManager,
  cacheDecorator,
  CacheHelper,
  
  // 便捷方法
  init: () => cacheManager.init(),
  set: (key, value, ttl) => cacheManager.set(key, value, ttl),
  get: (key) => cacheManager.get(key),
  del: (key) => cacheManager.del(key),
  delMany: (keys) => cacheManager.delMany(keys),
  exists: (key) => cacheManager.exists(key),
  expire: (key, ttl) => cacheManager.expire(key, ttl),
  ttl: (key) => cacheManager.ttl(key),
  flush: () => cacheManager.flush(),
  getStats: () => cacheManager.getStats(),
  close: () => cacheManager.close()
};