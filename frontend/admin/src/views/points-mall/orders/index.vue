<template>
  <div class="orders-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>订单管理</h2>
        <p>管理积分商城的所有订单信息</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="exportOrders">
          <el-icon><Download /></el-icon>
          导出订单
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ statistics.pending_orders }}</h3>
              <p>待处理订单</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon completed">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ statistics.completed_orders }}</h3>
              <p>已完成订单</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon cancelled">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ statistics.cancelled_orders }}</h3>
              <p>已取消订单</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ statistics.total_points }}</h3>
              <p>总积分消耗</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.order_no" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="用户">
          <el-input v-model="searchForm.user_name" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="商品">
          <el-input v-model="searchForm.product_name" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="处理中" value="processing" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchOrders">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 订单列表 -->
    <div class="orders-table">
      <el-table :data="ordersList" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column label="用户信息" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">{{ row.user_name }}</div>
              <div class="user-phone">{{ row.user_phone }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" width="200">
          <template #default="{ row }">
            <div class="product-info">
              <img :src="row.product_image" alt="" class="product-image" />
              <div class="product-details">
                <div class="product-name">{{ row.product_name }}</div>
                <div class="product-sku">SKU: {{ row.product_sku }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="积分" width="100">
          <template #default="{ row }">
            <span class="points">{{ row.points_cost }}</span>
          </template>
        </el-table-column>
        <el-table-column label="现金" width="100">
          <template #default="{ row }">
            <span class="cash">¥{{ row.cash_cost }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">查看</el-button>
            <el-button 
              v-if="row.status === 'paid'"
              size="small" 
              type="primary" 
              @click="processOrder(row)"
            >
              处理
            </el-button>
            <el-button 
              v-if="row.status === 'processing'"
              size="small" 
              type="success" 
              @click="shipOrder(row)"
            >
              发货
            </el-button>
            <el-button 
              v-if="['pending', 'paid'].includes(row.status)"
              size="small" 
              type="danger" 
              @click="cancelOrder(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="orderDetailVisible" title="订单详情" width="800px">
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(currentOrder.status)">{{ getStatusText(currentOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用户姓名">{{ currentOrder.user_name }}</el-descriptions-item>
          <el-descriptions-item label="用户手机">{{ currentOrder.user_phone }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ currentOrder.product_name }}</el-descriptions-item>
          <el-descriptions-item label="商品SKU">{{ currentOrder.product_sku }}</el-descriptions-item>
          <el-descriptions-item label="购买数量">{{ currentOrder.quantity }}</el-descriptions-item>
          <el-descriptions-item label="积分消耗">{{ currentOrder.points_cost }}</el-descriptions-item>
          <el-descriptions-item label="现金支付">¥{{ currentOrder.cash_cost }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ currentOrder.address }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentOrder.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentOrder.updated_at }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="currentOrder.remark" class="order-remark">
          <h4>订单备注</h4>
          <p>{{ currentOrder.remark }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 发货对话框 -->
    <el-dialog v-model="shipDialogVisible" title="订单发货" width="500px">
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="快递公司" required>
          <el-select v-model="shipForm.express_company" placeholder="请选择快递公司">
            <el-option label="顺丰速运" value="SF" />
            <el-option label="圆通速递" value="YTO" />
            <el-option label="中通快递" value="ZTO" />
            <el-option label="申通快递" value="STO" />
            <el-option label="韵达速递" value="YD" />
            <el-option label="京东物流" value="JD" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" required>
          <el-input v-model="shipForm.tracking_number" placeholder="请输入快递单号" />
        </el-form-item>
        <el-form-item label="发货备注">
          <el-input v-model="shipForm.remark" type="textarea" placeholder="请输入发货备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download, Clock, Check, Close, Money, Search, Refresh
} from '@element-plus/icons-vue'
import {
  getOrdersList,
  getOrderDetail,
  updateOrderStatus,
  shipOrder as shipOrderApi,
  cancelOrder as cancelOrderApi,
  getOrderStatistics,
  exportOrders as exportOrdersApi
} from '@/api/points-mall/orders'

// 响应式数据
const loading = ref(false)
const ordersList = ref([])
const statistics = ref({
  pending_orders: 0,
  completed_orders: 0,
  cancelled_orders: 0,
  total_points: 0
})

// 搜索表单
const searchForm = reactive({
  order_no: '',
  user_name: '',
  product_name: '',
  status: '',
  date_range: []
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 对话框
const orderDetailVisible = ref(false)
const shipDialogVisible = ref(false)
const currentOrder = ref(null)

// 发货表单
const shipForm = reactive({
  express_company: '',
  tracking_number: '',
  remark: ''
})

// 获取订单列表
const fetchOrdersList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    
    if (searchForm.date_range && searchForm.date_range.length === 2) {
      params.start_date = searchForm.date_range[0]
      params.end_date = searchForm.date_range[1]
    }
    
    const response = await getOrdersList(params)
    ordersList.value = response.data.list
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const response = await getOrderStatistics()
    statistics.value = response.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 搜索订单
const searchOrders = () => {
  pagination.page = 1
  fetchOrdersList()
}

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    if (Array.isArray(searchForm[key])) {
      searchForm[key] = []
    } else {
      searchForm[key] = ''
    }
  })
  searchOrders()
}

// 查看订单详情
const viewOrder = async (order) => {
  try {
    const response = await getOrderDetail(order.id)
    currentOrder.value = response.data
    orderDetailVisible.value = true
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
}

// 处理订单
const processOrder = async (order) => {
  try {
    await ElMessageBox.confirm('确认处理此订单？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await updateOrderStatus(order.id, { status: 'processing' })
    ElMessage.success('订单处理成功')
    fetchOrdersList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('订单处理失败')
    }
  }
}

// 发货
const shipOrder = (order) => {
  currentOrder.value = order
  shipForm.express_company = ''
  shipForm.tracking_number = ''
  shipForm.remark = ''
  shipDialogVisible.value = true
}

// 确认发货
const confirmShip = async () => {
  if (!shipForm.express_company || !shipForm.tracking_number) {
    ElMessage.warning('请填写完整的发货信息')
    return
  }
  
  try {
    await shipOrderApi(currentOrder.value.id, shipForm)
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    fetchOrdersList()
  } catch (error) {
    ElMessage.error('发货失败')
  }
}

// 取消订单
const cancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm('确认取消此订单？取消后积分将退还给用户。', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cancelOrderApi(order.id)
    ElMessage.success('订单取消成功')
    fetchOrdersList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('订单取消失败')
    }
  }
}

// 导出订单
const exportOrders = async () => {
  try {
    const response = await exportOrdersApi(searchForm)
    ElMessage.success('导出任务已创建，请稍后下载')
    // 这里可以添加下载逻辑
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    pending: 'warning',
    paid: 'primary',
    processing: 'primary',
    shipped: 'success',
    completed: 'success',
    cancelled: 'danger',
    refunded: 'info'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待支付',
    paid: '已支付',
    processing: '处理中',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return statusMap[status] || '未知'
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchOrdersList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchOrdersList()
}

// 初始化
onMounted(() => {
  fetchOrdersList()
  fetchStatistics()
})
</script>

<style scoped>
.orders-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.pending {
  background: #e6a23c;
}

.stat-icon.completed {
  background: #67c23a;
}

.stat-icon.cancelled {
  background: #f56c6c;
}

.stat-icon.total {
  background: #409eff;
}

.stat-content h3 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-content p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.search-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.orders-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 12px;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-sku {
  font-size: 12px;
  color: #909399;
}

.points {
  color: #e6a23c;
  font-weight: 500;
}

.cash {
  color: #67c23a;
  font-weight: 500;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.order-detail {
  padding: 20px 0;
}

.order-remark {
  margin-top: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.order-remark h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
}

.order-remark p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}
</style>