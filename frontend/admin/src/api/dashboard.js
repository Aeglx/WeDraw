import request from '@/utils/request'

// 获取仪表盘统计数据
export function getDashboardStats() {
  return request({
    url: '/api/dashboard/stats',
    method: 'get'
  })
}

// 获取用户增长趋势数据
export function getUserGrowthData() {
  return request({
    url: '/api/dashboard/user-growth',
    method: 'get'
  })
}

// 获取订单统计数据
export function getOrderStatsData() {
  return request({
    url: '/api/dashboard/order-stats',
    method: 'get'
  })
}

// 获取收入趋势数据
export function getRevenueData() {
  return request({
    url: '/api/dashboard/revenue',
    method: 'get'
  })
}