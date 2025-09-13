import request from '@/utils/request'

// 获取群聊列表
export function getGroupList(params) {
  return request({
    url: '/api/wecom/groups/list',
    method: 'get',
    params
  })
}

// 获取群聊详情
export function getGroupDetail(chatid) {
  return request({
    url: `/api/wecom/groups/${chatid}`,
    method: 'get'
  })
}

// 获取群成员列表
export function getGroupMembers(chatid) {
  return request({
    url: `/wecom/groups/${chatid}/members`,
    method: 'get'
  })
}

// 更新群聊信息
export function updateGroup(chatid, data) {
  return request({
    url: `/wecom/groups/${chatid}`,
    method: 'put',
    data
  })
}

// 删除群聊
export function deleteGroup(chatid) {
  return request({
    url: `/wecom/groups/${chatid}`,
    method: 'delete'
  })
}

// 移除群成员
export function removeMember(chatid, userid) {
  return request({
    url: `/wecom/groups/${chatid}/members/${userid}`,
    method: 'delete'
  })
}

// 添加群成员
export function addMember(chatid, data) {
  return request({
    url: `/wecom/groups/${chatid}/members`,
    method: 'post',
    data
  })
}

// 同步群聊数据
export function syncGroups(data) {
  return request({
    url: '/api/wecom/groups/sync',
    method: 'post',
    data
  })
}

// 导出群聊数据
export function exportGroups(params) {
  return request({
    url: '/api/wecom/groups/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取统计信息
export function getStatistics() {
  return request({
    url: '/api/wecom/groups/statistics',
    method: 'get'
  })
}

// 发送群消息
export function sendGroupMessage(data) {
  return request({
    url: '/api/wecom/groups/message',
    method: 'post',
    data
  })
}

// 设置群公告
export function setGroupNotice(chatid, data) {
  return request({
    url: `/wecom/groups/${chatid}/notice`,
    method: 'post',
    data
  })
}

// 获取群聊历史消息
export function getGroupMessages(chatid, params) {
  return request({
    url: `/wecom/groups/${chatid}/messages`,
    method: 'get',
    params
  })
}

// 创建群聊
export function createGroup(data) {
  return request({
    url: '/api/wecom/groups',
    method: 'post',
    data
  })
}

// 解散群聊
export function dismissGroup(chatid) {
  return request({
    url: `/wecom/groups/${chatid}/dismiss`,
    method: 'post'
  })
}

// 转让群主
export function transferOwner(chatid, data) {
  return request({
    url: `/wecom/groups/${chatid}/transfer`,
    method: 'post',
    data
  })
}

// 设置群管理员
export function setGroupAdmin(chatid, data) {
  return request({
    url: `/wecom/groups/${chatid}/admin`,
    method: 'post',
    data
  })
}

// 获取群聊二维码
export function getGroupQRCode(chatid) {
  return request({
    url: `/wecom/groups/${chatid}/qrcode`,
    method: 'get'
  })
}