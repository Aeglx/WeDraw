<template>
  <div class="miniprogram-messages">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">小程序模板消息</h1>
        <p class="page-description">管理小程序模板消息发送记录和统计</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showSendDialog = true">
          <el-icon><Plus /></el-icon>
          发送消息
        </el-button>
        <el-button @click="showBatchSendDialog = true">
          <el-icon><Message /></el-icon>
          批量发送
        </el-button>
        <el-button @click="exportMessages">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><Message /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.total_sent }}</div>
              <div class="stat-label">总发送量</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon success">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.success_count }}</div>
              <div class="stat-label">成功发送</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon failed">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.failed_count }}</div>
              <div class="stat-label">发送失败</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon rate">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.success_rate }}</div>
              <div class="stat-label">成功率</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="模板ID">
          <el-input
            v-model="searchForm.template_id"
            placeholder="请输入模板ID"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="发送状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="发送成功" value="success" />
            <el-option label="等待发送" value="pending" />
            <el-option label="发送失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送时间">
          <el-date-picker
            v-model="searchForm.dateRange"
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
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 消息列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="messageList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="template_id" label="模板ID" width="120" />
        <el-table-column prop="title" label="消息标题" min-width="200" />
        <el-table-column label="接收用户" width="150">
          <template #default="{ row }">
            <span>{{ row.touser.substring(0, 8) }}...</span>
          </template>
        </el-table-column>
        <el-table-column label="发送状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="send_time" label="发送时间" width="180" />
        <el-table-column prop="click_count" label="点击次数" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewMessage(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="row.status === 'failed'"
              type="warning"
              size="small"
              @click="resendMessage(row.id)"
            >
              重发
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteMessage(row.id)"
            >
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
    </div>

    <!-- 发送消息对话框 -->
    <el-dialog
      v-model="showSendDialog"
      title="发送模板消息"
      width="600px"
      :before-close="handleSendDialogClose"
    >
      <el-form
        ref="sendFormRef"
        :model="sendForm"
        :rules="sendRules"
        label-width="100px"
      >
        <el-form-item label="选择模板" prop="template_id">
          <el-select
            v-model="sendForm.template_id"
            placeholder="请选择消息模板"
            style="width: 100%"
            @change="handleTemplateChange"
          >
            <el-option
              v-for="template in templateList"
              :key="template.template_id"
              :label="template.title"
              :value="template.template_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="接收用户" prop="touser">
          <el-input
            v-model="sendForm.touser"
            placeholder="请输入用户openid"
          />
        </el-form-item>
        <el-form-item label="跳转页面">
          <el-input
            v-model="sendForm.page"
            placeholder="请输入小程序页面路径（可选）"
          />
        </el-form-item>
        <el-form-item label="模板数据" prop="data">
          <div v-if="selectedTemplate" class="template-data">
            <div class="template-preview">
              <h4>模板预览：</h4>
              <div class="preview-content">{{ selectedTemplate.example }}</div>
            </div>
            <div class="data-inputs">
              <div
                v-for="(field, key) in templateFields"
                :key="key"
                class="field-input"
              >
                <label>{{ key }}:</label>
                <el-input
                  v-model="sendForm.data[key].value"
                  :placeholder="`请输入${key}的值`"
                />
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSendDialog = false">取消</el-button>
        <el-button type="primary" @click="sendMessage" :loading="sending">
          发送消息
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量发送对话框 -->
    <el-dialog
      v-model="showBatchSendDialog"
      title="批量发送消息"
      width="600px"
    >
      <el-form
        ref="batchSendFormRef"
        :model="batchSendForm"
        label-width="100px"
      >
        <el-form-item label="选择模板" prop="template_id">
          <el-select
            v-model="batchSendForm.template_id"
            placeholder="请选择消息模板"
            style="width: 100%"
          >
            <el-option
              v-for="template in templateList"
              :key="template.template_id"
              :label="template.title"
              :value="template.template_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用户列表">
          <el-input
            v-model="batchSendForm.user_list"
            type="textarea"
            :rows="6"
            placeholder="请输入用户openid列表，每行一个"
          />
        </el-form-item>
        <el-form-item label="发送时间">
          <el-radio-group v-model="batchSendForm.send_type">
            <el-radio label="now">立即发送</el-radio>
            <el-radio label="scheduled">定时发送</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="batchSendForm.send_type === 'scheduled'" label="发送时间">
          <el-date-picker
            v-model="batchSendForm.scheduled_time"
            type="datetime"
            placeholder="选择发送时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchSendDialog = false">取消</el-button>
        <el-button type="primary" @click="batchSendMessage" :loading="batchSending">
          批量发送
        </el-button>
      </template>
    </el-dialog>

    <!-- 消息详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="消息详情"
      width="600px"
    >
      <div v-if="currentMessage" class="message-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="消息ID">{{ currentMessage.id }}</el-descriptions-item>
          <el-descriptions-item label="模板ID">{{ currentMessage.template_id }}</el-descriptions-item>
          <el-descriptions-item label="消息标题">{{ currentMessage.title }}</el-descriptions-item>
          <el-descriptions-item label="接收用户">{{ currentMessage.touser }}</el-descriptions-item>
          <el-descriptions-item label="发送状态">
            <el-tag :type="getStatusType(currentMessage.status)">
              {{ getStatusText(currentMessage.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ currentMessage.send_time || '未发送' }}</el-descriptions-item>
          <el-descriptions-item label="点击次数">{{ currentMessage.click_count }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentMessage.created_at }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="message-content">
          <h4>消息内容：</h4>
          <div class="content-text">{{ currentMessage.content }}</div>
        </div>
        
        <div class="message-data">
          <h4>模板数据：</h4>
          <el-table :data="formatMessageData(currentMessage.data)" size="small">
            <el-table-column prop="key" label="字段" width="120" />
            <el-table-column prop="value" label="值" />
          </el-table>
        </div>
        
        <div v-if="currentMessage.error_msg" class="error-info">
          <h4>错误信息：</h4>
          <div class="error-text">{{ currentMessage.error_msg }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Message,
  Download,
  Check,
  Close,
  TrendCharts,
  Search,
  Refresh
} from '@element-plus/icons-vue'
import {
  getMessageList,
  getMessageDetail,
  sendTemplateMessage,
  batchSendMessage as batchSendAPI,
  getTemplateList,
  getMessageStatistics,
  deleteMessage as deleteMessageAPI,
  resendMessage as resendMessageAPI,
  exportMessages as exportMessagesAPI
} from '@/api/miniprogram/messages'

// 响应式数据
const loading = ref(false)
const sending = ref(false)
const batchSending = ref(false)
const showSendDialog = ref(false)
const showBatchSendDialog = ref(false)
const showDetailDialog = ref(false)

const messageList = ref([])
const templateList = ref([])
const currentMessage = ref(null)
const selectedTemplate = ref(null)

const statistics = ref({
  total_sent: 0,
  success_count: 0,
  failed_count: 0,
  success_rate: '0%',
  today_sent: 0,
  click_rate: '0%'
})

const searchForm = reactive({
  template_id: '',
  status: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const sendForm = reactive({
  template_id: '',
  touser: '',
  page: '',
  data: {}
})

const batchSendForm = reactive({
  template_id: '',
  user_list: '',
  send_type: 'now',
  scheduled_time: ''
})

const sendRules = {
  template_id: [{ required: true, message: '请选择消息模板', trigger: 'change' }],
  touser: [{ required: true, message: '请输入接收用户openid', trigger: 'blur' }]
}

// 计算属性
const templateFields = computed(() => {
  if (!selectedTemplate.value) return {}
  
  const fields = {}
  const content = selectedTemplate.value.content
  const matches = content.match(/{{(\w+)\.DATA}}/g)
  
  if (matches) {
    matches.forEach(match => {
      const key = match.replace('{{', '').replace('.DATA}}', '')
      fields[key] = { value: '' }
    })
  }
  
  return fields
})

// 方法
const fetchMessageList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.start_date = searchForm.dateRange[0]
      params.end_date = searchForm.dateRange[1]
    }
    
    const { data } = await getMessageList(params)
    messageList.value = data.list
    pagination.total = data.total
  } catch (error) {
    ElMessage.error('获取消息列表失败')
  } finally {
    loading.value = false
  }
}

const fetchTemplateList = async () => {
  try {
    const { data } = await getTemplateList()
    templateList.value = data.list
  } catch (error) {
    ElMessage.error('获取模板列表失败')
  }
}

const fetchStatistics = async () => {
  try {
    const { data } = await getMessageStatistics()
    statistics.value = data
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchMessageList()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    template_id: '',
    status: '',
    dateRange: []
  })
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.size = size
  fetchMessageList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchMessageList()
}

const handleTemplateChange = (templateId) => {
  selectedTemplate.value = templateList.value.find(t => t.template_id === templateId)
  if (selectedTemplate.value) {
    sendForm.data = { ...templateFields.value }
  }
}

const sendMessage = async () => {
  try {
    sending.value = true
    await sendTemplateMessage(sendForm)
    ElMessage.success('消息发送成功')
    showSendDialog.value = false
    resetSendForm()
    fetchMessageList()
    fetchStatistics()
  } catch (error) {
    ElMessage.error('消息发送失败')
  } finally {
    sending.value = false
  }
}

const batchSendMessage = async () => {
  try {
    batchSending.value = true
    const userList = batchSendForm.user_list.split('\n').filter(user => user.trim())
    const params = {
      ...batchSendForm,
      user_list: userList
    }
    
    const { data } = await batchSendAPI(params)
    ElMessage.success(`批量发送完成，成功：${data.success_count}，失败：${data.fail_count}`)
    showBatchSendDialog.value = false
    resetBatchSendForm()
    fetchMessageList()
    fetchStatistics()
  } catch (error) {
    ElMessage.error('批量发送失败')
  } finally {
    batchSending.value = false
  }
}

const viewMessage = async (row) => {
  try {
    const { data } = await getMessageDetail(row.id)
    currentMessage.value = data
    showDetailDialog.value = true
  } catch (error) {
    ElMessage.error('获取消息详情失败')
  }
}

const resendMessage = async (id) => {
  try {
    await ElMessageBox.confirm('确认重新发送此消息？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await resendMessageAPI(id)
    ElMessage.success('消息重发成功')
    fetchMessageList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('消息重发失败')
    }
  }
}

const deleteMessage = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除此消息记录？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteMessageAPI(id)
    ElMessage.success('消息删除成功')
    fetchMessageList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('消息删除失败')
    }
  }
}

const exportMessages = async () => {
  try {
    const { data } = await exportMessagesAPI(searchForm)
    ElMessage.success('导出任务已创建，请稍后下载')
    // 这里可以添加下载逻辑
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const getStatusType = (status) => {
  const statusMap = {
    success: 'success',
    pending: 'warning',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    success: '发送成功',
    pending: '等待发送',
    failed: '发送失败'
  }
  return statusMap[status] || '未知状态'
}

const formatMessageData = (data) => {
  if (!data) return []
  return Object.entries(data).map(([key, value]) => ({
    key,
    value: value.value || value
  }))
}

const handleSendDialogClose = () => {
  resetSendForm()
}

const resetSendForm = () => {
  Object.assign(sendForm, {
    template_id: '',
    touser: '',
    page: '',
    data: {}
  })
  selectedTemplate.value = null
}

const resetBatchSendForm = () => {
  Object.assign(batchSendForm, {
    template_id: '',
    user_list: '',
    send_type: 'now',
    scheduled_time: ''
  })
}

// 生命周期
onMounted(() => {
  fetchMessageList()
  fetchTemplateList()
  fetchStatistics()
})
</script>

<style scoped>
.miniprogram-messages {
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
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.success {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.failed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.rate {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.template-data {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
}

.template-preview {
  margin-bottom: 16px;
}

.template-preview h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.preview-content {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-line;
}

.data-inputs {
  display: grid;
  gap: 12px;
}

.field-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-input label {
  min-width: 80px;
  font-size: 14px;
  color: #606266;
}

.message-detail {
  padding: 16px 0;
}

.message-content,
.message-data,
.error-info {
  margin-top: 20px;
}

.message-content h4,
.message-data h4,
.error-info h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}

.content-text {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
}

.error-text {
  padding: 12px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 14px;
}
</style>