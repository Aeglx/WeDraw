import request from '@/utils/request'

// 获取发送记录列表
export function getRecordList(params) {
  return request({
    url: '/api/message-center/records',
    method: 'get',
    params
  })
}

// 获取发送记录详情
export function getRecordDetail(id) {
  return request({
    url: `/api/message-center/records/${id}`,
    method: 'get'
  })
}

// 删除发送记录
export function deleteRecord(id) {
  return request({
    url: `/api/message-center/records/${id}`,
    method: 'delete'
  })
}

// 批量删除发送记录
export function batchDeleteRecords(data) {
  return request({
    url: '/api/message-center/records/batch-delete',
    method: 'post',
    data
  })
}

// 重发消息
export function resendMessage(id) {
  return request({
    url: `/api/message-center/records/${id}/resend`,
    method: 'post'
  })
}

// 批量重发消息
export function batchResendMessages(data) {
  return request({
    url: '/api/message-center/records/batch-resend',
    method: 'post',
    data
  })
}

// 导出发送记录
export function exportRecords(params) {
  return request({
    url: '/api/message-center/records/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取发送记录统计
export function getRecordStats(params) {
  return request({
    url: '/api/message-center/records/stats',
    method: 'get',
    params
  })
}

// 发送消息
export function sendMessage(data) {
  return request({
    url: '/api/message-center/messages/send',
    method: 'post',
    data
  })
}

// 批量发送消息
export function batchSendMessage(data) {
  return request({
    url: '/api/message-center/messages/batch-send',
    method: 'post',
    data
  })
}

// 获取发送任务列表
export function getSendTaskList(params) {
  return request({
    url: '/api/message-center/send-tasks',
    method: 'get',
    params
  })
}

// 获取发送任务详情
export function getSendTaskDetail(id) {
  return request({
    url: `/api/message-center/send-tasks/${id}`,
    method: 'get'
  })
}

// 取消发送任务
export function cancelSendTask(id) {
  return request({
    url: `/api/message-center/send-tasks/${id}/cancel`,
    method: 'post'
  })
}

// 暂停发送任务
export function pauseSendTask(id) {
  return request({
    url: `/api/message-center/send-tasks/${id}/pause`,
    method: 'post'
  })
}

// 恢复发送任务
export function resumeSendTask(id) {
  return request({
    url: `/api/message-center/send-tasks/${id}/resume`,
    method: 'post'
  })
}

// 获取发送统计趋势
export function getSendTrend(params) {
  return request({
    url: '/api/message-center/records/trend',
    method: 'get',
    params
  })
}

// 获取发送成功率统计
export function getSuccessRateStats(params) {
  return request({
    url: '/api/message-center/records/success-rate',
    method: 'get',
    params
  })
}

// 获取消息类型统计
export function getTypeStats(params) {
  return request({
    url: '/api/message-center/records/type-stats',
    method: 'get',
    params
  })
}

// 获取模板使用统计
export function getTemplateUsageStats(params) {
  return request({
    url: '/api/message-center/records/template-usage',
    method: 'get',
    params
  })
}

// 获取发送日志
export function getSendLogs(recordId, params) {
  return request({
    url: `/api/message-center/records/${recordId}/logs`,
    method: 'get',
    params
  })
}

// 获取失败原因统计
export function getFailureReasonStats(params) {
  return request({
    url: '/api/message-center/records/failure-reasons',
    method: 'get',
    params
  })
}

// 重试失败记录
export function retryFailedRecords(data) {
  return request({
    url: '/api/message-center/records/retry-failed',
    method: 'post',
    data
  })
}

// 清理过期记录
export function cleanExpiredRecords(data) {
  return request({
    url: '/api/message-center/records/clean-expired',
    method: 'post',
    data
  })
}

// 获取发送配置
export function getSendConfig() {
  return request({
    url: '/api/message-center/send-config',
    method: 'get'
  })
}

// 更新发送配置
export function updateSendConfig(data) {
  return request({
    url: '/api/message-center/send-config',
    method: 'put',
    data
  })
}

// 测试发送配置
export function testSendConfig(data) {
  return request({
    url: '/api/message-center/send-config/test',
    method: 'post',
    data
  })
}

// 获取发送渠道列表
export function getSendChannels() {
  return request({
    url: '/api/message-center/send-channels',
    method: 'get'
  })
}

// 创建发送渠道
export function createSendChannel(data) {
  return request({
    url: '/api/message-center/send-channels',
    method: 'post',
    data
  })
}

// 更新发送渠道
export function updateSendChannel(id, data) {
  return request({
    url: `/api/message-center/send-channels/${id}`,
    method: 'put',
    data
  })
}

// 删除发送渠道
export function deleteSendChannel(id) {
  return request({
    url: `/api/message-center/send-channels/${id}`,
    method: 'delete'
  })
}

// 测试发送渠道
export function testSendChannel(id, data) {
  return request({
    url: `/api/message-center/send-channels/${id}/test`,
    method: 'post',
    data
  })
}

// 获取发送队列状态
export function getQueueStatus() {
  return request({
    url: '/api/message-center/queue/status',
    method: 'get'
  })
}

// 清空发送队列
export function clearQueue(data) {
  return request({
    url: '/api/message-center/queue/clear',
    method: 'post',
    data
  })
}

// 获取发送限制配置
export function getSendLimits() {
  return request({
    url: '/api/message-center/send-limits',
    method: 'get'
  })
}

// 更新发送限制配置
export function updateSendLimits(data) {
  return request({
    url: '/api/message-center/send-limits',
    method: 'put',
    data
  })
}

// 获取黑名单列表
export function getBlacklist(params) {
  return request({
    url: '/api/message-center/blacklist',
    method: 'get',
    params
  })
}

// 添加到黑名单
export function addToBlacklist(data) {
  return request({
    url: '/api/message-center/blacklist',
    method: 'post',
    data
  })
}

// 从黑名单移除
export function removeFromBlacklist(id) {
  return request({
    url: `/api/message-center/blacklist/${id}`,
    method: 'delete'
  })
}

// 批量导入黑名单
export function importBlacklist(data) {
  return request({
    url: '/api/message-center/blacklist/import',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导出黑名单
export function exportBlacklist(params) {
  return request({
    url: '/api/message-center/blacklist/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}