<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateChange"
              style="margin-right: 10px;"
            />
            <el-input
              v-model="searchQuery"
              placeholder="搜索订单号/用户昵称"
              style="width: 200px; margin-right: 10px;"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="statusFilter"
              placeholder="订单状态"
              style="width: 120px; margin-right: 10px;"
              clearable
              @change="handleStatusFilter"
            >
              <el-option label="待发货" value="pending" />
              <el-option label="已发货" value="shipped" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
            <el-button type="primary" @click="exportOrders" :loading="exporting">
              导出订单
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total_orders || 0 }}</div>
              <div class="stat-label">总订单数</div>
            </div>
            <el-icon class="stat-icon"><Document /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.pending_orders || 0 }}</div>
              <div class="stat-label">待处理订单</div>
            </div>
            <el-icon class="stat-icon"><Clock /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total_points || 0 }}</div>
              <div class="stat-label">消耗积分</div>
            </div>
            <el-icon class="stat-icon"><Coin /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.completion_rate || '0%' }}</div>
              <div class="stat-label">完成率</div>
            </div>
            <el-icon class="stat-icon"><TrendCharts /></el-icon>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 订单列表 -->
      <el-table :data="orderList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button type="text" @click="viewOrder(row)">
              {{ row.order_no }}
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div class="goods-info">
              <el-image
                :src="row.goods.image_url"
                fit="cover"
                style="width: 40px; height: 40px; border-radius: 4px; margin-right: 10px;"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div>
                <div class="goods-name">{{ row.goods.name }}</div>
                <div class="goods-type">{{ getTypeName(row.goods.type) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="用户信息" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :src="row.user.avatar" :size="30">
                <img src="/src/assets/images/avatar.png" />
              </el-avatar>
              <div style="margin-left: 8px;">
                <div class="user-name">{{ row.user.nickname }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="quantity" label="数量" width="80" />
        
        <el-table-column label="消耗积分" width="100">
          <template #default="{ row }">
            <span class="points-text">{{ row.total_points }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewOrder(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="shipOrder(row)"
            >
              发货
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              size="small"
              @click="cancelOrder(row)"
            >
              取消
            </el-button>
            <el-button
              v-if="row.status === 'shipped'"
              type="info"
              size="small"
              @click="completeOrder(row)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-if="total > 0"
        :current-page="query.page"
        :page-size="query.limit"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px;"
      />
    </el-card>
    
    <!-- 订单详情对话框 -->
    <el-dialog
      title="订单详情"
      v-model="detailVisible"
      width="800px"
    >
      <el-descriptions v-if="currentOrder" :column="2" border>
        <el-descriptions-item label="订单号" :span="2">
          {{ currentOrder.order_no }}
        </el-descriptions-item>
        
        <el-descriptions-item label="商品信息" :span="2">
          <div class="goods-detail">
            <el-image
              :src="currentOrder.goods.image_url"
              fit="cover"
              style="width: 80px; height: 80px; border-radius: 4px; margin-right: 15px;"
            />
            <div>
              <h4>{{ currentOrder.goods.name }}</h4>
              <p>类型: {{ getTypeName(currentOrder.goods.type) }}</p>
              <p>单价: {{ currentOrder.goods.points }} 积分</p>
            </div>
          </div>
        </el-descriptions-item>
        
        <el-descriptions-item label="用户信息" :span="2">
          <div class="user-detail">
            <el-avatar :src="currentOrder.user.avatar" :size="50">
              <img src="/src/assets/images/avatar.png" />
            </el-avatar>
            <div style="margin-left: 15px;">
              <h4>{{ currentOrder.user.nickname }}</h4>
              <p>OpenID: {{ currentOrder.user.openid }}</p>
            </div>
          </div>
        </el-descriptions-item>
        
        <el-descriptions-item label="购买数量">
          {{ currentOrder.quantity }}
        </el-descriptions-item>
        
        <el-descriptions-item label="消耗积分">
          <span class="points-text">{{ currentOrder.total_points }}</span>
        </el-descriptions-item>
        
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusTagType(currentOrder.status)">
            {{ getStatusName(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="下单时间">
          {{ formatTime(currentOrder.created_at) }}
        </el-descriptions-item>
        
        <el-descriptions-item v-if="currentOrder.shipped_at" label="发货时间">
          {{ formatTime(currentOrder.shipped_at) }}
        </el-descriptions-item>
        
        <el-descriptions-item v-if="currentOrder.completed_at" label="完成时间">
          {{ formatTime(currentOrder.completed_at) }}
        </el-descriptions-item>
        
        <el-descriptions-item v-if="currentOrder.address" label="收货地址" :span="2">
          {{ formatAddress(currentOrder.address) }}
        </el-descriptions-item>
        
        <el-descriptions-item v-if="currentOrder.tracking_no" label="快递单号">
          {{ currentOrder.tracking_no }}
        </el-descriptions-item>
        
        <el-descriptions-item v-if="currentOrder.express_company" label="快递公司">
          {{ currentOrder.express_company }}
        </el-descriptions-item>
        
        <el-descriptions-item v-if="currentOrder.remark" label="备注" :span="2">
          {{ currentOrder.remark }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
    
    <!-- 发货对话框 -->
    <el-dialog
      title="订单发货"
      v-model="shipVisible"
      width="500px"
    >
      <el-form
        ref="shipFormRef"
        :model="shipForm"
        :rules="shipRules"
        label-width="100px"
      >
        <el-form-item label="快递公司" prop="express_company">
          <el-select v-model="shipForm.express_company" placeholder="请选择快递公司" style="width: 100%;">
            <el-option label="顺丰速运" value="SF" />
            <el-option label="圆通速递" value="YTO" />
            <el-option label="中通快递" value="ZTO" />
            <el-option label="申通快递" value="STO" />
            <el-option label="韵达速递" value="YD" />
            <el-option label="百世快递" value="HTKY" />
            <el-option label="德邦快递" value="DBL" />
            <el-option label="京东快递" value="JD" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="快递单号" prop="tracking_no">
          <el-input v-model="shipForm.tracking_no" placeholder="请输入快递单号" />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="shipForm.remark"
            type="textarea"
            :rows="3"
            placeholder="发货备注(可选)"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shipVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmShip" :loading="shipping">
            确认发货
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Document,
  Clock,
  Coin,
  TrendCharts,
  Picture
} from '@element-plus/icons-vue'
import {
  getOrders,
  getOrderStatistics,
  getOrderDetail,
  shipOrder as shipOrderApi,
  cancelOrder as cancelOrderApi,
  completeOrder as completeOrderApi,
  exportOrders as exportOrdersApi
} from '@/api/points'

const loading = ref(false)
const exporting = ref(false)
const shipping = ref(false)
const detailVisible = ref(false)
const shipVisible = ref(false)

const searchQuery = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const currentOrder = ref(null)

const orderList = ref([])
const total = ref(0)
const statistics = ref({})

const query = reactive({
  page: 1,
  limit: 20,
  search: '',
  status: '',
  start_date: '',
  end_date: ''
})

const shipForm = reactive({
  order_id: null,
  express_company: '',
  tracking_no: '',
  remark: ''
})

const shipRules = {
  express_company: [{ required: true, message: '请选择快递公司', trigger: 'change' }],
  tracking_no: [{ required: true, message: '请输入快递单号', trigger: 'blur' }]
}

const shipFormRef = ref()

const getOrderData = async () => {
  try {
    loading.value = true
    const response = await getOrders(query)
    orderList.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    console.error('获取订单数据失败:', error)
  } finally {
    loading.value = false
  }
}

const getStatisticsData = async () => {
  try {
    const response = await getOrderStatistics({
      start_date: query.start_date,
      end_date: query.end_date
    })
    statistics.value = response.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const handleSearch = () => {
  query.search = searchQuery.value
  query.page = 1
  getOrderData()
}

const handleStatusFilter = () => {
  query.status = statusFilter.value
  query.page = 1
  getOrderData()
}

const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    query.start_date = dates[0]
    query.end_date = dates[1]
  } else {
    query.start_date = ''
    query.end_date = ''
  }
  query.page = 1
  getOrderData()
  getStatisticsData()
}

const handleSizeChange = (size) => {
  query.limit = size
  query.page = 1
  getOrderData()
}

const handleCurrentChange = (page) => {
  query.page = page
  getOrderData()
}

const viewOrder = async (order) => {
  try {
    const response = await getOrderDetail(order.id)
    currentOrder.value = response.data
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取订单详情失败: ' + error.message)
  }
}

const shipOrder = (order) => {
  Object.assign(shipForm, {
    order_id: order.id,
    express_company: '',
    tracking_no: '',
    remark: ''
  })
  shipVisible.value = true
}

const confirmShip = async () => {
  try {
    await shipFormRef.value.validate()
    shipping.value = true
    
    await shipOrderApi(shipForm.order_id, {
      express_company: shipForm.express_company,
      tracking_no: shipForm.tracking_no,
      remark: shipForm.remark
    })
    
    ElMessage.success('发货成功')
    shipVisible.value = false
    getOrderData()
  } catch (error) {
    if (error.message) {
      ElMessage.error('发货失败: ' + error.message)
    }
  } finally {
    shipping.value = false
  }
}

const cancelOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消订单「${order.order_no}」吗？取消后将退还用户积分。`,
      '取消确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await cancelOrderApi(order.id)
    ElMessage.success('订单已取消')
    getOrderData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败: ' + error.message)
    }
  }
}

const completeOrder = async (order) => {
  try {
    await ElMessageBox.confirm(
      `确定要完成订单「${order.order_no}」吗？`,
      '完成确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    await completeOrderApi(order.id)
    ElMessage.success('订单已完成')
    getOrderData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('完成失败: ' + error.message)
    }
  }
}

const exportOrders = async () => {
  try {
    exporting.value = true
    const response = await exportOrdersApi(query)
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `积分订单数据_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}

const getTypeName = (type) => {
  const typeMap = {
    physical: '实物商品',
    virtual: '虚拟商品',
    coupon: '优惠券',
    membership: '会员权益'
  }
  return typeMap[type] || type
}

const getStatusName = (status) => {
  const statusMap = {
    pending: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status) => {
  const typeMap = {
    pending: 'warning',
    shipped: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString()
}

const formatAddress = (address) => {
  if (!address) return '-'
  return `${address.province} ${address.city} ${address.district} ${address.detail} (${address.name} ${address.phone})`
}

onMounted(() => {
  getOrderData()
  getStatisticsData()
})
</script>

<style lang="scss" scoped>
.app-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
  }
  
  .stat-card {
    position: relative;
    overflow: hidden;
    
    .stat-content {
      .stat-number {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 5px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
    
    .stat-icon {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 40px;
      color: #409eff;
      opacity: 0.3;
    }
  }
  
  .goods-info {
    display: flex;
    align-items: center;
    
    .goods-name {
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .goods-type {
      font-size: 12px;
      color: #909399;
    }
  }
  
  .user-info {
    display: flex;
    align-items: center;
    
    .user-name {
      font-size: 14px;
      font-weight: bold;
    }
  }
  
  .points-text {
    color: #e6a23c;
    font-weight: bold;
  }
  
  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    background: #f5f7fa;
    color: #909399;
    font-size: 16px;
    border-radius: 4px;
  }
  
  .goods-detail {
    display: flex;
    align-items: flex-start;
    
    h4 {
      margin: 0 0 8px 0;
    }
    
    p {
      margin: 4px 0;
      color: #666;
    }
  }
  
  .user-detail {
    display: flex;
    align-items: flex-start;
    
    h4 {
      margin: 0 0 8px 0;
    }
    
    p {
      margin: 4px 0;
      color: #666;
      font-size: 12px;
    }
  }
}
</style>