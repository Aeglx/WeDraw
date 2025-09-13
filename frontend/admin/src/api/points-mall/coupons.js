import request from '@/utils/request'

// 获取优惠券列表
export function getCouponsList(params) {
  return request({
    url: '/api/points-mall/coupons/list',
    method: 'get',
    params
  })
}

// 获取优惠券详情
export function getCouponDetail(id) {
  return request({
    url: `/api/points-mall/coupons/${id}`,
    method: 'get'
  })
}

// 创建优惠券
export function createCoupon(data) {
  return request({
    url: '/api/points-mall/coupons',
    method: 'post',
    data
  })
}

// 更新优惠券
export function updateCoupon(id, data) {
  return request({
    url: `/api/points-mall/coupons/${id}`,
    method: 'put',
    data
  })
}

// 删除优惠券
export function deleteCoupon(id) {
  return request({
    url: `/api/points-mall/coupons/${id}`,
    method: 'delete'
  })
}

// 更新优惠券状态
export function updateCouponStatus(id, data) {
  return request({
    url: `/api/points-mall/coupons/${id}/status`,
    method: 'put',
    data
  })
}

// 批量操作优惠券
export function batchUpdateCoupons(data) {
  return request({
    url: '/api/points-mall/coupons/batch',
    method: 'put',
    data
  })
}

// 获取优惠券统计
export function getCouponStatistics(params = {}) {
  return request({
    url: '/api/points-mall/coupons/statistics',
    method: 'get',
    params
  })
}

// 导出优惠券
export function exportCoupons(params = {}) {
  return request({
    url: '/api/points-mall/coupons/export',
    method: 'get',
    params
  })
}

// 获取优惠券使用记录
export function getCouponUsageRecords(id, params) {
  return request({
    url: `/api/points-mall/coupons/${id}/usage-records`,
    method: 'get',
    params
  })
}

// 发放优惠券给用户
export function issueCouponToUser(data) {
  return request({
    url: '/api/points-mall/coupons/issue',
    method: 'post',
    data
  })
}

// 批量发放优惠券
export function batchIssueCoupons(data) {
  return request({
    url: '/api/points-mall/coupons/batch-issue',
    method: 'post',
    data
  })
}

// 回收用户优惠券
export function revokeCoupon(data) {
  return request({
    url: '/api/points-mall/coupons/revoke',
    method: 'post',
    data
  })
}

// 获取优惠券模板
export function getCouponTemplates(params) {
  return request({
    url: '/api/points-mall/coupons/templates',
    method: 'get',
    params
  })
}

// 创建优惠券模板
export function createCouponTemplate(data) {
  return request({
    url: '/api/points-mall/coupons/templates',
    method: 'post',
    data
  })
}

// 应用优惠券模板
export function applyCouponTemplate(templateId, data) {
  return request({
    url: `/api/points-mall/coupons/templates/${templateId}/apply`,
    method: 'post',
    data
  })
}

// 获取优惠券使用统计
export function getCouponUsageStats(params) {
  return request({
    url: '/api/points-mall/coupons/usage-stats',
    method: 'get',
    params
  })
}

// 获取优惠券转化率统计
export function getCouponConversionStats(params) {
  return request({
    url: '/api/points-mall/coupons/conversion-stats',
    method: 'get',
    params
  })
}

// 获取优惠券趋势数据
export function getCouponTrends(params) {
  return request({
    url: '/api/points-mall/coupons/trends',
    method: 'get',
    params
  })
}

// 获取用户优惠券列表
export function getUserCoupons(userId, params) {
  return request({
    url: `/api/points-mall/users/${userId}/coupons`,
    method: 'get',
    params
  })
}

// 验证优惠券
export function validateCoupon(data) {
  return request({
    url: '/api/points-mall/coupons/validate',
    method: 'post',
    data
  })
}

// 使用优惠券
export function useCoupon(data) {
  return request({
    url: '/api/points-mall/coupons/use',
    method: 'post',
    data
  })
}

// 获取优惠券二维码
export function getCouponQRCode(id) {
  return request({
    url: `/api/points-mall/coupons/${id}/qrcode`,
    method: 'get'
  })
}

// 获取优惠券分享链接
export function getCouponShareLink(id) {
  return request({
    url: `/api/points-mall/coupons/${id}/share-link`,
    method: 'get'
  })
}

// 获取优惠券活动列表
export function getCouponActivities(params) {
  return request({
    url: '/api/points-mall/coupons/activities',
    method: 'get',
    params
  })
}

// 创建优惠券活动
export function createCouponActivity(data) {
  return request({
    url: '/api/points-mall/coupons/activities',
    method: 'post',
    data
  })
}

// 获取优惠券规则配置
export function getCouponRules() {
  return request({
    url: '/api/points-mall/coupons/rules',
    method: 'get'
  })
}

// 更新优惠券规则配置
export function updateCouponRules(data) {
  return request({
    url: '/api/points-mall/coupons/rules',
    method: 'put',
    data
  })
}

// 获取优惠券分类
export function getCouponCategories() {
  return request({
    url: '/api/points-mall/coupons/categories',
    method: 'get'
  })
}

// 创建优惠券分类
export function createCouponCategory(data) {
  return request({
    url: '/api/points-mall/coupons/categories',
    method: 'post',
    data
  })
}

// 获取优惠券推荐
export function getCouponRecommendations(params) {
  return request({
    url: '/api/points-mall/coupons/recommendations',
    method: 'get',
    params
  })
}

// 获取优惠券效果分析
export function getCouponEffectAnalysis(id, params) {
  return request({
    url: `/api/points-mall/coupons/${id}/effect-analysis`,
    method: 'get',
    params
  })
}

// 复制优惠券
export function copyCoupon(id, data) {
  return request({
    url: `/api/points-mall/coupons/${id}/copy`,
    method: 'post',
    data
  })
}

// 预览优惠券
export function previewCoupon(data) {
  return request({
    url: '/api/points-mall/coupons/preview',
    method: 'post',
    data
  })
}

// 获取优惠券导入模板
export function getCouponImportTemplate() {
  return request({
    url: '/api/points-mall/coupons/import-template',
    method: 'get'
  })
}

// 导入优惠券
export function importCoupons(data) {
  return request({
    url: '/api/points-mall/coupons/import',
    method: 'post',
    data
  })
}

// 获取优惠券审核列表
export function getCouponAuditList(params) {
  return request({
    url: '/api/points-mall/coupons/audit-list',
    method: 'get',
    params
  })
}

// 审核优惠券
export function auditCoupon(id, data) {
  return request({
    url: `/api/points-mall/coupons/${id}/audit`,
    method: 'put',
    data
  })
}