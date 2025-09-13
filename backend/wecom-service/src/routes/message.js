const express = require('express');
const router = express.Router();
const { Message } = require('../models');
const logger = require('../utils/logger');

// 获取消息列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    
    const messages = await Message.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        messages: messages.rows,
        total: messages.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('获取消息列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取消息列表失败',
      error: error.message
    });
  }
});

// 获取消息详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByPk(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }
    
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error('获取消息详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取消息详情失败',
      error: error.message
    });
  }
});

// 发送消息
router.post('/', async (req, res) => {
  try {
    const messageData = req.body;
    const message = await Message.create(messageData);
    
    res.status(201).json({
      success: true,
      data: message,
      message: '消息发送成功'
    });
  } catch (error) {
    logger.error('发送消息失败:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败',
      error: error.message
    });
  }
});

// 更新消息状态
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }
    
    await message.update({ status });
    
    res.json({
      success: true,
      data: message,
      message: '消息状态更新成功'
    });
  } catch (error) {
    logger.error('更新消息状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新消息状态失败',
      error: error.message
    });
  }
});

// 删除消息
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByPk(id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }
    
    await message.destroy();
    
    res.json({
      success: true,
      message: '消息删除成功'
    });
  } catch (error) {
    logger.error('删除消息失败:', error);
    res.status(500).json({
      success: false,
      message: '删除消息失败',
      error: error.message
    });
  }
});

module.exports = router;