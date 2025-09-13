import request from '@/utils/request'

// 获取报表列表
export function getReportsList(params) {
  return request({
    url: '/api/data-analysis/reports',
    method: 'get',
    params
  })
}

// 获取报表详情
export function getReportDetail(id) {
  return request({
    url: `/api/data-analysis/reports/${id}`,
    method: 'get'
  })
}

// 创建报表
export function createReport(data) {
  return request({
    url: '/api/data-analysis/reports',
    method: 'post',
    data
  })
}

// 更新报表
export function updateReport(id, data) {
  return request({
    url: `/api/data-analysis/reports/${id}`,
    method: 'put',
    data
  })
}

// 删除报表
export function deleteReport(id) {
  return request({
    url: `/api/data-analysis/reports/${id}`,
    method: 'delete'
  })
}

// 更新报表状态
export function updateReportStatus(id, data) {
  return request({
    url: `/api/data-analysis/reports/${id}/status`,
    method: 'patch',
    data
  })
}

// 批量删除报表
export function batchDeleteReports(data) {
  return request({
    url: '/api/data-analysis/reports/batch-delete',
    method: 'post',
    data
  })
}

// 导出报表列表
export function exportReportsList(params) {
  return request({
    url: '/api/data-analysis/reports/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取报表统计
export function getReportsStats() {
  return request({
    url: '/api/data-analysis/reports/stats',
    method: 'get'
  })
}

// 生成报表数据
export function generateReportData(id, params) {
  return request({
    url: `/api/data-analysis/reports/${id}/generate`,
    method: 'post',
    data: params
  })
}

// 获取报表生成历史
export function getReportHistory(id, params) {
  return request({
    url: `/api/data-analysis/reports/${id}/history`,
    method: 'get',
    params
  })
}

// 下载报表文件
export function downloadReportFile(id, fileId) {
  return request({
    url: `/api/data-analysis/reports/${id}/download/${fileId}`,
    method: 'get',
    responseType: 'blob'
  })
}

// 预览报表数据
export function previewReportData(id, params) {
  return request({
    url: `/api/data-analysis/reports/${id}/preview`,
    method: 'post',
    data: params
  })
}

// 复制报表
export function copyReport(id, data) {
  return request({
    url: `/api/data-analysis/reports/${id}/copy`,
    method: 'post',
    data
  })
}

// 获取报表模板
export function getReportTemplates(params) {
  return request({
    url: '/api/data-analysis/report-templates',
    method: 'get',
    params
  })
}

// 创建报表模板
export function createReportTemplate(data) {
  return request({
    url: '/api/data-analysis/report-templates',
    method: 'post',
    data
  })
}

// 获取数据源列表
export function getDataSources(params) {
  return request({
    url: '/api/data-analysis/data-sources',
    method: 'get',
    params
  })
}

// 获取数据源字段
export function getDataSourceFields(dataSource) {
  return request({
    url: `/api/data-analysis/data-sources/${dataSource}/fields`,
    method: 'get'
  })
}

// 测试数据源连接
export function testDataSourceConnection(data) {
  return request({
    url: '/api/data-analysis/data-sources/test',
    method: 'post',
    data
  })
}

// 获取报表调度任务
export function getReportSchedules(params) {
  return request({
    url: '/api/data-analysis/report-schedules',
    method: 'get',
    params
  })
}

// 创建报表调度任务
export function createReportSchedule(data) {
  return request({
    url: '/api/data-analysis/report-schedules',
    method: 'post',
    data
  })
}

// 更新报表调度任务
export function updateReportSchedule(id, data) {
  return request({
    url: `/api/data-analysis/report-schedules/${id}`,
    method: 'put',
    data
  })
}

// 删除报表调度任务
export function deleteReportSchedule(id) {
  return request({
    url: `/api/data-analysis/report-schedules/${id}`,
    method: 'delete'
  })
}

// 启用/禁用报表调度任务
export function toggleReportSchedule(id, data) {
  return request({
    url: `/api/data-analysis/report-schedules/${id}/toggle`,
    method: 'patch',
    data
  })
}

// 手动执行报表调度任务
export function executeReportSchedule(id) {
  return request({
    url: `/api/data-analysis/report-schedules/${id}/execute`,
    method: 'post'
  })
}

// 获取报表执行日志
export function getReportExecutionLogs(params) {
  return request({
    url: '/api/data-analysis/report-execution-logs',
    method: 'get',
    params
  })
}

// 获取报表分享链接
export function getReportShareLink(id, data) {
  return request({
    url: `/api/data-analysis/reports/${id}/share`,
    method: 'post',
    data
  })
}

// 获取报表权限设置
export function getReportPermissions(id) {
  return request({
    url: `/api/data-analysis/reports/${id}/permissions`,
    method: 'get'
  })
}

// 更新报表权限设置
export function updateReportPermissions(id, data) {
  return request({
    url: `/api/data-analysis/reports/${id}/permissions`,
    method: 'put',
    data
  })
}

// 获取报表订阅设置
export function getReportSubscriptions(id) {
  return request({
    url: `/api/data-analysis/reports/${id}/subscriptions`,
    method: 'get'
  })
}

// 创建报表订阅
export function createReportSubscription(id, data) {
  return request({
    url: `/api/data-analysis/reports/${id}/subscriptions`,
    method: 'post',
    data
  })
}

// 取消报表订阅
export function cancelReportSubscription(id, subscriptionId) {
  return request({
    url: `/api/data-analysis/reports/${id}/subscriptions/${subscriptionId}`,
    method: 'delete'
  })
}

// 获取报表评论
export function getReportComments(id, params) {
  return request({
    url: `/api/data-analysis/reports/${id}/comments`,
    method: 'get',
    params
  })
}

// 添加报表评论
export function addReportComment(id, data) {
  return request({
    url: `/api/data-analysis/reports/${id}/comments`,
    method: 'post',
    data
  })
}

// 删除报表评论
export function deleteReportComment(id, commentId) {
  return request({
    url: `/api/data-analysis/reports/${id}/comments/${commentId}`,
    method: 'delete'
  })
}

// 获取报表版本历史
export function getReportVersions(id, params) {
  return request({
    url: `/api/data-analysis/reports/${id}/versions`,
    method: 'get',
    params
  })
}

// 恢复报表版本
export function restoreReportVersion(id, versionId) {
  return request({
    url: `/api/data-analysis/reports/${id}/versions/${versionId}/restore`,
    method: 'post'
  })
}

// 获取报表使用统计
export function getReportUsageStats(id, params) {
  return request({
    url: `/api/data-analysis/reports/${id}/usage-stats`,
    method: 'get',
    params
  })
}