const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const logger = require('../utils/logger');
const wecomService = require('../services/wecomService');
const contactsService = require('../services/contactsService');

// 企业微信回调验证
router.get('/', (req, res) => {
  try {
    const { msg_signature, timestamp, nonce, echostr } = req.query;
    
    // 验证回调URL
    const token = process.env.WECOM_TOKEN || 'your_token_here';
    const encodingAESKey = process.env.WECOM_ENCODING_AES_KEY || 'your_encoding_aes_key_here';
    
    // 这里应该实现企业微信的回调验证逻辑
    // 简化处理，直接返回echostr
    logger.info('企业微信回调验证', { msg_signature, timestamp, nonce });
    
    res.send(echostr);
  } catch (error) {
    logger.error('企业微信回调验证失败:', error);
    res.status(500).json({
      success: false,
      message: '回调验证失败',
      error: error.message
    });
  }
});

// 企业微信事件回调
router.post('/', async (req, res) => {
  try {
    const { msg_signature, timestamp, nonce } = req.query;
    const body = req.body;
    
    logger.info('收到企业微信回调事件', { msg_signature, timestamp, nonce, body });
    
    // 解析回调事件
    if (body.MsgType) {
      switch (body.MsgType) {
        case 'event':
          await handleEvent(body);
          break;
        case 'text':
          await handleTextMessage(body);
          break;
        case 'image':
          await handleImageMessage(body);
          break;
        default:
          logger.info('未处理的消息类型:', body.MsgType);
      }
    }
    
    res.send('success');
  } catch (error) {
    logger.error('处理企业微信回调失败:', error);
    res.status(500).json({
      success: false,
      message: '处理回调失败',
      error: error.message
    });
  }
});

// 处理事件消息
async function handleEvent(data) {
  try {
    const { Event, ChangeType } = data;
    
    logger.info('处理事件消息', { Event, ChangeType });
    
    switch (Event) {
      case 'change_contact':
        await handleContactChange(data);
        break;
      case 'change_external_contact':
        await handleExternalContactChange(data);
        break;
      default:
        logger.info('未处理的事件类型:', Event);
    }
  } catch (error) {
    logger.error('处理事件消息失败:', error);
  }
}

// 处理通讯录变更事件
async function handleContactChange(data) {
  try {
    const { ChangeType, UserID, DepartmentId } = data;
    
    logger.info('处理通讯录变更', { ChangeType, UserID, DepartmentId });
    
    switch (ChangeType) {
      case 'create_user':
      case 'update_user':
        if (UserID) {
          // 同步用户信息
          await contactsService.syncUserById(UserID);
        }
        break;
      case 'delete_user':
        if (UserID) {
          // 删除用户
          await contactsService.deleteUser(UserID);
        }
        break;
      case 'create_party':
      case 'update_party':
        if (DepartmentId) {
          // 同步部门信息
          await contactsService.syncDepartmentById(DepartmentId);
        }
        break;
      case 'delete_party':
        if (DepartmentId) {
          // 删除部门
          await contactsService.deleteDepartment(DepartmentId);
        }
        break;
    }
  } catch (error) {
    logger.error('处理通讯录变更失败:', error);
  }
}

// 处理外部联系人变更事件
async function handleExternalContactChange(data) {
  try {
    const { ChangeType, ExternalUserID, UserID } = data;
    
    logger.info('处理外部联系人变更', { ChangeType, ExternalUserID, UserID });
    
    // 这里可以实现外部联系人的处理逻辑
    // 例如同步外部联系人信息、记录客户跟进等
  } catch (error) {
    logger.error('处理外部联系人变更失败:', error);
  }
}

// 处理文本消息
async function handleTextMessage(data) {
  try {
    const { FromUserName, ToUserName, Content, MsgId } = data;
    
    logger.info('处理文本消息', { FromUserName, ToUserName, Content, MsgId });
    
    // 这里可以实现自动回复、消息记录等逻辑
  } catch (error) {
    logger.error('处理文本消息失败:', error);
  }
}

// 处理图片消息
async function handleImageMessage(data) {
  try {
    const { FromUserName, ToUserName, MediaId, PicUrl, MsgId } = data;
    
    logger.info('处理图片消息', { FromUserName, ToUserName, MediaId, PicUrl, MsgId });
    
    // 这里可以实现图片下载、存储等逻辑
  } catch (error) {
    logger.error('处理图片消息失败:', error);
  }
}

module.exports = router;