import request from '@/utils/request'

// 查询岗位列表
export function listPost(query) {
  return request({
    url: '/api/system/post/list',
    method: 'get',
    params: query
  })
}

// 查询岗位详细
export function getPost(postId) {
  return request({
    url: '/api/system/post/' + postId,
    method: 'get'
  })
}

// 新增岗位
export function addPost(data) {
  return request({
    url: '/api/system/post',
    method: 'post',
    data: data
  })
}

// 修改岗位
export function updatePost(data) {
  return request({
    url: '/api/system/post',
    method: 'put',
    data: data
  })
}

// 删除岗位
export function delPost(postId) {
  return request({
    url: '/api/system/post/' + postId,
    method: 'delete'
  })
}

// 批量删除岗位
export function batchDelPost(postIds) {
  return request({
    url: '/api/system/post/batch',
    method: 'delete',
    data: postIds
  })
}

// 岗位状态修改
export function changePostStatus(postId, status) {
  const data = {
    postId,
    status
  }
  return request({
    url: '/api/system/post/changeStatus',
    method: 'put',
    data: data
  })
}

// 导出岗位
export function exportPost(query) {
  return request({
    url: '/api/system/post/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}

// 导入岗位
export function importPost(data) {
  return request({
    url: '/api/system/post/import',
    method: 'post',
    data: data
  })
}

// 获取岗位导入模板
export function importTemplate() {
  return request({
    url: '/api/system/post/importTemplate',
    method: 'post',
    responseType: 'blob'
  })
}

// 岗位排序
export function sortPost(data) {
  return request({
    url: '/api/system/post/sort',
    method: 'put',
    data: data
  })
}

// 复制岗位
export function copyPost(postId, data) {
  return request({
    url: '/api/system/post/copy/' + postId,
    method: 'post',
    data: data
  })
}

// 获取岗位统计信息
export function getPostStats() {
  return request({
    url: '/api/system/post/stats',
    method: 'get'
  })
}

// 获取岗位成员列表
export function getPostMembers(postId, query) {
  return request({
    url: '/api/system/post/members/' + postId,
    method: 'get',
    params: query
  })
}

// 添加岗位成员
export function addPostMember(postId, userIds) {
  return request({
    url: '/api/system/post/members/' + postId,
    method: 'post',
    data: { userIds }
  })
}

// 移除岗位成员
export function removePostMember(postId, userId) {
  return request({
    url: '/api/system/post/members/' + postId + '/' + userId,
    method: 'delete'
  })
}

// 检查岗位编码是否唯一
export function checkPostCodeUnique(postCode, postId) {
  return request({
    url: '/api/system/post/checkPostCodeUnique',
    method: 'post',
    data: {
      postCode,
      postId
    }
  })
}

// 检查岗位名称是否唯一
export function checkPostNameUnique(postName, postId) {
  return request({
    url: '/api/system/post/checkPostNameUnique',
    method: 'post',
    data: {
      postName,
      postId
    }
  })
}

// 获取岗位权限
export function getPostPermissions(postId) {
  return request({
    url: '/api/system/post/permissions/' + postId,
    method: 'get'
  })
}

// 设置岗位权限
export function setPostPermissions(postId, permissions) {
  return request({
    url: '/api/system/post/permissions/' + postId,
    method: 'put',
    data: { permissions }
  })
}

// 获取岗位配置
export function getPostConfig(postId) {
  return request({
    url: '/api/system/post/config/' + postId,
    method: 'get'
  })
}

// 更新岗位配置
export function updatePostConfig(postId, config) {
  return request({
    url: '/api/system/post/config/' + postId,
    method: 'put',
    data: config
  })
}

// 获取岗位历史记录
export function getPostHistory(postId, query) {
  return request({
    url: '/api/system/post/history/' + postId,
    method: 'get',
    params: query
  })
}

// 恢复已删除的岗位
export function restorePost(postId) {
  return request({
    url: '/api/system/post/restore/' + postId,
    method: 'put'
  })
}

// 彻底删除岗位
export function permanentDelPost(postId) {
  return request({
    url: '/api/system/post/permanent/' + postId,
    method: 'delete'
  })
}

// 获取已删除的岗位列表
export function getDeletedPostList(query) {
  return request({
    url: '/api/system/post/deleted',
    method: 'get',
    params: query
  })
}

// 岗位合并
export function mergePost(sourcePostId, targetPostId) {
  return request({
    url: '/api/system/post/merge',
    method: 'post',
    data: {
      sourcePostId,
      targetPostId
    }
  })
}

// 获取岗位层级关系
export function getPostHierarchy() {
  return request({
    url: '/api/system/post/hierarchy',
    method: 'get'
  })
}

// 设置岗位层级关系
export function setPostHierarchy(data) {
  return request({
    url: '/api/system/post/hierarchy',
    method: 'put',
    data: data
  })
}

// 获取岗位职责描述
export function getPostResponsibilities(postId) {
  return request({
    url: '/api/system/post/responsibilities/' + postId,
    method: 'get'
  })
}

// 更新岗位职责描述
export function updatePostResponsibilities(postId, responsibilities) {
  return request({
    url: '/api/system/post/responsibilities/' + postId,
    method: 'put',
    data: { responsibilities }
  })
}

// 获取岗位要求
export function getPostRequirements(postId) {
  return request({
    url: '/api/system/post/requirements/' + postId,
    method: 'get'
  })
}

// 更新岗位要求
export function updatePostRequirements(postId, requirements) {
  return request({
    url: '/api/system/post/requirements/' + postId,
    method: 'put',
    data: { requirements }
  })
}