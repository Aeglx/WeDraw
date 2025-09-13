import request from '@/utils/request'

// 查询粉丝列表
export function listFans(query) {
  return request({
    url: '/api/wechat-official/api/fans',
    method: 'get',
    params: query
  })
}

// 查询粉丝详细
export function getFan(fanId) {
  return request({
    url: '/api/wechat-official/api/fans/' + fanId,
    method: 'get'
  })
}

// 修改粉丝信息
export function updateFan(data) {
  return request({
    url: '/api/wechat-official/api/fans/' + data.id,
    method: 'put',
    data: data
  })
}

// 拉黑粉丝
export function blockFan(fanId) {
  return request({
    url: '/api/wechat-official/api/fans/' + fanId + '/block',
    method: 'post'
  })
}

// 解除拉黑粉丝
export function unblockFan(fanId) {
  return request({
    url: '/api/wechat-official/api/fans/' + fanId + '/unblock',
    method: 'post'
  })
}

// 同步粉丝数据
export function syncFans() {
  return request({
    url: '/api/wechat-official/api/fans/sync',
    method: 'post'
  })
}

// 导出粉丝数据
export function exportFans(query) {
  return request({
    url: '/api/wechat-official/api/fans/export',
    method: 'get',
    params: query
  })
}

// 批量打标签
export function batchTagFans(data) {
  return request({
    url: '/api/wechat-official/api/fans/batch-tag',
    method: 'post',
    data: data
  })
}

// 获取粉丝统计数据
export function getFansStatistics() {
  return request({
    url: '/api/wechat-official/api/fans/statistics',
    method: 'get'
  })
}