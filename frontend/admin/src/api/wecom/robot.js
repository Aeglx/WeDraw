import request from '@/utils/request'

// 获取机器人列表
export function getRobotList(params) {
  return request({
    url: '/api/wecom/robots',
    method: 'get',
    params
  })
}

// 获取机器人详情
export function getRobotDetail(id) {
  return request({
    url: `/api/wecom/robots/${id}`,
    method: 'get'
  })
}

// 创建机器人
export function createRobot(data) {
  return request({
    url: '/api/wecom/robots',
    method: 'post',
    data
  })
}

// 更新机器人
export function updateRobot(id, data) {
  return request({
    url: `/api/wecom/robots/${id}`,
    method: 'put',
    data
  })
}

// 删除机器人
export function deleteRobot(id) {
  return request({
    url: `/api/wecom/robots/${id}`,
    method: 'delete'
  })
}

// 更新机器人状态
export function updateRobotStatus(id, data) {
  return request({
    url: `/api/wecom/robots/${id}/status`,
    method: 'put',
    data
  })
}

// 测试机器人
export function testRobot(id, data) {
  return request({
    url: `/api/wecom/robots/${id}/test`,
    method: 'post',
    data
  })
}

// 发送机器人消息
export function sendRobotMessage(id, data) {
  return request({
    url: `/api/wecom/robots/${id}/send`,
    method: 'post',
    data
  })
}

// 获取机器人消息记录
export function getRobotMessages(params) {
  return request({
    url: '/api/wecom/robot-messages',
    method: 'get',
    params
  })
}

// 同步机器人状态
export function syncRobotStatus() {
  return request({
    url: '/api/wecom/robots/sync',
    method: 'post'
  })
}

// 获取机器人统计信息
export function getStatistics() {
  return request({
    url: '/api/wecom/robots/statistics',
    method: 'get'
  })
}

// 批量删除机器人
export function batchDeleteRobots(ids) {
  return request({
    url: '/api/wecom/robots/batch',
    method: 'delete',
    data: { ids }
  })
}

// 导出机器人数据
export function exportRobots(params) {
  return request({
    url: '/api/wecom/robots/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取机器人配置模板
export function getRobotTemplates() {
  return request({
    url: '/api/wecom/robot-templates',
    method: 'get'
  })
}

// 创建机器人配置模板
export function createRobotTemplate(data) {
  return request({
    url: '/api/wecom/robot-templates',
    method: 'post',
    data
  })
}

// 应用机器人配置模板
export function applyRobotTemplate(robotId, templateId) {
  return request({
    url: `/api/wecom/robots/${robotId}/apply-template`,
    method: 'post',
    data: { templateId }
  })
}

// 获取机器人发送统计
export function getRobotSendStats(id, params) {
  return request({
    url: `/api/wecom/robots/${id}/send-stats`,
    method: 'get',
    params
  })
}

// 重置机器人Webhook
export function resetRobotWebhook(id) {
  return request({
    url: `/api/wecom/robots/${id}/reset-webhook`,
    method: 'post'
  })
}