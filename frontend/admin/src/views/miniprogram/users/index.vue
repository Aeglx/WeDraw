<template>
  <div class="miniprogram-users-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>小程序用户管理</h2>
        <p class="header-desc">管理小程序用户信息，包括用户数据、行为分析和标签管理</p>
      </div>
      <div class="header-right">
        <el-button @click="handleSync" :loading="syncLoading">
          <el-icon><Refresh /></el-icon>
          同步用户
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
            <div class="stat-icon total-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total || 0 }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.active || 0 }}</div>
              <div class="stat-label">活跃用户</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon new-icon">
              <el-icon><Plus /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.newToday || 0 }}</div>
              <div class="stat-label">今日新增</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon retention-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.retention || '0%' }}</div>
              <div class="stat-label">留存率</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true" label-width="80px">
        <el-form-item label="用户昵称">
          <el-input
            v-model="searchForm.nickname"
            placeholder="请输入用户昵称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="用户标签">
          <el-select
            v-model="searchForm.tags"
            placeholder="请选择用户标签"
            multiple
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="tag in tagList"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
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
        <el-form-item label="用户状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
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

    <!-- 用户列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <div class="header-actions">
            <el-button
              type="warning"
              :disabled="selectedUsers.length === 0"
              @click="handleBatchTag"
            >
              <el-icon><PriceTag /></el-icon>
              批量标签
            </el-button>
            <el-button
              type="danger"
              :disabled="selectedUsers.length === 0"
              @click="handleBatchDisable"
            >
              <el-icon><Lock /></el-icon>
              批量禁用
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="userList"
        v-loading="loading"
        stripe
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
        <el-table-column prop="nickname" label="昵称" width="120" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">
            <span v-if="row.phone">{{ maskPhone(row.phone) }}</span>
            <el-text v-else type="info">未绑定</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.gender === 1" type="primary" size="small">男</el-tag>
            <el-tag v-else-if="row.gender === 2" type="danger" size="small">女</el-tag>
            <el-text v-else type="info">未知</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="city" label="城市" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.city">{{ row.city }}</span>
            <el-text v-else type="info">未知</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.tags"
              :key="tag.id"
              size="small"
              style="margin-right: 5px"
            >
              {{ tag.name }}
            </el-tag>
            <el-text v-if="!row.tags || row.tags.length === 0" type="info">无标签</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="visitCount" label="访问次数" width="100">
          <template #default="{ row }">
            <el-text type="primary">{{ row.visitCount || 0 }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="lastVisitTime" label="最后访问" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastVisitTime) }}
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
        <el-table-column prop="createTime" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-button text type="warning" @click="handleEditTags(row)">
              标签
            </el-button>
            <el-button text type="info" @click="handleViewBehavior(row)">
              行为
            </el-button>
            <el-dropdown @command="(command) => handleMoreAction(command, row)">
              <el-button text type="primary">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="message">发送消息</el-dropdown-item>
                  <el-dropdown-item command="export">导出数据</el-dropdown-item>
                  <el-dropdown-item command="disable" divided>禁用用户</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="用户详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="currentUser" class="user-detail">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="user-avatar-section">
              <el-avatar :src="currentUser.avatar" :size="120">
                <el-icon><User /></el-icon>
              </el-avatar>
              <h3>{{ currentUser.nickname }}</h3>
              <p class="user-id">ID: {{ currentUser.openid }}</p>
            </div>
          </el-col>
          <el-col :span="16">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="手机号">
                {{ currentUser.phone || '未绑定' }}
              </el-descriptions-item>
              <el-descriptions-item label="性别">
                <el-tag v-if="currentUser.gender === 1" type="primary" size="small">男</el-tag>
                <el-tag v-else-if="currentUser.gender === 2" type="danger" size="small">女</el-tag>
                <span v-else>未知</span>
              </el-descriptions-item>
              <el-descriptions-item label="城市">
                {{ currentUser.city || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="省份">
                {{ currentUser.province || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="国家">
                {{ currentUser.country || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="语言">
                {{ currentUser.language || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="访问次数">
                <el-text type="primary">{{ currentUser.visitCount || 0 }}</el-text>
              </el-descriptions-item>
              <el-descriptions-item label="积分">
                <el-text type="warning">{{ currentUser.points || 0 }}</el-text>
              </el-descriptions-item>
              <el-descriptions-item label="最后访问">
                {{ formatDate(currentUser.lastVisitTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="注册时间">
                {{ formatDate(currentUser.createTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="用户标签" :span="2">
                <el-tag
                  v-for="tag in currentUser.tags"
                  :key="tag.id"
                  size="small"
                  style="margin-right: 5px"
                >
                  {{ tag.name }}
                </el-tag>
                <span v-if="!currentUser.tags || currentUser.tags.length === 0">无标签</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </div>
    </el-dialog>

    <!-- 编辑标签对话框 -->
    <el-dialog
      v-model="tagVisible"
      title="编辑用户标签"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="tag-section">
        <h4>当前标签</h4>
        <div class="current-tags">
          <el-tag
            v-for="tag in currentUserTags"
            :key="tag.id"
            closable
            @close="removeTag(tag.id)"
            style="margin-right: 8px; margin-bottom: 8px"
          >
            {{ tag.name }}
          </el-tag>
          <span v-if="currentUserTags.length === 0" class="no-tags">暂无标签</span>
        </div>
        
        <h4 style="margin-top: 20px">添加标签</h4>
        <el-select
          v-model="selectedTags"
          multiple
          placeholder="请选择要添加的标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
            :disabled="currentUserTags.some(t => t.id === tag.id)"
          />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="tagVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTags" :loading="tagLoading">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户行为分析对话框 -->
    <el-dialog
      v-model="behaviorVisible"
      title="用户行为分析"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="behavior-analysis">
        <el-tabs v-model="behaviorTab">
          <el-tab-pane label="访问记录" name="visit">
            <el-table :data="visitRecords" stripe max-height="400">
              <el-table-column prop="page" label="访问页面" show-overflow-tooltip />
              <el-table-column prop="duration" label="停留时长(秒)" width="120" />
              <el-table-column prop="source" label="来源" width="100" />
              <el-table-column prop="visitTime" label="访问时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.visitTime) }}
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="操作记录" name="action">
            <el-table :data="actionRecords" stripe max-height="400">
              <el-table-column prop="action" label="操作类型" width="120" />
              <el-table-column prop="target" label="操作对象" show-overflow-tooltip />
              <el-table-column prop="result" label="操作结果" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small">
                    {{ row.result === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="actionTime" label="操作时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.actionTime) }}
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="消费记录" name="order">
            <el-table :data="orderRecords" stripe max-height="400">
              <el-table-column prop="orderNo" label="订单号" width="150" />
              <el-table-column prop="amount" label="金额" width="100">
                <template #default="{ row }">
                  <el-text type="danger">¥{{ row.amount }}</el-text>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getOrderStatusType(row.status)" size="small">
                    {{ getOrderStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="下单时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.createTime) }}
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 批量标签对话框 -->
    <el-dialog
      v-model="batchTagVisible"
      title="批量设置标签"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="batch-tag-section">
        <p>已选择 <strong>{{ selectedUsers.length }}</strong> 个用户</p>
        <el-select
          v-model="batchSelectedTags"
          multiple
          placeholder="请选择要添加的标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in tagList"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
          />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="batchTagVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBatchTags" :loading="batchTagLoading">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  UserFilled,
  Plus,
  TrendCharts,
  Refresh,
  Download,
  Search,
  PriceTag,
  Lock,
  ArrowDown
} from '@element-plus/icons-vue'
import {
  getUserList,
  getUserDetail,
  updateUserStatus,
  updateUserTags,
  batchUpdateUserTags,
  batchUpdateUserStatus,
  getUserBehavior,
  syncUsers,
  exportUsers,
  getStatistics
} from '@/api/miniprogram/users'
import { getTagList } from '@/api/miniprogram/tags'

// 响应式数据
const loading = ref(false)
const syncLoading = ref(false)
const exportLoading = ref(false)
const tagLoading = ref(false)
const batchTagLoading = ref(false)
const detailVisible = ref(false)
const tagVisible = ref(false)
const behaviorVisible = ref(false)
const batchTagVisible = ref(false)

const userList = ref([])
const tagList = ref([])
const selectedUsers = ref([])
const statistics = ref({})
const currentUser = ref(null)
const currentUserTags = ref([])
const selectedTags = ref([])
const batchSelectedTags = ref([])
const behaviorTab = ref('visit')
const visitRecords = ref([])
const actionRecords = ref([])
const orderRecords = ref([])

const searchForm = reactive({
  nickname: '',
  phone: '',
  tags: [],
  dateRange: null,
  status: null
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 计算属性
const availableTags = computed(() => {
  return tagList.value.filter(tag => !currentUserTags.value.some(t => t.id === tag.id))
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
    
    if (searchForm.dateRange) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
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

const fetchTagList = async () => {
  try {
    const response = await getTagList({ page: 1, limit: 100 })
    tagList.value = response.data.tags
  } catch (error) {
    console.error('获取标签列表失败：', error)
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

const resetSearch = () => {
  Object.assign(searchForm, {
    nickname: '',
    phone: '',
    tags: [],
    dateRange: null,
    status: null
  })
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

const handleStatusChange = async (user) => {
  try {
    await updateUserStatus(user.openid, { status: user.status })
    ElMessage.success(user.status ? '启用成功' : '禁用成功')
  } catch (error) {
    // 恢复原状态
    user.status = user.status ? 0 : 1
    ElMessage.error('状态更新失败：' + error.message)
  }
}

const handleViewDetail = async (user) => {
  try {
    const response = await getUserDetail(user.openid)
    currentUser.value = response.data
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取用户详情失败：' + error.message)
  }
}

const handleEditTags = (user) => {
  currentUser.value = user
  currentUserTags.value = [...(user.tags || [])]
  selectedTags.value = []
  tagVisible.value = true
}

const removeTag = (tagId) => {
  currentUserTags.value = currentUserTags.value.filter(tag => tag.id !== tagId)
}

const saveTags = async () => {
  try {
    tagLoading.value = true
    const allTags = [...currentUserTags.value]
    
    // 添加新选择的标签
    selectedTags.value.forEach(tagId => {
      const tag = tagList.value.find(t => t.id === tagId)
      if (tag && !allTags.some(t => t.id === tagId)) {
        allTags.push(tag)
      }
    })
    
    await updateUserTags(currentUser.value.openid, {
      tags: allTags.map(tag => tag.id)
    })
    
    // 更新列表中的用户标签
    const userIndex = userList.value.findIndex(u => u.openid === currentUser.value.openid)
    if (userIndex !== -1) {
      userList.value[userIndex].tags = allTags
    }
    
    ElMessage.success('标签更新成功')
    tagVisible.value = false
  } catch (error) {
    ElMessage.error('标签更新失败：' + error.message)
  } finally {
    tagLoading.value = false
  }
}

const handleViewBehavior = async (user) => {
  try {
    currentUser.value = user
    const response = await getUserBehavior(user.openid)
    visitRecords.value = response.data.visits || []
    actionRecords.value = response.data.actions || []
    orderRecords.value = response.data.orders || []
    behaviorVisible.value = true
  } catch (error) {
    ElMessage.error('获取用户行为数据失败：' + error.message)
  }
}

const handleBatchTag = () => {
  batchSelectedTags.value = []
  batchTagVisible.value = true
}

const saveBatchTags = async () => {
  try {
    batchTagLoading.value = true
    const userIds = selectedUsers.value.map(user => user.openid)
    await batchUpdateUserTags({
      userIds,
      tags: batchSelectedTags.value
    })
    
    ElMessage.success('批量设置标签成功')
    batchTagVisible.value = false
    fetchUserList()
  } catch (error) {
    ElMessage.error('批量设置标签失败：' + error.message)
  } finally {
    batchTagLoading.value = false
  }
}

const handleBatchDisable = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要禁用选中的 ${selectedUsers.value.length} 个用户吗？`,
      '确认批量禁用',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const userIds = selectedUsers.value.map(user => user.openid)
    await batchUpdateUserStatus({
      userIds,
      status: 0
    })
    
    ElMessage.success('批量禁用成功')
    fetchUserList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量禁用失败：' + error.message)
    }
  }
}

const handleMoreAction = async (command, user) => {
  switch (command) {
    case 'message':
      ElMessage.info('发送消息功能开发中')
      break
    case 'export':
      try {
        await exportUsers({ userIds: [user.openid] })
        ElMessage.success('导出成功')
      } catch (error) {
        ElMessage.error('导出失败：' + error.message)
      }
      break
    case 'disable':
      try {
        await ElMessageBox.confirm(
          `确定要禁用用户 "${user.nickname}" 吗？`,
          '确认禁用',
          {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await updateUserStatus(user.openid, { status: 0 })
        user.status = 0
        ElMessage.success('禁用成功')
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('禁用失败：' + error.message)
        }
      }
      break
  }
}

const handleSync = async () => {
  try {
    syncLoading.value = true
    await syncUsers()
    ElMessage.success('同步成功')
    await Promise.all([
      fetchUserList(),
      fetchStatistics()
    ])
  } catch (error) {
    ElMessage.error('同步失败：' + error.message)
  } finally {
    syncLoading.value = false
  }
}

const handleExport = async () => {
  try {
    exportLoading.value = true
    await exportUsers(searchForm)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  } finally {
    exportLoading.value = false
  }
}

const maskPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const getOrderStatusType = (status) => {
  const statusMap = {
    'pending': 'warning',
    'paid': 'success',
    'cancelled': 'info',
    'refunded': 'danger'
  }
  return statusMap[status] || 'info'
}

const getOrderStatusText = (status) => {
  const statusMap = {
    'pending': '待支付',
    'paid': '已支付',
    'cancelled': '已取消',
    'refunded': '已退款'
  }
  return statusMap[status] || '未知'
}

// 生命周期
onMounted(() => {
  Promise.all([
    fetchUserList(),
    fetchTagList(),
    fetchStatistics()
  ])
})
</script>

<style scoped>
.miniprogram-users-container {
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

.total-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.active-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.new-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.retention-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.user-detail {
  padding: 20px 0;
}

.user-avatar-section {
  text-align: center;
}

.user-avatar-section h3 {
  margin: 15px 0 5px 0;
  color: #303133;
}

.user-id {
  color: #909399;
  font-size: 12px;
  margin: 0;
}

.tag-section h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.current-tags {
  min-height: 32px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.no-tags {
  color: #909399;
  font-size: 14px;
}

.behavior-analysis {
  padding: 10px 0;
}

.batch-tag-section p {
  margin-bottom: 15px;
  color: #606266;
}
</style>