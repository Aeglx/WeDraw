import request from '@/utils/request'

// 用户管理相关API
export const userApi = {
  // 获取用户列表
  getUserList(params) {
    return request({
      url: '/api/users',
      method: 'get',
      params
    })
  },
  // 获取用户详情
  getUserDetail(id) {
    return request({
      url: `/api/users/${id}`,
      method: 'get'
    })
  },
  // 创建用户
  createUser(data) {
    return request({
      url: '/api/users',
      method: 'post',
      data
    })
  },
  // 更新用户
  updateUser(id, data) {
    return request({
      url: `/api/users/${id}`,
      method: 'put',
      data
    })
  },
  // 删除用户
  deleteUser(id) {
    return request({
      url: `/api/users/${id}`,
      method: 'delete'
    })
  }
}

// 公众号管理相关API
export const officialApi = {
  // 粉丝管理
  getFansList(params) {
    return request({
      url: '/api/official/fans',
      method: 'get',
      params
    })
  },
  updateFan(id, data) {
    return request({
      url: `/api/official/fans/${id}`,
      method: 'put',
      data
    })
  },
  sendMessage(data) {
    return request({
      url: '/api/official/message/send',
      method: 'post',
      data
    })
  },
  
  // 配置管理
  getConfig() {
    return request({
      url: '/api/official/config',
      method: 'get'
    })
  },
  saveConfig(data) {
    return request({
      url: '/api/official/config',
      method: 'post',
      data
    })
  },
  testConnection(data) {
    return request({
      url: '/api/official/config/test',
      method: 'post',
      data
    })
  },
  
  // 菜单管理
  getMenu() {
    return request({
      url: '/api/official/menu',
      method: 'get'
    })
  },
  publishMenu(data) {
    return request({
      url: '/api/official/menu/publish',
      method: 'post',
      data
    })
  },
  deleteMenu() {
    return request({
      url: '/api/official/menu',
      method: 'delete'
    })
  },
  
  // 自动回复
  getReplyConfig() {
    return request({
      url: '/api/official/reply',
      method: 'get'
    })
  },
  saveReplyConfig(data) {
    return request({
      url: '/api/official/reply',
      method: 'post',
      data
    })
  },
  
  // 素材管理
  getMaterialList(params) {
    return request({
      url: '/api/official/material',
      method: 'get',
      params
    })
  },
  uploadMaterial(data) {
    return request({
      url: '/api/official/material/upload',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  deleteMaterial(id) {
    return request({
      url: `/api/official/material/${id}`,
      method: 'delete'
    })
  }
}

// 企业微信管理相关API
export const weworkApi = {
  // 配置管理
  getConfig() {
    return request({
      url: '/api/wework/config',
      method: 'get'
    })
  },
  saveConfig(data) {
    return request({
      url: '/api/wework/config',
      method: 'post',
      data
    })
  },
  testConnection(data) {
    return request({
      url: '/api/wework/config/test',
      method: 'post',
      data
    })
  },
  
  // 通讯录管理
  getDepartments() {
    return request({
      url: '/api/wework/departments',
      method: 'get'
    })
  },
  getMembers(params) {
    return request({
      url: '/api/wework/members',
      method: 'get',
      params
    })
  },
  syncDepartments() {
    return request({
      url: '/api/wework/sync/departments',
      method: 'post'
    })
  },
  syncMembers() {
    return request({
      url: '/api/wework/sync/members',
      method: 'post'
    })
  },
  sendMessage(data) {
    return request({
      url: '/api/wework/message/send',
      method: 'post',
      data
    })
  }
}

// 小程序管理相关API
export const miniprogramApi = {
  // 配置管理
  getConfig() {
    return request({
      url: '/api/miniprogram/config',
      method: 'get'
    })
  },
  saveConfig(data) {
    return request({
      url: '/api/miniprogram/config',
      method: 'post',
      data
    })
  },
  testConnection(data) {
    return request({
      url: '/api/miniprogram/config/test',
      method: 'post',
      data
    })
  },
  
  // 用户管理
  getUserList(params) {
    return request({
      url: '/api/miniprogram/users',
      method: 'get',
      params
    })
  },
  getUserStats() {
    return request({
      url: '/api/miniprogram/users/stats',
      method: 'get'
    })
  },
  exportUsers(params) {
    return request({
      url: '/api/miniprogram/users/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

// 积分商城相关API
export const pointsApi = {
  // 商品管理
  getGoodsList(params) {
    return request({
      url: '/api/points/goods',
      method: 'get',
      params
    })
  },
  createGoods(data) {
    return request({
      url: '/api/points/goods',
      method: 'post',
      data
    })
  },
  updateGoods(id, data) {
    return request({
      url: `/api/points/goods/${id}`,
      method: 'put',
      data
    })
  },
  deleteGoods(id) {
    return request({
      url: `/api/points/goods/${id}`,
      method: 'delete'
    })
  },
  
  // 订单管理
  getOrdersList(params) {
    return request({
      url: '/api/points/orders',
      method: 'get',
      params
    })
  },
  getOrderStats() {
    return request({
      url: '/api/points/orders/stats',
      method: 'get'
    })
  },
  updateOrderStatus(id, status) {
    return request({
      url: `/api/points/orders/${id}/status`,
      method: 'put',
      data: { status }
    })
  },
  shipOrder(id, data) {
    return request({
      url: `/api/points/orders/${id}/ship`,
      method: 'post',
      data
    })
  },
  exportOrders(params) {
    return request({
      url: '/api/points/orders/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

// 消息中心相关API
export const messageApi = {
  getMessageList(params) {
    return request({
      url: '/api/messages',
      method: 'get',
      params
    })
  },
  markAsRead(id) {
    return request({
      url: `/api/messages/${id}/read`,
      method: 'put'
    })
  },
  deleteMessage(id) {
    return request({
      url: `/api/messages/${id}`,
      method: 'delete'
    })
  },
  sendMessage(data) {
    return request({
      url: '/api/messages',
      method: 'post',
      data
    })
  },
  replyMessage(id, data) {
    return request({
      url: `/api/messages/${id}/reply`,
      method: 'post',
      data
    })
  }
}

// 数据分析相关API
export const analyticsApi = {
  getOverviewData(params) {
    return request({
      url: '/api/analytics/overview',
      method: 'get',
      params
    })
  },
  getChartData(params) {
    return request({
      url: '/api/analytics/chart',
      method: 'get',
      params
    })
  },
  getDetailData(params) {
    return request({
      url: '/api/analytics/detail',
      method: 'get',
      params
    })
  },
  exportData(params) {
    return request({
      url: '/api/analytics/export',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

// 文件上传相关API
export const uploadApi = {
  uploadFile(file, onProgress) {
    const formData = new FormData()
    formData.append('file', file)
    
    return request({
      url: '/api/upload',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    })
  },
  uploadImage(file, onProgress) {
    const formData = new FormData()
    formData.append('image', file)
    
    return request({
      url: '/api/upload/image',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    })
  }
}

// 认证相关API - 使用现有的auth模块
export { login, getUserInfo, logout, refreshToken } from './auth'