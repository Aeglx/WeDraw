<template>
  <div class="coupons-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>优惠券管理</h2>
        <p>管理积分商城的优惠券发放和使用</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          创建优惠券
        </el-button>
        <el-button @click="exportCoupons">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active">
              <el-icon><Ticket /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ statistics.active_coupons }}</h3>
              <p>活跃优惠券</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon used">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ statistics.used_coupons }}</h3>
              <p>已使用</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon expired">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ statistics.expired_coupons }}</h3>
              <p>已过期</p>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <h3>{{ statistics.total_discount }}</h3>
              <p>总优惠金额</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="优惠券名称">
          <el-input v-model="searchForm.name" placeholder="请输入优惠券名称" clearable />
        </el-form-item>
        <el-form-item label="优惠券类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option label="满减券" value="discount" />
            <el-option label="折扣券" value="percentage" />
            <el-option label="积分券" value="points" />
            <el-option label="免邮券" value="shipping" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="未开始" value="pending" />
            <el-option label="进行中" value="active" />
            <el-option label="已结束" value="ended" />
            <el-option label="已停用" value="disabled" />
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
          <el-button type="primary" @click="searchCoupons">
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

    <!-- 优惠券列表 -->
    <div class="coupons-table">
      <el-table :data="couponsList" v-loading="loading" stripe>
        <el-table-column prop="name" label="优惠券名称" width="200" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠信息" width="150">
          <template #default="{ row }">
            <div class="discount-info">
              <span v-if="row.type === 'discount'" class="discount-amount">满{{ row.min_amount }}减{{ row.discount_amount }}</span>
              <span v-else-if="row.type === 'percentage'" class="discount-amount">{{ row.discount_rate }}折</span>
              <span v-else-if="row.type === 'points'" class="discount-amount">{{ row.points_amount }}积分</span>
              <span v-else-if="row.type === 'shipping'" class="discount-amount">免邮</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="使用条件" width="120">
          <template #default="{ row }">
            <span v-if="row.min_amount > 0">满{{ row.min_amount }}元</span>
            <span v-else>无门槛</span>
          </template>
        </el-table-column>
        <el-table-column label="发放/使用" width="120">
          <template #default="{ row }">
            <div class="usage-info">
              <div>发放: {{ row.issued_count }}</div>
              <div>使用: {{ row.used_count }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="180">
          <template #default="{ row }">
            <div class="validity-period">
              <div>{{ row.start_time }}</div>
              <div>{{ row.end_time }}</div>
            </div>
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
            <el-button size="small" @click="viewCoupon(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editCoupon(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteCoupon(row)">删除</el-button>
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

    <!-- 创建/编辑优惠券对话框 -->
    <el-dialog 
      v-model="couponDialogVisible" 
      :title="isEdit ? '编辑优惠券' : '创建优惠券'" 
      width="600px"
    >
      <el-form :model="couponForm" :rules="couponRules" ref="couponFormRef" label-width="120px">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="couponForm.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="优惠券类型" prop="type">
          <el-select v-model="couponForm.type" placeholder="请选择类型" @change="onTypeChange">
            <el-option label="满减券" value="discount" />
            <el-option label="折扣券" value="percentage" />
            <el-option label="积分券" value="points" />
            <el-option label="免邮券" value="shipping" />
          </el-select>
        </el-form-item>
        <el-form-item 
          v-if="couponForm.type === 'discount'" 
          label="减免金额" 
          prop="discount_amount"
        >
          <el-input-number v-model="couponForm.discount_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item 
          v-if="couponForm.type === 'percentage'" 
          label="折扣率" 
          prop="discount_rate"
        >
          <el-input-number v-model="couponForm.discount_rate" :min="0.1" :max="9.9" :step="0.1" :precision="1" />
        </el-form-item>
        <el-form-item 
          v-if="couponForm.type === 'points'" 
          label="积分数量" 
          prop="points_amount"
        >
          <el-input-number v-model="couponForm.points_amount" :min="1" />
        </el-form-item>
        <el-form-item label="使用门槛" prop="min_amount">
          <el-input-number v-model="couponForm.min_amount" :min="0" :precision="2" />
          <span class="form-tip">设置为0表示无门槛</span>
        </el-form-item>
        <el-form-item label="发放数量" prop="total_count">
          <el-input-number v-model="couponForm.total_count" :min="1" />
        </el-form-item>
        <el-form-item label="每人限领" prop="per_user_limit">
          <el-input-number v-model="couponForm.per_user_limit" :min="1" />
        </el-form-item>
        <el-form-item label="有效期" prop="validity_period">
          <el-date-picker
            v-model="couponForm.validity_period"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="适用商品">
          <el-radio-group v-model="couponForm.applicable_type">
            <el-radio label="all">全部商品</el-radio>
            <el-radio label="category">指定分类</el-radio>
            <el-radio label="product">指定商品</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="couponForm.applicable_type === 'category'" label="适用分类">
          <el-select v-model="couponForm.applicable_ids" multiple placeholder="请选择分类">
            <el-option 
              v-for="category in categories" 
              :key="category.id" 
              :label="category.name" 
              :value="category.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="couponForm.applicable_type === 'product'" label="适用商品">
          <el-select v-model="couponForm.applicable_ids" multiple placeholder="请选择商品">
            <el-option 
              v-for="product in products" 
              :key="product.id" 
              :label="product.name" 
              :value="product.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠券描述">
          <el-input v-model="couponForm.description" type="textarea" placeholder="请输入优惠券描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="couponDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCoupon">保存</el-button>
      </template>
    </el-dialog>

    <!-- 优惠券详情对话框 -->
    <el-dialog v-model="couponDetailVisible" title="优惠券详情" width="800px">
      <div v-if="currentCoupon" class="coupon-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="优惠券名称">{{ currentCoupon.name }}</el-descriptions-item>
          <el-descriptions-item label="优惠券类型">
            <el-tag :type="getTypeColor(currentCoupon.type)">{{ getTypeText(currentCoupon.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优惠信息">
            <span v-if="currentCoupon.type === 'discount'">满{{ currentCoupon.min_amount }}减{{ currentCoupon.discount_amount }}</span>
            <span v-else-if="currentCoupon.type === 'percentage'">{{ currentCoupon.discount_rate }}折</span>
            <span v-else-if="currentCoupon.type === 'points'">{{ currentCoupon.points_amount }}积分</span>
            <span v-else-if="currentCoupon.type === 'shipping'">免邮</span>
          </el-descriptions-item>
          <el-descriptions-item label="使用门槛">
            <span v-if="currentCoupon.min_amount > 0">满{{ currentCoupon.min_amount }}元</span>
            <span v-else>无门槛</span>
          </el-descriptions-item>
          <el-descriptions-item label="发放数量">{{ currentCoupon.total_count }}</el-descriptions-item>
          <el-descriptions-item label="已发放">{{ currentCoupon.issued_count }}</el-descriptions-item>
          <el-descriptions-item label="已使用">{{ currentCoupon.used_count }}</el-descriptions-item>
          <el-descriptions-item label="每人限领">{{ currentCoupon.per_user_limit }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentCoupon.start_time }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentCoupon.end_time }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentCoupon.status)">{{ getStatusText(currentCoupon.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentCoupon.created_at }}</el-descriptions-item>
          <el-descriptions-item label="优惠券描述" :span="2">{{ currentCoupon.description || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Download, Ticket, Check, Clock, Money, Search, Refresh
} from '@element-plus/icons-vue'
import {
  getCouponsList,
  getCouponDetail,
  createCoupon,
  updateCoupon,
  deleteCoupon as deleteCouponApi,
  updateCouponStatus,
  getCouponStatistics,
  exportCoupons as exportCouponsApi
} from '@/api/points-mall/coupons'
import { getCategoriesList } from '@/api/points-mall/products'

// 响应式数据
const loading = ref(false)
const couponsList = ref([])
const statistics = ref({
  active_coupons: 0,
  used_coupons: 0,
  expired_coupons: 0,
  total_discount: 0
})
const categories = ref([])
const products = ref([])

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
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
const couponDialogVisible = ref(false)
const couponDetailVisible = ref(false)
const isEdit = ref(false)
const currentCoupon = ref(null)
const couponFormRef = ref()

// 优惠券表单
const couponForm = reactive({
  name: '',
  type: '',
  discount_amount: 0,
  discount_rate: 0,
  points_amount: 0,
  min_amount: 0,
  total_count: 1,
  per_user_limit: 1,
  validity_period: [],
  applicable_type: 'all',
  applicable_ids: [],
  description: ''
})

// 表单验证规则
const couponRules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
  discount_amount: [{ required: true, message: '请输入减免金额', trigger: 'blur' }],
  discount_rate: [{ required: true, message: '请输入折扣率', trigger: 'blur' }],
  points_amount: [{ required: true, message: '请输入积分数量', trigger: 'blur' }],
  total_count: [{ required: true, message: '请输入发放数量', trigger: 'blur' }],
  per_user_limit: [{ required: true, message: '请输入每人限领数量', trigger: 'blur' }],
  validity_period: [{ required: true, message: '请选择有效期', trigger: 'change' }]
}

// 获取优惠券列表
const fetchCouponsList = async () => {
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
    
    const response = await getCouponsList(params)
    couponsList.value = response.data.list
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取优惠券列表失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const response = await getCouponStatistics()
    statistics.value = response.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getCategoriesList()
    categories.value = response.data.list
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 搜索优惠券
const searchCoupons = () => {
  pagination.page = 1
  fetchCouponsList()
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
  searchCoupons()
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  resetCouponForm()
  couponDialogVisible.value = true
}

// 查看优惠券详情
const viewCoupon = async (coupon) => {
  try {
    const response = await getCouponDetail(coupon.id)
    currentCoupon.value = response.data
    couponDetailVisible.value = true
  } catch (error) {
    ElMessage.error('获取优惠券详情失败')
  }
}

// 编辑优惠券
const editCoupon = async (coupon) => {
  try {
    const response = await getCouponDetail(coupon.id)
    const data = response.data
    
    isEdit.value = true
    Object.keys(couponForm).forEach(key => {
      if (key === 'validity_period') {
        couponForm[key] = [data.start_time, data.end_time]
      } else if (key === 'applicable_ids') {
        couponForm[key] = data.applicable_ids || []
      } else {
        couponForm[key] = data[key] || couponForm[key]
      }
    })
    
    currentCoupon.value = data
    couponDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取优惠券详情失败')
  }
}

// 保存优惠券
const saveCoupon = async () => {
  try {
    await couponFormRef.value.validate()
    
    const formData = { ...couponForm }
    if (formData.validity_period && formData.validity_period.length === 2) {
      formData.start_time = formData.validity_period[0]
      formData.end_time = formData.validity_period[1]
      delete formData.validity_period
    }
    
    if (isEdit.value) {
      await updateCoupon(currentCoupon.value.id, formData)
      ElMessage.success('优惠券更新成功')
    } else {
      await createCoupon(formData)
      ElMessage.success('优惠券创建成功')
    }
    
    couponDialogVisible.value = false
    fetchCouponsList()
  } catch (error) {
    if (error !== false) {
      ElMessage.error(isEdit.value ? '优惠券更新失败' : '优惠券创建失败')
    }
  }
}

// 切换状态
const toggleStatus = async (coupon) => {
  try {
    const newStatus = coupon.status === 'active' ? 'disabled' : 'active'
    const action = newStatus === 'active' ? '启用' : '停用'
    
    await ElMessageBox.confirm(`确认${action}此优惠券？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await updateCouponStatus(coupon.id, { status: newStatus })
    ElMessage.success(`优惠券${action}成功`)
    fetchCouponsList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 删除优惠券
const deleteCoupon = async (coupon) => {
  try {
    await ElMessageBox.confirm('确认删除此优惠券？删除后不可恢复。', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteCouponApi(coupon.id)
    ElMessage.success('优惠券删除成功')
    fetchCouponsList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('优惠券删除失败')
    }
  }
}

// 导出优惠券
const exportCoupons = async () => {
  try {
    const response = await exportCouponsApi(searchForm)
    ElMessage.success('导出任务已创建，请稍后下载')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 重置表单
const resetCouponForm = () => {
  Object.keys(couponForm).forEach(key => {
    if (Array.isArray(couponForm[key])) {
      couponForm[key] = []
    } else if (typeof couponForm[key] === 'number') {
      couponForm[key] = key === 'per_user_limit' || key === 'total_count' ? 1 : 0
    } else if (typeof couponForm[key] === 'string') {
      couponForm[key] = key === 'applicable_type' ? 'all' : ''
    }
  })
}

// 类型变化处理
const onTypeChange = () => {
  // 重置相关字段
  couponForm.discount_amount = 0
  couponForm.discount_rate = 0
  couponForm.points_amount = 0
}

// 获取类型颜色
const getTypeColor = (type) => {
  const typeMap = {
    discount: 'primary',
    percentage: 'success',
    points: 'warning',
    shipping: 'info'
  }
  return typeMap[type] || 'info'
}

// 获取类型文本
const getTypeText = (type) => {
  const typeMap = {
    discount: '满减券',
    percentage: '折扣券',
    points: '积分券',
    shipping: '免邮券'
  }
  return typeMap[type] || '未知'
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    pending: 'info',
    active: 'success',
    ended: 'warning',
    disabled: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '未开始',
    active: '进行中',
    ended: '已结束',
    disabled: '已停用'
  }
  return statusMap[status] || '未知'
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchCouponsList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchCouponsList()
}

// 初始化
onMounted(() => {
  fetchCouponsList()
  fetchStatistics()
  fetchCategories()
})
</script>

<style scoped>
.coupons-container {
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

.stat-icon.active {
  background: #67c23a;
}

.stat-icon.used {
  background: #409eff;
}

.stat-icon.expired {
  background: #e6a23c;
}

.stat-icon.total {
  background: #f56c6c;
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

.coupons-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.discount-info {
  font-weight: 500;
}

.discount-amount {
  color: #f56c6c;
  font-size: 14px;
}

.usage-info {
  font-size: 12px;
  color: #606266;
}

.validity-period {
  font-size: 12px;
  color: #606266;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.coupon-detail {
  padding: 20px 0;
}

.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
</style>