import request from '@/utils/request'

// 获取商品列表
export function getProductList(params) {
  return request({
    url: '/api/points-mall/products/list',
    method: 'get',
    params
  })
}

// 获取商品详情
export function getProductDetail(id) {
  return request({
    url: `/api/points-mall/products/${id}`,
    method: 'get'
  })
}

// 创建商品
export function createProduct(data) {
  return request({
    url: '/api/points-mall/products',
    method: 'post',
    data
  })
}

// 更新商品
export function updateProduct(id, data) {
  return request({
    url: `/api/points-mall/products/${id}`,
    method: 'put',
    data
  })
}

// 删除商品
export function deleteProduct(id) {
  return request({
    url: `/api/points-mall/products/${id}`,
    method: 'delete'
  })
}

// 更新商品状态
export function updateProductStatus(id, data) {
  return request({
    url: `/api/points-mall/products/${id}/status`,
    method: 'put',
    data
  })
}

// 批量更新商品状态
export function batchUpdateProductStatus(data) {
  return request({
    url: '/api/points-mall/products/batch-status',
    method: 'put',
    data
  })
}

// 批量删除商品
export function batchDeleteProducts(ids) {
  return request({
    url: '/api/points-mall/products/batch-delete',
    method: 'post',
    data: { ids }
  })
}

// 获取商品统计
export function getProductStatistics(params) {
  return request({
    url: '/api/points-mall/products/statistics',
    method: 'get',
    params
  })
}

// 获取商品分类列表
export function getCategoryList(params) {
  return request({
    url: '/api/points-mall/categories/list',
    method: 'get',
    params
  })
}

// 创建商品分类
export function createCategory(data) {
  return request({
    url: '/api/points-mall/categories',
    method: 'post',
    data
  })
}

// 更新商品分类
export function updateCategory(id, data) {
  return request({
    url: `/api/points-mall/categories/${id}`,
    method: 'put',
    data
  })
}

// 删除商品分类
export function deleteCategory(id) {
  return request({
    url: `/api/points-mall/categories/${id}`,
    method: 'delete'
  })
}

// 导出商品
export function exportProducts(params) {
  return request({
    url: '/api/points-mall/products/export',
    method: 'get',
    params
  })
}

// 导入商品
export function importProducts(data) {
  return request({
    url: '/api/points-mall/products/import',
    method: 'post',
    data
  })
}

// 获取导入模板
export function getProductTemplate() {
  return request({
    url: '/api/points-mall/products/template',
    method: 'get'
  })
}

// 更新商品库存
export function updateProductStock(id, data) {
  return request({
    url: `/api/points-mall/products/${id}/stock`,
    method: 'put',
    data
  })
}

// 批量更新商品库存
export function batchUpdateProductStock(data) {
  return request({
    url: '/api/points-mall/products/batch-stock',
    method: 'put',
    data
  })
}

// 获取商品销售统计
export function getProductSalesStats(params) {
  return request({
    url: '/api/points-mall/products/sales-stats',
    method: 'get',
    params
  })
}

// 获取热销商品
export function getHotProducts(params) {
  return request({
    url: '/api/points-mall/products/hot',
    method: 'get',
    params
  })
}

// 获取推荐商品
export function getFeaturedProducts(params) {
  return request({
    url: '/api/points-mall/products/featured',
    method: 'get',
    params
  })
}

// 设置商品推荐
export function setProductFeatured(id, data) {
  return request({
    url: `/api/points-mall/products/${id}/featured`,
    method: 'put',
    data
  })
}

// 获取商品评价
export function getProductReviews(id, params) {
  return request({
    url: `/api/points-mall/products/${id}/reviews`,
    method: 'get',
    params
  })
}

// 回复商品评价
export function replyProductReview(reviewId, data) {
  return request({
    url: `/api/points-mall/reviews/${reviewId}/reply`,
    method: 'post',
    data
  })
}

// 获取商品库存预警
export function getStockAlerts(params) {
  return request({
    url: '/api/points-mall/products/stock-alerts',
    method: 'get',
    params
  })
}

// 设置库存预警阈值
export function setStockAlertThreshold(id, data) {
  return request({
    url: `/api/points-mall/products/${id}/stock-threshold`,
    method: 'put',
    data
  })
}

// 获取商品价格历史
export function getProductPriceHistory(id, params) {
  return request({
    url: `/api/points-mall/products/${id}/price-history`,
    method: 'get',
    params
  })
}

// 更新商品价格
export function updateProductPrice(id, data) {
  return request({
    url: `/api/points-mall/products/${id}/price`,
    method: 'put',
    data
  })
}

// 批量更新商品价格
export function batchUpdateProductPrice(data) {
  return request({
    url: '/api/points-mall/products/batch-price',
    method: 'put',
    data
  })
}

// 复制商品
export function copyProduct(id) {
  return request({
    url: `/api/points-mall/products/${id}/copy`,
    method: 'post'
  })
}

// 获取商品SKU列表
export function getProductSkus(id) {
  return request({
    url: `/api/points-mall/products/${id}/skus`,
    method: 'get'
  })
}

// 创建商品SKU
export function createProductSku(id, data) {
  return request({
    url: `/api/points-mall/products/${id}/skus`,
    method: 'post',
    data
  })
}

// 更新商品SKU
export function updateProductSku(id, skuId, data) {
  return request({
    url: `/api/points-mall/products/${id}/skus/${skuId}`,
    method: 'put',
    data
  })
}

// 删除商品SKU
export function deleteProductSku(id, skuId) {
  return request({
    url: `/api/points-mall/products/${id}/skus/${skuId}`,
    method: 'delete'
  })
}

// 获取商品属性
export function getProductAttributes(params) {
  return request({
    url: '/api/points-mall/product-attributes',
    method: 'get',
    params
  })
}

// 创建商品属性
export function createProductAttribute(data) {
  return request({
    url: '/api/points-mall/product-attributes',
    method: 'post',
    data
  })
}

// 更新商品属性
export function updateProductAttribute(id, data) {
  return request({
    url: `/api/points-mall/product-attributes/${id}`,
    method: 'put',
    data
  })
}

// 删除商品属性
export function deleteProductAttribute(id) {
  return request({
    url: `/api/points-mall/product-attributes/${id}`,
    method: 'delete'
  })
}