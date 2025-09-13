const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1秒
    
    this.init();
  }

  /**
   * 初始化Redis连接
   */
  init() {
    try {
      const redisConfig = {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        keyPrefix: config.redis.keyPrefix,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000,
      };

      this.redis = new Redis(redisConfig);

      // 连接事件监听
      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.redis.on('ready', () => {
        logger.info('Redis ready for commands');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.redis.on('reconnecting', (delay) => {
        this.reconnectAttempts++;
        logger.info(`Redis reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('Max reconnection attempts reached, giving up');
          this.redis.disconnect();
        }
      });

      // 建立连接
      this.redis.connect().catch(error => {
        logger.error('Failed to connect to Redis:', error);
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
    }
  }

  /**
   * 检查连接状态
   */
  isReady() {
    return this.redis && this.isConnected && this.redis.status === 'ready';
  }

  /**
   * 设置缓存
   */
  async set(key, value, ttl = null) {
    if (!this.isReady()) {
      logger.warn('Redis not ready, skipping cache set');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
      
      logger.debug('Cache set:', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Failed to set cache:', error);
      return false;
    }
  }

  /**
   * 获取缓存
   */
  async get(key) {
    if (!this.isReady()) {
      logger.warn('Redis not ready, skipping cache get');
      return null;
    }

    try {
      const value = await this.redis.get(key);
      
      if (value === null) {
        return null;
      }
      
      const parsedValue = JSON.parse(value);
      logger.debug('Cache hit:', { key });
      return parsedValue;
    } catch (error) {
      logger.error('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  async del(key) {
    if (!this.isReady()) {
      logger.warn('Redis not ready, skipping cache delete');
      return false;
    }

    try {
      const result = await this.redis.del(key);
      logger.debug('Cache deleted:', { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logger.error('Failed to delete cache:', error);
      return false;
    }
  }

  /**
   * 批量删除缓存
   */
  async delPattern(pattern) {
    if (!this.isReady()) {
      logger.warn('Redis not ready, skipping pattern delete');
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      const result = await this.redis.del(...keys);
      logger.debug('Pattern cache deleted:', { pattern, count: result });
      return result;
    } catch (error) {
      logger.error('Failed to delete pattern cache:', error);
      return 0;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key) {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Failed to check cache existence:', error);
      return false;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key, ttl) {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Failed to set cache expiration:', error);
      return false;
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key) {
    if (!this.isReady()) {
      return -1;
    }

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Failed to get cache TTL:', error);
      return -1;
    }
  }

  /**
   * 原子递增
   */
  async incr(key, increment = 1) {
    if (!this.isReady()) {
      return null;
    }

    try {
      if (increment === 1) {
        return await this.redis.incr(key);
      } else {
        return await this.redis.incrby(key, increment);
      }
    } catch (error) {
      logger.error('Failed to increment cache:', error);
      return null;
    }
  }

  /**
   * 原子递减
   */
  async decr(key, decrement = 1) {
    if (!this.isReady()) {
      return null;
    }

    try {
      if (decrement === 1) {
        return await this.redis.decr(key);
      } else {
        return await this.redis.decrby(key, decrement);
      }
    } catch (error) {
      logger.error('Failed to decrement cache:', error);
      return null;
    }
  }

  /**
   * 哈希表操作 - 设置字段
   */
  async hset(key, field, value) {
    if (!this.isReady()) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);
      return true;
    } catch (error) {
      logger.error('Failed to set hash field:', error);
      return false;
    }
  }

  /**
   * 哈希表操作 - 获取字段
   */
  async hget(key, field) {
    if (!this.isReady()) {
      return null;
    }

    try {
      const value = await this.redis.hget(key, field);
      
      if (value === null) {
        return null;
      }
      
      return JSON.parse(value);
    } catch (error) {
      logger.error('Failed to get hash field:', error);
      return null;
    }
  }

  /**
   * 哈希表操作 - 获取所有字段
   */
  async hgetall(key) {
    if (!this.isReady()) {
      return {};
    }

    try {
      const hash = await this.redis.hgetall(key);
      const result = {};
      
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to get hash:', error);
      return {};
    }
  }

  /**
   * 哈希表操作 - 删除字段
   */
  async hdel(key, field) {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.redis.hdel(key, field);
      return result > 0;
    } catch (error) {
      logger.error('Failed to delete hash field:', error);
      return false;
    }
  }

  /**
   * 列表操作 - 左推入
   */
  async lpush(key, ...values) {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await this.redis.lpush(key, ...serializedValues);
    } catch (error) {
      logger.error('Failed to lpush:', error);
      return 0;
    }
  }

  /**
   * 列表操作 - 右推入
   */
  async rpush(key, ...values) {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await this.redis.rpush(key, ...serializedValues);
    } catch (error) {
      logger.error('Failed to rpush:', error);
      return 0;
    }
  }

  /**
   * 列表操作 - 左弹出
   */
  async lpop(key) {
    if (!this.isReady()) {
      return null;
    }

    try {
      const value = await this.redis.lpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Failed to lpop:', error);
      return null;
    }
  }

  /**
   * 列表操作 - 右弹出
   */
  async rpop(key) {
    if (!this.isReady()) {
      return null;
    }

    try {
      const value = await this.redis.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Failed to rpop:', error);
      return null;
    }
  }

  /**
   * 列表操作 - 获取范围
   */
  async lrange(key, start, stop) {
    if (!this.isReady()) {
      return [];
    }

    try {
      const values = await this.redis.lrange(key, start, stop);
      return values.map(v => {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      });
    } catch (error) {
      logger.error('Failed to lrange:', error);
      return [];
    }
  }

  /**
   * 集合操作 - 添加成员
   */
  async sadd(key, ...members) {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await this.redis.sadd(key, ...serializedMembers);
    } catch (error) {
      logger.error('Failed to sadd:', error);
      return 0;
    }
  }

  /**
   * 集合操作 - 获取所有成员
   */
  async smembers(key) {
    if (!this.isReady()) {
      return [];
    }

    try {
      const members = await this.redis.smembers(key);
      return members.map(m => {
        try {
          return JSON.parse(m);
        } catch {
          return m;
        }
      });
    } catch (error) {
      logger.error('Failed to smembers:', error);
      return [];
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats() {
    if (!this.isReady()) {
      return null;
    }

    try {
      const info = await this.redis.info('memory');
      const stats = {};
      
      info.split('\r\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });
      
      return {
        connected: this.isConnected,
        status: this.redis.status,
        memory: stats,
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * 清空所有缓存
   */
  async flushall() {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.redis.flushall();
      logger.warn('All cache cleared');
      return true;
    } catch (error) {
      logger.error('Failed to flush cache:', error);
      return false;
    }
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.redis) {
      try {
        await this.redis.quit();
        logger.info('Redis connection closed');
      } catch (error) {
        logger.error('Failed to close Redis connection:', error);
        this.redis.disconnect();
      }
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    if (!this.isReady()) {
      return {
        status: 'unhealthy',
        message: 'Redis not connected',
      };
    }

    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency: `${latency}ms`,
        connected: this.isConnected,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
      };
    }
  }
}

module.exports = new CacheService();