/**
 * 企业微信服务路由配置
 */

const express = require('express');
const router = express.Router();

// 导入控制器
const ContactController = require('../controllers/ContactController');
const GroupController = require('../controllers/GroupController');
const BotController = require('../controllers/BotController');

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '企业微信服务运行正常',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API信息
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '企业微信服务API',
    version: '1.0.0',
    endpoints: {
      contacts: '/api/contacts',
      groups: '/api/groups',
      bots: '/api/bots',
      health: '/api/health',
      docs: '/api/docs'
    },
    timestamp: new Date().toISOString()
  });
});

// ==================== 通讯录路由 ====================

// 获取通讯录列表
router.get('/contacts', ContactController.getContacts);

// 获取联系人详情
router.get('/contacts/:id', ContactController.getContact);

// 创建联系人
router.post('/contacts', ContactController.createContact);

// 更新联系人
router.put('/contacts/:id', ContactController.updateContact);

// 删除联系人
router.delete('/contacts/:id', ContactController.deleteContact);

// 批量导入联系人
router.post('/contacts/batch-import', ContactController.batchImportContacts);

// 同步企业微信通讯录
router.post('/contacts/sync-from-wework', ContactController.syncFromWework);

// ==================== 群组路由 ====================

// 获取群组列表
router.get('/groups', GroupController.getGroups);

// 获取群组详情
router.get('/groups/:id', GroupController.getGroup);

// 创建群组
router.post('/groups', GroupController.createGroup);

// 更新群组
router.put('/groups/:id', GroupController.updateGroup);

// 删除群组
router.delete('/groups/:id', GroupController.deleteGroup);

// 添加群成员
router.post('/groups/:id/members', GroupController.addMembers);

// 移除群成员
router.delete('/groups/:id/members', GroupController.removeMembers);

// 更新成员角色
router.put('/groups/:id/members/:memberId/role', GroupController.updateMemberRole);

// 获取群组消息
router.get('/groups/:id/messages', GroupController.getGroupMessages);

// 发送群组消息
router.post('/groups/:id/messages', GroupController.sendMessage);

// 同步企业微信群组
router.post('/groups/sync-from-wework', GroupController.syncFromWework);

// ==================== 机器人路由 ====================

// 获取机器人列表
router.get('/bots', BotController.getBots);

// 获取机器人详情
router.get('/bots/:id', BotController.getBot);

// 创建机器人
router.post('/bots', BotController.createBot);

// 更新机器人
router.put('/bots/:id', BotController.updateBot);

// 删除机器人
router.delete('/bots/:id', BotController.deleteBot);

// 发送消息
router.post('/bots/:id/send', BotController.sendMessage);

// 测试机器人连接
router.post('/bots/:id/test', BotController.testBot);

// 获取机器人统计信息
router.get('/bots/:id/stats', BotController.getBotStats);

// 重置机器人Webhook密钥
router.post('/bots/:id/reset-key', BotController.resetWebhookKey);

// 启用/禁用机器人
router.patch('/bots/:id/toggle', BotController.toggleBot);

// ==================== Webhook路由 ====================

// 企业微信回调接口
router.post('/webhook/wework', (req, res) => {
  // 这里处理企业微信的回调消息
  // 实际实现需要根据企业微信的回调格式来处理
  try {
    const { msgtype, content, from, to, chatid } = req.body;
    
    console.log('收到企业微信回调:', {
      msgtype,
      content,
      from,
      to,
      chatid,
      timestamp: new Date().toISOString()
    });
    
    // 这里可以添加消息处理逻辑
    // 比如自动回复、关键词触发、命令处理等
    
    res.json({
      success: true,
      message: '回调处理成功'
    });
  } catch (error) {
    console.error('处理企业微信回调失败:', error);
    res.status(500).json({
      success: false,
      message: '回调处理失败',
      error: error.message
    });
  }
});

// 机器人Webhook接口
router.post('/webhook/bot/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const webhookData = req.body;
    
    console.log(`收到机器人 ${botId} 的Webhook:`, {
      botId,
      data: webhookData,
      timestamp: new Date().toISOString()
    });
    
    // 这里可以添加机器人Webhook处理逻辑
    // 比如处理外部系统的消息推送
    
    res.json({
      success: true,
      message: 'Webhook处理成功'
    });
  } catch (error) {
    console.error('处理机器人Webhook失败:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook处理失败',
      error: error.message
    });
  }
});

// ==================== 统计路由 ====================

// 获取服务统计信息
router.get('/stats', async (req, res) => {
  try {
    const { Contact, Group, Bot, Message } = require('../models');
    
    const stats = {
      contacts: {
        total: await Contact.count(),
        active: await Contact.count({ where: { status: 'active' } }),
        enabled: await Contact.count({ where: { is_enabled: true } })
      },
      groups: {
        total: await Group.count(),
        active: await Group.count({ where: { status: 'active' } }),
        enabled: await Group.count({ where: { is_enabled: true } })
      },
      bots: {
        total: await Bot.count(),
        active: await Bot.count({ where: { status: 'active' } }),
        enabled: await Bot.count({ where: { is_enabled: true } })
      },
      messages: {
        total: await Message.count(),
        today: await Message.count({
          where: {
            created_at: {
              [require('sequelize').Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        from_bot: await Message.count({ where: { is_from_bot: true } })
      }
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

// ==================== 错误处理 ====================

// 404处理
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    code: 404,
    message: '接口不存在',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
router.use((error, req, res, next) => {
  console.error('路由错误:', error);
  
  res.status(error.status || 500).json({
    success: false,
    code: error.status || 500,
    message: error.message || '服务器内部错误',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = router;