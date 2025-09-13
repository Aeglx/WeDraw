const wechatService = require('../services/wechatService');
const messageService = require('../services/messageService');
const logger = require('../utils/logger');
const config = require('../config');

class WechatController {
  /**
   * 微信服务器验证
   */
  async verify(req, res) {
    try {
      const { signature, timestamp, nonce, echostr } = req.query;

      logger.info('WeChat server verification request:', {
        signature,
        timestamp,
        nonce,
        echostr,
      });

      // 验证签名
      const isValid = wechatService.verifySignature(signature, timestamp, nonce);

      if (isValid) {
        logger.info('WeChat server verification successful');
        res.send(echostr);
      } else {
        logger.warn('WeChat server verification failed');
        res.status(403).send('Forbidden');
      }
    } catch (error) {
      logger.error('WeChat verification error:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * 处理微信消息推送
   */
  async handleMessage(req, res) {
    try {
      const { signature, timestamp, nonce } = req.query;
      const xmlData = req.body;

      // 验证签名
      const isValid = wechatService.verifySignature(signature, timestamp, nonce);
      if (!isValid) {
        logger.warn('Invalid signature for message handling');
        return res.status(403).send('Forbidden');
      }

      // 解析XML消息
      const messageData = await wechatService.parseXML(xmlData);
      
      logger.info('Received WeChat message:', {
        msgType: messageData.MsgType,
        fromUser: messageData.FromUserName,
        toUser: messageData.ToUserName,
        createTime: messageData.CreateTime,
      });

      // 处理消息
      const response = await messageService.handleIncomingMessage(messageData);

      if (response) {
        res.set('Content-Type', 'application/xml');
        res.send(response);
      } else {
        res.send('success');
      }
    } catch (error) {
      logger.error('Failed to handle WeChat message:', error);
      res.send('success'); // 微信要求返回success，避免重复推送
    }
  }

  /**
   * 获取微信用户信息
   */
  async getUserInfo(req, res) {
    try {
      const { openid } = req.params;

      if (!openid) {
        return res.status(400).json({
          success: false,
          message: 'openid参数不能为空',
        });
      }

      const userInfo = await wechatService.getUserInfo(openid);

      res.json({
        success: true,
        data: userInfo,
      });
    } catch (error) {
      logger.error('Failed to get user info:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取微信用户列表
   */
  async getUserList(req, res) {
    try {
      const { next_openid } = req.query;

      const userList = await wechatService.getUserList(next_openid);

      res.json({
        success: true,
        data: userList,
      });
    } catch (error) {
      logger.error('Failed to get user list:', error);
      res.status(500).json({
        success: false,
        message: '获取用户列表失败',
        error: error.message,
      });
    }
  }

  /**
   * 创建自定义菜单
   */
  async createMenu(req, res) {
    try {
      const menuData = req.body;

      // 验证菜单数据
      if (!menuData.button || !Array.isArray(menuData.button)) {
        return res.status(400).json({
          success: false,
          message: '菜单数据格式错误',
        });
      }

      const result = await wechatService.createMenu(menuData);

      logger.business('menu_created', {
        menuData: JSON.stringify(menuData),
      }, req.user?.id);

      res.json({
        success: true,
        message: '菜单创建成功',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to create menu:', error);
      res.status(500).json({
        success: false,
        message: '创建菜单失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取自定义菜单
   */
  async getMenu(req, res) {
    try {
      const menu = await wechatService.getMenu();

      res.json({
        success: true,
        data: menu,
      });
    } catch (error) {
      logger.error('Failed to get menu:', error);
      res.status(500).json({
        success: false,
        message: '获取菜单失败',
        error: error.message,
      });
    }
  }

  /**
   * 删除自定义菜单
   */
  async deleteMenu(req, res) {
    try {
      const result = await wechatService.deleteMenu();

      logger.business('menu_deleted', {}, req.user?.id);

      res.json({
        success: true,
        message: '菜单删除成功',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to delete menu:', error);
      res.status(500).json({
        success: false,
        message: '删除菜单失败',
        error: error.message,
      });
    }
  }

  /**
   * 创建标签
   */
  async createTag(req, res) {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: '标签名称不能为空',
        });
      }

      const tag = await wechatService.createTag(name);

      logger.business('tag_created', {
        tagName: name,
        tagId: tag.id,
      }, req.user?.id);

      res.json({
        success: true,
        message: '标签创建成功',
        data: tag,
      });
    } catch (error) {
      logger.error('Failed to create tag:', error);
      res.status(500).json({
        success: false,
        message: '创建标签失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取标签列表
   */
  async getTags(req, res) {
    try {
      const tags = await wechatService.getTags();

      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      logger.error('Failed to get tags:', error);
      res.status(500).json({
        success: false,
        message: '获取标签列表失败',
        error: error.message,
      });
    }
  }

  /**
   * 更新标签
   */
  async updateTag(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: '标签名称不能为空',
        });
      }

      const result = await wechatService.updateTag(parseInt(id), name);

      logger.business('tag_updated', {
        tagId: id,
        tagName: name,
      }, req.user?.id);

      res.json({
        success: true,
        message: '标签更新成功',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to update tag:', error);
      res.status(500).json({
        success: false,
        message: '更新标签失败',
        error: error.message,
      });
    }
  }

  /**
   * 删除标签
   */
  async deleteTag(req, res) {
    try {
      const { id } = req.params;

      const result = await wechatService.deleteTag(parseInt(id));

      logger.business('tag_deleted', {
        tagId: id,
      }, req.user?.id);

      res.json({
        success: true,
        message: '标签删除成功',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to delete tag:', error);
      res.status(500).json({
        success: false,
        message: '删除标签失败',
        error: error.message,
      });
    }
  }

  /**
   * 批量为用户打标签
   */
  async batchTagging(req, res) {
    try {
      const { tag_id, openid_list } = req.body;

      if (!tag_id || !openid_list || !Array.isArray(openid_list)) {
        return res.status(400).json({
          success: false,
          message: '参数错误',
        });
      }

      const result = await wechatService.batchTagging(tag_id, openid_list);

      logger.business('batch_tagging', {
        tagId: tag_id,
        userCount: openid_list.length,
      }, req.user?.id);

      res.json({
        success: true,
        message: '批量打标签成功',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to batch tagging:', error);
      res.status(500).json({
        success: false,
        message: '批量打标签失败',
        error: error.message,
      });
    }
  }

  /**
   * 批量为用户取消标签
   */
  async batchUntagging(req, res) {
    try {
      const { tag_id, openid_list } = req.body;

      if (!tag_id || !openid_list || !Array.isArray(openid_list)) {
        return res.status(400).json({
          success: false,
          message: '参数错误',
        });
      }

      const result = await wechatService.batchUntagging(tag_id, openid_list);

      logger.business('batch_untagging', {
        tagId: tag_id,
        userCount: openid_list.length,
      }, req.user?.id);

      res.json({
        success: true,
        message: '批量取消标签成功',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to batch untagging:', error);
      res.status(500).json({
        success: false,
        message: '批量取消标签失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取用户标签
   */
  async getUserTags(req, res) {
    try {
      const { openid } = req.params;

      if (!openid) {
        return res.status(400).json({
          success: false,
          message: 'openid参数不能为空',
        });
      }

      const tags = await wechatService.getUserTags(openid);

      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      logger.error('Failed to get user tags:', error);
      res.status(500).json({
        success: false,
        message: '获取用户标签失败',
        error: error.message,
      });
    }
  }

  /**
   * 上传多媒体文件
   */
  async uploadMedia(req, res) {
    try {
      const { type } = req.body;
      const file = req.file;

      if (!type || !file) {
        return res.status(400).json({
          success: false,
          message: '参数错误',
        });
      }

      const result = await wechatService.uploadMedia(type, file.buffer);

      logger.business('media_uploaded', {
        type,
        mediaId: result.media_id,
        fileName: file.originalname,
      }, req.user?.id);

      res.json({
        success: true,
        message: '文件上传成功',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to upload media:', error);
      res.status(500).json({
        success: false,
        message: '文件上传失败',
        error: error.message,
      });
    }
  }

  /**
   * 生成带参数的二维码
   */
  async createQRCode(req, res) {
    try {
      const { scene_id, is_temporary = true, expire_seconds = 604800 } = req.body;

      if (!scene_id) {
        return res.status(400).json({
          success: false,
          message: '场景值不能为空',
        });
      }

      const result = await wechatService.createQRCode(
        scene_id,
        is_temporary,
        expire_seconds
      );

      logger.business('qrcode_created', {
        sceneId: scene_id,
        isTemporary: is_temporary,
        ticket: result.ticket,
      }, req.user?.id);

      res.json({
        success: true,
        message: '二维码生成成功',
        data: {
          ...result,
          qr_code_url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(result.ticket)}`,
        },
      });
    } catch (error) {
      logger.error('Failed to create QR code:', error);
      res.status(500).json({
        success: false,
        message: '生成二维码失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取微信服务器IP列表
   */
  async getCallbackIP(req, res) {
    try {
      const ipList = await wechatService.getCallbackIP();

      res.json({
        success: true,
        data: ipList,
      });
    } catch (error) {
      logger.error('Failed to get callback IP:', error);
      res.status(500).json({
        success: false,
        message: '获取服务器IP列表失败',
        error: error.message,
      });
    }
  }

  /**
   * 获取访问令牌（仅用于调试）
   */
  async getAccessToken(req, res) {
    try {
      // 仅在开发环境下允许
      if (config.env !== 'development') {
        return res.status(403).json({
          success: false,
          message: '此接口仅在开发环境下可用',
        });
      }

      const accessToken = await wechatService.getAccessToken();

      res.json({
        success: true,
        data: {
          access_token: accessToken,
        },
      });
    } catch (error) {
      logger.error('Failed to get access token:', error);
      res.status(500).json({
        success: false,
        message: '获取访问令牌失败',
        error: error.message,
      });
    }
  }

  /**
   * 微信服务健康检查
   */
  async healthCheck(req, res) {
    try {
      // 检查访问令牌
      const accessToken = await wechatService.getAccessToken();
      
      // 检查服务器IP
      const ipList = await wechatService.getCallbackIP();

      res.json({
        success: true,
        message: '微信服务正常',
        data: {
          access_token_valid: !!accessToken,
          server_ip_count: ipList.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('WeChat service health check failed:', error);
      res.status(500).json({
        success: false,
        message: '微信服务异常',
        error: error.message,
      });
    }
  }
}

module.exports = new WechatController();