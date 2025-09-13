import request from '@/utils/request'

// 获取用户列表
export function getUserList(params) {
  return request({
    url: '/api/miniprogram/users',
    method: 'get',
    params
  })
}

// 获取用户详情
export function getUserDetail(openid) {
  return request({
    url: `/api/miniprogram/users/${openid}`,
    method: 'get'
  })
}

// 更新用户状态
export function updateUserStatus(openid, data) {
  return request({
    url: `/api/miniprogram/users/${openid}/status`,
    method: 'put',
    data
  })
}

// 更新用户标签
export function updateUserTags(openid, data) {
  return request({
    url: `/api/miniprogram/users/${openid}/tags`,
    method: 'put',
    data
  })
}

// 批量更新用户标签
export function batchUpdateUserTags(data) {
  return request({
    url: '/api/miniprogram/users/batch/tags',
    method: 'put',
    data
  })
}

// 批量更新用户状态
export function batchUpdateUserStatus(data) {
  return request({
    url: '/api/miniprogram/users/batch/status',
    method: 'put',
    data
  })
}

// 获取用户行为数据
export function getUserBehavior(openid, params) {
  return request({
    url: `/api/miniprogram/users/${openid}/behavior`,
    method: 'get',
    params
  })
}

// 同步用户数据
export function syncUsers() {
  return request({
    url: '/api/miniprogram/users/sync',
    method: 'post'
  })
}

// 导出用户数据
export function exportUsers(params) {
  return request({
    url: '/api/miniprogram/users/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取用户统计信息
export function getStatistics() {
  return request({
    url: '/api/miniprogram/users/statistics',
    method: 'get'
  })
}

// 获取用户访问记录
export function getUserVisits(openid, params) {
  return request({
    url: `/api/miniprogram/users/${openid}/visits`,
    method: 'get',
    params
  })
}

// 获取用户操作记录
export function getUserActions(openid, params) {
  return request({
    url: `/api/miniprogram/users/${openid}/actions`,
    method: 'get',
    params
  })
}

// 获取用户订单记录
export function getUserOrders(openid, params) {
  return request({
    url: `/api/miniprogram/users/${openid}/orders`,
    method: 'get',
    params
  })
}

// 发送消息给用户
export function sendMessageToUser(openid, data) {
  return request({
    url: `/api/miniprogram/users/${openid}/message`,
    method: 'post',
    data
  })
}

// 批量发送消息
export function batchSendMessage(data) {
  return request({
    url: '/api/miniprogram/users/batch/message',
    method: 'post',
    data
  })
}

// 获取用户画像
export function getUserProfile(openid) {
  return request({
    url: `/api/miniprogram/users/${openid}/profile`,
    method: 'get'
  })
}

// 更新用户画像
export function updateUserProfile(openid, data) {
  return request({
    url: `/api/miniprogram/users/${openid}/profile`,
    method: 'put',
    data
  })
}

// 获取用户积分记录
export function getUserPoints(openid, params) {
  return request({
    url: `/api/miniprogram/users/${openid}/points`,
    method: 'get',
    params
  })
}

// 调整用户积分
export function adjustUserPoints(openid, data) {
  return request({
    url: `/api/miniprogram/users/${openid}/points/adjust`,
    method: 'post',
    data
  })
}

// 获取用户分组
export function getUserGroups() {
  return request({
    url: '/api/miniprogram/user-groups',
    method: 'get'
  })
}

// 创建用户分组
export function createUserGroup(data) {
  return request({
    url: '/api/miniprogram/user-groups',
    method: 'post',
    data
  })
}

// 更新用户分组
export function updateUserGroup(id, data) {
  return request({
    url: `/api/miniprogram/user-groups/${id}`,
    method: 'put',
    data
  })
}

// 删除用户分组
export function deleteUserGroup(id) {
  return request({
    url: `/api/miniprogram/user-groups/${id}`,
    method: 'delete'
  })
}

// 将用户添加到分组
export function addUserToGroup(groupId, data) {
  return request({
    url: `/api/miniprogram/user-groups/${groupId}/users`,
    method: 'post',
    data
  })
}

// 从分组中移除用户
export function removeUserFromGroup(groupId, openid) {
  return request({
    url: `/api/miniprogram/user-groups/${groupId}/users/${openid}`,
    method: 'delete'
  })
}