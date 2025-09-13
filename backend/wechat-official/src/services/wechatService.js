const axios = require('axios');
const crypto = require('crypto');
const xml2js = require('xml2js');
const config = require('../config');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');

class WechatService {
  constructor() {
    this.appId = config.wechat.appId;
    this.appSecret = config.wechat.appSecret;
    this.token = config.wechat.token;
    this.encodingAESKey = config.wechat.encodingAESKey;
    this.baseURL = 'https://api.weixin.qq.com/cgi-bin';
    
    // 初始化axios实例
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        logger.wechatApi('Request:', {
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error('WeChat API request error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.api.interceptors.response.use(
      (response) => {
        logger.wechatApi('Response:', {
          status: response.status,
          data: response.data,
        });
        
        // 检查微信API错误
        if (response.data.errcode && response.data.errcode !== 0) {
          const error = new Error(response.data.errmsg || '微信API调用失败');
          error.code = response.data.errcode;
          throw error;
        }
        
        return response;
      },
      (error) => {
        logger.error('WeChat API response error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken() {
    const cacheKey = 'wechat:access_token';
    let token = await cacheService.get(cacheKey);
    
    if (!token) {
      try {
        const response = await this.api.get('/token', {
          params: {
            grant_type: 'client_credential',
            appid: this.appId,
            secret: this.appSecret,
          },
        });
        
        token = response.data.access_token;
        const expiresIn = response.data.expires_in || 7200;
        
        // 提前5分钟过期，避免边界问题
        await cacheService.set(cacheKey, token, expiresIn - 300);
        
        logger.wechatApi('Access token refreshed', { expiresIn });
      } catch (error) {
        logger.error('Failed to get access token:', error);
        throw new Error('获取访问令牌失败');
      }
    }
    
    return token;
  }

  /**
   * 验证微信服务器签名
   */
  verifySignature(signature, timestamp, nonce) {
    const tmpArr = [this.token, timestamp, nonce].sort();
    const tmpStr = tmpArr.join('');
    const shasum = crypto.createHash('sha1');
    shasum.update(tmpStr);
    const hashCode = shasum.digest('hex');
    
    return hashCode === signature;
  }

  /**
   * 解析XML消息
   */
  async parseXML(xml) {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.xml);
        }
      });
    });
  }

  /**
   * 构建XML响应
   */
  buildXMLResponse(toUser, fromUser, msgType, content) {
    const timestamp = Math.floor(Date.now() / 1000);
    let xml = `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${timestamp}</CreateTime>
<MsgType><![CDATA[${msgType}]]></MsgType>`;
    
    switch (msgType) {
      case 'text':
        xml += `<Content><![CDATA[${content}]]></Content>`;
        break;
      case 'image':
        xml += `<Image><MediaId><![CDATA[${content.mediaId}]]></MediaId></Image>`;
        break;
      case 'news':
        xml += `<ArticleCount>${content.articles.length}</ArticleCount><Articles>`;
        content.articles.forEach(article => {
          xml += `<item>
<Title><![CDATA[${article.title}]]></Title>
<Description><![CDATA[${article.description}]]></Description>
<PicUrl><![CDATA[${article.picUrl}]]></PicUrl>
<Url><![CDATA[${article.url}]]></Url>
</item>`;
        });
        xml += '</Articles>';
        break;
    }
    
    xml += '</xml>';
    return xml;
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(openid) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await this.api.get('/user/info', {
        params: {
          access_token: accessToken,
          openid,
          lang: 'zh_CN',
        },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get user info:', error);
      throw new Error('获取用户信息失败');
    }
  }

  /**
   * 获取用户列表
   */
  async getUserList(nextOpenid = null) {
    const accessToken = await this.getAccessToken();
    
    try {
      const params = {
        access_token: accessToken,
      };
      
      if (nextOpenid) {
        params.next_openid = nextOpenid;
      }
      
      const response = await this.api.get('/user/get', { params });
      return response.data;
    } catch (error) {
      logger.error('Failed to get user list:', error);
      throw new Error('获取用户列表失败');
    }
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(openid, content) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      touser: openid,
      msgtype: 'text',
      text: {
        content,
      },
    };
    
    try {
      const response = await this.api.post('/message/custom/send', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send text message:', error);
      throw new Error('发送文本消息失败');
    }
  }

  /**
   * 发送图片消息
   */
  async sendImageMessage(openid, mediaId) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      touser: openid,
      msgtype: 'image',
      image: {
        media_id: mediaId,
      },
    };
    
    try {
      const response = await this.api.post('/message/custom/send', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send image message:', error);
      throw new Error('发送图片消息失败');
    }
  }

  /**
   * 发送图文消息
   */
  async sendNewsMessage(openid, articles) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      touser: openid,
      msgtype: 'news',
      news: {
        articles: articles.map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          picurl: article.picUrl,
        })),
      },
    };
    
    try {
      const response = await this.api.post('/message/custom/send', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send news message:', error);
      throw new Error('发送图文消息失败');
    }
  }

  /**
   * 发送音乐消息
   */
  async sendMusicMessage(openid, music) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      touser: openid,
      msgtype: 'music',
      music: {
        title: music.title,
        description: music.description,
        musicurl: music.musicUrl,
        hqmusicurl: music.hqMusicUrl,
        thumb_media_id: music.thumbMediaId,
      },
    };
    
    try {
      const response = await this.api.post('/message/custom/send', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send music message:', error);
      throw new Error('发送音乐消息失败');
    }
  }

  /**
   * 发送模板消息
   */
  async sendTemplateMessage(templateData) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await this.api.post('/message/template/send', templateData, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send template message:', error);
      throw new Error('发送模板消息失败');
    }
  }

  /**
   * 群发消息给所有用户
   */
  async sendMassMessageToAll(messageData) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      filter: {
        is_to_all: true,
      },
      ...this.formatMassMessageData(messageData),
    };
    
    try {
      const response = await this.api.post('/message/mass/sendall', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send mass message to all:', error);
      throw new Error('群发消息失败');
    }
  }

  /**
   * 根据标签群发消息
   */
  async sendMassMessageByTag(tagId, messageData) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      filter: {
        is_to_all: false,
        tag_id: tagId,
      },
      ...this.formatMassMessageData(messageData),
    };
    
    try {
      const response = await this.api.post('/message/mass/sendall', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send mass message by tag:', error);
      throw new Error('按标签群发消息失败');
    }
  }

  /**
   * 根据OpenID列表群发消息
   */
  async sendMassMessageByOpenid(openidList, messageData) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      touser: openidList,
      ...this.formatMassMessageData(messageData),
    };
    
    try {
      const response = await this.api.post('/message/mass/send', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to send mass message by openid:', error);
      throw new Error('按用户列表群发消息失败');
    }
  }

  /**
   * 格式化群发消息数据
   */
  formatMassMessageData(messageData) {
    const { msg_type, content, media_id, articles } = messageData;
    
    switch (msg_type) {
      case 'text':
        return {
          msgtype: 'text',
          text: { content },
        };
      case 'image':
        return {
          msgtype: 'image',
          image: { media_id },
        };
      case 'news':
        return {
          msgtype: 'mpnews',
          mpnews: { media_id },
        };
      default:
        throw new Error('不支持的群发消息类型');
    }
  }

  /**
   * 创建用户标签
   */
  async createTag(name) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      tag: { name },
    };
    
    try {
      const response = await this.api.post('/tags/create', data, {
        params: { access_token: accessToken },
      });
      
      return response.data.tag;
    } catch (error) {
      logger.error('Failed to create tag:', error);
      throw new Error('创建标签失败');
    }
  }

  /**
   * 获取标签列表
   */
  async getTags() {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await this.api.get('/tags/get', {
        params: { access_token: accessToken },
      });
      
      return response.data.tags;
    } catch (error) {
      logger.error('Failed to get tags:', error);
      throw new Error('获取标签列表失败');
    }
  }

  /**
   * 更新标签
   */
  async updateTag(tagId, name) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      tag: {
        id: tagId,
        name,
      },
    };
    
    try {
      const response = await this.api.post('/tags/update', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to update tag:', error);
      throw new Error('更新标签失败');
    }
  }

  /**
   * 删除标签
   */
  async deleteTag(tagId) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      tag: { id: tagId },
    };
    
    try {
      const response = await this.api.post('/tags/delete', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to delete tag:', error);
      throw new Error('删除标签失败');
    }
  }

  /**
   * 批量为用户打标签
   */
  async batchTagging(tagId, openidList) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      openid_list: openidList,
      tagid: tagId,
    };
    
    try {
      const response = await this.api.post('/tags/members/batchtagging', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to batch tagging:', error);
      throw new Error('批量打标签失败');
    }
  }

  /**
   * 批量为用户取消标签
   */
  async batchUntagging(tagId, openidList) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      openid_list: openidList,
      tagid: tagId,
    };
    
    try {
      const response = await this.api.post('/tags/members/batchuntagging', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to batch untagging:', error);
      throw new Error('批量取消标签失败');
    }
  }

  /**
   * 获取用户身上的标签列表
   */
  async getUserTags(openid) {
    const accessToken = await this.getAccessToken();
    
    const data = { openid };
    
    try {
      const response = await this.api.post('/tags/getidlist', data, {
        params: { access_token: accessToken },
      });
      
      return response.data.tagid_list;
    } catch (error) {
      logger.error('Failed to get user tags:', error);
      throw new Error('获取用户标签失败');
    }
  }

  /**
   * 上传多媒体文件
   */
  async uploadMedia(type, media) {
    const accessToken = await this.getAccessToken();
    
    const formData = new FormData();
    formData.append('media', media);
    
    try {
      const response = await this.api.post('/media/upload', formData, {
        params: {
          access_token: accessToken,
          type,
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to upload media:', error);
      throw new Error('上传媒体文件失败');
    }
  }

  /**
   * 获取多媒体文件
   */
  async getMedia(mediaId) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await this.api.get('/media/get', {
        params: {
          access_token: accessToken,
          media_id: mediaId,
        },
        responseType: 'stream',
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get media:', error);
      throw new Error('获取媒体文件失败');
    }
  }

  /**
   * 创建自定义菜单
   */
  async createMenu(menuData) {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await this.api.post('/menu/create', menuData, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to create menu:', error);
      throw new Error('创建自定义菜单失败');
    }
  }

  /**
   * 获取自定义菜单
   */
  async getMenu() {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await this.api.get('/menu/get', {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to get menu:', error);
      throw new Error('获取自定义菜单失败');
    }
  }

  /**
   * 删除自定义菜单
   */
  async deleteMenu() {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await this.api.get('/menu/delete', {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to delete menu:', error);
      throw new Error('删除自定义菜单失败');
    }
  }

  /**
   * 生成带参数的二维码
   */
  async createQRCode(sceneId, isTemporary = true, expireSeconds = 604800) {
    const accessToken = await this.getAccessToken();
    
    const data = {
      action_name: isTemporary ? 'QR_SCENE' : 'QR_LIMIT_SCENE',
      action_info: {
        scene: {
          scene_id: sceneId,
        },
      },
    };
    
    if (isTemporary) {
      data.expire_seconds = expireSeconds;
    }
    
    try {
      const response = await this.api.post('/qrcode/create', data, {
        params: { access_token: accessToken },
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to create QR code:', error);
      throw new Error('生成二维码失败');
    }
  }

  /**
   * 获取服务器IP列表
   */
  async getCallbackIP() {
    const accessToken = await this.getAccessToken();
    
    try {
      const response = await this.api.get('/getcallbackip', {
        params: { access_token: accessToken },
      });
      
      return response.data.ip_list;
    } catch (error) {
      logger.error('Failed to get callback IP:', error);
      throw new Error('获取服务器IP列表失败');
    }
  }
}

module.exports = new WechatService();