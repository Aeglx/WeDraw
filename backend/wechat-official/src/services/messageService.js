const { Message, Fan } = require('../models');
const logger = require('../utils/logger');
const wechatService = require('./wechatService');
const cacheService = require('./cacheService');
const { Op } = require('sequelize');

class MessageService {
  /**
   * 处理接收到的消息
   */
  async handleIncomingMessage(messageData) {
    try {
      const {
        ToUserName,
        FromUserName,
        CreateTime,
        MsgType,
        MsgId,
        Content,
        MediaId,
        PicUrl,
        Format,
        Recognition,
        ThumbMediaId,
        Location_X,
        Location_Y,
        Scale,
        Label,
        Title,
        Description,
        Url,
        Event,
        EventKey,
        Ticket,
        Latitude,
        Longitude,
        Precision,
      } = messageData;

      // 查找或创建粉丝记录
      let fan = await Fan.findByOpenid(FromUserName);
      if (!fan) {
        // 获取用户信息并创建粉丝记录
        try {
          const userInfo = await wechatService.getUserInfo(FromUserName);
          fan = await Fan.createFromWechatUser(userInfo);
        } catch (error) {
          logger.error('Failed to get user info for new fan:', error);
          // 创建基础粉丝记录
          fan = await Fan.create({
            openid: FromUserName,
            subscribe: true,
            subscribe_time: new Date(CreateTime * 1000),
            status: 'active',
          });
        }
      }

      // 更新粉丝最后交互时间
      await fan.updateInteraction();

      // 处理不同类型的消息
      let response = null;
      
      if (MsgType === 'event') {
        response = await this.handleEvent(messageData, fan);
      } else {
        response = await this.handleMessage(messageData, fan);
      }

      // 记录消息
      await this.recordMessage({
        fan_id: fan.id,
        openid: FromUserName,
        msg_id: MsgId,
        msg_type: MsgType,
        direction: 'in',
        content: Content,
        media_id: MediaId,
        pic_url: PicUrl,
        format: Format,
        recognition: Recognition,
        thumb_media_id: ThumbMediaId,
        location_x: Location_X,
        location_y: Location_Y,
        scale: Scale,
        label: Label,
        title: Title,
        description: Description,
        url: Url,
        event: Event,
        event_key: EventKey,
        ticket: Ticket,
        latitude: Latitude,
        longitude: Longitude,
        precision: Precision,
        receive_time: new Date(CreateTime * 1000),
        status: 'received',
      });

      return response;
    } catch (error) {
      logger.error('Failed to handle incoming message:', error);
      throw error;
    }
  }

  /**
   * 处理事件消息
   */
  async handleEvent(messageData, fan) {
    const { Event, EventKey, FromUserName, ToUserName } = messageData;

    logger.business('event_received', {
      event: Event,
      eventKey: EventKey,
      openid: FromUserName,
      fanId: fan.id,
    });

    switch (Event) {
      case 'subscribe':
        return await this.handleSubscribe(messageData, fan);
      case 'unsubscribe':
        return await this.handleUnsubscribe(messageData, fan);
      case 'CLICK':
        return await this.handleMenuClick(messageData, fan);
      case 'VIEW':
        return await this.handleMenuView(messageData, fan);
      case 'SCAN':
        return await this.handleScan(messageData, fan);
      case 'LOCATION':
        return await this.handleLocation(messageData, fan);
      case 'TEMPLATESENDJOBFINISH':
        return await this.handleTemplateSendFinish(messageData, fan);
      default:
        logger.warn('Unknown event type:', Event);
        return null;
    }
  }

  /**
   * 处理普通消息
   */
  async handleMessage(messageData, fan) {
    const { MsgType, Content, FromUserName, ToUserName } = messageData;

    logger.business('message_received', {
      msgType: MsgType,
      content: Content?.substring(0, 100),
      openid: FromUserName,
      fanId: fan.id,
    });

    switch (MsgType) {
      case 'text':
        return await this.handleTextMessage(messageData, fan);
      case 'image':
        return await this.handleImageMessage(messageData, fan);
      case 'voice':
        return await this.handleVoiceMessage(messageData, fan);
      case 'video':
      case 'shortvideo':
        return await this.handleVideoMessage(messageData, fan);
      case 'location':
        return await this.handleLocationMessage(messageData, fan);
      case 'link':
        return await this.handleLinkMessage(messageData, fan);
      default:
        logger.warn('Unknown message type:', MsgType);
        return this.getDefaultResponse(FromUserName, ToUserName);
    }
  }

  /**
   * 处理关注事件
   */
  async handleSubscribe(messageData, fan) {
    const { FromUserName, ToUserName, EventKey } = messageData;

    // 更新粉丝关注状态
    await fan.subscribe();

    // 如果是扫码关注，处理场景值
    if (EventKey && EventKey.startsWith('qrscene_')) {
      const sceneId = EventKey.replace('qrscene_', '');
      await this.handleQRCodeScene(sceneId, fan);
    }

    // 获取欢迎消息
    const welcomeMessage = await this.getWelcomeMessage(fan);
    
    logger.business('user_subscribed', {
      openid: FromUserName,
      fanId: fan.id,
      sceneId: EventKey,
    });

    return wechatService.buildXMLResponse(
      FromUserName,
      ToUserName,
      'text',
      welcomeMessage
    );
  }

  /**
   * 处理取消关注事件
   */
  async handleUnsubscribe(messageData, fan) {
    const { FromUserName } = messageData;

    // 更新粉丝关注状态
    await fan.unsubscribe();

    logger.business('user_unsubscribed', {
      openid: FromUserName,
      fanId: fan.id,
    });

    // 取消关注事件不需要回复
    return null;
  }

  /**
   * 处理菜单点击事件
   */
  async handleMenuClick(messageData, fan) {
    const { FromUserName, ToUserName, EventKey } = messageData;

    // 根据菜单key处理不同的业务逻辑
    let response = null;
    
    switch (EventKey) {
      case 'MENU_HELP':
        response = await this.getHelpMessage();
        break;
      case 'MENU_CONTACT':
        response = await this.getContactMessage();
        break;
      case 'MENU_ABOUT':
        response = await this.getAboutMessage();
        break;
      default:
        response = '感谢您的点击！';
    }

    logger.business('menu_clicked', {
      eventKey: EventKey,
      openid: FromUserName,
      fanId: fan.id,
    });

    return wechatService.buildXMLResponse(
      FromUserName,
      ToUserName,
      'text',
      response
    );
  }

  /**
   * 处理菜单跳转事件
   */
  async handleMenuView(messageData, fan) {
    const { FromUserName, EventKey } = messageData;

    logger.business('menu_viewed', {
      eventKey: EventKey,
      openid: FromUserName,
      fanId: fan.id,
    });

    // 菜单跳转事件不需要回复
    return null;
  }

  /**
   * 处理扫码事件
   */
  async handleScan(messageData, fan) {
    const { FromUserName, ToUserName, EventKey, Ticket } = messageData;

    // 处理二维码场景
    await this.handleQRCodeScene(EventKey, fan);

    logger.business('qr_code_scanned', {
      sceneId: EventKey,
      ticket: Ticket,
      openid: FromUserName,
      fanId: fan.id,
    });

    return wechatService.buildXMLResponse(
      FromUserName,
      ToUserName,
      'text',
      '扫码成功！'
    );
  }

  /**
   * 处理地理位置事件
   */
  async handleLocation(messageData, fan) {
    const { FromUserName, Latitude, Longitude, Precision } = messageData;

    // 更新粉丝地理位置信息
    await fan.update({
      latitude: Latitude,
      longitude: Longitude,
      precision: Precision,
      location_updated_at: new Date(),
    });

    logger.business('location_reported', {
      latitude: Latitude,
      longitude: Longitude,
      precision: Precision,
      openid: FromUserName,
      fanId: fan.id,
    });

    // 地理位置事件不需要回复
    return null;
  }

  /**
   * 处理模板消息发送结果
   */
  async handleTemplateSendFinish(messageData, fan) {
    const { FromUserName, Status, MsgID } = messageData;

    // 更新消息发送状态
    if (MsgID) {
      await Message.update(
        {
          status: Status === 'success' ? 'delivered' : 'failed',
          delivered_time: Status === 'success' ? new Date() : null,
        },
        {
          where: {
            openid: FromUserName,
            msg_type: 'template',
            extra_data: {
              msgid: MsgID,
            },
          },
        }
      );
    }

    logger.business('template_send_finished', {
      status: Status,
      msgId: MsgID,
      openid: FromUserName,
      fanId: fan.id,
    });

    return null;
  }

  /**
   * 处理文本消息
   */
  async handleTextMessage(messageData, fan) {
    const { FromUserName, ToUserName, Content } = messageData;

    // 智能回复逻辑
    const response = await this.getAutoReply(Content, fan);

    if (response) {
      return wechatService.buildXMLResponse(
        FromUserName,
        ToUserName,
        response.type || 'text',
        response.content
      );
    }

    return null;
  }

  /**
   * 处理图片消息
   */
  async handleImageMessage(messageData, fan) {
    const { FromUserName, ToUserName } = messageData;

    return wechatService.buildXMLResponse(
      FromUserName,
      ToUserName,
      'text',
      '收到您的图片了！'
    );
  }

  /**
   * 处理语音消息
   */
  async handleVoiceMessage(messageData, fan) {
    const { FromUserName, ToUserName, Recognition } = messageData;

    let response = '收到您的语音消息了！';
    
    // 如果有语音识别结果，进行智能回复
    if (Recognition) {
      const autoReply = await this.getAutoReply(Recognition, fan);
      if (autoReply) {
        response = autoReply.content;
      }
    }

    return wechatService.buildXMLResponse(
      FromUserName,
      ToUserName,
      'text',
      response
    );
  }

  /**
   * 处理视频消息
   */
  async handleVideoMessage(messageData, fan) {
    const { FromUserName, ToUserName } = messageData;

    return wechatService.buildXMLResponse(
      FromUserName,
      ToUserName,
      'text',
      '收到您的视频了！'
    );
  }

  /**
   * 处理地理位置消息
   */
  async handleLocationMessage(messageData, fan) {
    const { FromUserName, ToUserName, Location_X, Location_Y, Label } = messageData;

    // 更新粉丝地理位置信息
    await fan.update({
      latitude: Location_Y,
      longitude: Location_X,
      address: Label,
      location_updated_at: new Date(),
    });

    return wechatService.buildXMLResponse(
      FromUserName,
      ToUserName,
      'text',
      `收到您的位置信息：${Label}`
    );
  }

  /**
   * 处理链接消息
   */
  async handleLinkMessage(messageData, fan) {
    const { FromUserName, ToUserName, Title, Url } = messageData;

    return wechatService.buildXMLResponse(
      FromUserName,
      ToUserName,
      'text',
      `收到您分享的链接：${Title}`
    );
  }

  /**
   * 处理二维码场景
   */
  async handleQRCodeScene(sceneId, fan) {
    try {
      // 根据场景ID处理不同的业务逻辑
      switch (sceneId) {
        case '1001': // 推广场景
          await this.handlePromotionScene(fan);
          break;
        case '1002': // 活动场景
          await this.handleActivityScene(fan);
          break;
        default:
          logger.info('Unknown QR code scene:', sceneId);
      }
    } catch (error) {
      logger.error('Failed to handle QR code scene:', error);
    }
  }

  /**
   * 处理推广场景
   */
  async handlePromotionScene(fan) {
    // 给用户添加推广标签
    await fan.addTag('推广用户');
    
    // 发送推广欢迎消息
    // 这里可以调用发送消息的方法
  }

  /**
   * 处理活动场景
   */
  async handleActivityScene(fan) {
    // 给用户添加活动标签
    await fan.addTag('活动用户');
    
    // 发送活动信息
    // 这里可以调用发送消息的方法
  }

  /**
   * 获取智能回复
   */
  async getAutoReply(content, fan) {
    try {
      // 缓存键
      const cacheKey = `auto_reply:${content.toLowerCase()}`;
      let reply = await cacheService.get(cacheKey);
      
      if (!reply) {
        // 关键词匹配
        const keywords = {
          '你好': '您好！欢迎关注我们！',
          'hello': 'Hello! Welcome!',
          '帮助': '如需帮助，请点击菜单或回复"客服"联系我们。',
          '客服': '客服工作时间：9:00-18:00，如需紧急帮助请拨打400-xxx-xxxx',
          '积分': '您当前积分：' + (fan.points || 0),
          '签到': await this.handleCheckIn(fan),
        };
        
        // 模糊匹配
        for (const [keyword, response] of Object.entries(keywords)) {
          if (content.toLowerCase().includes(keyword.toLowerCase())) {
            reply = {
              type: 'text',
              content: response,
            };
            break;
          }
        }
        
        // 缓存回复结果
        if (reply) {
          await cacheService.set(cacheKey, reply, 3600); // 缓存1小时
        }
      }
      
      return reply;
    } catch (error) {
      logger.error('Failed to get auto reply:', error);
      return null;
    }
  }

  /**
   * 处理签到
   */
  async handleCheckIn(fan) {
    try {
      const today = new Date().toDateString();
      const lastCheckIn = fan.last_checkin_date ? new Date(fan.last_checkin_date).toDateString() : null;
      
      if (lastCheckIn === today) {
        return '您今天已经签到过了！';
      }
      
      // 执行签到
      const points = Math.floor(Math.random() * 10) + 1; // 随机1-10积分
      await fan.addPoints(points, '每日签到');
      await fan.update({ last_checkin_date: new Date() });
      
      return `签到成功！获得${points}积分，当前积分：${fan.points + points}`;
    } catch (error) {
      logger.error('Failed to handle check in:', error);
      return '签到失败，请稍后重试。';
    }
  }

  /**
   * 获取欢迎消息
   */
  async getWelcomeMessage(fan) {
    const messages = [
      `欢迎关注！${fan.nickname || '朋友'}`,
      '感谢您的关注！我们将为您提供最优质的服务。',
      '回复"帮助"获取更多功能介绍。',
    ];
    
    return messages.join('\n');
  }

  /**
   * 获取帮助消息
   */
  async getHelpMessage() {
    return [
      '📖 帮助信息',
      '',
      '🔹 回复"积分"查看当前积分',
      '🔹 回复"签到"进行每日签到',
      '🔹 回复"客服"联系人工客服',
      '🔹 点击菜单获取更多功能',
      '',
      '如有其他问题，请联系客服。',
    ].join('\n');
  }

  /**
   * 获取联系方式
   */
  async getContactMessage() {
    return [
      '📞 联系我们',
      '',
      '客服热线：400-xxx-xxxx',
      '工作时间：9:00-18:00',
      '邮箱：service@example.com',
      '',
      '我们将竭诚为您服务！',
    ].join('\n');
  }

  /**
   * 获取关于信息
   */
  async getAboutMessage() {
    return [
      '🏢 关于我们',
      '',
      'WeDraw - 专业的绘图工具平台',
      '致力于为用户提供便捷的绘图体验',
      '',
      '官网：https://wedraw.example.com',
      '版本：v1.0.0',
    ].join('\n');
  }

  /**
   * 获取默认回复
   */
  getDefaultResponse(fromUser, toUser) {
    return wechatService.buildXMLResponse(
      fromUser,
      toUser,
      'text',
      '感谢您的消息！如需帮助请回复"帮助"。'
    );
  }

  /**
   * 记录消息
   */
  async recordMessage(messageData) {
    try {
      return await Message.create(messageData);
    } catch (error) {
      logger.error('Failed to record message:', error);
      throw error;
    }
  }

  /**
   * 批量发送消息
   */
  async batchSendMessages(messages) {
    const results = [];
    
    for (const message of messages) {
      try {
        let result;
        
        switch (message.type) {
          case 'text':
            result = await wechatService.sendTextMessage(message.openid, message.content);
            break;
          case 'template':
            result = await wechatService.sendTemplateMessage(message.templateData);
            break;
          default:
            throw new Error('不支持的消息类型');
        }
        
        results.push({
          openid: message.openid,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          openid: message.openid,
          success: false,
          error: error.message,
        });
      }
    }
    
    return results;
  }

  /**
   * 获取消息统计
   */
  async getMessageStatistics(startDate, endDate) {
    const where = {};
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = startDate;
      if (endDate) where.created_at[Op.lte] = endDate;
    }
    
    const [totalCount, inCount, outCount, typeStats] = await Promise.all([
      Message.count({ where }),
      Message.count({ where: { ...where, direction: 'in' } }),
      Message.count({ where: { ...where, direction: 'out' } }),
      Message.findAll({
        where,
        attributes: [
          'msg_type',
          [Message.sequelize.fn('COUNT', '*'), 'count'],
        ],
        group: ['msg_type'],
        raw: true,
      }),
    ]);
    
    return {
      total: totalCount,
      incoming: inCount,
      outgoing: outCount,
      byType: typeStats.reduce((acc, item) => {
        acc[item.msg_type] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }
}

module.exports = new MessageService();