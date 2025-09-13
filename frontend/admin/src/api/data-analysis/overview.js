import request from '@/utils/request'

// 获取概览统计数据
export function getOverviewStats(params) {
  return request({
    url: '/api/data-analysis/overview/stats',
    method: 'get',
    params
  })
}

// 获取访问趋势数据
export function getVisitTrend(params) {
  return request({
    url: '/api/data-analysis/overview/visit-trend',
    method: 'get',
    params
  })
}

// 获取用户分布数据
export function getUserDistribution(params) {
  return request({
    url: '/api/data-analysis/overview/user-distribution',
    method: 'get',
    params
  })
}

// 获取热门功能数据
export function getPopularFeatures(params) {
  return request({
    url: '/api/data-analysis/overview/popular-features',
    method: 'get',
    params
  })
}

// 获取实时数据
export function getRealtimeData(params) {
  return request({
    url: '/api/data-analysis/overview/realtime',
    method: 'get',
    params
  })
}

// 获取系统状态
export function getSystemStatus(params) {
  return request({
    url: '/api/data-analysis/overview/system-status',
    method: 'get',
    params
  })
}

// 获取收入趋势
export function getRevenueTrend(params) {
  return request({
    url: '/api/data-analysis/overview/revenue-trend',
    method: 'get',
    params
  })
}

// 获取用户增长趋势
export function getUserGrowthTrend(params) {
  return request({
    url: '/api/data-analysis/overview/user-growth',
    method: 'get',
    params
  })
}

// 获取订单趋势
export function getOrderTrend(params) {
  return request({
    url: '/api/data-analysis/overview/order-trend',
    method: 'get',
    params
  })
}

// 获取地域分布数据
export function getRegionDistribution(params) {
  return request({
    url: '/api/data-analysis/overview/region-distribution',
    method: 'get',
    params
  })
}

// 获取设备分布数据
export function getDeviceDistribution(params) {
  return request({
    url: '/api/data-analysis/overview/device-distribution',
    method: 'get',
    params
  })
}

// 获取流量来源数据
export function getTrafficSource(params) {
  return request({
    url: '/api/data-analysis/overview/traffic-source',
    method: 'get',
    params
  })
}

// 获取转化漏斗数据
export function getConversionFunnel(params) {
  return request({
    url: '/api/data-analysis/overview/conversion-funnel',
    method: 'get',
    params
  })
}

// 获取留存率数据
export function getRetentionRate(params) {
  return request({
    url: '/api/data-analysis/overview/retention-rate',
    method: 'get',
    params
  })
}

// 获取活跃度数据
export function getActivityData(params) {
  return request({
    url: '/api/data-analysis/overview/activity',
    method: 'get',
    params
  })
}

// 导出概览报告
export function exportOverviewReport(params) {
  return request({
    url: '/api/data-analysis/overview/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取对比数据
export function getComparisonData(params) {
  return request({
    url: '/api/data-analysis/overview/comparison',
    method: 'get',
    params
  })
}

// 获取预测数据
export function getForecastData(params) {
  return request({
    url: '/api/data-analysis/overview/forecast',
    method: 'get',
    params
  })
}

// 获取异常检测数据
export function getAnomalyDetection(params) {
  return request({
    url: '/api/data-analysis/overview/anomaly',
    method: 'get',
    params
  })
}

// 获取关键指标
export function getKeyMetrics(params) {
  return request({
    url: '/api/data-analysis/overview/key-metrics',
    method: 'get',
    params
  })
}

// 获取业务指标
export function getBusinessMetrics(params) {
  return request({
    url: '/api/data-analysis/overview/business-metrics',
    method: 'get',
    params
  })
}