<template>
  <div class="groups-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>群聊管理</h2>
        <p class="header-desc">管理企业微信群聊，包括群聊信息和成员管理</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleSync" :loading="syncLoading">
          <el-icon><Refresh /></el-icon>
          同步群聊
        </el-button>
        <el-button @click="handleExport" :loading="exportLoading">
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
            <div class="stat-icon group-icon">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total || 0 }}</div>
              <div class="stat-label">总群聊数</div>
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
              <div class="stat-label">活跃群聊</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon member-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.totalMembers || 0 }}</div>
              <div class="stat-label">总成员数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon sync-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ lastSyncTime }}</div>
              <div class="stat-label">最后同步</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true" label-width="80px">
        <el-form-item label="群聊名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入群聊名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="群主">
          <el-input
            v-model="searchForm.owner"
            placeholder="请输入群主姓名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="群聊类型">
          <el-select
            v-model="searchForm.chatType"
            placeholder="请选择群聊类型"
            clearable
            style="width: 150px"
          >
            <el-option label="普通群" value="group" />
            <el-option label="部门群" value="department" />
            <el-option label="项目群" value="project" />
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

    <!-- 群聊列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>群聊列表</span>
          <div class="header-actions">
            <el-button
              type="danger"
              :disabled="selectedGroups.length === 0"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="groupList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="群聊名称" width="200" show-overflow-tooltip />
        <el-table-column prop="owner" label="群主" width="120">
          <template #default="{ row }">
            <div class="owner-info">
              <el-avatar :src="row.ownerAvatar" :size="30">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="owner-name">{{ row.owner }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="chatType" label="群聊类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getChatTypeColor(row.chatType)" size="small">
              {{ getChatTypeText(row.chatType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="memberCount" label="成员数量" width="100">
          <template #default="{ row }">
            <el-text type="primary">{{ row.memberCount }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="notice" label="群公告" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.notice">{{ row.notice }}</span>
            <el-text v-else type="info">暂无公告</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastActiveTime" label="最后活跃" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastActiveTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleViewMembers(row)">
              成员
            </el-button>
            <el-button text type="primary" @click="handleViewDetail(row)">
              详情
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

    <!-- 群聊详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="群聊详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="currentGroup" class="group-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="群聊ID">{{ currentGroup.chatid }}</el-descriptions-item>
          <el-descriptions-item label="群聊名称">{{ currentGroup.name }}</el-descriptions-item>
          <el-descriptions-item label="群主">{{ currentGroup.owner }}</el-descriptions-item>
          <el-descriptions-item label="群聊类型">
            <el-tag :type="getChatTypeColor(currentGroup.chatType)" size="small">
              {{ getChatTypeText(currentGroup.chatType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="成员数量">{{ currentGroup.memberCount }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentGroup.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="群公告" :span="2">
            {{ currentGroup.notice || '暂无公告' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 群成员对话框 -->
    <el-dialog
      v-model="membersVisible"
      title="群成员管理"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="members-header">
        <el-input
          v-model="memberSearch"
          placeholder="搜索成员姓名"
          style="width: 300px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <el-table :data="filteredMembers" stripe max-height="400">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="userid" label="用户ID" width="150" />
        <el-table-column prop="department" label="部门" width="150" />
        <el-table-column prop="joinTime" label="加入时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.joinTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="成员类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1" type="success" size="small">群主</el-tag>
            <el-tag v-else-if="row.type === 2" type="warning" size="small">管理员</el-tag>
            <el-tag v-else type="info" size="small">普通成员</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button
              v-if="row.type !== 1"
              text
              type="danger"
              @click="handleRemoveMember(row)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 编辑群聊对话框 -->
    <el-dialog
      v-model="editVisible"
      title="编辑群聊"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
        <el-form-item label="群聊名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入群聊名称" />
        </el-form-item>
        <el-form-item label="群聊类型" prop="chatType">
          <el-select v-model="editForm.chatType" placeholder="请选择群聊类型" style="width: 100%">
            <el-option label="普通群" value="group" />
            <el-option label="部门群" value="department" />
            <el-option label="项目群" value="project" />
          </el-select>
        </el-form-item>
        <el-form-item label="群公告" prop="notice">
          <el-input
            v-model="editForm.notice"
            type="textarea"
            :rows="3"
            placeholder="请输入群公告"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submitLoading">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 导出对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出群聊数据"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="exportForm" label-width="80px">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportForm.format">
            <el-radio label="xlsx">Excel格式</el-radio>
            <el-radio label="csv">CSV格式</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="导出内容">
          <el-checkbox-group v-model="exportForm.fields">
            <el-checkbox label="basic">基本信息</el-checkbox>
            <el-checkbox label="members">成员信息</el-checkbox>
            <el-checkbox label="statistics">统计数据</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExport" :loading="exportLoading">
          确认导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound,
  User,
  Refresh,
  Download,
  Search,
  CircleCheck,
  Clock,
  Delete
} from '@element-plus/icons-vue'
import {
  getGroupList,
  getGroupDetail,
  getGroupMembers,
  updateGroup,
  deleteGroup,
  removeMember,
  syncGroups,
  exportGroups,
  getStatistics
} from '@/api/wecom/groups'

// 响应式数据
const loading = ref(false)
const syncLoading = ref(false)
const exportLoading = ref(false)
const submitLoading = ref(false)
const detailVisible = ref(false)
const membersVisible = ref(false)
const editVisible = ref(false)
const exportDialogVisible = ref(false)

const groupList = ref([])
const currentGroup = ref(null)
const currentMembers = ref([])
const selectedGroups = ref([])
const statistics = ref({})
const memberSearch = ref('')

const searchForm = reactive({
  name: '',
  owner: '',
  chatType: '',
  dateRange: null
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const editForm = reactive({
  chatid: '',
  name: '',
  chatType: '',
  notice: ''
})

const exportForm = reactive({
  format: 'xlsx',
  fields: ['basic']
})

const editFormRef = ref()

const editRules = {
  name: [
    { required: true, message: '请输入群聊名称', trigger: 'blur' }
  ],
  chatType: [
    { required: true, message: '请选择群聊类型', trigger: 'change' }
  ]
}

// 计算属性
const lastSyncTime = computed(() => {
  if (!statistics.value.lastSyncTime) return '未同步'
  const date = new Date(statistics.value.lastSyncTime)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
})

const filteredMembers = computed(() => {
  if (!memberSearch.value) return currentMembers.value
  return currentMembers.value.filter(member => 
    member.name.toLowerCase().includes(memberSearch.value.toLowerCase())
  )
})

// 方法
const fetchGroupList = async () => {
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
    
    const response = await getGroupList(params)
    groupList.value = response.data.groups
    pagination.total = response.data.pagination.total
  } catch (error) {
    ElMessage.error('获取群聊列表失败：' + error.message)
  } finally {
    loading.value = false
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

const handleSearch = () => {
  pagination.page = 1
  fetchGroupList()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    owner: '',
    chatType: '',
    dateRange: null
  })
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchGroupList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchGroupList()
}

const handleSelectionChange = (selection) => {
  selectedGroups.value = selection
}

const handleViewDetail = async (group) => {
  try {
    const response = await getGroupDetail(group.chatid)
    currentGroup.value = response.data
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取群聊详情失败：' + error.message)
  }
}

const handleViewMembers = async (group) => {
  try {
    const response = await getGroupMembers(group.chatid)
    currentMembers.value = response.data.members
    currentGroup.value = group
    membersVisible.value = true
  } catch (error) {
    ElMessage.error('获取群成员失败：' + error.message)
  }
}

const handleEdit = (group) => {
  Object.assign(editForm, {
    chatid: group.chatid,
    name: group.name,
    chatType: group.chatType,
    notice: group.notice || ''
  })
  editVisible.value = true
}

const submitEdit = async () => {
  try {
    await editFormRef.value.validate()
    submitLoading.value = true
    
    await updateGroup(editForm.chatid, {
      name: editForm.name,
      chatType: editForm.chatType,
      notice: editForm.notice
    })
    
    ElMessage.success('更新成功')
    editVisible.value = false
    fetchGroupList()
  } catch (error) {
    if (error.message) {
      ElMessage.error('更新失败：' + error.message)
    }
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (group) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除群聊 "${group.name}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteGroup(group.chatid)
    ElMessage.success('删除成功')
    fetchGroupList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedGroups.value.length} 个群聊吗？此操作不可恢复！`,
      '确认批量删除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const chatids = selectedGroups.value.map(group => group.chatid)
    await Promise.all(chatids.map(chatid => deleteGroup(chatid)))
    
    ElMessage.success('批量删除成功')
    fetchGroupList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + error.message)
    }
  }
}

const handleRemoveMember = async (member) => {
  try {
    await ElMessageBox.confirm(
      `确定要将 "${member.name}" 移出群聊吗？`,
      '确认移除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await removeMember(currentGroup.value.chatid, member.userid)
    ElMessage.success('移除成功')
    
    // 重新获取成员列表
    const response = await getGroupMembers(currentGroup.value.chatid)
    currentMembers.value = response.data.members
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移除失败：' + error.message)
    }
  }
}

const handleSync = async () => {
  try {
    await ElMessageBox.confirm(
      '同步操作将从企业微信获取最新的群聊数据，可能需要较长时间，是否继续？',
      '确认同步',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    syncLoading.value = true
    const response = await syncGroups({ force: false })
    
    ElMessage.success(
      `同步完成！新增 ${response.data.groups.created} 个群聊，更新 ${response.data.groups.updated} 个群聊`
    )
    
    // 刷新数据
    await Promise.all([
      fetchGroupList(),
      fetchStatistics()
    ])
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('同步失败：' + error.message)
    }
  } finally {
    syncLoading.value = false
  }
}

const handleExport = () => {
  exportDialogVisible.value = true
}

const confirmExport = async () => {
  try {
    exportLoading.value = true
    
    const params = {
      format: exportForm.format,
      fields: exportForm.fields
    }
    
    const response = await exportGroups(params)
    
    // 创建下载链接
    const blob = new Blob([response], {
      type: exportForm.format === 'csv' 
        ? 'text/csv;charset=utf-8' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `groups_${Date.now()}.${exportForm.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
    exportDialogVisible.value = false
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  } finally {
    exportLoading.value = false
  }
}

const getChatTypeColor = (type) => {
  const colorMap = {
    group: '',
    department: 'success',
    project: 'warning'
  }
  return colorMap[type] || ''
}

const getChatTypeText = (type) => {
  const textMap = {
    group: '普通群',
    department: '部门群',
    project: '项目群'
  }
  return textMap[type] || '未知'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  Promise.all([
    fetchGroupList(),
    fetchStatistics()
  ])
})
</script>

<style scoped>
.groups-container {
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

.group-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.active-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.member-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.sync-icon {
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

.owner-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.owner-name {
  font-size: 14px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.group-detail {
  padding: 10px 0;
}

.members-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>