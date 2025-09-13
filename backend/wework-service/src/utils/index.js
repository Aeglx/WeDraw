/**
 * 企业微信服务工具类
 */

const crypto = require('crypto');
const axios = require('axios');
const Redis = require('ioredis');

/**
 * Redis客户端
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * 连接Redis
   */
  async connect() {
    if (this.isConnected) {
      return this.client;
    }

    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB) || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      await this.client.connect();
      this.isConnected = true;
      
      console.log('Redis连接成功');
      return this.client;
    } catch (error) {
      console.error('Redis连接失败:', error);
      throw error;
    }
  }

  /**
   * 获取客户端
   */
  async getClient() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.client;
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('Redis连接已断开');
    }
  }
}

// Redis客户端实例
const redisClient = new RedisClient();

/**
 * 缓存工具类
 */
class CacheUtil {
  /**
   * 设置缓存
   */
  static async set(key, value, ttl = 3600) {
    try {
      const client = await redisClient.getClient();
      const serializedValue = JSON.stringify(value);
      
      if (ttl > 0) {
        await client.setex(key, ttl, serializedValue);
      } else {
        await client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      console.error('缓存设置失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存
   */
  static async get(key) {
    try {
      const client = await redisClient.getClient();
      const value = await client.get(key);
      
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('缓存获取失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  static async del(key) {
    try {
      const client = await redisClient.getClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error('缓存删除失败:', error);
      return false;
    }
  }

  /**
   * 检查缓存是否存在
   */
  static async exists(key) {
    try {
      const client = await redisClient.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('缓存检查失败:', error);
      return false;
    }
  }

  /**
   * 设置缓存过期时间
   */
  static async expire(key, ttl) {
    try {
      const client = await redisClient.getClient();
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('缓存过期时间设置失败:', error);
      return false;
    }
  }

  /**
   * 批量删除缓存
   */
  static async delPattern(pattern) {
    try {
      const client = await redisClient.getClient();
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        await client.del(...keys);
      }
      
      return keys.length;
    } catch (error) {
      console.error('批量缓存删除失败:', error);
      return 0;
    }
  }
}

/**
 * 企业微信API工具类
 */
class WeworkApiUtil {
  constructor() {
    this.baseUrl = 'https://qyapi.weixin.qq.com';
    this.corpId = process.env.WEWORK_CORP_ID;
    this.corpSecret = process.env.WEWORK_CORP_SECRET;
    this.agentId = process.env.WEWORK_AGENT_ID;
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken() {
    const cacheKey = `wework:access_token:${this.corpId}`;
    
    // 先从缓存获取
    let token = await CacheUtil.get(cacheKey);
    if (token) {
      return token;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/cgi-bin/gettoken`, {
        params: {
          corpid: this.corpId,
          corpsecret: this.corpSecret
        }
      });

      if (response.data.errcode === 0) {
        token = response.data.access_token;
        // 缓存token，提前5分钟过期
        await CacheUtil.set(cacheKey, token, response.data.expires_in - 300);
        return token;
      } else {
        throw new Error(`获取访问令牌失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      console.error('获取企业微信访问令牌失败:', error);
      throw error;
    }
  }

  /**
   * 发起API请求
   */
  async apiRequest(endpoint, method = 'GET', data = null) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `${this.baseUrl}${endpoint}`;
      
      const config = {
        method,
        url,
        params: { access_token: accessToken },
        timeout: 30000
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }

      const response = await axios(config);
      
      if (response.data.errcode !== 0) {
        throw new Error(`API请求失败: ${response.data.errmsg}`);
      }

      return response.data;
    } catch (error) {
      console.error('企业微信API请求失败:', error);
      throw error;
    }
  }

  /**
   * 获取部门列表
   */
  async getDepartments(departmentId = null) {
    const params = departmentId ? { id: departmentId } : {};
    return await this.apiRequest('/cgi-bin/department/list', 'GET', params);
  }

  /**
   * 获取部门成员
   */
  async getDepartmentUsers(departmentId, fetchChild = false) {
    const params = {
      department_id: departmentId,
      fetch_child: fetchChild ? 1 : 0
    };
    return await this.apiRequest('/cgi-bin/user/list', 'GET', params);
  }

  /**
   * 发送应用消息
   */
  async sendMessage(message) {
    return await this.apiRequest('/cgi-bin/message/send', 'POST', {
      ...message,
      agentid: this.agentId
    });
  }
}

/**
 * 加密工具类
 */
class CryptoUtil {
  /**
   * MD5哈希
   */
  static md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * SHA256哈希
   */
  static sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * HMAC-SHA256签名
   */
  static hmacSha256(text, secret) {
    return crypto.createHmac('sha256', secret).update(text).digest('hex');
  }

  /**
   * 生成随机字符串
   */
  static randomString(length = 32) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  /**
   * 生成UUID
   */
  static uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * AES加密
   */
  static aesEncrypt(text, key) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * AES解密
   */
  static aesDecrypt(encryptedText, key) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

/**
 * 验证工具类
 */
class ValidationUtil {
  /**
   * 验证邮箱
   */
  static isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号
   */
  static isPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证身份证号
   */
  static isIdCard(idCard) {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return idCardRegex.test(idCard);
  }

  /**
   * 验证URL
   */
  static isUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证IP地址
   */
  static isIp(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  /**
   * 验证JSON字符串
   */
  static isJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 时间工具类
 */
class DateUtil {
  /**
   * 格式化日期
   */
  static format(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 获取时间戳
   */
  static timestamp(date = new Date()) {
    return Math.floor(new Date(date).getTime() / 1000);
  }

  /**
   * 添加时间
   */
  static addTime(date, amount, unit = 'days') {
    const d = new Date(date);
    
    switch (unit) {
      case 'seconds':
        d.setSeconds(d.getSeconds() + amount);
        break;
      case 'minutes':
        d.setMinutes(d.getMinutes() + amount);
        break;
      case 'hours':
        d.setHours(d.getHours() + amount);
        break;
      case 'days':
        d.setDate(d.getDate() + amount);
        break;
      case 'months':
        d.setMonth(d.getMonth() + amount);
        break;
      case 'years':
        d.setFullYear(d.getFullYear() + amount);
        break;
    }
    
    return d;
  }

  /**
   * 计算时间差
   */
  static diff(date1, date2, unit = 'days') {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    
    switch (unit) {
      case 'seconds':
        return Math.floor(diffMs / 1000);
      case 'minutes':
        return Math.floor(diffMs / (1000 * 60));
      case 'hours':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'days':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      default:
        return diffMs;
    }
  }
}

/**
 * 文件工具类
 */
class FileUtil {
  /**
   * 获取文件扩展名
   */
  static getExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  /**
   * 获取文件大小描述
   */
  static formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 检查文件类型
   */
  static isImage(filename) {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return imageExts.includes(this.getExtension(filename));
  }

  /**
   * 检查是否为视频文件
   */
  static isVideo(filename) {
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    return videoExts.includes(this.getExtension(filename));
  }

  /**
   * 检查是否为音频文件
   */
  static isAudio(filename) {
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'];
    return audioExts.includes(this.getExtension(filename));
  }
}

/**
 * 字符串工具类
 */
class StringUtil {
  /**
   * 驼峰转下划线
   */
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 下划线转驼峰
   */
  static snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * 首字母大写
   */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 截断字符串
   */
  static truncate(str, length, suffix = '...') {
    if (str.length <= length) {
      return str;
    }
    return str.substring(0, length) + suffix;
  }

  /**
   * 移除HTML标签
   */
  static stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * 转义HTML
   */
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

/**
 * 数组工具类
 */
class ArrayUtil {
  /**
   * 数组去重
   */
  static unique(arr) {
    return [...new Set(arr)];
  }

  /**
   * 数组分块
   */
  static chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 数组打乱
   */
  static shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * 数组求交集
   */
  static intersection(arr1, arr2) {
    return arr1.filter(x => arr2.includes(x));
  }

  /**
   * 数组求差集
   */
  static difference(arr1, arr2) {
    return arr1.filter(x => !arr2.includes(x));
  }
}

module.exports = {
  // Redis客户端
  redisClient,
  
  // 工具类
  CacheUtil,
  WeworkApiUtil,
  CryptoUtil,
  ValidationUtil,
  DateUtil,
  FileUtil,
  StringUtil,
  ArrayUtil
};