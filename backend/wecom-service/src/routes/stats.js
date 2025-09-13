const express = require('express');
const router = express.Router();
const { User, Department, Message, Application } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// 获取统计概览
router.get('/overview', async (req, res) => {
  try {
    // 统计用户数量
    const userCount = await User.count();
    const activeUserCount = await User.count({
      where: { status: 1 }
    });
    
    // 统计部门数量
    const departmentCount = await Department.count();
    
    // 统计消息数量
    const messageCount = await Message.count();
    const todayMessageCount = await Message.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    
    // 统计应用数量
    const applicationCount = await Application.count();
    const activeApplicationCount = await Application.count({
      where: { status: 'active' }
    });
    
    res.json({
      success: true,
      data: {
        users: {
          total: userCount,
          active: activeUserCount
        },
        departments: {
          total: departmentCount
        },
        messages: {
          total: messageCount,
          today: todayMessageCount
        },
        applications: {
          total: applicationCount,
          active: activeApplicationCount
        }
      }
    });
  } catch (error) {
    logger.error('获取统计概览失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计概览失败',
      error: error.message
    });
  }
});

// 获取用户统计
router.get('/users', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    switch (period) {
      case '1d':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // 按部门统计用户数量
    const usersByDepartment = await User.findAll({
      attributes: [
        'department',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['department'],
      raw: true
    });
    
    // 按状态统计用户数量
    const usersByStatus = await User.findAll({
      attributes: [
        'status',
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // 新增用户趋势
    const newUsersTrend = await User.findAll({
      attributes: [
        [User.sequelize.fn('DATE', User.sequelize.col('createdAt')), 'date'],
        [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: [User.sequelize.fn('DATE', User.sequelize.col('createdAt'))],
      order: [[User.sequelize.fn('DATE', User.sequelize.col('createdAt')), 'ASC']],
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        byDepartment: usersByDepartment,
        byStatus: usersByStatus,
        newUsersTrend
      }
    });
  } catch (error) {
    logger.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计失败',
      error: error.message
    });
  }
});

// 获取消息统计
router.get('/messages', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    switch (period) {
      case '1d':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // 按类型统计消息数量
    const messagesByType = await Message.findAll({
      attributes: [
        'type',
        [Message.sequelize.fn('COUNT', Message.sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });
    
    // 按状态统计消息数量
    const messagesByStatus = await Message.findAll({
      attributes: [
        'status',
        [Message.sequelize.fn('COUNT', Message.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // 消息发送趋势
    const messagesTrend = await Message.findAll({
      attributes: [
        [Message.sequelize.fn('DATE', Message.sequelize.col('createdAt')), 'date'],
        [Message.sequelize.fn('COUNT', Message.sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      group: [Message.sequelize.fn('DATE', Message.sequelize.col('createdAt'))],
      order: [[Message.sequelize.fn('DATE', Message.sequelize.col('createdAt')), 'ASC']],
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        byType: messagesByType,
        byStatus: messagesByStatus,
        messagesTrend
      }
    });
  } catch (error) {
    logger.error('获取消息统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取消息统计失败',
      error: error.message
    });
  }
});

// 获取部门统计
router.get('/departments', async (req, res) => {
  try {
    // 部门用户数量统计
    const departmentUserCounts = await Department.findAll({
      attributes: [
        'id',
        'name',
        [Department.sequelize.literal('(SELECT COUNT(*) FROM Users WHERE Users.department = Department.id)'), 'userCount']
      ],
      raw: true
    });
    
    // 部门层级统计
    const departmentLevels = await Department.findAll({
      attributes: [
        [Department.sequelize.fn('COUNT', Department.sequelize.col('id')), 'count'],
        'parentid'
      ],
      group: ['parentid'],
      raw: true
    });
    
    res.json({
      success: true,
      data: {
        userCounts: departmentUserCounts,
        levels: departmentLevels
      }
    });
  } catch (error) {
    logger.error('获取部门统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取部门统计失败',
      error: error.message
    });
  }
});

module.exports = router;