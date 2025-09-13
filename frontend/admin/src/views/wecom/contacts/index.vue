<template>
  <div class="contacts-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>通讯录管理</h2>
        <p class="header-desc">管理企业微信通讯录，包括用户和部门信息</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleSync" :loading="syncLoading">
          <el-icon><Refresh /></el-icon>
          同步通讯录
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
            <div class="stat-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.users?.total || 0 }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon dept-icon">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.departments?.total || 0 }}</div>
              <div class="stat-label">总部门数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.users?.active || 0 }}</div>
              <div class="stat-label">活跃用户</div>
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

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-row :gutter="20">
        <!-- 左侧部门树 -->
        <el-col :span="6">
          <el-card class="dept-tree-card">
            <template #header>
              <div class="card-header">
                <span>部门结构</span>
                <el-button text @click="refreshDepartments">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </template>
            <el-tree
              ref="deptTree"
              :data="departmentTree"
              :props="treeProps"
              node-key="department_id"
              :expand-on-click-node="false"
              :highlight-current="true"
              @node-click="handleDeptClick"
              class="dept-tree"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <el-icon class="node-icon"><OfficeBuilding /></el-icon>
                  <span class="node-label">{{ node.label }}</span>
                  <span class="node-count">({{ data.userCount || 0 }})</span>
                </div>
              </template>
            </el-tree>
          </el-card>
        </el-col>

        <!-- 右侧用户列表 -->
        <el-col :span="18">
          <el-card class="user-list-card">
            <template #header>
              <div class="card-header">
                <span>用户列表</span>
                <div class="header-actions">
                  <el-input
                    v-model="searchForm.search"
                    placeholder="搜索用户姓名、手机号、邮箱"
                    style="width: 300px; margin-right: 10px"
                    clearable
                    @keyup.enter="handleSearch"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-select
                    v-model="searchForm.status"
                    placeholder="用户状态"
                    style="width: 120px; margin-right: 10px"
                    clearable
                    @change="handleSearch"
                  >
                    <el-option label="已激活" :value="1" />
                    <el-option label="已禁用" :value="2" />
                    <el-option label="未激活" :value="4" />
                    <el-option label="退出企业" :value="5" />
                  </el-select>
                  <el-button type="primary" @click="handleSearch">
                    <el-icon><Search /></el-icon>
                    搜索
                  </el-button>
                </div>
              </div>
            </template>

            <!-- 用户表格 -->
            <el-table
              :data="userList"
              v-loading="loading"
              stripe
              style="width: 100%"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="avatar" label="头像" width="80">
                <template #default="{ row }">
                  <el-avatar :src="row.avatar" :size="40">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="姓名" width="120" />
              <el-table-column prop="english_name" label="英文名" width="120" />
              <el-table-column prop="position" label="职位" width="150" />
              <el-table-column prop="mobile" label="手机号" width="130" />
              <el-table-column prop="email" label="邮箱" width="200" show-overflow-tooltip />
              <el-table-column prop="departments" label="部门" width="200">
                <template #default="{ row }">
                  <el-tag
                    v-for="dept in row.departments"
                    :key="dept.department_id"
                    size="small"
                    style="margin-right: 5px"
                  >
                    {{ dept.name }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag
                    :type="getStatusType(row.status)"
                    size="small"
                  >
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button
                    text
                    type="primary"
                    @click="handleViewUser(row)"
                  >
                    查看
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
        </el-col>
      </el-row>
    </div>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="userDetailVisible"
      title="用户详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="currentUser" class="user-detail">
        <div class="user-basic">
          <el-avatar :src="currentUser.avatar" :size="80">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="user-info">
            <h3>{{ currentUser.name }}</h3>
            <p v-if="currentUser.english_name">{{ currentUser.english_name }}</p>
            <p>{{ currentUser.position || '暂无职位' }}</p>
          </div>
        </div>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ currentUser.userid }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentUser.status)" size="small">
              {{ getStatusText(currentUser.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.mobile || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentUser.email || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ getGenderText(currentUser.gender) }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ currentUser.telephone || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ currentUser.address || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="所属部门" :span="2">
            <el-tag
              v-for="dept in currentUser.departments"
              :key="dept.department_id"
              size="small"
              style="margin-right: 5px"
            >
              {{ dept.name }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentUser.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(currentUser.updated_at) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 导出对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出通讯录"
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
        <el-form-item label="导出范围">
          <el-radio-group v-model="exportForm.scope">
            <el-radio label="all">全部用户</el-radio>
            <el-radio label="department">当前部门</el-radio>
            <el-radio label="selected">选中用户</el-radio>
          </el-radio-group>
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
  User,
  OfficeBuilding,
  Refresh,
  Download,
  Search,
  CircleCheck,
  Clock
} from '@element-plus/icons-vue'
import {
  getUserList,
  getUserDetail,
  syncContacts,
  exportContacts,
  getStatistics
} from '@/api/wecom/contacts'
import { getDepartmentTree } from '@/api/wecom/department'

// 响应式数据
const loading = ref(false)
const syncLoading = ref(false)
const exportLoading = ref(false)
const userDetailVisible = ref(false)
const exportDialogVisible = ref(false)

const userList = ref([])
const departmentTree = ref([])
const currentUser = ref(null)
const selectedUsers = ref([])
const statistics = ref({})

const searchForm = reactive({
  search: '',
  status: null,
  department_id: null
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const exportForm = reactive({
  format: 'xlsx',
  scope: 'all'
})

const treeProps = {
  children: 'children',
  label: 'name'
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

// 方法
const fetchUserList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    
    const response = await getUserList(params)
    userList.value = response.data.users
    pagination.total = response.data.pagination.total
  } catch (error) {
    ElMessage.error('获取用户列表失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const fetchDepartmentTree = async () => {
  try {
    const response = await getDepartmentTree({ tree: true })
    departmentTree.value = response.data.departments || []
  } catch (error) {
    ElMessage.error('获取部门树失败：' + error.message)
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
  fetchUserList()
}

const handleDeptClick = (data) => {
  searchForm.department_id = data.department_id
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchUserList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchUserList()
}

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const handleViewUser = async (user) => {
  try {
    const response = await getUserDetail(user.userid)
    currentUser.value = response.data
    userDetailVisible.value = true
  } catch (error) {
    ElMessage.error('获取用户详情失败：' + error.message)
  }
}

const handleSync = async () => {
  try {
    await ElMessageBox.confirm(
      '同步操作将从企业微信获取最新的通讯录数据，可能需要较长时间，是否继续？',
      '确认同步',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    syncLoading.value = true
    const response = await syncContacts({ force: false })
    
    ElMessage.success(
      `同步完成！新增 ${response.data.users.created} 个用户，更新 ${response.data.users.updated} 个用户`
    )
    
    // 刷新数据
    await Promise.all([
      fetchUserList(),
      fetchDepartmentTree(),
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
      format: exportForm.format
    }
    
    if (exportForm.scope === 'department' && searchForm.department_id) {
      params.department_id = searchForm.department_id
    } else if (exportForm.scope === 'selected') {
      if (selectedUsers.value.length === 0) {
        ElMessage.warning('请先选择要导出的用户')
        return
      }
      params.userids = selectedUsers.value.map(u => u.userid)
    }
    
    const response = await exportContacts(params)
    
    // 创建下载链接
    const blob = new Blob([response], {
      type: exportForm.format === 'csv' 
        ? 'text/csv;charset=utf-8' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contacts_${Date.now()}.${exportForm.format}`
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

const refreshDepartments = () => {
  fetchDepartmentTree()
}

const getStatusType = (status) => {
  const typeMap = {
    1: 'success',
    2: 'danger',
    4: 'warning',
    5: 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    1: '已激活',
    2: '已禁用',
    4: '未激活',
    5: '退出企业'
  }
  return textMap[status] || '未知'
}

const getGenderText = (gender) => {
  const textMap = {
    0: '未定义',
    1: '男',
    2: '女'
  }
  return textMap[gender] || '未定义'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  Promise.all([
    fetchUserList(),
    fetchDepartmentTree(),
    fetchStatistics()
  ])
})
</script>

<style scoped>
.contacts-container {
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

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dept-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.active-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

.main-content {
  margin-top: 20px;
}

.dept-tree-card,
.user-list-card {
  height: 600px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.dept-tree {
  height: 520px;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
}

.node-icon {
  margin-right: 5px;
  color: #409eff;
}

.node-label {
  flex: 1;
}

.node-count {
  color: #909399;
  font-size: 12px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.user-detail {
  padding: 10px 0;
}

.user-basic {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.user-info {
  margin-left: 20px;
}

.user-info h3 {
  margin: 0 0 5px 0;
  color: #303133;
}

.user-info p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}
</style>