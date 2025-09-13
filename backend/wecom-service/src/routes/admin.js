const express = require('express');
const router = express.Router();
const { User, Department, Message, Application } = require('../models');
const logger = require('../utils/logger');
const wecomService = require('../services/wecomService');
const contactsService = require('../services/contactsService');

// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
  // 这里应该实现真正的管理员权限验证
  // 暂时跳过验证
  next();
};

// 获取系统信息
router.get('/system/info', requireAdmin, async (req, res) => {
  try {
    const systemInfo = {
      version: '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV || 'development'
    };
    
    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    logger.error('获取系统信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统信息失败',
      error: error.message
    });
  }
});

// 获取配置信息
router.get('/config', requireAdmin, async (req, res) => {
  try {
    const config = {
      wecom: {
        corpId: process.env.WECOM_CORP_ID ? '已配置' : '未配置',
        agentId: process.env.WECOM_AGENT_ID ? '已配置' : '未配置',
        secret: process.env.WECOM_SECRET ? '已配置' : '未配置'
      },
      redis: {
        enabled: process.env.REDIS_URL ? true : false,
        url: process.env.REDIS_URL ? '已配置' : '未配置'
      },
      database: {
        type: process.env.DB_DIALECT || 'sqlite',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'wecom.db'
      }
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('获取配置信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置信息失败',
      error: error.message
    });
  }
});

// 手动同步通讯录
router.post('/sync/contacts', requireAdmin, async (req, res) => {
  try {
    logger.info('开始手动同步通讯录');
    
    // 同步部门
    await contactsService.syncDepartments();
    
    // 同步用户
    await contactsService.syncUsers();
    
    res.json({
      success: true,
      message: '通讯录同步完成'
    });
  } catch (error) {
    logger.error('手动同步通讯录失败:', error);
    res.status(500).json({
      success: false,
      message: '同步通讯录失败',
      error: error.message
    });
  }
});

// 清理数据
router.post('/cleanup', requireAdmin, async (req, res) => {
  try {
    const { type } = req.body;
    
    switch (type) {
      case 'messages':
        await Message.destroy({ where: {} });
        logger.info('已清理所有消息数据');
        break;
      case 'users':
        await User.destroy({ where: {} });
        logger.info('已清理所有用户数据');
        break;
      case 'departments':
        await Department.destroy({ where: {} });
        logger.info('已清理所有部门数据');
        break;
      case 'all':
        await Message.destroy({ where: {} });
        await User.destroy({ where: {} });
        await Department.destroy({ where: {} });
        await Application.destroy({ where: {} });
        logger.info('已清理所有数据');
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '无效的清理类型'
        });
    }
    
    res.json({
      success: true,
      message: `${type} 数据清理完成`
    });
  } catch (error) {
    logger.error('数据清理失败:', error);
    res.status(500).json({
      success: false,
      message: '数据清理失败',
      error: error.message
    });
  }
});

// 测试企业微信连接
router.post('/test/wecom', requireAdmin, async (req, res) => {
  try {
    // 测试获取access_token
    const token = await wecomService.getAccessToken();
    
    if (token) {
      res.json({
        success: true,
        message: '企业微信连接测试成功',
        data: {
          tokenLength: token.length,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '企业微信连接测试失败'
      });
    }
  } catch (error) {
    logger.error('企业微信连接测试失败:', error);
    res.status(500).json({
      success: false,
      message: '企业微信连接测试失败',
      error: error.message
    });
  }
});

// 获取日志
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const { level = 'info', limit = 100 } = req.query;
    
    // 这里应该实现真正的日志查询逻辑
    // 暂时返回模拟数据
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: '系统启动成功',
        service: 'wecom-service'
      }
    ];
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    logger.error('获取日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取日志失败',
      error: error.message
    });
  }
});

// 重启服务
router.post('/restart', requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      message: '重启命令已发送'
    });
    
    // 延迟重启，让响应先返回
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    logger.error('重启服务失败:', error);
    res.status(500).json({
      success: false,
      message: '重启服务失败',
      error: error.message
    });
  }
});

module.exports = router;