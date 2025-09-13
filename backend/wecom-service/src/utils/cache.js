const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.memoryCache = new Map();
    this.init();
  }

  /**
   * 初始化缓存服务
   */
  init() {
    if (config.redis.enabled) {
      this.initRedis();
    } else {
      logger.info('Redis disabled, using memory cache');
      this.isConnected = true;
    }
  }

  /**
   * 初始化Redis连接
   */
  initRedis() {
    try {
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      // 尝试连接
      this.redis.connect().catch(error => {
        logger.error('Failed to connect to Redis:', error);
        this.isConnected = false;
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * 设置缓存
   * @param {string} key 键
   * @param {any} value 值
   * @param {number} ttl 过期时间（秒）
   * @returns {Promise<boolean>} 是否成功
   */
  async set(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (this.redis && this.isConnected) {
        if (ttl > 0) {
          await this.redis.setex(key, ttl, serializedValue);
        } else {
          await this.redis.set(key, serializedValue);
        }
      } else {
        // 使用内存缓存
        this.memoryCache.set(key, {
          value: serializedValue,
          expireAt: ttl > 0 ? Date.now() + ttl * 1000 : null,
        });
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to set cache:', error);
      return false;
    }
  }

  /**
   * 获取缓存
   * @param {string} key 键
   * @returns {Promise<any>} 值
   */
  async get(key) {
    try {
      let serializedValue = null;
      
      if (this.redis && this.isConnected) {
        serializedValue = await this.redis.get(key);
      } else {
        // 使用内存缓存
        const cached = this.memoryCache.get(key);
        if (cached) {
          if (cached.expireAt && Date.now() > cached.expireAt) {
            this.memoryCache.delete(key);
            return null;
          }
          serializedValue = cached.value;
        }
      }
      
      if (serializedValue) {
        return JSON.parse(serializedValue);
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key 键
   * @returns {Promise<boolean>} 是否成功
   */
  async del(key) {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to delete cache:', error);
      return false;
    }
  }

  /**
   * 批量删除缓存
   * @param {string} pattern 模式
   * @returns {Promise<number>} 删除的数量
   */
  async delPattern(pattern) {
    try {
      let count = 0;
      
      if (this.redis && this.isConnected) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          count = await this.redis.del(...keys);
        }
      } else {
        // 内存缓存模式匹配删除
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            count++;
          }
        }
      }
      
      return count;
    } catch (error) {
      logger.error('Failed to delete cache pattern:', error);
      return 0;
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key 键
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(key) {
    try {
      if (this.redis && this.isConnected) {
        const result = await this.redis.exists(key);
        return result === 1;
      } else {
        const cached = this.memoryCache.get(key);
        if (cached && cached.expireAt && Date.now() > cached.expireAt) {
          this.memoryCache.delete(key);
          return false;
        }
        return this.memoryCache.has(key);
      }
    } catch (error) {
      logger.error('Failed to check cache existence:', error);
      return false;
    }
  }

  /**
   * 设置过期时间
   * @param {string} key 键
   * @param {number} ttl 过期时间（秒）
   * @returns {Promise<boolean>} 是否成功
   */
  async expire(key, ttl) {
    try {
      if (this.redis && this.isConnected) {
        const result = await this.redis.expire(key, ttl);
        return result === 1;
      } else {
        const cached = this.memoryCache.get(key);
        if (cached) {
          cached.expireAt = Date.now() + ttl * 1000;
          return true;
        }
        return false;
      }
    } catch (error) {
      logger.error('Failed to set cache expiration:', error);
      return false;
    }
  }

  /**
   * 获取剩余过期时间
   * @param {string} key 键
   * @returns {Promise<number>} 剩余时间（秒），-1表示永不过期，-2表示不存在
   */
  async ttl(key) {
    try {
      if (this.redis && this.isConnected) {
        return await this.redis.ttl(key);
      } else {
        const cached = this.memoryCache.get(key);
        if (!cached) {
          return -2;
        }
        if (!cached.expireAt) {
          return -1;
        }
        const remaining = Math.ceil((cached.expireAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
      }
    } catch (error) {
      logger.error('Failed to get cache TTL:', error);
      return -2;
    }
  }

  /**
   * 清空所有缓存
   * @returns {Promise<boolean>} 是否成功
   */
  async flush() {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.flushdb();
      } else {
        this.memoryCache.clear();
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to flush cache:', error);
      return false;
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    try {
      const stats = {
        type: this.redis && this.isConnected ? 'redis' : 'memory',
        connected: this.isConnected,
      };
      
      if (this.redis && this.isConnected) {
        const info = await this.redis.info('memory');
        const lines = info.split('\r\n');
        const memoryInfo = {};
        
        lines.forEach(line => {
          const [key, value] = line.split(':');
          if (key && value) {
            memoryInfo[key] = value;
          }
        });
        
        stats.memory = memoryInfo;
      } else {
        stats.keys = this.memoryCache.size;
      }
      
      return stats;
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return {
        type: 'unknown',
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * 关闭连接
   */
  async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      this.memoryCache.clear();
      this.isConnected = false;
    } catch (error) {
      logger.error('Failed to close cache connection:', error);
    }
  }
}

module.exports = new CacheService();