import request from '@/utils/request'

// 查询标签列表
export function listTags(query) {
  return request({
    url: '/wechat-official/api/tags',
    method: 'get',
    params: query
  })
}

// 查询标签详细
export function getTag(tagId) {
  return request({
    url: '/wechat-official/api/tags/' + tagId,
    method: 'get'
  })
}

// 新增标签
export function addTag(data) {
  return request({
    url: '/wechat-official/api/tags',
    method: 'post',
    data: data
  })
}

// 修改标签
export function updateTag(data) {
  return request({
    url: '/wechat-official/api/tags/' + data.id,
    method: 'put',
    data: data
  })
}

// 删除标签
export function delTag(tagId) {
  return request({
    url: '/wechat-official/api/tags/' + tagId,
    method: 'delete'
  })
}

// 同步微信标签
export function syncTags() {
  return request({
    url: '/wechat-official/api/tags/sync',
    method: 'post'
  })
}