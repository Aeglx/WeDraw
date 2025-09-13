import request from '@/utils/request'

// 查询消息列表
export function listMessages(query) {
  return request({
    url: '/api/wechat/message/list',
    method: 'get',
    params: query
  })
}

// 查询消息详细
export function getMessage(messageId) {
  return request({
    url: '/api/wechat/message/' + messageId,
    method: 'get'
  })
}

// 新增消息
export function addMessage(data) {
  return request({
    url: '/api/wechat/message',
    method: 'post',
    data: data
  })
}

// 修改消息
export function updateMessage(data) {
  return request({
    url: '/api/wechat/message',
    method: 'put',
    data: data
  })
}

// 删除消息
export function delMessage(messageId) {
  return request({
    url: '/api/wechat/message/' + messageId,
    method: 'delete'
  })
}

// 发送消息
export function sendMessage(data) {
  return request({
    url: '/api/wechat/message/send',
    method: 'post',
    data: data
  })
}

// 群发消息
export function broadcastMessage(data) {
  return request({
    url: '/api/wechat/message/broadcast',
    method: 'post',
    data: data
  })
}

// 获取消息统计
export function getMessageStats() {
  return request({
    url: '/api/wechat/message/stats',
    method: 'get'
  })
}

// 导出消息记录
export function exportMessage(query) {
  return request({
    url: '/api/wechat/message/export',
    method: 'get',
    params: query
  })
}

// 获取消息模板列表
export function getMessageTemplates() {
  return request({
    url: '/api/wechat/message/templates',
    method: 'get'
  })
}

// 预览消息
export function previewMessage(data) {
  return request({
    url: '/api/wechat/message/preview',
    method: 'post',
    data: data
  })
}