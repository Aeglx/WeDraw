import request from '@/utils/request'

// 获取模板消息列表
export function getMessageList(params) {
  return request({
    url: '/api/miniprogram/template-messages/list',
    method: 'get',
    params
  })
}

// 获取模板消息详情
export function getMessageDetail(id) {
  return request({
    url: `/api/miniprogram/template-messages/${id}`,
    method: 'get'
  })
}

// 发送模板消息
export function sendTemplateMessage(data) {
  return request({
    url: '/api/miniprogram/template-messages/send',
    method: 'post',
    data
  })
}

// 批量发送模板消息
export function batchSendMessage(data) {
  return request({
    url: '/api/miniprogram/template-messages/batch-send',
    method: 'post',
    data
  })
}

// 获取模板列表
export function getTemplateList(params) {
  return request({
    url: '/api/miniprogram/templates/list',
    method: 'get',
    params
  })
}

// 获取消息统计
export function getMessageStatistics(params) {
  return request({
    url: '/api/miniprogram/template-messages/statistics',
    method: 'get',
    params
  })
}

// 删除消息记录
export function deleteMessage(id) {
  return request({
    url: `/api/miniprogram/template-messages/${id}`,
    method: 'delete'
  })
}

// 重发消息
export function resendMessage(id) {
  return request({
    url: `/api/miniprogram/template-messages/resend/${id}`,
    method: 'post'
  })
}

// 导出消息记录
export function exportMessages(params) {
  return request({
    url: '/api/miniprogram/template-messages/export',
    method: 'get',
    params
  })
}

// 获取模板详情
export function getTemplateDetail(templateId) {
  return request({
    url: `/api/miniprogram/templates/${templateId}`,
    method: 'get'
  })
}

// 创建模板
export function createTemplate(data) {
  return request({
    url: '/api/miniprogram/templates',
    method: 'post',
    data
  })
}

// 更新模板
export function updateTemplate(templateId, data) {
  return request({
    url: `/api/miniprogram/templates/${templateId}`,
    method: 'put',
    data
  })
}

// 删除模板
export function deleteTemplate(templateId) {
  return request({
    url: `/api/miniprogram/templates/${templateId}`,
    method: 'delete'
  })
}

// 获取模板分类
export function getTemplateCategories() {
  return request({
    url: '/api/miniprogram/template-categories',
    method: 'get'
  })
}

// 获取发送记录统计
export function getSendStatistics(params) {
  return request({
    url: '/api/miniprogram/template-messages/send-statistics',
    method: 'get',
    params
  })
}

// 获取用户消息偏好
export function getUserMessagePreferences(openid) {
  return request({
    url: `/api/miniprogram/users/${openid}/message-preferences`,
    method: 'get'
  })
}

// 更新用户消息偏好
export function updateUserMessagePreferences(openid, data) {
  return request({
    url: `/api/miniprogram/users/${openid}/message-preferences`,
    method: 'put',
    data
  })
}

// 获取消息模板使用统计
export function getTemplateUsageStats(params) {
  return request({
    url: '/api/miniprogram/templates/usage-stats',
    method: 'get',
    params
  })
}

// 测试模板消息
export function testTemplateMessage(data) {
  return request({
    url: '/api/miniprogram/template-messages/test',
    method: 'post',
    data
  })
}

// 获取消息发送任务状态
export function getTaskStatus(taskId) {
  return request({
    url: `/api/miniprogram/template-messages/tasks/${taskId}`,
    method: 'get'
  })
}

// 取消发送任务
export function cancelTask(taskId) {
  return request({
    url: `/api/miniprogram/template-messages/tasks/${taskId}/cancel`,
    method: 'post'
  })
}

// 获取消息点击统计
export function getClickStatistics(params) {
  return request({
    url: '/api/miniprogram/template-messages/click-statistics',
    method: 'get',
    params
  })
}

// 获取用户消息历史
export function getUserMessageHistory(openid, params) {
  return request({
    url: `/api/miniprogram/users/${openid}/message-history`,
    method: 'get',
    params
  })
}

// 批量删除消息记录
export function batchDeleteMessages(ids) {
  return request({
    url: '/api/miniprogram/template-messages/batch-delete',
    method: 'post',
    data: { ids }
  })
}

// 获取消息发送趋势
export function getMessageTrends(params) {
  return request({
    url: '/api/miniprogram/template-messages/trends',
    method: 'get',
    params
  })
}

// 获取模板消息配额
export function getMessageQuota() {
  return request({
    url: '/api/miniprogram/template-messages/quota',
    method: 'get'
  })
}

// 申请模板消息配额
export function applyMessageQuota(data) {
  return request({
    url: '/api/miniprogram/template-messages/quota/apply',
    method: 'post',
    data
  })
}