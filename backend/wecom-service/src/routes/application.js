const express = require('express');
const router = express.Router();
const { Application } = require('../models');
const logger = require('../utils/logger');

// 获取应用列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    
    const applications = await Application.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        applications: applications.rows,
        total: applications.count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('获取应用列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取应用列表失败',
      error: error.message
    });
  }
});

// 获取应用详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findByPk(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: '应用不存在'
      });
    }
    
    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    logger.error('获取应用详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取应用详情失败',
      error: error.message
    });
  }
});

// 创建应用
router.post('/', async (req, res) => {
  try {
    const applicationData = req.body;
    const application = await Application.create(applicationData);
    
    res.status(201).json({
      success: true,
      data: application,
      message: '应用创建成功'
    });
  } catch (error) {
    logger.error('创建应用失败:', error);
    res.status(500).json({
      success: false,
      message: '创建应用失败',
      error: error.message
    });
  }
});

// 更新应用
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: '应用不存在'
      });
    }
    
    await application.update(updateData);
    
    res.json({
      success: true,
      data: application,
      message: '应用更新成功'
    });
  } catch (error) {
    logger.error('更新应用失败:', error);
    res.status(500).json({
      success: false,
      message: '更新应用失败',
      error: error.message
    });
  }
});

// 删除应用
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findByPk(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: '应用不存在'
      });
    }
    
    await application.destroy();
    
    res.json({
      success: true,
      message: '应用删除成功'
    });
  } catch (error) {
    logger.error('删除应用失败:', error);
    res.status(500).json({
      success: false,
      message: '删除应用失败',
      error: error.message
    });
  }
});

// 启用/禁用应用
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: '应用不存在'
      });
    }
    
    await application.update({ status });
    
    res.json({
      success: true,
      data: application,
      message: '应用状态更新成功'
    });
  } catch (error) {
    logger.error('更新应用状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新应用状态失败',
      error: error.message
    });
  }
});

module.exports = router;