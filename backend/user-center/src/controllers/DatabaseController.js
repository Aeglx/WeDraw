/**
 * 数据库管理控制器
 */

const { sequelize } = require('../config/database');
const { redisClient: redis } = require('../config/redis');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const logger = require('../utils/logger');
const cron = require('node-cron');

// 存储定时任务的Map
const scheduledTasks = new Map();

// 备份文件存储目录
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// 确保备份目录存在
const ensureBackupDir = async () => {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
};

class DatabaseController {
  // ==================== MySQL管理方法 ====================

  /**
   * 获取MySQL连接状态
   */
  static async getMysqlStatus(req, res) {
    try {
      await sequelize.authenticate();
      
      // 获取数据库基本信息
      const [results] = await sequelize.query('SELECT VERSION() as version');
      const version = results[0]?.version;
      
      // 获取连接数信息
      const [connectionInfo] = await sequelize.query('SHOW STATUS LIKE "Threads_connected"');
      const connections = connectionInfo[0]?.Value;
      
      // 获取数据库大小
      const [sizeInfo] = await sequelize.query(`
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `);
      const sizeInMB = sizeInfo[0]?.size_mb || 0;
      
      res.json({
        success: true,
        data: {
          status: 'connected',
          version,
          connections: parseInt(connections) || 0,
          database: sequelize.config.database,
          host: sequelize.config.host,
          port: sequelize.config.port,
          sizeInMB: parseFloat(sizeInMB),
          uptime: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('MySQL status check failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get MySQL status',
        error: error.message
      });
    }
  }

  /**
   * 获取MySQL数据库表列表
   */
  static async getMysqlTables(req, res) {
    try {
      const [tables] = await sequelize.query(`
        SELECT 
          table_name as name,
          table_rows as rows,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb,
          table_comment as comment,
          create_time as created_at
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        ORDER BY table_name
      `);
      
      res.json({
        success: true,
        data: tables
      });
    } catch (error) {
      logger.error('Failed to get MySQL tables:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get table list',
        error: error.message
      });
    }
  }

  /**
   * 获取指定表的数据
   */
  static async getMysqlTableData(req, res) {
    try {
      const { tableName, page = 1, size = 10 } = req.query;
      
      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: 'Table name is required'
        });
      }
      
      const offset = (page - 1) * size;
      
      // 获取表结构
      const [columns] = await sequelize.query(`DESCRIBE \`${tableName}\``);
      
      // 获取总记录数
      const [countResult] = await sequelize.query(`SELECT COUNT(*) as total FROM \`${tableName}\``);
      const total = countResult[0].total;
      
      // 获取数据
      const [rows] = await sequelize.query(`SELECT * FROM \`${tableName}\` LIMIT ${size} OFFSET ${offset}`);
      
      res.json({
        success: true,
        data: {
          columns,
          rows,
          pagination: {
            page: parseInt(page),
            size: parseInt(size),
            total: parseInt(total),
            pages: Math.ceil(total / size)
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get table data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get table data',
        error: error.message
      });
    }
  }

  /**
   * 删除指定表
   */
  static async deleteMysqlTable(req, res) {
    try {
      const { tableName } = req.query;
      
      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: 'Table name is required'
        });
      }
      
      await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      
      logger.info(`Table ${tableName} deleted by user ${req.user.id}`);
      
      res.json({
        success: true,
        message: `Table ${tableName} deleted successfully`
      });
    } catch (error) {
      logger.error('Failed to delete table:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete table',
        error: error.message
      });
    }
  }

  /**
   * 清空指定表数据
   */
  static async clearMysqlTable(req, res) {
    try {
      const { tableName } = req.body;
      
      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: 'Table name is required'
        });
      }
      
      await sequelize.query(`TRUNCATE TABLE \`${tableName}\``);
      
      logger.info(`Table ${tableName} cleared by user ${req.user.id}`);
      
      res.json({
        success: true,
        message: `Table ${tableName} cleared successfully`
      });
    } catch (error) {
      logger.error('Failed to clear table:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear table',
        error: error.message
      });
    }
  }

  /**
   * 备份MySQL数据库
   */
  static async backupMysqlDatabase(req, res) {
    try {
      await ensureBackupDir();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `mysql_backup_${timestamp}.sql`;
      const backupPath = path.join(BACKUP_DIR, backupFileName);
      
      const { host, port, database, username, password } = sequelize.config;
      
      // 使用mysqldump命令备份
      const command = `mysqldump -h ${host} -P ${port} -u ${username} ${password ? `-p${password}` : ''} ${database} > "${backupPath}"`;
      
      await execAsync(command);
      
      logger.info(`MySQL database backed up by user ${req.user.id}: ${backupFileName}`);
      
      res.json({
        success: true,
        message: 'Database backup completed successfully',
        data: {
          fileName: backupFileName,
          filePath: backupPath,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to backup MySQL database:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to backup database',
        error: error.message
      });
    }
  }

  /**
   * 恢复MySQL数据库
   */
  static async restoreMysqlDatabase(req, res) {
    try {
      const { backupFile } = req.body;
      
      if (!backupFile) {
        return res.status(400).json({
          success: false,
          message: 'Backup file name is required'
        });
      }
      
      const backupPath = path.join(BACKUP_DIR, backupFile);
      
      // 检查备份文件是否存在
      try {
        await fs.access(backupPath);
      } catch {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found'
        });
      }
      
      const { host, port, database, username, password } = sequelize.config;
      
      // 使用mysql命令恢复
      const command = `mysql -h ${host} -P ${port} -u ${username} ${password ? `-p${password}` : ''} ${database} < "${backupPath}"`;
      
      await execAsync(command);
      
      logger.info(`MySQL database restored by user ${req.user.id}: ${backupFile}`);
      
      res.json({
        success: true,
        message: 'Database restored successfully'
      });
    } catch (error) {
      logger.error('Failed to restore MySQL database:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore database',
        error: error.message
      });
    }
  }

  /**
   * 获取MySQL备份文件列表
   */
  static async getMysqlBackupList(req, res) {
    try {
      await ensureBackupDir();
      
      const files = await fs.readdir(BACKUP_DIR);
      const mysqlBackups = files.filter(file => file.startsWith('mysql_backup_') && file.endsWith('.sql'));
      
      const backupList = await Promise.all(
        mysqlBackups.map(async (file) => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = await fs.stat(filePath);
          
          return {
            fileName: file,
            size: stats.size,
            sizeInMB: (stats.size / 1024 / 1024).toFixed(2),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          };
        })
      );
      
      // 按创建时间倒序排列
      backupList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      res.json({
        success: true,
        data: backupList
      });
    } catch (error) {
      logger.error('Failed to get MySQL backup list:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get backup list',
        error: error.message
      });
    }
  }

  /**
   * 删除MySQL备份文件
   */
  static async deleteMysqlBackup(req, res) {
    try {
      const { backupFile } = req.query;
      
      if (!backupFile) {
        return res.status(400).json({
          success: false,
          message: 'Backup file name is required'
        });
      }
      
      const backupPath = path.join(BACKUP_DIR, backupFile);
      
      // 检查文件是否存在
      try {
        await fs.access(backupPath);
      } catch {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found'
        });
      }
      
      await fs.unlink(backupPath);
      
      logger.info(`MySQL backup file deleted by user ${req.user.id}: ${backupFile}`);
      
      res.json({
        success: true,
        message: 'Backup file deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete MySQL backup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete backup file',
        error: error.message
      });
    }
  }

  // ==================== MySQL定时任务管理 ====================

  /**
   * 创建MySQL定时任务
   */
  static async createMysqlScheduleTask(req, res) {
    try {
      const { name, type, schedule, enabled = true } = req.body;
      
      if (!name || !type || !schedule) {
        return res.status(400).json({
          success: false,
          message: 'Name, type and schedule are required'
        });
      }
      
      // 验证cron表达式
      if (!cron.validate(schedule)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cron schedule format'
        });
      }
      
      const taskId = `mysql_${Date.now()}`;
      const taskData = {
        id: taskId,
        name,
        type,
        schedule,
        enabled,
        createdAt: new Date().toISOString(),
        createdBy: req.user.id
      };
      
      // 如果启用，则创建定时任务
      if (enabled) {
        const task = cron.schedule(schedule, async () => {
          try {
            if (type === 'backup') {
              await DatabaseController.performMysqlBackup();
            }
            logger.info(`MySQL scheduled task executed: ${name}`);
          } catch (error) {
            logger.error(`MySQL scheduled task failed: ${name}`, error);
          }
        }, {
          scheduled: false
        });
        
        task.start();
        scheduledTasks.set(taskId, { task, data: taskData });
      }
      
      res.json({
        success: true,
        message: 'Scheduled task created successfully',
        data: taskData
      });
    } catch (error) {
      logger.error('Failed to create MySQL scheduled task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create scheduled task',
        error: error.message
      });
    }
  }

  /**
   * 获取MySQL定时任务列表
   */
  static async getMysqlScheduleTasks(req, res) {
    try {
      const tasks = Array.from(scheduledTasks.entries())
        .filter(([id]) => id.startsWith('mysql_'))
        .map(([id, { data }]) => data);
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      logger.error('Failed to get MySQL scheduled tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduled tasks',
        error: error.message
      });
    }
  }

  /**
   * 更新MySQL定时任务
   */
  static async updateMysqlScheduleTask(req, res) {
    try {
      const { taskId } = req.params;
      const { name, type, schedule, enabled } = req.body;
      
      if (!scheduledTasks.has(taskId)) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled task not found'
        });
      }
      
      const { task, data } = scheduledTasks.get(taskId);
      
      // 停止旧任务
      if (task) {
        task.stop();
      }
      
      // 更新任务数据
      const updatedData = {
        ...data,
        name: name || data.name,
        type: type || data.type,
        schedule: schedule || data.schedule,
        enabled: enabled !== undefined ? enabled : data.enabled,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.id
      };
      
      // 如果启用，创建新任务
      let newTask = null;
      if (updatedData.enabled) {
        if (schedule && !cron.validate(schedule)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid cron schedule format'
          });
        }
        
        newTask = cron.schedule(updatedData.schedule, async () => {
          try {
            if (updatedData.type === 'backup') {
              await DatabaseController.performMysqlBackup();
            }
            logger.info(`MySQL scheduled task executed: ${updatedData.name}`);
          } catch (error) {
            logger.error(`MySQL scheduled task failed: ${updatedData.name}`, error);
          }
        }, {
          scheduled: false
        });
        
        newTask.start();
      }
      
      scheduledTasks.set(taskId, { task: newTask, data: updatedData });
      
      res.json({
        success: true,
        message: 'Scheduled task updated successfully',
        data: updatedData
      });
    } catch (error) {
      logger.error('Failed to update MySQL scheduled task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scheduled task',
        error: error.message
      });
    }
  }

  /**
   * 删除MySQL定时任务
   */
  static async deleteMysqlScheduleTask(req, res) {
    try {
      const { taskId } = req.params;
      
      if (!scheduledTasks.has(taskId)) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled task not found'
        });
      }
      
      const { task } = scheduledTasks.get(taskId);
      
      // 停止并删除任务
      if (task) {
        task.stop();
      }
      
      scheduledTasks.delete(taskId);
      
      logger.info(`MySQL scheduled task deleted by user ${req.user.id}: ${taskId}`);
      
      res.json({
        success: true,
        message: 'Scheduled task deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete MySQL scheduled task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete scheduled task',
        error: error.message
      });
    }
  }

  /**
   * 执行MySQL备份（内部方法）
   */
  static async performMysqlBackup() {
    await ensureBackupDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `mysql_auto_backup_${timestamp}.sql`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    const { host, port, database, username, password } = sequelize.config;
    
    const command = `mysqldump -h ${host} -P ${port} -u ${username} ${password ? `-p${password}` : ''} ${database} > "${backupPath}"`;
    
    await execAsync(command);
    
    logger.info(`MySQL auto backup completed: ${backupFileName}`);
    
    return backupFileName;
  }

  // ==================== Redis管理方法 ====================

  /**
   * 获取Redis连接状态
   */
  static async getRedisStatus(req, res) {
    try {
      const info = await redis.client.info();
      const lines = info.split('\r\n');
      const serverInfo = {};
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          serverInfo[key] = value;
        }
      });
      
      res.json({
        success: true,
        data: {
          status: redis.isConnected ? 'connected' : 'disconnected',
          version: serverInfo.redis_version,
          mode: serverInfo.redis_mode,
          uptime: serverInfo.uptime_in_seconds,
          connectedClients: serverInfo.connected_clients,
          usedMemory: serverInfo.used_memory_human,
          totalKeys: await redis.client.dbSize(),
          host: redis.client.options?.socket?.host || 'localhost',
          port: redis.client.options?.socket?.port || 6379,
          db: redis.client.options?.database || 0
        }
      });
    } catch (error) {
      logger.error('Redis status check failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Redis status',
        error: error.message
      });
    }
  }

  /**
   * 获取Redis键列表
   */
  static async getRedisKeys(req, res) {
    try {
      const { pattern = '*', page = 1, size = 10 } = req.query;
      
      const keys = await redis.client.keys(pattern);
      const total = keys.length;
      const startIndex = (page - 1) * size;
      const endIndex = startIndex + parseInt(size);
      const paginatedKeys = keys.slice(startIndex, endIndex);
      
      // 获取键的详细信息
      const keyDetails = await Promise.all(
        paginatedKeys.map(async (key) => {
          const type = await redis.client.type(key);
          const ttl = await redis.client.ttl(key);
          
          return {
            key,
            type,
            ttl: ttl === -1 ? 'never' : ttl,
            size: await redis.client.memoryUsage(key) || 0
          };
        })
      );
      
      res.json({
        success: true,
        data: {
          keys: keyDetails,
          pagination: {
            page: parseInt(page),
            size: parseInt(size),
            total,
            pages: Math.ceil(total / size)
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get Redis keys:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Redis keys',
        error: error.message
      });
    }
  }

  /**
   * 获取Redis键值
   */
  static async getRedisValue(req, res) {
    try {
      const { key } = req.query;
      
      if (!key) {
        return res.status(400).json({
          success: false,
          message: 'Key is required'
        });
      }
      
      const exists = await redis.client.exists(key);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Key not found'
        });
      }
      
      const type = await redis.client.type(key);
      const ttl = await redis.client.ttl(key);
      let value;
      
      switch (type) {
        case 'string':
          value = await redis.client.get(key);
          break;
        case 'hash':
          value = await redis.client.hGetAll(key);
          break;
        case 'list':
          value = await redis.client.lRange(key, 0, -1);
          break;
        case 'set':
          value = await redis.client.sMembers(key);
          break;
        case 'zset':
          value = await redis.client.zRangeWithScores(key, 0, -1);
          break;
        default:
          value = 'Unsupported type';
      }
      
      res.json({
        success: true,
        data: {
          key,
          type,
          value,
          ttl: ttl === -1 ? 'never' : ttl
        }
      });
    } catch (error) {
      logger.error('Failed to get Redis value:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Redis value',
        error: error.message
      });
    }
  }

  /**
   * 设置Redis键值
   */
  static async setRedisValue(req, res) {
    try {
      const { key, value, ttl } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Key and value are required'
        });
      }
      
      if (ttl && ttl > 0) {
        await redis.client.setEx(key, ttl, value);
      } else {
        await redis.client.set(key, value);
      }
      
      logger.info(`Redis key set by user ${req.user.id}: ${key}`);
      
      res.json({
        success: true,
        message: 'Key set successfully'
      });
    } catch (error) {
      logger.error('Failed to set Redis value:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set Redis value',
        error: error.message
      });
    }
  }

  /**
   * 删除Redis键
   */
  static async deleteRedisKey(req, res) {
    try {
      const { key } = req.query;
      
      if (!key) {
        return res.status(400).json({
          success: false,
          message: 'Key is required'
        });
      }
      
      const deleted = await redis.client.del(key);
      
      if (deleted === 0) {
        return res.status(404).json({
          success: false,
          message: 'Key not found'
        });
      }
      
      logger.info(`Redis key deleted by user ${req.user.id}: ${key}`);
      
      res.json({
        success: true,
        message: 'Key deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete Redis key:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete Redis key',
        error: error.message
      });
    }
  }

  /**
   * 清空Redis数据库
   */
  static async clearRedisDatabase(req, res) {
    try {
      await redis.client.flushDb();
      
      logger.info(`Redis database cleared by user ${req.user.id}`);
      
      res.json({
        success: true,
        message: 'Redis database cleared successfully'
      });
    } catch (error) {
      logger.error('Failed to clear Redis database:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear Redis database',
        error: error.message
      });
    }
  }

  /**
   * 备份Redis数据库
   */
  static async backupRedisDatabase(req, res) {
    try {
      await ensureBackupDir();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `redis_backup_${timestamp}.rdb`;
      const backupPath = path.join(BACKUP_DIR, backupFileName);
      
      // 执行BGSAVE命令
      await redis.client.bgSave();
      
      // 等待备份完成
      let saving = true;
      while (saving) {
        const info = await redis.client.info('persistence');
        saving = info.includes('rdb_bgsave_in_progress:1');
        if (saving) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // 复制RDB文件到备份目录
      const redisDataDir = '/var/lib/redis'; // 默认Redis数据目录
      const rdbPath = path.join(redisDataDir, 'dump.rdb');
      
      try {
        await execAsync(`cp "${rdbPath}" "${backupPath}"`);
      } catch {
        // 如果复制失败，创建一个包含所有键值的JSON备份
        const keys = await redis.client.keys('*');
        const backup = {};
        
        for (const key of keys) {
          const type = await redis.client.type(key);
          const ttl = await redis.client.ttl(key);
          
          let value;
          switch (type) {
            case 'string':
              value = await redis.client.get(key);
              break;
            case 'hash':
              value = await redis.client.hGetAll(key);
              break;
            case 'list':
              value = await redis.client.lRange(key, 0, -1);
              break;
            case 'set':
              value = await redis.client.sMembers(key);
              break;
            case 'zset':
              value = await redis.client.zRangeWithScores(key, 0, -1);
              break;
          }
          
          backup[key] = {
            type,
            value,
            ttl: ttl === -1 ? null : ttl
          };
        }
        
        const jsonBackupPath = backupPath.replace('.rdb', '.json');
        await fs.writeFile(jsonBackupPath, JSON.stringify(backup, null, 2));
      }
      
      logger.info(`Redis database backed up by user ${req.user.id}: ${backupFileName}`);
      
      res.json({
        success: true,
        message: 'Redis backup completed successfully',
        data: {
          fileName: backupFileName,
          filePath: backupPath,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to backup Redis database:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to backup Redis database',
        error: error.message
      });
    }
  }

  /**
   * 获取Redis备份文件列表
   */
  static async getRedisBackupList(req, res) {
    try {
      await ensureBackupDir();
      
      const files = await fs.readdir(BACKUP_DIR);
      const redisBackups = files.filter(file => 
        (file.startsWith('redis_backup_') && (file.endsWith('.rdb') || file.endsWith('.json')))
      );
      
      const backupList = await Promise.all(
        redisBackups.map(async (file) => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = await fs.stat(filePath);
          
          return {
            fileName: file,
            size: stats.size,
            sizeInMB: (stats.size / 1024 / 1024).toFixed(2),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            type: file.endsWith('.rdb') ? 'rdb' : 'json'
          };
        })
      );
      
      // 按创建时间倒序排列
      backupList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      res.json({
        success: true,
        data: backupList
      });
    } catch (error) {
      logger.error('Failed to get Redis backup list:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get backup list',
        error: error.message
      });
    }
  }

  /**
   * 恢复Redis数据库
   */
  static async restoreRedisDatabase(req, res) {
    try {
      const { backupFile } = req.body;
      
      if (!backupFile) {
        return res.status(400).json({
          success: false,
          message: 'Backup file name is required'
        });
      }
      
      const backupPath = path.join(BACKUP_DIR, backupFile);
      
      // 检查备份文件是否存在
      try {
        await fs.access(backupPath);
      } catch {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found'
        });
      }
      
      if (backupFile.endsWith('.json')) {
        // JSON格式备份恢复
        const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
        
        // 清空当前数据库
        await redis.client.flushDb();
        
        // 恢复数据
        for (const [key, data] of Object.entries(backupData)) {
          const { type, value, ttl } = data;
          
          switch (type) {
            case 'string':
              if (ttl) {
                await redis.client.setEx(key, ttl, value);
              } else {
                await redis.client.set(key, value);
              }
              break;
            case 'hash':
              await redis.client.hSet(key, value);
              if (ttl) await redis.client.expire(key, ttl);
              break;
            case 'list':
              if (Array.isArray(value) && value.length > 0) {
                await redis.client.lPush(key, ...value.reverse());
                if (ttl) await redis.client.expire(key, ttl);
              }
              break;
            case 'set':
              if (Array.isArray(value) && value.length > 0) {
                await redis.client.sAdd(key, ...value);
                if (ttl) await redis.client.expire(key, ttl);
              }
              break;
            case 'zset':
              if (Array.isArray(value) && value.length > 0) {
                const args = [];
                for (let i = 0; i < value.length; i += 2) {
                  args.push({ score: value[i + 1], value: value[i] });
                }
                await redis.client.zAdd(key, args);
                if (ttl) await redis.client.expire(key, ttl);
              }
              break;
          }
        }
      } else {
        // RDB格式备份恢复（需要重启Redis服务）
        return res.status(501).json({
          success: false,
          message: 'RDB restore requires Redis service restart, please contact administrator'
        });
      }
      
      logger.info(`Redis database restored by user ${req.user.id}: ${backupFile}`);
      
      res.json({
        success: true,
        message: 'Redis database restored successfully'
      });
    } catch (error) {
      logger.error('Failed to restore Redis database:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore Redis database',
        error: error.message
      });
    }
  }

  /**
   * 删除Redis备份文件
   */
  static async deleteRedisBackup(req, res) {
    try {
      const { backupFile } = req.query;
      
      if (!backupFile) {
        return res.status(400).json({
          success: false,
          message: 'Backup file name is required'
        });
      }
      
      const backupPath = path.join(BACKUP_DIR, backupFile);
      
      // 检查文件是否存在
      try {
        await fs.access(backupPath);
      } catch {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found'
        });
      }
      
      await fs.unlink(backupPath);
      
      logger.info(`Redis backup file deleted by user ${req.user.id}: ${backupFile}`);
      
      res.json({
        success: true,
        message: 'Backup file deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete Redis backup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete backup file',
        error: error.message
      });
    }
  }

  // ==================== Redis定时任务管理 ====================

  /**
   * 创建Redis定时任务
   */
  static async createRedisScheduleTask(req, res) {
    try {
      const { name, type, schedule, enabled = true } = req.body;
      
      if (!name || !type || !schedule) {
        return res.status(400).json({
          success: false,
          message: 'Name, type and schedule are required'
        });
      }
      
      // 验证cron表达式
      if (!cron.validate(schedule)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cron schedule format'
        });
      }
      
      const taskId = `redis_${Date.now()}`;
      const taskData = {
        id: taskId,
        name,
        type,
        schedule,
        enabled,
        createdAt: new Date().toISOString(),
        createdBy: req.user.id
      };
      
      // 如果启用，则创建定时任务
      if (enabled) {
        const task = cron.schedule(schedule, async () => {
          try {
            if (type === 'backup') {
              await DatabaseController.performRedisBackup();
            }
            logger.info(`Redis scheduled task executed: ${name}`);
          } catch (error) {
            logger.error(`Redis scheduled task failed: ${name}`, error);
          }
        }, {
          scheduled: false
        });
        
        task.start();
        scheduledTasks.set(taskId, { task, data: taskData });
      }
      
      res.json({
        success: true,
        message: 'Scheduled task created successfully',
        data: taskData
      });
    } catch (error) {
      logger.error('Failed to create Redis scheduled task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create scheduled task',
        error: error.message
      });
    }
  }

  /**
   * 获取Redis定时任务列表
   */
  static async getRedisScheduleTasks(req, res) {
    try {
      const tasks = Array.from(scheduledTasks.entries())
        .filter(([id]) => id.startsWith('redis_'))
        .map(([id, { data }]) => data);
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      logger.error('Failed to get Redis scheduled tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduled tasks',
        error: error.message
      });
    }
  }

  /**
   * 更新Redis定时任务
   */
  static async updateRedisScheduleTask(req, res) {
    try {
      const { taskId } = req.params;
      const { name, type, schedule, enabled } = req.body;
      
      if (!scheduledTasks.has(taskId)) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled task not found'
        });
      }
      
      const { task, data } = scheduledTasks.get(taskId);
      
      // 停止旧任务
      if (task) {
        task.stop();
      }
      
      // 更新任务数据
      const updatedData = {
        ...data,
        name: name || data.name,
        type: type || data.type,
        schedule: schedule || data.schedule,
        enabled: enabled !== undefined ? enabled : data.enabled,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.id
      };
      
      // 如果启用，创建新任务
      let newTask = null;
      if (updatedData.enabled) {
        if (schedule && !cron.validate(schedule)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid cron schedule format'
          });
        }
        
        newTask = cron.schedule(updatedData.schedule, async () => {
          try {
            if (updatedData.type === 'backup') {
              await DatabaseController.performRedisBackup();
            }
            logger.info(`Redis scheduled task executed: ${updatedData.name}`);
          } catch (error) {
            logger.error(`Redis scheduled task failed: ${updatedData.name}`, error);
          }
        }, {
          scheduled: false
        });
        
        newTask.start();
      }
      
      scheduledTasks.set(taskId, { task: newTask, data: updatedData });
      
      res.json({
        success: true,
        message: 'Scheduled task updated successfully',
        data: updatedData
      });
    } catch (error) {
      logger.error('Failed to update Redis scheduled task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scheduled task',
        error: error.message
      });
    }
  }

  /**
   * 删除Redis定时任务
   */
  static async deleteRedisScheduleTask(req, res) {
    try {
      const { taskId } = req.params;
      
      if (!scheduledTasks.has(taskId)) {
        return res.status(404).json({
          success: false,
          message: 'Scheduled task not found'
        });
      }
      
      const { task } = scheduledTasks.get(taskId);
      
      // 停止并删除任务
      if (task) {
        task.stop();
      }
      
      scheduledTasks.delete(taskId);
      
      logger.info(`Redis scheduled task deleted by user ${req.user.id}: ${taskId}`);
      
      res.json({
        success: true,
        message: 'Scheduled task deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete Redis scheduled task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete scheduled task',
        error: error.message
      });
    }
  }

  /**
   * 获取Redis信息
   */
  static async getRedisInfo(req, res) {
    try {
      const info = await redis.client.info();
      const sections = {};
      let currentSection = 'general';
      
      info.split('\r\n').forEach(line => {
        if (line.startsWith('# ')) {
          currentSection = line.substring(2).toLowerCase();
          sections[currentSection] = {};
        } else if (line.includes(':')) {
          const [key, value] = line.split(':');
          if (!sections[currentSection]) {
            sections[currentSection] = {};
          }
          sections[currentSection][key] = value;
        }
      });
      
      res.json({
        success: true,
        data: sections
      });
    } catch (error) {
      logger.error('Failed to get Redis info:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Redis info',
        error: error.message
      });
    }
  }

  /**
   * 执行Redis备份（内部方法）
   */
  static async performRedisBackup() {
    await ensureBackupDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `redis_auto_backup_${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    const keys = await redis.client.keys('*');
    const backup = {};
    
    for (const key of keys) {
      const type = await redis.client.type(key);
      const ttl = await redis.client.ttl(key);
      
      let value;
      switch (type) {
        case 'string':
          value = await redis.client.get(key);
          break;
        case 'hash':
          value = await redis.client.hGetAll(key);
          break;
        case 'list':
          value = await redis.client.lRange(key, 0, -1);
          break;
        case 'set':
          value = await redis.client.sMembers(key);
          break;
        case 'zset':
          value = await redis.client.zRangeWithScores(key, 0, -1);
          break;
      }
      
      backup[key] = {
        type,
        value,
        ttl: ttl === -1 ? null : ttl
      };
    }
    
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
    
    logger.info(`Redis auto backup completed: ${backupFileName}`);
    
    return backupFileName;
  }
}

module.exports = DatabaseController;