import request from '@/utils/request'

// 获取系统设置
export function getSystemSettings() {
  return request({
    url: '/api/system/settings',
    method: 'get'
  })
}

// 更新系统设置
export function updateSystemSettings(data) {
  return request({
    url: '/api/system/settings',
    method: 'put',
    data
  })
}

// 重置系统设置
export function resetSystemSettings() {
  return request({
    url: '/api/system/settings/reset',
    method: 'post'
  })
}

// 测试邮件设置
export function testEmailSettings(data) {
  return request({
    url: '/api/system/settings/email/test',
    method: 'post',
    data
  })
}

// 测试Redis连接
export function testRedisConnection(data) {
  return request({
    url: '/api/system/settings/redis/test',
    method: 'post',
    data
  })
}

// 清空系统缓存
export function clearSystemCache() {
  return request({
    url: '/api/system/settings/cache/clear',
    method: 'post'
  })
}

// 获取系统信息
export function getSystemInfo() {
  return request({
    url: '/api/system/info',
    method: 'get'
  })
}

// 获取系统状态
export function getSystemStatus() {
  return request({
    url: '/api/system/status',
    method: 'get'
  })
}

// 系统健康检查
export function healthCheck() {
  return request({
    url: '/api/system/health',
    method: 'get'
  })
}

// 获取系统日志
export function getSystemLogs(params) {
  return request({
    url: '/api/system/logs',
    method: 'get',
    params
  })
}

// 清理系统日志
export function clearSystemLogs(data) {
  return request({
    url: '/api/system/logs/clear',
    method: 'post',
    data
  })
}

// 系统备份
export function createSystemBackup(data) {
  return request({
    url: '/api/system/backup',
    method: 'post',
    data
  })
}

// 获取备份列表
export function getBackupList(params) {
  return request({
    url: '/api/system/backup',
    method: 'get',
    params
  })
}

// 恢复系统备份
export function restoreSystemBackup(backupId) {
  return request({
    url: `/api/system/backup/${backupId}/restore`,
    method: 'post'
  })
}

// 删除系统备份
export function deleteSystemBackup(backupId) {
  return request({
    url: `/api/system/backup/${backupId}`,
    method: 'delete'
  })
}

// 下载系统备份
export function downloadSystemBackup(backupId) {
  return request({
    url: `/api/system/backup/${backupId}/download`,
    method: 'get',
    responseType: 'blob'
  })
}

// 系统更新检查
export function checkSystemUpdate() {
  return request({
    url: '/api/system/update/check',
    method: 'get'
  })
}

// 执行系统更新
export function executeSystemUpdate(data) {
  return request({
    url: '/api/system/update/execute',
    method: 'post',
    data
  })
}

// 获取更新历史
export function getUpdateHistory(params) {
  return request({
    url: '/api/system/update/history',
    method: 'get',
    params
  })
}

// 系统维护模式
export function toggleMaintenanceMode(enabled) {
  return request({
    url: '/api/system/maintenance',
    method: 'post',
    data: { enabled }
  })
}

// 获取系统配置模板
export function getConfigTemplates() {
  return request({
    url: '/api/system/config/templates',
    method: 'get'
  })
}

// 应用配置模板
export function applyConfigTemplate(templateId) {
  return request({
    url: `/api/system/config/templates/${templateId}/apply`,
    method: 'post'
  })
}

// 导出系统配置
export function exportSystemConfig() {
  return request({
    url: '/api/system/config/export',
    method: 'get',
    responseType: 'blob'
  })
}

// 导入系统配置
export function importSystemConfig(data) {
  return request({
    url: '/api/system/config/import',
    method: 'post',
    data
  })
}

// 获取环境变量
export function getEnvironmentVariables() {
  return request({
    url: '/api/system/env',
    method: 'get'
  })
}

// 更新环境变量
export function updateEnvironmentVariables(data) {
  return request({
    url: '/api/system/env',
    method: 'put',
    data
  })
}

// 重启系统服务
export function restartSystemService(serviceName) {
  return request({
    url: `/api/system/services/${serviceName}/restart`,
    method: 'post'
  })
}

// 获取服务状态
export function getServiceStatus() {
  return request({
    url: '/api/system/services/status',
    method: 'get'
  })
}

// 系统性能监控
export function getSystemPerformance(params) {
  return request({
    url: '/api/system/performance',
    method: 'get',
    params
  })
}

// 获取系统资源使用情况
export function getSystemResources() {
  return request({
    url: '/api/system/resources',
    method: 'get'
  })
}

// 清理系统垃圾文件
export function cleanSystemGarbage() {
  return request({
    url: '/api/system/cleanup',
    method: 'post'
  })
}

// 优化系统数据库
export function optimizeSystemDatabase() {
  return request({
    url: '/api/system/database/optimize',
    method: 'post'
  })
}

// 获取数据库状态
export function getDatabaseStatus() {
  return request({
    url: '/api/system/database/status',
    method: 'get'
  })
}

// 执行数据库备份
export function backupDatabase(data) {
  return request({
    url: '/api/system/database/backup',
    method: 'post',
    data
  })
}

// 恢复数据库备份
export function restoreDatabase(backupId) {
  return request({
    url: `/api/system/database/backup/${backupId}/restore`,
    method: 'post'
  })
}

// 获取系统许可证信息
export function getLicenseInfo() {
  return request({
    url: '/api/system/license',
    method: 'get'
  })
}

// 更新系统许可证
export function updateLicense(data) {
  return request({
    url: '/api/system/license',
    method: 'put',
    data
  })
}

// 验证许可证
export function validateLicense() {
  return request({
    url: '/api/system/license/validate',
    method: 'post'
  })
}