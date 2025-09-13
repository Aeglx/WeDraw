import request from '@/utils/request'

// 查询菜单列表
export function listMenus(query) {
  return request({
    url: '/api/wechat-official/api/menus',
    method: 'get',
    params: query
  })
}

// 查询菜单详细
export function getMenu(menuId) {
  return request({
    url: '/api/wechat-official/api/menus/' + menuId,
    method: 'get'
  })
}

// 新增菜单
export function addMenu(data) {
  return request({
    url: '/api/wechat-official/api/menus',
    method: 'post',
    data: data
  })
}

// 修改菜单
export function updateMenu(data) {
  return request({
    url: '/api/wechat-official/api/menus/' + data.id,
    method: 'put',
    data: data
  })
}

// 删除菜单
export function delMenu(menuId) {
  return request({
    url: '/api/wechat-official/api/menus/' + menuId,
    method: 'delete'
  })
}

// 发布菜单到微信
export function publishMenu() {
  return request({
    url: '/api/wechat-official/api/menus/publish',
    method: 'post'
  })
}

// 获取微信菜单
export function getWechatMenu() {
  return request({
    url: '/api/wechat-official/api/menus/wechat',
    method: 'get'
  })
}

// 同步微信菜单
export function syncWechatMenu() {
  return request({
    url: '/api/wechat-official/api/menus/sync',
    method: 'post'
  })
}

// 删除微信菜单
export function deleteWechatMenu() {
  return request({
    url: '/api/wechat-official/api/menus/wechat',
    method: 'delete'
  })
}