const { User, Department } = require('../models');
const wecomService = require('./wecomService');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');

class ContactsService {
  /**
   * 同步通讯录数据
   * @param {boolean} force 是否强制全量同步
   * @returns {Promise<Object>} 同步结果
   */
  async syncContacts(force = false) {
    const startTime = Date.now();
    const result = {
      departments: { created: 0, updated: 0, deleted: 0 },
      users: { created: 0, updated: 0, deleted: 0 },
      errors: [],
    };

    try {
      logger.info('Starting contacts sync', { force });

      // 同步部门
      const deptResult = await this.syncDepartments(force);
      result.departments = deptResult;

      // 同步用户
      const userResult = await this.syncUsers(force);
      result.users = userResult;

      // 记录同步时间
      await this.setLastSyncTime();

      const duration = Date.now() - startTime;
      logger.info('Contacts sync completed', {
        result,
        duration: `${duration}ms`,
      });

      return {
        ...result,
        duration,
        success: true,
      };
    } catch (error) {
      logger.error('Contacts sync failed:', error);
      result.errors.push(error.message);
      
      return {
        ...result,
        duration: Date.now() - startTime,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 同步部门数据
   * @param {boolean} force 是否强制全量同步
   * @returns {Promise<Object>} 同步结果
   */
  async syncDepartments(force = false) {
    const result = { created: 0, updated: 0, deleted: 0 };

    try {
      // 获取企业微信部门列表
      const wecomDepartments = await wecomService.getDepartmentList();
      logger.info(`Fetched ${wecomDepartments.length} departments from WeChat Work`);

      // 获取本地部门列表
      const localDepartments = await Department.findAll({
        attributes: ['department_id', 'updated_at'],
      });
      const localDeptMap = new Map(
        localDepartments.map(dept => [dept.department_id, dept])
      );

      // 同步部门数据
      for (const wecomDept of wecomDepartments) {
        try {
          const localDept = localDeptMap.get(wecomDept.id);
          const deptData = {
            department_id: wecomDept.id,
            name: wecomDept.name,
            name_en: wecomDept.name_en || '',
            parent_id: wecomDept.parentid,
            order: wecomDept.order || 0,
          };

          if (!localDept) {
            // 创建新部门
            await Department.create(deptData);
            result.created++;
            logger.debug(`Created department: ${wecomDept.name}`);
          } else if (force || this.shouldUpdateDepartment(localDept, wecomDept)) {
            // 更新部门
            await Department.update(deptData, {
              where: { department_id: wecomDept.id },
            });
            result.updated++;
            logger.debug(`Updated department: ${wecomDept.name}`);
          }

          localDeptMap.delete(wecomDept.id);
        } catch (error) {
          logger.error(`Failed to sync department ${wecomDept.name}:`, error);
        }
      }

      // 删除不存在的部门
      if (localDeptMap.size > 0) {
        const deletedIds = Array.from(localDeptMap.keys());
        await Department.destroy({
          where: { department_id: deletedIds },
        });
        result.deleted = deletedIds.length;
        logger.info(`Deleted ${result.deleted} departments`);
      }

      // 更新部门路径和全名
      await Department.updatePaths();

      return result;
    } catch (error) {
      logger.error('Failed to sync departments:', error);
      throw error;
    }
  }

  /**
   * 同步用户数据
   * @param {boolean} force 是否强制全量同步
   * @returns {Promise<Object>} 同步结果
   */
  async syncUsers(force = false) {
    const result = { created: 0, updated: 0, deleted: 0 };

    try {
      // 获取所有部门
      const departments = await Department.findAll({
        attributes: ['department_id'],
      });

      const allWecomUsers = [];
      
      // 获取每个部门的用户
      for (const dept of departments) {
        try {
          const deptUsers = await wecomService.getDepartmentUsers(dept.department_id);
          allWecomUsers.push(...deptUsers);
        } catch (error) {
          logger.warn(`Failed to get users for department ${dept.department_id}:`, error.message);
        }
      }

      // 去重用户（用户可能属于多个部门）
      const uniqueUsers = new Map();
      allWecomUsers.forEach(user => {
        if (!uniqueUsers.has(user.userid)) {
          uniqueUsers.set(user.userid, user);
        } else {
          // 合并部门信息
          const existingUser = uniqueUsers.get(user.userid);
          existingUser.department = [...new Set([...existingUser.department, ...user.department])];
        }
      });

      const wecomUsers = Array.from(uniqueUsers.values());
      logger.info(`Fetched ${wecomUsers.length} unique users from WeChat Work`);

      // 获取本地用户列表
      const localUsers = await User.findAll({
        attributes: ['userid', 'updated_at'],
      });
      const localUserMap = new Map(
        localUsers.map(user => [user.userid, user])
      );

      // 同步用户数据
      for (const wecomUser of wecomUsers) {
        try {
          const localUser = localUserMap.get(wecomUser.userid);
          const userData = {
            userid: wecomUser.userid,
            name: wecomUser.name,
            english_name: wecomUser.english_name || '',
            mobile: wecomUser.mobile || '',
            department: wecomUser.department || [],
            position: wecomUser.position || '',
            gender: wecomUser.gender || 0,
            email: wecomUser.email || '',
            avatar: wecomUser.avatar || '',
            status: wecomUser.status || 1,
            enable: wecomUser.enable !== undefined ? wecomUser.enable : 1,
            hide_mobile: wecomUser.hide_mobile || 0,
            telephone: wecomUser.telephone || '',
            alias: wecomUser.alias || '',
            address: wecomUser.address || '',
            open_userid: wecomUser.open_userid || '',
            main_department: wecomUser.main_department || (wecomUser.department && wecomUser.department[0]) || null,
          };

          if (!localUser) {
            // 创建新用户
            await User.create(userData);
            result.created++;
            logger.debug(`Created user: ${wecomUser.name}`);
          } else if (force || this.shouldUpdateUser(localUser, wecomUser)) {
            // 更新用户
            await User.update(userData, {
              where: { userid: wecomUser.userid },
            });
            result.updated++;
            logger.debug(`Updated user: ${wecomUser.name}`);
          }

          localUserMap.delete(wecomUser.userid);
        } catch (error) {
          logger.error(`Failed to sync user ${wecomUser.name}:`, error);
        }
      }

      // 删除不存在的用户
      if (localUserMap.size > 0) {
        const deletedUserids = Array.from(localUserMap.keys());
        await User.destroy({
          where: { userid: deletedUserids },
        });
        result.deleted = deletedUserids.length;
        logger.info(`Deleted ${result.deleted} users`);
      }

      return result;
    } catch (error) {
      logger.error('Failed to sync users:', error);
      throw error;
    }
  }

  /**
   * 判断是否需要更新部门
   * @param {Object} localDept 本地部门
   * @param {Object} wecomDept 企业微信部门
   * @returns {boolean} 是否需要更新
   */
  shouldUpdateDepartment(localDept, wecomDept) {
    // 简单的时间戳比较，实际可以根据具体字段判断
    return true; // 暂时总是更新
  }

  /**
   * 判断是否需要更新用户
   * @param {Object} localUser 本地用户
   * @param {Object} wecomUser 企业微信用户
   * @returns {boolean} 是否需要更新
   */
  shouldUpdateUser(localUser, wecomUser) {
    // 简单的时间戳比较，实际可以根据具体字段判断
    return true; // 暂时总是更新
  }

  /**
   * 导出通讯录数据
   * @param {Object} options 导出选项
   * @returns {Promise<Object>} 导出结果
   */
  async exportContacts(options = {}) {
    const { format = 'xlsx', department_id } = options;

    try {
      // 构建查询条件
      const where = {};
      const include = [
        {
          association: 'departments',
          attributes: ['department_id', 'name', 'name_en'],
        },
      ];

      if (department_id) {
        where.department = {
          [require('sequelize').Op.contains]: [department_id],
        };
      }

      // 获取用户数据
      const users = await User.findAll({
        where,
        include,
        order: [['created_at', 'DESC']],
      });

      // 格式化数据
      const exportData = users.map(user => ({
        用户ID: user.userid,
        姓名: user.name,
        英文名: user.english_name,
        手机号: user.mobile,
        邮箱: user.email,
        职位: user.position,
        性别: user.gender === 1 ? '男' : user.gender === 2 ? '女' : '未知',
        状态: this.getUserStatusText(user.status),
        部门: user.departments?.map(d => d.name).join(', ') || '',
        电话: user.telephone,
        地址: user.address,
        创建时间: user.created_at,
        更新时间: user.updated_at,
      }));

      if (format === 'csv') {
        return this.exportToCSV(exportData);
      } else {
        return this.exportToExcel(exportData);
      }
    } catch (error) {
      logger.error('Failed to export contacts:', error);
      throw error;
    }
  }

  /**
   * 导出为CSV格式
   * @param {Array} data 数据
   * @returns {Object} 导出结果
   */
  exportToCSV(data) {
    const parser = new Parser({
      fields: Object.keys(data[0] || {}),
    });
    
    const csv = parser.parse(data);
    const buffer = Buffer.from(csv, 'utf8');
    
    return {
      buffer,
      filename: `contacts_${Date.now()}.csv`,
      contentType: 'text/csv',
    };
  }

  /**
   * 导出为Excel格式
   * @param {Array} data 数据
   * @returns {Promise<Object>} 导出结果
   */
  async exportToExcel(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('通讯录');

    if (data.length > 0) {
      // 设置表头
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // 设置表头样式
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // 添加数据
      data.forEach(item => {
        worksheet.addRow(Object.values(item));
      });

      // 自动调整列宽
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    
    return {
      buffer,
      filename: `contacts_${Date.now()}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /**
   * 获取用户状态文本
   * @param {number} status 状态码
   * @returns {string} 状态文本
   */
  getUserStatusText(status) {
    const statusMap = {
      1: '已激活',
      2: '已禁用',
      4: '未激活',
      5: '退出企业',
    };
    return statusMap[status] || '未知';
  }

  /**
   * 设置最后同步时间
   * @returns {Promise<void>}
   */
  async setLastSyncTime() {
    const cacheKey = 'wecom:contacts:last_sync_time';
    await cache.set(cacheKey, new Date().toISOString(), 86400 * 30); // 缓存30天
  }

  /**
   * 获取最后同步时间
   * @returns {Promise<string|null>} 最后同步时间
   */
  async getLastSyncTime() {
    const cacheKey = 'wecom:contacts:last_sync_time';
    return await cache.get(cacheKey);
  }

  /**
   * 获取同步状态
   * @returns {Promise<Object>} 同步状态
   */
  async getSyncStatus() {
    const lastSyncTime = await this.getLastSyncTime();
    const isRunning = await cache.get('wecom:contacts:sync_running');
    
    return {
      lastSyncTime,
      isRunning: !!isRunning,
      nextSyncTime: lastSyncTime 
        ? new Date(new Date(lastSyncTime).getTime() + 24 * 60 * 60 * 1000).toISOString()
        : null,
    };
  }

  /**
   * 设置同步运行状态
   * @param {boolean} running 是否运行中
   * @returns {Promise<void>}
   */
  async setSyncRunning(running) {
    const cacheKey = 'wecom:contacts:sync_running';
    if (running) {
      await cache.set(cacheKey, '1', 3600); // 1小时超时
    } else {
      await cache.del(cacheKey);
    }
  }
}

module.exports = new ContactsService();