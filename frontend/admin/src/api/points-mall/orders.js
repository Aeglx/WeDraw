import request from '@/utils/request'

// 获取订单列表
export function getOrdersList(params) {
  return request({
    url: '/api/points-mall/orders/list',
    method: 'get',
    params
  })
}

// 获取订单详情
export function getOrderDetail(id) {
  return request({
    url: `/api/points-mall/orders/${id}`,
    method: 'get'
  })
}

// 更新订单状态
export function updateOrderStatus(id, data) {
  return request({
    url: `/api/points-mall/orders/${id}/status`,
    method: 'put',
    data
  })
}

// 订单发货
export function shipOrder(id, data) {
  return request({
    url: `/api/points-mall/orders/${id}/ship`,
    method: 'put',
    data
  })
}

// 取消订单
export function cancelOrder(id, data = {}) {
  return request({
    url: `/api/points-mall/orders/${id}/cancel`,
    method: 'put',
    data
  })
}

// 退款订单
export function refundOrder(id, data) {
  return request({
    url: `/api/points-mall/orders/${id}/refund`,
    method: 'put',
    data
  })
}

// 批量操作订单
export function batchUpdateOrders(data) {
  return request({
    url: '/api/points-mall/orders/batch',
    method: 'put',
    data
  })
}

// 获取订单统计
export function getOrderStatistics(params = {}) {
  return request({
    url: '/api/points-mall/orders/statistics',
    method: 'get',
    params
  })
}

// 导出订单
export function exportOrders(params = {}) {
  return request({
    url: '/api/points-mall/orders/export',
    method: 'get',
    params
  })
}

// 获取订单日志
export function getOrderLogs(id) {
  return request({
    url: `/api/points-mall/orders/${id}/logs`,
    method: 'get'
  })
}

// 添加订单备注
export function addOrderRemark(id, data) {
  return request({
    url: `/api/points-mall/orders/${id}/remark`,
    method: 'post',
    data
  })
}

// 获取物流信息
export function getShippingInfo(id) {
  return request({
    url: `/api/points-mall/orders/${id}/shipping`,
    method: 'get'
  })
}

// 更新收货地址
export function updateShippingAddress(id, data) {
  return request({
    url: `/api/points-mall/orders/${id}/address`,
    method: 'put',
    data
  })
}

// 获取订单趋势数据
export function getOrderTrends(params) {
  return request({
    url: '/api/points-mall/orders/trends',
    method: 'get',
    params
  })
}

// 获取热销商品统计
export function getHotProducts(params) {
  return request({
    url: '/api/points-mall/orders/hot-products',
    method: 'get',
    params
  })
}

// 获取用户订单统计
export function getUserOrderStats(params) {
  return request({
    url: '/api/points-mall/orders/user-stats',
    method: 'get',
    params
  })
}

// 获取订单收入统计
export function getOrderRevenue(params) {
  return request({
    url: '/api/points-mall/orders/revenue',
    method: 'get',
    params
  })
}

// 获取退款统计
export function getRefundStatistics(params) {
  return request({
    url: '/api/points-mall/orders/refund-stats',
    method: 'get',
    params
  })
}

// 获取订单地区分布
export function getOrderRegionStats(params) {
  return request({
    url: '/api/points-mall/orders/region-stats',
    method: 'get',
    params
  })
}

// 获取订单时间分布
export function getOrderTimeStats(params) {
  return request({
    url: '/api/points-mall/orders/time-stats',
    method: 'get',
    params
  })
}

// 同步订单状态
export function syncOrderStatus(id) {
  return request({
    url: `/api/points-mall/orders/${id}/sync`,
    method: 'post'
  })
}

// 重新计算订单金额
export function recalculateOrder(id) {
  return request({
    url: `/api/points-mall/orders/${id}/recalculate`,
    method: 'post'
  })
}

// 获取订单打印信息
export function getOrderPrintInfo(id) {
  return request({
    url: `/api/points-mall/orders/${id}/print`,
    method: 'get'
  })
}

// 批量打印订单
export function batchPrintOrders(data) {
  return request({
    url: '/api/points-mall/orders/batch-print',
    method: 'post',
    data
  })
}

// 获取订单模板
export function getOrderTemplate() {
  return request({
    url: '/api/points-mall/orders/template',
    method: 'get'
  })
}

// 导入订单
export function importOrders(data) {
  return request({
    url: '/api/points-mall/orders/import',
    method: 'post',
    data
  })
}

// 获取快递公司列表
export function getExpressCompanies() {
  return request({
    url: '/api/points-mall/orders/express-companies',
    method: 'get'
  })
}

// 查询快递信息
export function trackExpress(data) {
  return request({
    url: '/api/points-mall/orders/track-express',
    method: 'post',
    data
  })
}

// 获取订单配置
export function getOrderConfig() {
  return request({
    url: '/api/points-mall/orders/config',
    method: 'get'
  })
}

// 更新订单配置
export function updateOrderConfig(data) {
  return request({
    url: '/api/points-mall/orders/config',
    method: 'put',
    data
  })
}