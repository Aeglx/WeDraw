<template>
  <div class="reports-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">报表管理</h1>
        <p class="page-description">创建、管理和查看各类数据报表</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          创建报表
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total-icon">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statsData.total }}</div>
              <div class="stat-label">总报表数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active-icon">
              <el-icon :size="24"><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statsData.active }}</div>
              <div class="stat-label">启用报表</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon scheduled-icon">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statsData.scheduled }}</div>
              <div class="stat-label">定时报表</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon generated-icon">
              <el-icon :size="24"><Download /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statsData.generated }}</div>
              <div class="stat-label">今日生成</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="报表名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入报表名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="报表类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable style="width: 150px">
            <el-option label="用户报表" value="user" />
            <el-option label="订单报表" value="order" />
            <el-option label="财务报表" value="finance" />
            <el-option label="运营报表" value="operation" />
            <el-option label="自定义报表" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 报表列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>报表列表</span>
          <div class="header-actions">
            <el-button size="small" @click="batchDelete" :disabled="!selectedReports.length">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
            <el-button size="small" @click="exportReports">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="reportsList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="报表名称" min-width="200">
          <template #default="{ row }">
            <div class="report-info">
              <div class="report-name">{{ row.name }}</div>
              <div class="report-desc">{{ row.description }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="schedule" label="调度设置" width="150">
          <template #default="{ row }">
            <div v-if="row.schedule">
              <el-icon><Clock /></el-icon>
              {{ row.schedule }}
            </div>
            <span v-else class="text-muted">手动生成</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastGenerated" label="最后生成" width="180">
          <template #default="{ row }">
            <div v-if="row.lastGenerated">
              <div>{{ row.lastGenerated }}</div>
              <el-tag size="small" :type="row.lastStatus === 'success' ? 'success' : 'danger'">
                {{ row.lastStatus === 'success' ? '成功' : '失败' }}
              </el-tag>
            </div>
            <span v-else class="text-muted">未生成</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="updateStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewReport(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button size="small" @click="generateReport(row)">
              <el-icon><Refresh /></el-icon>
              生成
            </el-button>
            <el-button size="small" @click="editReport(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="deleteReport(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑报表对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报表名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入报表名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报表类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
                <el-option label="用户报表" value="user" />
                <el-option label="订单报表" value="order" />
                <el-option label="财务报表" value="finance" />
                <el-option label="运营报表" value="operation" />
                <el-option label="自定义报表" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="报表描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入报表描述"
          />
        </el-form-item>
        <el-form-item label="数据源" prop="dataSource">
          <el-select v-model="formData.dataSource" placeholder="请选择数据源" style="width: 100%">
            <el-option label="用户数据" value="users" />
            <el-option label="订单数据" value="orders" />
            <el-option label="商品数据" value="products" />
            <el-option label="财务数据" value="finance" />
          </el-select>
        </el-form-item>
        <el-form-item label="报表字段">
          <el-checkbox-group v-model="formData.fields">
            <el-checkbox label="id">ID</el-checkbox>
            <el-checkbox label="name">名称</el-checkbox>
            <el-checkbox label="email">邮箱</el-checkbox>
            <el-checkbox label="phone">手机号</el-checkbox>
            <el-checkbox label="createdAt">创建时间</el-checkbox>
            <el-checkbox label="status">状态</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="调度设置">
          <el-radio-group v-model="formData.scheduleType">
            <el-radio label="manual">手动生成</el-radio>
            <el-radio label="daily">每日</el-radio>
            <el-radio label="weekly">每周</el-radio>
            <el-radio label="monthly">每月</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="输出格式">
          <el-checkbox-group v-model="formData.formats">
            <el-checkbox label="excel">Excel</el-checkbox>
            <el-checkbox label="pdf">PDF</el-checkbox>
            <el-checkbox label="csv">CSV</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Refresh, Search, RefreshLeft, Delete, Download, View, Edit,
  Document, CircleCheck, Clock
} from '@element-plus/icons-vue'
import {
  getReportsList, getReportsStats, createReport, updateReport, deleteReport,
  updateReportStatus, batchDeleteReports, exportReportsList, generateReportData
} from '@/api/data-analysis/reports'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const selectedReports = ref([])
const formRef = ref(null)

// 统计数据
const statsData = reactive({
  total: 0,
  active: 0,
  scheduled: 0,
  generated: 0
})

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
  status: '',
  dateRange: null
})

// 分页数据
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 报表列表
const reportsList = ref([])

// 表单数据
const formData = reactive({
  id: null,
  name: '',
  type: '',
  description: '',
  dataSource: '',
  fields: [],
  scheduleType: 'manual',
  formats: ['excel']
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入报表名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择报表类型', trigger: 'change' }],
  dataSource: [{ required: true, message: '请选择数据源', trigger: 'change' }]
}

// 方法
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    
    // 处理日期范围
    if (searchForm.dateRange) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const { data } = await getReportsList(params)
    reportsList.value = data.list
    pagination.total = data.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const { data } = await getReportsStats()
    Object.assign(statsData, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const refreshData = () => {
  loadData()
  loadStats()
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    type: '',
    status: '',
    dateRange: null
  })
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.size = size
  loadData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSelectionChange = (selection) => {
  selectedReports.value = selection
}

const showCreateDialog = () => {
  dialogTitle.value = '创建报表'
  dialogVisible.value = true
}

const editReport = (row) => {
  dialogTitle.value = '编辑报表'
  Object.assign(formData, row)
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (formData.id) {
      await updateReport(formData.id, formData)
      ElMessage.success('报表更新成功')
    } else {
      await createReport(formData)
      ElMessage.success('报表创建成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('操作失败')
    }
  }
}

const resetForm = () => {
  Object.assign(formData, {
    id: null,
    name: '',
    type: '',
    description: '',
    dataSource: '',
    fields: [],
    scheduleType: 'manual',
    formats: ['excel']
  })
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const updateStatus = async (row) => {
  try {
    await updateReportStatus(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    // 恢复原状态
    row.status = row.status === 'active' ? 'inactive' : 'active'
  }
}

const viewReport = (row) => {
  // 跳转到报表详情页面
  ElMessage.info('报表查看功能开发中')
}

const generateReport = async (row) => {
  try {
    await generateReportData(row.id)
    ElMessage.success('报表生成成功')
    loadData()
  } catch (error) {
    ElMessage.error('报表生成失败')
  }
}

const deleteReport = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除报表 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteReport(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedReports.value.length} 个报表吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedReports.value.map(item => item.id)
    await batchDeleteReports({ ids })
    ElMessage.success('批量删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

const exportReports = async () => {
  try {
    await exportReportsList(searchForm)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const getTypeLabel = (type) => {
  const labels = {
    user: '用户报表',
    order: '订单报表',
    finance: '财务报表',
    operation: '运营报表',
    custom: '自定义报表'
  }
  return labels[type] || type
}

const getTypeTagType = (type) => {
  const types = {
    user: 'primary',
    order: 'success',
    finance: 'warning',
    operation: 'info',
    custom: 'danger'
  }
  return types[type] || 'info'
}

// 生命周期
onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped>
.reports-management {
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

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-description {
  margin: 5px 0 0 0;
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
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: white;
}

.total-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.active-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.scheduled-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.generated-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-info {
  display: flex;
  flex-direction: column;
}

.report-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.report-desc {
  font-size: 12px;
  color: #909399;
}

.text-muted {
  color: #c0c4cc;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>