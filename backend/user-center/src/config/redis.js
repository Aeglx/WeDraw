const { createClient } = require('redis');
const logger = require('../utils/logger');

/**
 * Redis配置
 */
const config = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 1,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'user:',
  
  // 连接配置
  connectTimeout: 10000,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  
  // 重连配置
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis reconnecting attempt ${times}, delay: ${delay}ms`);
    return delay;
  }
};

/**
 * Redis客户端类
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    
    this.createClient();
  }

  /**
   * 创建Redis客户端
   */
  createClient() {
    const clientConfig = {
      socket: {
        host: config.host,
        port: config.port,
        connectTimeout: config.connectTimeout,
        reconnectStrategy: (retries) => {
          if (retries >= this.maxConnectionAttempts) {
            logger.error('Redis max reconnection attempts reached');
            return false;
          }
          const delay = Math.min(retries * 1000, 5000);
          logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries + 1})`);
          return delay;
        }
      },
      password: config.password,
      database: config.db
    };

    this.client = createClient(clientConfig);
    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  setupEventHandlers() {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.connectionAttempts = 0;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection ended');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
      this.connectionAttempts++;
    });
  }

  /**
   * 连接Redis
   */
  async connect() {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      return true;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      return false;
    }
  }

  /**
   * 断开连接
   */
  async disconnect() {
    try {
      if (this.client.isOpen) {
        await this.client.quit();
      }
      this.isConnected = false;
      logger.info('Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis:', error);
    }
  }

  /**
   * 生成带前缀的键名
   */
  getKey(key) {
    return `${config.keyPrefix}${key}`;
  }

  /**
   * 设置值
   */
  async set(key, value, ttl = null) {
    try {
      const fullKey = this.getKey(key);
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      if (ttl) {
        await this.client.setEx(fullKey, ttl, serializedValue);
      } else {
        await this.client.set(fullKey, serializedValue);
      }
      
      logger.debug('Redis SET:', { key: fullKey, ttl });
      return true;
    } catch (error) {
      logger.error('Redis SET error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * 获取值
   */
  async get(key) {
    try {
      const fullKey = this.getKey(key);
      const value = await this.client.get(fullKey);
      
      if (value === null) {
        return null;
      }
      
      // 尝试解析JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis GET error:', { key, error: error.message });
      return null;
    }
  }

  /**
   * 删除键
   */
  async del(key) {
    try {
      const fullKey = this.getKey(key);
      const result = await this.client.del(fullKey);
      logger.debug('Redis DEL:', { key: fullKey, deleted: result });
      return result;
    } catch (error) {
      logger.error('Redis DEL error:', { key, error: error.message });
      return 0;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key) {
    try {
      const fullKey = this.getKey(key);
      return await this.client.exists(fullKey);
    } catch (error) {
      logger.error('Redis EXISTS error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key, ttl) {
    try {
      const fullKey = this.getKey(key);
      return await this.client.expire(fullKey, ttl);
    } catch (error) {
      logger.error('Redis EXPIRE error:', { key, ttl, error: error.message });
      return false;
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key) {
    try {
      const fullKey = this.getKey(key);
      return await this.client.ttl(fullKey);
    } catch (error) {
      logger.error('Redis TTL error:', { key, error: error.message });
      return -1;
    }
  }

  /**
   * 递增
   */
  async incr(key, increment = 1) {
    try {
      const fullKey = this.getKey(key);
      return await this.client.incrBy(fullKey, increment);
    } catch (error) {
      logger.error('Redis INCR error:', { key, increment, error: error.message });
      return null;
    }
  }

  /**
   * 递减
   */
  async decr(key, decrement = 1) {
    try {
      const fullKey = this.getKey(key);
      return await this.client.decrBy(fullKey, decrement);
    } catch (error) {
      logger.error('Redis DECR error:', { key, decrement, error: error.message });
      return null;
    }
  }

  /**
   * 哈希表操作
   */
  async hset(key, field, value) {
    try {
      const fullKey = this.getKey(key);
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return await this.client.hSet(fullKey, field, serializedValue);
    } catch (error) {
      logger.error('Redis HSET error:', { key, field, error: error.message });
      return false;
    }
  }

  async hget(key, field) {
    try {
      const fullKey = this.getKey(key);
      const value = await this.client.hGet(fullKey, field);
      
      if (value === null) {
        return null;
      }
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis HGET error:', { key, field, error: error.message });
      return null;
    }
  }

  async hgetall(key) {
    try {
      const fullKey = this.getKey(key);
      const hash = await this.client.hGetAll(fullKey);
      
      // 尝试解析每个字段的JSON值
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
      logger.error('Redis HGETALL error:', { key, error: error.message });
      return {};
    }
  }

  async hdel(key, field) {
    try {
      const fullKey = this.getKey(key);
      return await this.client.hDel(fullKey, field);
    } catch (error) {
      logger.error('Redis HDEL error:', { key, field, error: error.message });
      return 0;
    }
  }

  /**
   * 列表操作
   */
  async lpush(key, ...values) {
    try {
      const fullKey = this.getKey(key);
      const serializedValues = values.map(v => 
        typeof v === 'object' ? JSON.stringify(v) : String(v)
      );
      return await this.client.lPush(fullKey, serializedValues);
    } catch (error) {
      logger.error('Redis LPUSH error:', { key, error: error.message });
      return 0;
    }
  }

  async rpop(key) {
    try {
      const fullKey = this.getKey(key);
      const value = await this.client.rPop(fullKey);
      
      if (value === null) {
        return null;
      }
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis RPOP error:', { key, error: error.message });
      return null;
    }
  }

  /**
   * 集合操作
   */
  async sadd(key, ...members) {
    try {
      const fullKey = this.getKey(key);
      const serializedMembers = members.map(m => 
        typeof m === 'object' ? JSON.stringify(m) : String(m)
      );
      return await this.client.sAdd(fullKey, serializedMembers);
    } catch (error) {
      logger.error('Redis SADD error:', { key, error: error.message });
      return 0;
    }
  }

  async sismember(key, member) {
    try {
      const fullKey = this.getKey(key);
      const serializedMember = typeof member === 'object' ? JSON.stringify(member) : String(member);
      return await this.client.sIsMember(fullKey, serializedMember);
    } catch (error) {
      logger.error('Redis SISMEMBER error:', { key, member, error: error.message });
      return false;
    }
  }

  /**
   * 批量操作
   */
  async mget(keys) {
    try {
      const fullKeys = keys.map(key => this.getKey(key));
      const values = await this.client.mGet(fullKeys);
      
      return values.map(value => {
        if (value === null) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
    } catch (error) {
      logger.error('Redis MGET error:', { keys, error: error.message });
      return keys.map(() => null);
    }
  }

  /**
   * 管道操作
   */
  pipeline() {
    return this.client.multi();
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.client.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        connected: this.isConnected,
        config: {
          host: config.host,
          port: config.port,
          db: config.db
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false,
        config: {
          host: config.host,
          port: config.port,
          db: config.db
        }
      };
    }
  }

  /**
   * 获取Redis信息
   */
  async getInfo() {
    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('Redis INFO error:', error);
      return null;
    }
  }

  /**
   * 清空当前数据库
   */
  async flushdb() {
    try {
      await this.client.flushDb();
      logger.warn('Redis database flushed');
      return true;
    } catch (error) {
      logger.error('Redis FLUSHDB error:', error);
      return false;
    }
  }
}

// 创建Redis客户端实例
const redisClient = new RedisClient();

// 缓存工具函数
const cache = {
  /**
   * 缓存函数结果
   */
  async wrap(key, fn, ttl = 3600) {
    try {
      // 尝试从缓存获取
      const cached = await redisClient.get(key);
      if (cached !== null) {
        logger.debug('Cache hit:', { key });
        return cached;
      }
      
      // 执行函数并缓存结果
      logger.debug('Cache miss:', { key });
      const result = await fn();
      await redisClient.set(key, result, ttl);
      
      return result;
    } catch (error) {
      logger.error('Cache wrap error:', { key, error: error.message });
      // 如果缓存失败，直接执行函数
      return await fn();
    }
  },
  
  /**
   * 使缓存失效
   */
  async invalidate(pattern) {
    try {
      if (pattern.includes('*')) {
        // 模式匹配删除
        const keys = await redisClient.client.keys(redisClient.getKey(pattern));
        if (keys.length > 0) {
          await redisClient.client.del(keys);
        }
      } else {
        // 精确删除
        await redisClient.del(pattern);
      }
      logger.debug('Cache invalidated:', { pattern });
    } catch (error) {
      logger.error('Cache invalidate error:', { pattern, error: error.message });
    }
  }
};

module.exports = {
  redisClient,
  cache,
  config
};

// 默认导出Redis客户端
module.exports.default = redisClient;