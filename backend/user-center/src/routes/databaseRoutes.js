/**
 * 数据库管理路由
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requireAuth, requireRole } = require('../middleware/auth');
const DatabaseController = require('../controllers/DatabaseController');

// 数据库操作限流（更严格的限制）
const databaseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10, // 每15分钟最多10次数据库操作
  message: {
    success: false,
    message: 'Too many database operations, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 备份操作限流（更严格）
const backupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 每小时最多3次备份操作
  message: {
    success: false,
    message: 'Too many backup operations, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 所有数据库管理路由都需要认证和管理员权限
router.use(requireAuth);
router.use(requireRole('admin'));

// ==================== MySQL管理路由 ====================

/**
 * 获取MySQL连接状态
 * GET /database/mysql/status
 */
router.get('/mysql/status', DatabaseController.getMysqlStatus);

/**
 * 获取MySQL数据库表列表
 * GET /database/mysql/tables
 */
router.get('/mysql/tables', DatabaseController.getMysqlTables);

/**
 * 获取指定表的数据
 * GET /database/mysql/table/data
 */
router.get('/mysql/table/data', DatabaseController.getMysqlTableData);

/**
 * 删除指定表
 * DELETE /database/mysql/table
 */
router.delete('/mysql/table', databaseLimiter, DatabaseController.deleteMysqlTable);

/**
 * 清空指定表数据
 * POST /database/mysql/table/clear
 */
router.post('/mysql/table/clear', databaseLimiter, DatabaseController.clearMysqlTable);

/**
 * 备份MySQL数据库
 * POST /database/mysql/backup
 */
router.post('/mysql/backup', backupLimiter, DatabaseController.backupMysqlDatabase);

/**
 * 恢复MySQL数据库
 * POST /database/mysql/restore
 */
router.post('/mysql/restore', backupLimiter, DatabaseController.restoreMysqlDatabase);

/**
 * 获取MySQL备份文件列表
 * GET /database/mysql/backups
 */
router.get('/mysql/backups', DatabaseController.getMysqlBackupList);

/**
 * 删除MySQL备份文件
 * DELETE /database/mysql/backup
 */
router.delete('/mysql/backup', DatabaseController.deleteMysqlBackup);

/**
 * 创建MySQL定时任务
 * POST /database/mysql/schedule
 */
router.post('/mysql/schedule', DatabaseController.createMysqlScheduleTask);

/**
 * 获取MySQL定时任务列表
 * GET /database/mysql/schedule
 */
router.get('/mysql/schedule', DatabaseController.getMysqlScheduleTasks);

/**
 * 更新MySQL定时任务
 * PUT /database/mysql/schedule/:taskId
 */
router.put('/mysql/schedule/:taskId', DatabaseController.updateMysqlScheduleTask);

/**
 * 删除MySQL定时任务
 * DELETE /database/mysql/schedule/:taskId
 */
router.delete('/mysql/schedule/:taskId', DatabaseController.deleteMysqlScheduleTask);

// ==================== Redis管理路由 ====================

/**
 * 获取Redis连接状态
 * GET /database/redis/status
 */
router.get('/redis/status', DatabaseController.getRedisStatus);

/**
 * 获取Redis键列表
 * GET /database/redis/keys
 */
router.get('/redis/keys', DatabaseController.getRedisKeys);

/**
 * 获取Redis键值
 * GET /database/redis/value
 */
router.get('/redis/value', DatabaseController.getRedisValue);

/**
 * 设置Redis键值
 * POST /database/redis/value
 */
router.post('/redis/value', DatabaseController.setRedisValue);

/**
 * 删除Redis键
 * DELETE /database/redis/key
 */
router.delete('/redis/key', databaseLimiter, DatabaseController.deleteRedisKey);

/**
 * 清空Redis数据库
 * POST /database/redis/clear
 */
router.post('/redis/clear', databaseLimiter, DatabaseController.clearRedisDatabase);

/**
 * 备份Redis数据库
 * POST /database/redis/backup
 */
router.post('/redis/backup', backupLimiter, DatabaseController.backupRedisDatabase);

/**
 * 获取Redis备份文件列表
 * GET /database/redis/backups
 */
router.get('/redis/backups', DatabaseController.getRedisBackupList);

/**
 * 恢复Redis数据库
 * POST /database/redis/restore
 */
router.post('/redis/restore', backupLimiter, DatabaseController.restoreRedisDatabase);

/**
 * 删除Redis备份文件
 * DELETE /database/redis/backup
 */
router.delete('/redis/backup', DatabaseController.deleteRedisBackup);

/**
 * 创建Redis定时任务
 * POST /database/redis/schedule
 */
router.post('/redis/schedule', DatabaseController.createRedisScheduleTask);

/**
 * 获取Redis定时任务列表
 * GET /database/redis/schedule
 */
router.get('/redis/schedule', DatabaseController.getRedisScheduleTasks);

/**
 * 更新Redis定时任务
 * PUT /database/redis/schedule/:taskId
 */
router.put('/redis/schedule/:taskId', DatabaseController.updateRedisScheduleTask);

/**
 * 删除Redis定时任务
 * DELETE /database/redis/schedule/:taskId
 */
router.delete('/redis/schedule/:taskId', DatabaseController.deleteRedisScheduleTask);

/**
 * 获取Redis信息
 * GET /database/redis/info
 */
router.get('/redis/info', DatabaseController.getRedisInfo);

module.exports = router;