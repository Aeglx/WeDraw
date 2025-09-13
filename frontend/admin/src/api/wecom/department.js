import request from '@/utils/request'

/**
 * 查询部门列表
 * @param {Object} params 查询参数
 * @returns {Promise} 请求结果
 */
export function getDepartmentList(params) {
  return request({
    url: '/api/wecom/api/contacts/departments',
    method: 'get',
    params
  })
}

/**
 * 获取部门树形结构
 * @param {Object} params 查询参数
 * @returns {Promise} 请求结果
 */
export function getDepartmentTree(params = {}) {
  return request({
    url: '/api/wecom/api/contacts/departments',
    method: 'get',
    params: {
      tree: true,
      ...params
    }
  })
}

/**
 * 查询部门详细
 * @param {number} departmentId 部门ID
 * @returns {Promise} 请求结果
 */
export function getDepartmentDetail(departmentId) {
  return request({
    url: `/api/wecom/api/contacts/departments/${departmentId}`,
    method: 'get'
  })
}

/**
 * 获取部门统计信息
 * @param {number} departmentId 部门ID
 * @returns {Promise} 请求结果
 */
export function getDepartmentStats(departmentId) {
  return request({
    url: `/api/wecom/api/contacts/departments/${departmentId}/stats`,
    method: 'get'
  })
}

/**
 * 获取子部门列表
 * @param {number} parentId 父部门ID
 * @param {Object} params 查询参数
 * @returns {Promise} 请求结果
 */
export function getChildDepartments(parentId, params) {
  return request({
    url: '/api/wecom/api/contacts/departments',
    method: 'get',
    params: {
      parent_id: parentId,
      ...params
    }
  })
}

/**
 * 同步部门数据
 * @param {Object} data 同步参数
 * @returns {Promise} 请求结果
 */
export function syncDepartments(data) {
  return request({
    url: '/api/wecom/api/contacts/departments/sync',
    method: 'post',
    data,
    timeout: 60000 // 1分钟超时
  })
}

/**
 * 获取部门路径
 * @param {number} departmentId 部门ID
 * @returns {Promise} 请求结果
 */
export function getDepartmentPath(departmentId) {
  return request({
    url: `/api/wecom/api/contacts/departments/${departmentId}/path`,
    method: 'get'
  })
}

/**
 * 搜索部门
 * @param {Object} params 搜索参数
 * @returns {Promise} 请求结果
 */
export function searchDepartments(params) {
  return request({
    url: '/api/wecom/api/contacts/departments/search',
    method: 'get',
    params
  })
}