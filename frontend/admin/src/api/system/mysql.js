import request from '@/utils/request'

// 获取MySQL连接信息
export function getMysqlInfo() {
  return request({
    url: '/api/v1/database/mysql/info',
    method: 'get'
  })
}

// 获取MySQL状态
export function getMysqlStatus() {
  return request({
    url: '/api/v1/database/mysql/status',
    method: 'get'
  })
}

// 获取MySQL状态 (别名)
export function getMySQLStatus() {
  return getMysqlStatus()
}

// 获取MySQL表列表 (别名)
export function getMySQLTables(database) {
  return getMysqlTables(database)
}

// 获取MySQL数据库列表
export function getMysqlDatabases() {
  return request({
    url: '/api/v1/database/mysql/databases',
    method: 'get'
  })
}

// 获取MySQL表列表
export function getMysqlTables(database) {
  return request({
    url: '/api/v1/database/mysql/tables',
    method: 'get',
    params: { database }
  })
}

// 执行MySQL查询
export function executeMysqlQuery(data) {
  return request({
    url: '/api/v1/database/mysql/query',
    method: 'post',
    data
  })
}

// 获取MySQL配置
export function getMysqlConfig() {
  return request({
    url: '/api/v1/database/mysql/config',
    method: 'get'
  })
}

// 更新MySQL配置
export function updateMysqlConfig(data) {
  return request({
    url: '/api/v1/database/mysql/config',
    method: 'put',
    data
  })
}

// 备份MySQL数据库
export function backupMysqlDatabase(data) {
  return request({
    url: '/api/v1/database/mysql/backup',
    method: 'post',
    data
  })
}

// 备份数据库 (别名)
export function backupDatabase(data) {
  return backupMysqlDatabase(data)
}

// 恢复MySQL数据库
export function restoreMysqlDatabase(data) {
  return request({
    url: '/api/v1/database/mysql/restore',
    method: 'post',
    data
  })
}

// 恢复数据库 (别名)
export function restoreDatabase(data) {
  return restoreMysqlDatabase(data)
}

// 添加定时任务
export function addSchedule(data) {
  return request({
    url: '/api/v1/database/mysql/schedule',
    method: 'post',
    data
  })
}

// 获取定时任务列表
export function getScheduleList() {
  return request({
    url: '/api/v1/database/mysql/schedule',
    method: 'get'
  })
}

// 删除定时任务
export function deleteSchedule(id) {
  return request({
    url: `/api/v1/database/mysql/schedule/${id}`,
    method: 'delete'
  })
}

// 切换定时任务状态
export function toggleSchedule(id, enabled) {
  return request({
    url: `/api/v1/database/mysql/schedule/${id}/toggle`,
    method: 'put',
    data: { enabled }
  })
}

// 更新定时任务
export function updateSchedule(id, data) {
  return request({
    url: `/api/v1/database/mysql/schedule/${id}`,
    method: 'put',
    data
  })
}

// 获取表结构
export function getTableStructure(database, table) {
  return request({
    url: '/api/v1/database/mysql/table/structure',
    method: 'get',
    params: { database, table }
  })
}

// 优化数据库
export function optimizeDatabase() {
  return request({
    url: '/api/v1/database/mysql/optimize',
    method: 'post'
  })
}

// 清空表数据
export function truncateTable(database, table) {
  return request({
    url: '/api/v1/database/mysql/table/truncate',
    method: 'post',
    data: { database, table }
  })
}

// 删除表
export function dropTable(database, table) {
  return request({
    url: '/api/v1/database/mysql/table/drop',
    method: 'delete',
    data: { database, table }
  })
}

// 获取备份列表
export function getBackupList() {
  return request({
    url: '/api/v1/database/mysql/backups',
    method: 'get'
  })
}