import request from '@/utils/request'

/**
 * 查询用户列表
 * @param {Object} params 查询参数
 * @returns {Promise} 请求结果
 */
export function getUserList(params) {
  return request({
    url: '/wecom-service/api/contacts/users',
    method: 'get',
    params
  })
}

/**
 * 查询用户详细
 * @param {string} userid 用户ID
 * @returns {Promise} 请求结果
 */
export function getUserDetail(userid) {
  return request({
    url: `/wecom-service/api/contacts/users/${userid}`,
    method: 'get'
  })
}

/**
 * 同步通讯录数据
 * @param {Object} data 同步参数
 * @returns {Promise} 请求结果
 */
export function syncContacts(data) {
  return request({
    url: '/wecom-service/api/contacts/sync',
    method: 'post',
    data,
    timeout: 300000 // 5分钟超时
  })
}

/**
 * 获取通讯录统计信息
 * @returns {Promise} 请求结果
 */
export function getStatistics() {
  return request({
    url: '/wecom-service/api/contacts/statistics',
    method: 'get'
  })
}

/**
 * 导出通讯录数据
 * @param {Object} params 导出参数
 * @returns {Promise} 请求结果
 */
export function exportContacts(params) {
  return request({
    url: '/wecom-service/api/contacts/export',
    method: 'get',
    params,
    responseType: 'blob',
    timeout: 60000 // 1分钟超时
  })
}

/**
 * 获取同步状态
 * @returns {Promise} 请求结果
 */
export function getSyncStatus() {
  return request({
    url: '/wecom-service/api/contacts/sync/status',
    method: 'get'
  })
}

/**
 * 批量获取用户信息
 * @param {Object} data 用户ID列表
 * @returns {Promise} 请求结果
 */
export function batchGetUsers(data) {
  return request({
    url: '/wecom-service/api/contacts/users/batch',
    method: 'post',
    data
  })
}

/**
 * 搜索用户
 * @param {Object} params 搜索参数
 * @returns {Promise} 请求结果
 */
export function searchUsers(params) {
  return request({
    url: '/wecom-service/api/contacts/users/search',
    method: 'get',
    params
  })
}

/**
 * 获取用户所在部门
 * @param {string} userid 用户ID
 * @returns {Promise} 请求结果
 */
export function getUserDepartments(userid) {
  return request({
    url: `/wecom-service/api/contacts/users/${userid}/departments`,
    method: 'get'
  })
}

/**
 * 获取部门用户列表
 * @param {number} departmentId 部门ID
 * @param {Object} params 查询参数
 * @returns {Promise} 请求结果
 */
export function getDepartmentUsers(departmentId, params) {
  return request({
    url: `/wecom-service/api/contacts/departments/${departmentId}/users`,
    method: 'get',
    params
  })
}