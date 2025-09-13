<template>
  <div class="points-mall-orders">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>积分商城 - 订单管理</h1>
        <p>管理积分商城中的订单信息，包括订单查询、状态管理、发货和退款等操作</p>
      </div>
      <div class="header-actions">
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出订单
        </el-button>
        <el-button @click="handleBatchPrint" :disabled="selectedOrders.length === 0">
          <el-icon><Printer /></el-icon>
          批量打印
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #e1f3ff; color: #409eff;">
            <el-icon size="24"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.total || 0 }}</div>
            <div class="stat-label">订单总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #e8f8f5; color: #67c23a;">
            <el-icon size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.completed || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #fdf6ec; color: #e6a23c;">
            <el-icon size="24"><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.pending || 0 }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
            <el-icon size="24"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.refund || 0 }}</div>
            <div class="stat-label">退款中</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form ref="searchFormRef" :model="searchForm" :inline="true">
        <el-form-item label="订单号" prop="order_no">
          <el-input
            v-model="searchForm.order_no"
            placeholder="请输入订单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="用户手机" prop="user_phone">
          <el-input
            v-model="searchForm.user_phone"
            placeholder="请输入用户手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="订单状态" prop="status">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="退款中" value="refunding" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式" prop="payment_method">
          <el-select
            v-model="searchForm.payment_method"
            placeholder="请选择支付方式"
            clearable
            style="width: 150px"
          >
            <el-option label="积分" value="points" />
            <el-option label="积分+现金" value="mixed" />
            <el-option label="现金" value="cash" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearchForm">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="orderList"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column label="用户信息" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">{{ row.user_name }}</div>
              <div class="user-phone">{{ row.user_phone }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div class="product-info">
              <div v-for="item in row.items" :key="item.id" class="product-item">
                <el-image
                  v-if="item.product_image"
                  :src="item.product_image"
                  style="width: 40px; height: 40px; border-radius: 4px; margin-right: 8px;"
                  fit="cover"
                >
                  <template #error>
                    <div class="image-slot-small">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="product-detail">
                  <div class="product-name">{{ item.product_name }}</div>
                  <div class="product-spec">数量: {{ item.quantity }}</div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单金额" width="120">
          <template #default="{ row }">
            <div class="order-amount">
              <div v-if="row.points_amount > 0" class="points-amount">
                {{ row.points_amount }}积分
              </div>
              <div v-if="row.cash_amount > 0" class="cash-amount">
                ¥{{ row.cash_amount }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="100">
          <template #default="{ row }">
            <el-tag :type="getPaymentType(row.payment_method)" size="small">
              {{ getPaymentText(row.payment_method) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-dropdown v-if="getAvailableActions(row).length > 0" trigger="click">
              <el-button type="primary" link size="small">
                操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="action in getAvailableActions(row)"
                    :key="action.key"
                    @click="handleAction(action.key, row)"
                  >
                    {{ action.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <Pagination
          v-model:page="pagination.page"
          v-model:limit="pagination.limit"
          :total="pagination.total"
          @pagination="fetchOrderList"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="800px">
      <div v-if="currentOrder" class="order-detail">
        <!-- 基本信息 -->
        <el-card class="detail-section">
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getStatusType(currentOrder.status)" size="small">
                {{ getStatusText(currentOrder.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户姓名">{{ currentOrder.user_name }}</el-descriptions-item>
            <el-descriptions-item label="用户手机">{{ currentOrder.user_phone }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">
              <el-tag :type="getPaymentType(currentOrder.payment_method)" size="small">
                {{ getPaymentText(currentOrder.payment_method) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ currentOrder.created_at }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 商品信息 -->
        <el-card class="detail-section">
          <template #header>
            <span>商品信息</span>
          </template>
          <el-table :data="currentOrder.items" style="width: 100%">
            <el-table-column label="商品图片" width="80">
              <template #default="{ row }">
                <el-image
                  v-if="row.product_image"
                  :src="row.product_image"
                  style="width: 50px; height: 50px; border-radius: 4px;"
                  fit="cover"
                >
                  <template #error>
                    <div class="image-slot-small">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </template>
            </el-table-column>
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="product_sku" label="商品SKU" width="120" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column label="单价" width="100">
              <template #default="{ row }">
                <div>
                  <div v-if="row.points_price > 0">{{ row.points_price }}积分</div>
                  <div v-if="row.cash_price > 0">¥{{ row.cash_price }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="小计" width="100">
              <template #default="{ row }">
                <div>
                  <div v-if="row.total_points > 0">{{ row.total_points }}积分</div>
                  <div v-if="row.total_cash > 0">¥{{ row.total_cash }}</div>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 收货地址 -->
        <el-card v-if="currentOrder.shipping_address" class="detail-section">
          <template #header>
            <span>收货地址</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="收货人">{{ currentOrder.shipping_address.name }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentOrder.shipping_address.phone }}</el-descriptions-item>
            <el-descriptions-item label="收货地址">
              {{ currentOrder.shipping_address.province }}
              {{ currentOrder.shipping_address.city }}
              {{ currentOrder.shipping_address.district }}
              {{ currentOrder.shipping_address.detail }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 物流信息 -->
        <el-card v-if="currentOrder.shipping_info" class="detail-section">
          <template #header>
            <span>物流信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="物流公司">{{ currentOrder.shipping_info.company }}</el-descriptions-item>
            <el-descriptions-item label="快递单号">{{ currentOrder.shipping_info.tracking_no }}</el-descriptions-item>
            <el-descriptions-item label="发货时间">{{ currentOrder.shipping_info.shipped_at }}</el-descriptions-item>
            <el-descriptions-item label="物流状态">{{ currentOrder.shipping_info.status }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 订单日志 -->
        <el-card class="detail-section">
          <template #header>
            <span>订单日志</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="log in orderLogs"
              :key="log.id"
              :timestamp="log.created_at"
              placement="top"
            >
              <div class="log-content">
                <div class="log-action">{{ log.action }}</div>
                <div v-if="log.remark" class="log-remark">{{ log.remark }}</div>
                <div class="log-operator">操作人: {{ log.operator }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
    </el-dialog>

    <!-- 发货对话框 -->
    <el-dialog v-model="shipVisible" title="订单发货" width="500px">
      <el-form ref="shipFormRef" :model="shipForm" :rules="shipRules" label-width="100px">
        <el-form-item label="物流公司" prop="express_company">
          <el-select v-model="shipForm.express_company" placeholder="请选择物流公司" style="width: 100%">
            <el-option
              v-for="company in expressCompanies"
              :key="company.code"
              :label="company.name"
              :value="company.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="快递单号" prop="tracking_no">
          <el-input v-model="shipForm.tracking_no" placeholder="请输入快递单号" />
        </el-form-item>
        <el-form-item label="发货备注">
          <el-input
            v-model="shipForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入发货备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="shipVisible = false">取消</el-button>
          <el-button type="primary" @click="handleShipSubmit" :loading="submitting">
            确定发货
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 退款对话框 -->
    <el-dialog v-model="refundVisible" title="订单退款" width="500px">
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="100px">
        <el-form-item label="退款原因" prop="reason">
          <el-select v-model="refundForm.reason" placeholder="请选择退款原因" style="width: 100%">
            <el-option label="用户申请退款" value="user_request" />
            <el-option label="商品缺货" value="out_of_stock" />
            <el-option label="商品质量问题" value="quality_issue" />
            <el-option label="其他原因" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="退款金额" prop="amount">
          <el-input-number
            v-model="refundForm.amount"
            :min="0"
            :max="currentOrder?.cash_amount || 0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="退款积分" prop="points">
          <el-input-number
            v-model="refundForm.points"
            :min="0"
            :max="currentOrder?.points_amount || 0"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="退款说明">
          <el-input
            v-model="refundForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入退款说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="refundVisible = false">取消</el-button>
          <el-button type="primary" @click="handleRefundSubmit" :loading="submitting">
            确定退款
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download, Printer, Refresh, Search, Document, CircleCheck,
  Clock, Warning, Picture, ArrowDown
} from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination/index.vue'
import {
  getOrdersList, getOrderDetail, updateOrderStatus, shipOrder,
  cancelOrder, refundOrder, batchUpdateOrders, getOrderStatistics,
  exportOrders, getOrderLogs, addOrderRemark, getShippingInfo,
  batchPrintOrders, getExpressCompanies
} from '@/api/points-mall/orders'

// 响应式数据
const loading = ref(false)
const detailVisible = ref(false)
const shipVisible = ref(false)
const refundVisible = ref(false)
const submitting = ref(false)
const currentOrder = ref(null)
const selectedOrders = ref([])
const orderLogs = ref([])
const expressCompanies = ref([])

// 表单引用
const searchFormRef = ref()
const shipFormRef = ref()
const refundFormRef = ref()

// 列表数据
const orderList = ref([])
const statistics = ref({})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  order_no: '',
  user_phone: '',
  status: '',
  payment_method: ''
})

// 日期范围
const dateRange = ref([])

// 发货表单
const shipForm = reactive({
  express_company: '',
  tracking_no: '',
  remark: ''
})

// 退款表单
const refundForm = reactive({
  reason: '',
  amount: 0,
  points: 0,
  remark: ''
})

// 表单验证规则
const shipRules = {
  express_company: [{ required: true, message: '请选择物流公司', trigger: 'change' }],
  tracking_no: [{ required: true, message: '请输入快递单号', trigger: 'blur' }]
}

const refundRules = {
  reason: [{ required: true, message: '请选择退款原因', trigger: 'change' }]
}

// 获取订单列表
const fetchOrderList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    
    // 添加日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    
    const response = await getOrdersList(params)
    orderList.value = response.data.list
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

// 获取物流公司列表
const fetchExpressCompanies = async () => {
  try {
    const response = await getExpressCompanies()
    expressCompanies.value = response.data
  } catch (error) {
    console.error('获取物流公司失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchOrderList()
}

// 重置搜索表单
const resetSearchForm = () => {
  Object.assign(searchForm, {
    order_no: '',
    user_phone: '',
    status: '',
    payment_method: ''
  })
  dateRange.value = []
  if (searchFormRef.value) {
    searchFormRef.value.clearValidate()
  }
  handleSearch()
}

// 刷新
const handleRefresh = () => {
  fetchOrderList()
  fetchStatistics()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedOrders.value = selection
}

// 查看订单
const handleView = async (row) => {
  try {
    const response = await getOrderDetail(row.id)
    currentOrder.value = response.data
    
    // 获取订单日志
    const logsResponse = await getOrderLogs(row.id)
    orderLogs.value = logsResponse.data
    
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
}

// 处理操作
const handleAction = async (action, row) => {
  switch (action) {
    case 'ship':
      await handleShip(row)
      break
    case 'cancel':
      await handleCancel(row)
      break
    case 'refund':
      await handleRefund(row)
      break
    case 'complete':
      await handleComplete(row)
      break
  }
}

// 发货
const handleShip = async (row) => {
  currentOrder.value = row
  resetShipForm()
  shipVisible.value = true
}

// 取消订单
const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消订单 "${row.order_no}" 吗？`,
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await cancelOrder(row.id)
    ElMessage.success('取消成功')
    fetchOrderList()
    fetchStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

// 退款
const handleRefund = async (row) => {
  currentOrder.value = row
  resetRefundForm()
  refundForm.amount = row.cash_amount || 0
  refundForm.points = row.points_amount || 0
  refundVisible.value = true
}

// 完成订单
const handleComplete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要完成订单 "${row.order_no}" 吗？`,
      '确认完成',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await updateOrderStatus(row.id, { status: 'completed' })
    ElMessage.success('操作成功')
    fetchOrderList()
    fetchStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 发货提交
const handleShipSubmit = async () => {
  try {
    await shipFormRef.value.validate()
    submitting.value = true
    
    await shipOrder(currentOrder.value.id, shipForm)
    ElMessage.success('发货成功')
    shipVisible.value = false
    fetchOrderList()
    fetchStatistics()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('发货失败')
    }
  } finally {
    submitting.value = false
  }
}

// 退款提交
const handleRefundSubmit = async () => {
  try {
    await refundFormRef.value.validate()
    submitting.value = true
    
    await refundOrder(currentOrder.value.id, refundForm)
    ElMessage.success('退款申请提交成功')
    refundVisible.value = false
    fetchOrderList()
    fetchStatistics()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('退款失败')
    }
  } finally {
    submitting.value = false
  }
}

// 导出订单
const handleExport = async () => {
  try {
    await exportOrders(searchForm)
    ElMessage.success('导出任务已创建，请稍后下载')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 批量打印
const handleBatchPrint = async () => {
  try {
    const orderIds = selectedOrders.value.map(order => order.id)
    await batchPrintOrders({ order_ids: orderIds })
    ElMessage.success('打印任务已创建')
  } catch (error) {
    ElMessage.error('打印失败')
  }
}

// 获取可用操作
const getAvailableActions = (row) => {
  const actions = []
  
  switch (row.status) {
    case 'paid':
      actions.push({ key: 'ship', label: '发货' })
      actions.push({ key: 'refund', label: '退款' })
      break
    case 'shipped':
      actions.push({ key: 'complete', label: '完成' })
      actions.push({ key: 'refund', label: '退款' })
      break
    case 'pending':
      actions.push({ key: 'cancel', label: '取消' })
      break
  }
  
  return actions
}

// 获取支付方式类型
const getPaymentType = (method) => {
  const typeMap = {
    points: 'warning',
    mixed: 'success',
    cash: 'primary'
  }
  return typeMap[method] || 'info'
}

// 获取支付方式文本
const getPaymentText = (method) => {
  const textMap = {
    points: '积分',
    mixed: '积分+现金',
    cash: '现金'
  }
  return textMap[method] || '未知'
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    paid: 'primary',
    shipped: 'success',
    completed: 'success',
    cancelled: 'info',
    refunding: 'danger',
    refunded: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    pending: '待支付',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    refunding: '退款中',
    refunded: '已退款'
  }
  return textMap[status] || '未知'
}

// 重置发货表单
const resetShipForm = () => {
  Object.assign(shipForm, {
    express_company: '',
    tracking_no: '',
    remark: ''
  })
  if (shipFormRef.value) {
    shipFormRef.value.clearValidate()
  }
}

// 重置退款表单
const resetRefundForm = () => {
  Object.assign(refundForm, {
    reason: '',
    amount: 0,
    points: 0,
    remark: ''
  })
  if (refundFormRef.value) {
    refundFormRef.value.clearValidate()
  }
}

// 生命周期
onMounted(() => {
  fetchOrderList()
  fetchStatistics()
  fetchExpressCompanies()
})
</script>

<style scoped>
.points-mall-orders {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.header-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.search-card,
.table-card {
  margin-bottom: 20px;
}

.user-info {
  .user-name {
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .user-phone {
    font-size: 12px;
    color: #909399;
  }
}

.product-info {
  .product-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .product-detail {
    flex: 1;
  }
  
  .product-name {
    font-size: 14px;
    margin-bottom: 2px;
  }
  
  .product-spec {
    font-size: 12px;
    color: #909399;
  }
}

.order-amount {
  .points-amount {
    color: #e6a23c;
    font-weight: bold;
    margin-bottom: 2px;
  }
  
  .cash-amount {
    color: #67c23a;
    font-weight: bold;
  }
}

.image-slot-small {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: #f5f7fa;
  color: #909399;
  border-radius: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.order-detail {
  .detail-section {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.log-content {
  .log-action {
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .log-remark {
    color: #606266;
    margin-bottom: 4px;
  }
  
  .log-operator {
    font-size: 12px;
    color: #909399;
  }
}
</style>