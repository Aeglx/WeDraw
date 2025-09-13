import request from '@/utils/request'

// MySQL管理相关API
export function getMysqlStatus() {
  return request({
    url: '/api/system/database/mysql/status',
    method: 'get'
  })
}

export function getMysqlTables() {
  return request({
    url: '/api/system/database/mysql/tables',
    method: 'get'
  })
}

export function getMysqlTableData(tableName, page = 1, size = 10) {
  return request({
    url: '/api/system/database/mysql/table/data',
    method: 'get',
    params: {
      tableName,
      page,
      size
    }
  })
}

export function deleteMysqlTable(tableName) {
  return request({
    url: '/api/system/database/mysql/table',
    method: 'delete',
    params: {
      tableName
    }
  })
}

export function clearMysqlTable(tableName) {
  return request({
    url: '/api/system/database/mysql/table/clear',
    method: 'post',
    data: {
      tableName
    }
  })
}

export function backupMysqlDatabase() {
  return request({
    url: '/api/system/database/mysql/backup',
    method: 'post'
  })
}

export function restoreMysqlDatabase(backupFile) {
  return request({
    url: '/api/system/database/mysql/restore',
    method: 'post',
    data: {
      backupFile
    }
  })
}

export function getMysqlBackupList() {
  return request({
    url: '/api/system/database/mysql/backups',
    method: 'get'
  })
}

export function deleteMysqlBackup(backupFile) {
  return request({
    url: '/api/system/database/mysql/backup',
    method: 'delete',
    params: {
      backupFile
    }
  })
}

export function createMysqlScheduleTask(taskData) {
  return request({
    url: '/api/system/database/mysql/schedule',
    method: 'post',
    data: taskData
  })
}

export function getMysqlScheduleTasks() {
  return request({
    url: '/api/system/database/mysql/schedule',
    method: 'get'
  })
}

export function updateMysqlScheduleTask(taskId, taskData) {
  return request({
    url: `/api/system/database/mysql/schedule/${taskId}`,
    method: 'put',
    data: taskData
  })
}

export function deleteMysqlScheduleTask(taskId) {
  return request({
    url: `/api/system/database/mysql/schedule/${taskId}`,
    method: 'delete'
  })
}

// Redis管理相关API
export function getRedisStatus() {
  return request({
    url: '/api/system/database/redis/status',
    method: 'get'
  })
}

export function getRedisKeys(pattern = '*', page = 1, size = 10) {
  return request({
    url: '/api/system/database/redis/keys',
    method: 'get',
    params: {
      pattern,
      page,
      size
    }
  })
}

export function getRedisValue(key) {
  return request({
    url: '/api/system/database/redis/value',
    method: 'get',
    params: {
      key
    }
  })
}

export function setRedisValue(key, value, ttl) {
  return request({
    url: '/api/system/database/redis/value',
    method: 'post',
    data: {
      key,
      value,
      ttl
    }
  })
}

export function deleteRedisKey(key) {
  return request({
    url: '/api/system/database/redis/key',
    method: 'delete',
    params: {
      key
    }
  })
}

export function clearRedisDatabase() {
  return request({
    url: '/api/system/database/redis/clear',
    method: 'post'
  })
}

export function backupRedisDatabase() {
  return request({
    url: '/api/system/database/redis/backup',
    method: 'post'
  })
}

export function getRedisBackupList() {
  return request({
    url: '/api/system/database/redis/backups',
    method: 'get'
  })
}

export function restoreRedisDatabase(backupFile) {
  return request({
    url: '/api/system/database/redis/restore',
    method: 'post',
    data: {
      backupFile
    }
  })
}

export function deleteRedisBackup(backupFile) {
  return request({
    url: '/api/system/database/redis/backup',
    method: 'delete',
    params: {
      backupFile
    }
  })
}

export function createRedisScheduleTask(taskData) {
  return request({
    url: '/api/system/database/redis/schedule',
    method: 'post',
    data: taskData
  })
}

export function getRedisScheduleTasks() {
  return request({
    url: '/api/system/database/redis/schedule',
    method: 'get'
  })
}

export function updateRedisScheduleTask(taskId, taskData) {
  return request({
    url: `/api/system/database/redis/schedule/${taskId}`,
    method: 'put',
    data: taskData
  })
}

export function deleteRedisScheduleTask(taskId) {
  return request({
    url: `/api/system/database/redis/schedule/${taskId}`,
    method: 'delete'
  })
}

export function getRedisInfo() {
  return request({
    url: '/api/system/database/redis/info',
    method: 'get'
  })
}