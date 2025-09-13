const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js');
const config = require('../config');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

class WecomService {
  constructor() {
    this.corpid = config.wecom.corpid;
    this.corpsecret = config.wecom.corpsecret;
    this.agentid = config.wecom.agentid;
    this.token = config.wecom.token;
    this.encodingAESKey = config.wecom.encodingAESKey;
    
    // 初始化axios实例
    this.api = axios.create({
      baseURL: 'https://qyapi.weixin.qq.com/cgi-bin',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        logger.debug('WeChat Work API Request:', {
          url: config.url,
          method: config.method,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error('WeChat Work API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.api.interceptors.response.use(
      (response) => {
        logger.debug('WeChat Work API Response:', {
          url: response.config.url,
          status: response.status,
          data: response.data,
        });
        
        // 检查企业微信API错误
        if (response.data && response.data.errcode !== undefined && response.data.errcode !== 0) {
          const error = new Error(`WeChat Work API Error: ${response.data.errmsg}`);
          error.code = response.data.errcode;
          error.message = response.data.errmsg;
          throw error;
        }
        
        return response;
      },
      (error) => {
        logger.error('WeChat Work API Response Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取访问令牌
   * @returns {Promise<string>} access_token
   */
  async getAccessToken() {
    const cacheKey = `wecom:access_token:${this.corpid}`;
    
    try {
      // 从缓存获取
      let accessToken = await cache.get(cacheKey);
      if (accessToken) {
        logger.debug('Access token retrieved from cache');
        return accessToken;
      }

      // 从企业微信API获取
      const response = await this.api.get('/gettoken', {
        params: {
          corpid: this.corpid,
          corpsecret: this.corpsecret,
        },
      });

      accessToken = response.data.access_token;
      const expiresIn = response.data.expires_in || 7200;

      // 缓存访问令牌，提前5分钟过期
      await cache.set(cacheKey, accessToken, expiresIn - 300);
      
      logger.info('Access token refreshed successfully');
      return accessToken;
    } catch (error) {
      logger.error('Failed to get access token:', error);
      throw error;
    }
  }

  /**
   * 验证签名
   * @param {string} signature 微信加密签名
   * @param {string} timestamp 时间戳
   * @param {string} nonce 随机数
   * @param {string} echostr 随机字符串
   * @returns {boolean} 验证结果
   */
  verifySignature(signature, timestamp, nonce, echostr = '') {
    try {
      const token = this.token;
      const tmpArr = [token, timestamp, nonce, echostr].sort();
      const tmpStr = tmpArr.join('');
      const hashCode = crypto.createHash('sha1').update(tmpStr).digest('hex');
      
      return hashCode === signature;
    } catch (error) {
      logger.error('Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * 解析XML消息
   * @param {string} xml XML字符串
   * @returns {Promise<Object>} 解析后的对象
   */
  async parseXML(xml) {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: true,
      });
      
      const result = await parser.parseStringPromise(xml);
      return result.xml || result;
    } catch (error) {
      logger.error('Failed to parse XML:', error);
      throw error;
    }
  }

  /**
   * 构建XML响应
   * @param {Object} data 响应数据
   * @returns {string} XML字符串
   */
  buildXML(data) {
    try {
      const builder = new xml2js.Builder({
        rootName: 'xml',
        cdata: true,
        headless: true,
      });
      
      return builder.buildObject(data);
    } catch (error) {
      logger.error('Failed to build XML:', error);
      throw error;
    }
  }

  /**
   * 获取部门列表
   * @param {number} departmentId 部门ID，默认为根部门
   * @returns {Promise<Array>} 部门列表
   */
  async getDepartmentList(departmentId = null) {
    try {
      const accessToken = await this.getAccessToken();
      const params = { access_token: accessToken };
      
      if (departmentId) {
        params.id = departmentId;
      }

      const response = await this.api.get('/department/list', { params });
      return response.data.department || [];
    } catch (error) {
      logger.error('Failed to get department list:', error);
      throw error;
    }
  }

  /**
   * 获取部门成员
   * @param {number} departmentId 部门ID
   * @param {boolean} fetchChild 是否递归获取子部门成员
   * @returns {Promise<Array>} 成员列表
   */
  async getDepartmentUsers(departmentId, fetchChild = false) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await this.api.get('/user/list', {
        params: {
          access_token: accessToken,
          department_id: departmentId,
          fetch_child: fetchChild ? 1 : 0,
        },
      });
      
      return response.data.userlist || [];
    } catch (error) {
      logger.error('Failed to get department users:', error);
      throw error;
    }
  }

  /**
   * 获取用户详情
   * @param {string} userid 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserInfo(userid) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await this.api.get('/user/get', {
        params: {
          access_token: accessToken,
          userid,
        },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get user info:', error);
      throw error;
    }
  }

  /**
   * 创建用户
   * @param {Object} userData 用户数据
   * @returns {Promise<Object>} 创建结果
   */
  async createUser(userData) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await this.api.post('/user/create', userData, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * 更新用户
   * @param {Object} userData 用户数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateUser(userData) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await this.api.post('/user/update', userData, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw error;
    }
  }

  /**
   * 删除用户
   * @param {string} userid 用户ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteUser(userid) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await this.api.get('/user/delete', {
        params: {
          access_token: accessToken,
          userid,
        },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to delete user:', error);
      throw error;
    }
  }

  /**
   * 发送应用消息
   * @param {Object} messageData 消息数据
   * @returns {Promise<Object>} 发送结果
   */
  async sendMessage(messageData) {
    try {
      const accessToken = await this.getAccessToken();
      const data = {
        agentid: this.agentid,
        ...messageData,
      };
      
      const response = await this.api.post('/message/send', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * 上传临时素材
   * @param {string} type 媒体类型
   * @param {Buffer} media 媒体文件
   * @returns {Promise<Object>} 上传结果
   */
  async uploadMedia(type, media) {
    try {
      const accessToken = await this.getAccessToken();
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('media', media, {
        filename: `media.${type}`,
        contentType: `image/${type}`,
      });
      
      const response = await this.api.post('/media/upload', form, {
        params: {
          access_token: accessToken,
          type,
        },
        headers: {
          ...form.getHeaders(),
        },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to upload media:', error);
      throw error;
    }
  }

  /**
   * 获取企业信息
   * @returns {Promise<Object>} 企业信息
   */
  async getCorpInfo() {
    try {
      const accessToken = await this.getAccessToken();
      const response = await this.api.get('/corp/get', {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get corp info:', error);
      throw error;
    }
  }

  /**
   * 获取应用详情
   * @param {number} agentid 应用ID
   * @returns {Promise<Object>} 应用信息
   */
  async getAgentInfo(agentid = null) {
    try {
      const accessToken = await this.getAccessToken();
      const response = await this.api.get('/agent/get', {
        params: {
          access_token: accessToken,
          agentid: agentid || this.agentid,
        },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get agent info:', error);
      throw error;
    }
  }

  /**
   * 批量获取用户详情
   * @param {Array<string>} userids 用户ID列表
   * @returns {Promise<Array>} 用户信息列表
   */
  async batchGetUsers(userids) {
    try {
      const users = [];
      const batchSize = 100; // 企业微信API限制
      
      for (let i = 0; i < userids.length; i += batchSize) {
        const batch = userids.slice(i, i + batchSize);
        const batchUsers = await Promise.all(
          batch.map(userid => this.getUserInfo(userid).catch(err => {
            logger.warn(`Failed to get user ${userid}:`, err.message);
            return null;
          }))
        );
        
        users.push(...batchUsers.filter(user => user !== null));
      }
      
      return users;
    } catch (error) {
      logger.error('Failed to batch get users:', error);
      throw error;
    }
  }
}

module.exports = new WecomService();