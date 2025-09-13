<template>
  <div class="message-records-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>消息发送记录</h2>
        <p>查看和管理所有消息发送记录，支持重发、统计分析等功能</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleSend">
          <el-icon><Message /></el-icon>
          发送消息
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.total }}</div>
              <div class="stats-label">总发送量</div>
            </div>
            <el-icon class="stats-icon"><Message /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card success">
            <div class="stats-content">
              <div class="stats-number">{{ stats.success }}</div>
              <div class="stats-label">发送成功</div>
            </div>
            <el-icon class="stats-icon"><Check /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card warning">
            <div class="stats-content">
              <div class="stats-number">{{ stats.failed }}</div>
              <div class="stats-label">发送失败</div>
            </div>
            <el-icon class="stats-icon"><Close /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card info">
            <div class="stats-content">
              <div class="stats-number">{{ stats.pending }}</div>
              <div class="stats-label">待发送</div>
            </div>
            <el-icon class="stats-icon"><Clock /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="消息类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable style="width: 150px">
            <el-option label="邮件" value="email" />
            <el-option label="短信" value="sms" />
            <el-option label="站内信" value="notification" />
            <el-option label="微信" value="wechat" />
            <el-option label="钉钉" value="dingtalk" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
            <el-option label="待发送" value="pending" />
            <el-option label="发送中" value="sending" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板">
          <el-select v-model="searchForm.templateId" placeholder="请选择模板" clearable style="width: 200px">
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="接收人">
          <el-input
            v-model="searchForm.recipient"
            placeholder="请输入接收人"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="发送时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 350px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 记录列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="table-title">发送记录</div>
        <div class="table-actions">
          <el-button @click="handleBatchResend" :disabled="!selectedRecords.length">
            <el-icon><Refresh /></el-icon>
            批量重发
          </el-button>
          <el-button @click="handleBatchDelete" :disabled="!selectedRecords.length">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
      
      <el-table
        :data="records"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="记录ID" width="120" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="templateName" label="模板" min-width="150" show-overflow-tooltip />
        <el-table-column prop="subject" label="主题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="recipient" label="接收人" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sentAt" label="发送时间" width="160" />
        <el-table-column prop="deliveredAt" label="送达时间" width="160">
          <template #default="{ row }">
            <span v-if="row.deliveredAt">{{ row.deliveredAt }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button 
              v-if="row.status === 'failed'"
              type="warning" 
              link 
              @click="handleResend(row)"
            >
              <el-icon><Refresh /></el-icon>
              重发
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
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

    <!-- 记录详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="消息详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="recordDetail" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ recordDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="消息类型">
            <el-tag :type="getTypeTagType(recordDetail.type)">{{ getTypeLabel(recordDetail.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模板名称">{{ recordDetail.templateName }}</el-descriptions-item>
          <el-descriptions-item label="发送状态">
            <el-tag :type="getStatusTagType(recordDetail.status)">{{ getStatusLabel(recordDetail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="接收人">{{ recordDetail.recipient }}</el-descriptions-item>
          <el-descriptions-item label="发送人">{{ recordDetail.sender }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ recordDetail.sentAt }}</el-descriptions-item>
          <el-descriptions-item label="送达时间">
            <span v-if="recordDetail.deliveredAt">{{ recordDetail.deliveredAt }}</span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-section">
          <h4>消息主题</h4>
          <p>{{ recordDetail.subject }}</p>
        </div>
        
        <div class="detail-section">
          <h4>消息内容</h4>
          <div class="message-content" v-html="recordDetail.content"></div>
        </div>
        
        <div v-if="recordDetail.error" class="detail-section">
          <h4>错误信息</h4>
          <el-alert :title="recordDetail.error" type="error" show-icon :closable="false" />
        </div>
        
        <div v-if="recordDetail.logs && recordDetail.logs.length" class="detail-section">
          <h4>发送日志</h4>
          <el-timeline>
            <el-timeline-item
              v-for="log in recordDetail.logs"
              :key="log.id"
              :timestamp="log.createdAt"
              :type="getLogType(log.level)"
            >
              {{ log.message }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button 
          v-if="recordDetail && recordDetail.status === 'failed'"
          type="warning" 
          @click="handleResend(recordDetail)"
        >
          重发消息
        </el-button>
      </template>
    </el-dialog>

    <!-- 发送消息对话框 -->
    <el-dialog
      v-model="sendDialogVisible"
      title="发送消息"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="sendFormRef"
        :model="sendForm"
        :rules="sendFormRules"
        label-width="100px"
      >
        <el-form-item label="消息类型" prop="type">
          <el-select v-model="sendForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="邮件" value="email" />
            <el-option label="短信" value="sms" />
            <el-option label="站内信" value="notification" />
            <el-option label="微信" value="wechat" />
            <el-option label="钉钉" value="dingtalk" />
          </el-select>
        </el-form-item>
        <el-form-item label="消息模板" prop="templateId">
          <el-select v-model="sendForm.templateId" placeholder="请选择模板" style="width: 100%">
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="接收人" prop="recipients">
          <el-input
            v-model="sendForm.recipients"
            type="textarea"
            :rows="3"
            placeholder="请输入接收人，多个接收人用换行分隔"
          />
        </el-form-item>
        <el-form-item label="变量数据">
          <el-input
            v-model="sendForm.variables"
            type="textarea"
            :rows="4"
            placeholder="请输入变量数据（JSON格式），如：{\"name\": \"张三\", \"email\": \"zhangsan@example.com\"}"
          />
        </el-form-item>
        <el-form-item label="发送时间">
          <el-radio-group v-model="sendForm.sendType">
            <el-radio label="immediate">立即发送</el-radio>
            <el-radio label="scheduled">定时发送</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="sendForm.sendType === 'scheduled'" label="定时时间" prop="scheduledAt">
          <el-date-picker
            v-model="sendForm.scheduledAt"
            type="datetime"
            placeholder="选择发送时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="sendDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSendSubmit" :loading="sending">
          {{ sendForm.sendType === 'immediate' ? '立即发送' : '定时发送' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Message, Search, Refresh, Download, Delete, Edit, View,
  Check, Close, Clock
} from '@element-plus/icons-vue'
import {
  getRecordList,
  getRecordDetail,
  deleteRecord,
  batchDeleteRecords,
  resendMessage,
  batchResendMessages,
  exportRecords,
  getRecordStats,
  sendMessage
} from '@/api/message-center/records'
import { getTemplateList } from '@/api/message-center/templates'

// 响应式数据
const loading = ref(false)
const sending = ref(false)
const detailDialogVisible = ref(false)
const sendDialogVisible = ref(false)
const selectedRecords = ref([])
const recordDetail = ref(null)

// 统计数据
const stats = reactive({
  total: 0,
  success: 0,
  failed: 0,
  pending: 0
})

// 搜索表单
const searchForm = reactive({
  type: '',
  status: '',
  templateId: '',
  recipient: '',
  dateRange: []
})

// 分页数据
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 表格数据
const records = ref([])
const templates = ref([])

// 发送表单
const sendFormRef = ref()
const sendForm = reactive({
  type: '',
  templateId: '',
  recipients: '',
  variables: '',
  sendType: 'immediate',
  scheduledAt: ''
})

// 发送表单验证规则
const sendFormRules = {
  type: [{ required: true, message: '请选择消息类型', trigger: 'change' }],
  templateId: [{ required: true, message: '请选择消息模板', trigger: 'change' }],
  recipients: [{ required: true, message: '请输入接收人', trigger: 'blur' }],
  scheduledAt: [{ required: true, message: '请选择发送时间', trigger: 'change' }]
}

// 获取类型标签样式
const getTypeTagType = (type) => {
  const typeMap = {
    email: 'primary',
    sms: 'success',
    notification: 'info',
    wechat: 'warning',
    dingtalk: 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取类型标签文本
const getTypeLabel = (type) => {
  const typeMap = {
    email: '邮件',
    sms: '短信',
    notification: '站内信',
    wechat: '微信',
    dingtalk: '钉钉'
  }
  return typeMap[type] || type
}

// 获取状态标签样式
const getStatusTagType = (status) => {
  const statusMap = {
    success: 'success',
    failed: 'danger',
    pending: 'warning',
    sending: 'info'
  }
  return statusMap[status] || 'info'
}

// 获取状态标签文本
const getStatusLabel = (status) => {
  const statusMap = {
    success: '成功',
    failed: '失败',
    pending: '待发送',
    sending: '发送中'
  }
  return statusMap[status] || status
}

// 获取日志类型
const getLogType = (level) => {
  const levelMap = {
    info: 'primary',
    warning: 'warning',
    error: 'danger',
    success: 'success'
  }
  return levelMap[level] || 'primary'
}

// 获取记录列表
const fetchRecords = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: pagination.page,
      size: pagination.size
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startTime = searchForm.dateRange[0]
      params.endTime = searchForm.dateRange[1]
    }
    const response = await getRecordList(params)
    records.value = response.data.list
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取记录列表失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await getRecordStats()
    Object.assign(stats, response.data)
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取模板列表
const fetchTemplates = async () => {
  try {
    const response = await getTemplateList({ status: 'active' })
    templates.value = response.data.list || []
  } catch (error) {
    console.error('获取模板列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchRecords()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    type: '',
    status: '',
    templateId: '',
    recipient: '',
    dateRange: []
  })
  pagination.page = 1
  fetchRecords()
}

// 查看记录详情
const handleView = async (row) => {
  try {
    const response = await getRecordDetail(row.id)
    recordDetail.value = response.data
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取记录详情失败')
  }
}

// 重发消息
const handleResend = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要重发消息给 "${row.recipient}" 吗？`,
      '确认重发',
      {
        type: 'warning'
      }
    )
    await resendMessage(row.id)
    ElMessage.success('重发成功')
    fetchRecords()
    fetchStats()
    detailDialogVisible.value = false
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重发失败')
    }
  }
}

// 删除记录
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除记录 "${row.id}" 吗？`,
      '确认删除',
      {
        type: 'warning'
      }
    )
    await deleteRecord(row.id)
    ElMessage.success('删除成功')
    fetchRecords()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 批量重发
const handleBatchResend = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要重发选中的 ${selectedRecords.value.length} 条消息吗？`,
      '确认批量重发',
      {
        type: 'warning'
      }
    )
    const ids = selectedRecords.value.map(item => item.id)
    await batchResendMessages({ ids })
    ElMessage.success('批量重发成功')
    fetchRecords()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量重发失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRecords.value.length} 条记录吗？`,
      '确认批量删除',
      {
        type: 'warning'
      }
    )
    const ids = selectedRecords.value.map(item => item.id)
    await batchDeleteRecords({ ids })
    ElMessage.success('批量删除成功')
    fetchRecords()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 导出
const handleExport = async () => {
  try {
    await exportRecords(searchForm)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 发送消息
const handleSend = () => {
  resetSendForm()
  sendDialogVisible.value = true
}

// 提交发送
const handleSendSubmit = async () => {
  try {
    await sendFormRef.value.validate()
    sending.value = true
    
    const data = { ...sendForm }
    if (data.variables) {
      try {
        data.variables = JSON.parse(data.variables)
      } catch (error) {
        ElMessage.error('变量数据格式错误，请输入有效的JSON格式')
        return
      }
    }
    
    await sendMessage(data)
    ElMessage.success('发送成功')
    sendDialogVisible.value = false
    fetchRecords()
    fetchStats()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('发送失败')
    }
  } finally {
    sending.value = false
  }
}

// 选择变更
const handleSelectionChange = (selection) => {
  selectedRecords.value = selection
}

// 分页大小变更
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchRecords()
}

// 当前页变更
const handleCurrentChange = (page) => {
  pagination.page = page
  fetchRecords()
}

// 重置发送表单
const resetSendForm = () => {
  Object.assign(sendForm, {
    type: '',
    templateId: '',
    recipients: '',
    variables: '',
    sendType: 'immediate',
    scheduledAt: ''
  })
  sendFormRef.value?.clearValidate()
}

// 初始化
onMounted(() => {
  fetchRecords()
  fetchStats()
  fetchTemplates()
})
</script>

<style scoped>
.message-records-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  position: relative;
  overflow: hidden;
}

.stats-card.success {
  border-left: 4px solid #67c23a;
}

.stats-card.warning {
  border-left: 4px solid #e6a23c;
}

.stats-card.info {
  border-left: 4px solid #909399;
}

.stats-content {
  position: relative;
  z-index: 2;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stats-card.success .stats-number {
  color: #67c23a;
}

.stats-card.warning .stats-number {
  color: #e6a23c;
}

.stats-card.info .stats-number {
  color: #909399;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.stats-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40px;
  color: #409eff;
  opacity: 0.1;
}

.stats-card.success .stats-icon {
  color: #67c23a;
}

.stats-card.warning .stats-icon {
  color: #e6a23c;
}

.stats-card.info .stats-icon {
  color: #909399;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
}

.text-muted {
  color: #999;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.record-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.message-content {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  max-height: 200px;
  overflow-y: auto;
}
</style>