import request from '@/utils/request'

// 获取模板列表
export function getTemplateList(params) {
  return request({
    url: '/api/message-center/templates',
    method: 'get',
    params
  })
}

// 获取模板详情
export function getTemplateDetail(id) {
  return request({
    url: `/api/message-center/templates/${id}`,
    method: 'get'
  })
}

// 创建模板
export function createTemplate(data) {
  return request({
    url: '/api/message-center/templates',
    method: 'post',
    data
  })
}

// 更新模板
export function updateTemplate(id, data) {
  return request({
    url: `/api/message-center/templates/${id}`,
    method: 'put',
    data
  })
}

// 删除模板
export function deleteTemplate(id) {
  return request({
    url: `/api/message-center/templates/${id}`,
    method: 'delete'
  })
}

// 更新模板状态
export function updateTemplateStatus(id, data) {
  return request({
    url: `/api/message-center/templates/${id}/status`,
    method: 'patch',
    data
  })
}

// 批量删除模板
export function batchDeleteTemplates(data) {
  return request({
    url: '/api/message-center/templates/batch-delete',
    method: 'post',
    data
  })
}

// 批量更新模板状态
export function batchUpdateTemplateStatus(data) {
  return request({
    url: '/api/message-center/templates/batch-status',
    method: 'post',
    data
  })
}

// 复制模板
export function copyTemplate(id, data) {
  return request({
    url: `/api/message-center/templates/${id}/copy`,
    method: 'post',
    data
  })
}

// 导出模板
export function exportTemplates(params) {
  return request({
    url: '/api/message-center/templates/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 导入模板
export function importTemplates(data) {
  return request({
    url: '/api/message-center/templates/import',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取导入模板
export function getImportTemplate() {
  return request({
    url: '/api/message-center/templates/import-template',
    method: 'get',
    responseType: 'blob'
  })
}

// 获取模板统计
export function getTemplateStats(params) {
  return request({
    url: '/api/message-center/templates/stats',
    method: 'get',
    params
  })
}

// 获取模板分类
export function getTemplateCategories() {
  return request({
    url: '/api/message-center/template-categories',
    method: 'get'
  })
}

// 创建模板分类
export function createTemplateCategory(data) {
  return request({
    url: '/api/message-center/template-categories',
    method: 'post',
    data
  })
}

// 更新模板分类
export function updateTemplateCategory(id, data) {
  return request({
    url: `/api/message-center/template-categories/${id}`,
    method: 'put',
    data
  })
}

// 删除模板分类
export function deleteTemplateCategory(id) {
  return request({
    url: `/api/message-center/template-categories/${id}`,
    method: 'delete'
  })
}

// 获取模板使用统计
export function getTemplateUsageStats(params) {
  return request({
    url: '/api/message-center/templates/usage-stats',
    method: 'get',
    params
  })
}

// 获取模板使用趋势
export function getTemplateUsageTrend(params) {
  return request({
    url: '/api/message-center/templates/usage-trend',
    method: 'get',
    params
  })
}

// 预览模板
export function previewTemplate(id, data) {
  return request({
    url: `/api/message-center/templates/${id}/preview`,
    method: 'post',
    data
  })
}

// 测试模板
export function testTemplate(id, data) {
  return request({
    url: `/api/message-center/templates/${id}/test`,
    method: 'post',
    data
  })
}

// 获取模板变量
export function getTemplateVariables(id) {
  return request({
    url: `/api/message-center/templates/${id}/variables`,
    method: 'get'
  })
}

// 验证模板语法
export function validateTemplate(data) {
  return request({
    url: '/api/message-center/templates/validate',
    method: 'post',
    data
  })
}

// 获取模板历史版本
export function getTemplateVersions(id, params) {
  return request({
    url: `/api/message-center/templates/${id}/versions`,
    method: 'get',
    params
  })
}

// 恢复模板版本
export function restoreTemplateVersion(id, versionId) {
  return request({
    url: `/api/message-center/templates/${id}/versions/${versionId}/restore`,
    method: 'post'
  })
}

// 获取模板推荐
export function getTemplateRecommendations(params) {
  return request({
    url: '/api/message-center/templates/recommendations',
    method: 'get',
    params
  })
}

// 设置默认模板
export function setDefaultTemplate(id, data) {
  return request({
    url: `/api/message-center/templates/${id}/set-default`,
    method: 'post',
    data
  })
}

// 获取模板审核列表
export function getTemplateAuditList(params) {
  return request({
    url: '/api/message-center/templates/audit',
    method: 'get',
    params
  })
}

// 审核模板
export function auditTemplate(id, data) {
  return request({
    url: `/api/message-center/templates/${id}/audit`,
    method: 'post',
    data
  })
}

// 获取模板配置
export function getTemplateConfig() {
  return request({
    url: '/api/message-center/templates/config',
    method: 'get'
  })
}

// 更新模板配置
export function updateTemplateConfig(data) {
  return request({
    url: '/api/message-center/templates/config',
    method: 'put',
    data
  })
}