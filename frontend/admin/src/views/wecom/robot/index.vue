<template>
  <div class="robot-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>机器人管理</h2>
        <p class="header-desc">管理企业微信群机器人，包括机器人配置和消息推送</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          添加机器人
        </el-button>
        <el-button @click="handleSync" :loading="syncLoading">
          <el-icon><Refresh /></el-icon>
          同步状态
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon robot-icon">
              <el-icon><Robot /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total || 0 }}</div>
              <div class="stat-label">总机器人数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.active || 0 }}</div>
              <div class="stat-label">活跃机器人</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon message-icon">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.todayMessages || 0 }}</div>
              <div class="stat-label">今日消息</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon success-icon">
              <el-icon><SuccessFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.successRate || '0%' }}</div>
              <div class="stat-label">成功率</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true" label-width="80px">
        <el-form-item label="机器人名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入机器人名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="所属群聊">
          <el-input
            v-model="searchForm.groupName"
            placeholder="请输入群聊名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
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
    </el-card>

    <!-- 机器人列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>机器人列表</span>
          <div class="header-actions">
            <el-button
              type="danger"
              :disabled="selectedRobots.length === 0"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="robotList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="机器人名称" width="150" show-overflow-tooltip />
        <el-table-column prop="webhook" label="Webhook地址" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-text class="webhook-text">{{ maskWebhook(row.webhook) }}</el-text>
            <el-button text @click="copyWebhook(row.webhook)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="groupName" label="所属群聊" width="150" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.description">{{ row.description }}</span>
            <el-text v-else type="info">暂无描述</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="messageCount" label="消息数量" width="100">
          <template #default="{ row }">
            <el-text type="primary">{{ row.messageCount || 0 }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="lastMessageTime" label="最后发送" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastMessageTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleTest(row)">
              测试
            </el-button>
            <el-button text type="primary" @click="handleViewMessages(row)">
              消息
            </el-button>
            <el-button text type="warning" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button text type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑机器人对话框 -->
    <el-dialog
      v-model="formVisible"
      :title="isEdit ? '编辑机器人' : '添加机器人'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="robotForm" :rules="robotRules" ref="robotFormRef" label-width="100px">
        <el-form-item label="机器人名称" prop="name">
          <el-input v-model="robotForm.name" placeholder="请输入机器人名称" />
        </el-form-item>
        <el-form-item label="Webhook地址" prop="webhook">
          <el-input
            v-model="robotForm.webhook"
            placeholder="请输入Webhook地址"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
        <el-form-item label="所属群聊" prop="groupId">
          <el-select v-model="robotForm.groupId" placeholder="请选择群聊" style="width: 100%">
            <el-option
              v-for="group in groupList"
              :key="group.chatid"
              :label="group.name"
              :value="group.chatid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="robotForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入机器人描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="robotForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 测试消息对话框 -->
    <el-dialog
      v-model="testVisible"
      title="测试机器人"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="testForm" label-width="80px">
        <el-form-item label="消息类型">
          <el-radio-group v-model="testForm.msgtype">
            <el-radio label="text">文本</el-radio>
            <el-radio label="markdown">Markdown</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="消息内容">
          <el-input
            v-model="testForm.content"
            type="textarea"
            :rows="5"
            placeholder="请输入测试消息内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testVisible = false">取消</el-button>
        <el-button type="primary" @click="sendTestMessage" :loading="testLoading">
          发送测试
        </el-button>
      </template>
    </el-dialog>

    <!-- 消息记录对话框 -->
    <el-dialog
      v-model="messagesVisible"
      title="消息记录"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="messages-header">
        <el-date-picker
          v-model="messageQuery.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 240px; margin-right: 10px"
        />
        <el-button type="primary" @click="fetchMessages">
          查询
        </el-button>
      </div>
      
      <el-table :data="messageList" stripe max-height="400" v-loading="messageLoading">
        <el-table-column prop="content" label="消息内容" width="300" show-overflow-tooltip />
        <el-table-column prop="msgtype" label="消息类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.msgtype }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="发送状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sendTime" label="发送时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.sendTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="errorMsg" label="错误信息" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.errorMsg">{{ row.errorMsg }}</span>
            <el-text v-else type="success">-</el-text>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="messagePagination.page"
          v-model:page-size="messagePagination.limit"
          :page-sizes="[10, 20, 50]"
          :total="messagePagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleMessageSizeChange"
          @current-change="handleMessageCurrentChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Robot,
  Refresh,
  Search,
  CircleCheck,
  ChatDotRound,
  SuccessFilled,
  Delete,
  CopyDocument
} from '@element-plus/icons-vue'
import {
  getRobotList,
  getRobotDetail,
  createRobot,
  updateRobot,
  deleteRobot,
  updateRobotStatus,
  testRobot,
  getRobotMessages,
  syncRobotStatus,
  getStatistics
} from '@/api/wecom/robot'
import { getGroupList } from '@/api/wecom/groups'

// 响应式数据
const loading = ref(false)
const syncLoading = ref(false)
const submitLoading = ref(false)
const testLoading = ref(false)
const messageLoading = ref(false)
const formVisible = ref(false)
const testVisible = ref(false)
const messagesVisible = ref(false)
const isEdit = ref(false)

const robotList = ref([])
const groupList = ref([])
const messageList = ref([])
const selectedRobots = ref([])
const statistics = ref({})
const currentRobot = ref(null)

const searchForm = reactive({
  name: '',
  groupName: '',
  status: null,
  dateRange: null
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const messagePagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const robotForm = reactive({
  id: null,
  name: '',
  webhook: '',
  groupId: '',
  description: '',
  status: 1
})

const testForm = reactive({
  msgtype: 'text',
  content: ''
})

const messageQuery = reactive({
  dateRange: null
})

const robotFormRef = ref()

const robotRules = {
  name: [
    { required: true, message: '请输入机器人名称', trigger: 'blur' }
  ],
  webhook: [
    { required: true, message: '请输入Webhook地址', trigger: 'blur' },
    { type: 'url', message: '请输入正确的URL格式', trigger: 'blur' }
  ],
  groupId: [
    { required: true, message: '请选择所属群聊', trigger: 'change' }
  ]
}

// 方法
const fetchRobotList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    
    if (searchForm.dateRange) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const response = await getRobotList(params)
    robotList.value = response.data.robots
    pagination.total = response.data.pagination.total
  } catch (error) {
    ElMessage.error('获取机器人列表失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const fetchGroupList = async () => {
  try {
    const response = await getGroupList({ page: 1, limit: 100 })
    groupList.value = response.data.groups
  } catch (error) {
    console.error('获取群聊列表失败：', error)
  }
}

const fetchStatistics = async () => {
  try {
    const response = await getStatistics()
    statistics.value = response.data
  } catch (error) {
    console.error('获取统计信息失败：', error)
  }
}

const fetchMessages = async () => {
  try {
    messageLoading.value = true
    const params = {
      robotId: currentRobot.value.id,
      page: messagePagination.page,
      limit: messagePagination.limit
    }
    
    if (messageQuery.dateRange) {
      params.startDate = messageQuery.dateRange[0]
      params.endDate = messageQuery.dateRange[1]
    }
    
    const response = await getRobotMessages(params)
    messageList.value = response.data.messages
    messagePagination.total = response.data.pagination.total
  } catch (error) {
    ElMessage.error('获取消息记录失败：' + error.message)
  } finally {
    messageLoading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchRobotList()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    groupName: '',
    status: null,
    dateRange: null
  })
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchRobotList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchRobotList()
}

const handleMessageSizeChange = (size) => {
  messagePagination.limit = size
  messagePagination.page = 1
  fetchMessages()
}

const handleMessageCurrentChange = (page) => {
  messagePagination.page = page
  fetchMessages()
}

const handleSelectionChange = (selection) => {
  selectedRobots.value = selection
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(robotForm, {
    id: null,
    name: '',
    webhook: '',
    groupId: '',
    description: '',
    status: 1
  })
  formVisible.value = true
}

const handleEdit = (robot) => {
  isEdit.value = true
  Object.assign(robotForm, {
    id: robot.id,
    name: robot.name,
    webhook: robot.webhook,
    groupId: robot.groupId,
    description: robot.description || '',
    status: robot.status
  })
  formVisible.value = true
}

const submitForm = async () => {
  try {
    await robotFormRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value) {
      await updateRobot(robotForm.id, robotForm)
      ElMessage.success('更新成功')
    } else {
      await createRobot(robotForm)
      ElMessage.success('创建成功')
    }
    
    formVisible.value = false
    fetchRobotList()
  } catch (error) {
    if (error.message) {
      ElMessage.error(isEdit.value ? '更新失败：' + error.message : '创建失败：' + error.message)
    }
  } finally {
    submitLoading.value = false
  }
}

const handleStatusChange = async (robot) => {
  try {
    await updateRobotStatus(robot.id, { status: robot.status })
    ElMessage.success(robot.status ? '启用成功' : '禁用成功')
  } catch (error) {
    // 恢复原状态
    robot.status = robot.status ? 0 : 1
    ElMessage.error('状态更新失败：' + error.message)
  }
}

const handleTest = (robot) => {
  currentRobot.value = robot
  testForm.msgtype = 'text'
  testForm.content = '这是一条测试消息'
  testVisible.value = true
}

const sendTestMessage = async () => {
  try {
    testLoading.value = true
    await testRobot(currentRobot.value.id, testForm)
    ElMessage.success('测试消息发送成功')
    testVisible.value = false
  } catch (error) {
    ElMessage.error('测试消息发送失败：' + error.message)
  } finally {
    testLoading.value = false
  }
}

const handleViewMessages = (robot) => {
  currentRobot.value = robot
  messagePagination.page = 1
  messageQuery.dateRange = null
  messagesVisible.value = true
  fetchMessages()
}

const handleDelete = async (robot) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除机器人 "${robot.name}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteRobot(robot.id)
    ElMessage.success('删除成功')
    fetchRobotList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRobots.value.length} 个机器人吗？此操作不可恢复！`,
      '确认批量删除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedRobots.value.map(robot => robot.id)
    await Promise.all(ids.map(id => deleteRobot(id)))
    
    ElMessage.success('批量删除成功')
    fetchRobotList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + error.message)
    }
  }
}

const handleSync = async () => {
  try {
    syncLoading.value = true
    await syncRobotStatus()
    ElMessage.success('同步成功')
    await Promise.all([
      fetchRobotList(),
      fetchStatistics()
    ])
  } catch (error) {
    ElMessage.error('同步失败：' + error.message)
  } finally {
    syncLoading.value = false
  }
}

const maskWebhook = (webhook) => {
  if (!webhook) return ''
  const url = new URL(webhook)
  return `${url.protocol}//${url.host}/...`
}

const copyWebhook = async (webhook) => {
  try {
    await navigator.clipboard.writeText(webhook)
    ElMessage.success('Webhook地址已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  Promise.all([
    fetchRobotList(),
    fetchGroupList(),
    fetchStatistics()
  ])
})
</script>

<style scoped>
.robot-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 5px 0;
  color: #303133;
}

.header-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 10px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.robot-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.active-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.message-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.success-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.webhook-text {
  font-family: monospace;
  font-size: 12px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.messages-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}
</style>