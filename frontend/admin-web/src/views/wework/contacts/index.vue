<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 部门树 -->
      <el-col :span="6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>部门结构</span>
              <el-button type="text" @click="syncDepartments" :loading="syncing">
                同步
              </el-button>
            </div>
          </template>
          
          <el-tree
            :data="departmentTree"
            :props="treeProps"
            node-key="id"
            :expand-on-click-node="false"
            :highlight-current="true"
            @node-click="handleDeptClick"
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <el-icon><OfficeBuilding /></el-icon>
                <span>{{ node.label }}</span>
                <span class="node-count">({{ data.member_count || 0 }})</span>
              </span>
            </template>
          </el-tree>
        </el-card>
      </el-col>
      
      <!-- 成员列表 -->
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>成员列表</span>
              <div class="header-actions">
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索成员"
                  style="width: 200px; margin-right: 10px;"
                  clearable
                  @input="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
                <el-button type="primary" @click="syncUsers" :loading="syncingUsers">
                  同步成员
                </el-button>
              </div>
            </div>
          </template>
          
          <el-table :data="userList" border style="width: 100%" v-loading="loading">
            <el-table-column label="头像" width="80">
              <template #default="{ row }">
                <el-avatar :src="row.avatar" :size="40">
                  <img src="/src/assets/images/avatar.png" />
                </el-avatar>
              </template>
            </el-table-column>
            
            <el-table-column prop="name" label="姓名" width="120" />
            
            <el-table-column prop="userid" label="用户ID" width="150" show-overflow-tooltip />
            
            <el-table-column label="部门" width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag v-for="dept in row.departments" :key="dept.id" size="small" style="margin-right: 5px;">
                  {{ dept.name }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column prop="position" label="职位" width="120" show-overflow-tooltip />
            
            <el-table-column prop="mobile" label="手机号" width="120" />
            
            <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
            
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                  {{ row.status === 1 ? '已激活' : '未激活' }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewUser(row)">
                  详情
                </el-button>
                <el-button type="info" size="small" @click="sendMessage(row)">
                  发消息
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
      </el-col>
    </el-row>
    
    <!-- 用户详情对话框 -->
    <el-dialog
      title="用户详情"
      v-model="userDetailVisible"
      width="600px"
    >
      <el-descriptions v-if="currentUser" :column="2" border>
        <el-descriptions-item label="头像" :span="2">
          <el-avatar :src="currentUser.avatar" :size="60">
            <img src="/src/assets/images/avatar.png" />
          </el-avatar>
        </el-descriptions-item>
        <el-descriptions-item label="姓名">
          {{ currentUser.name }}
        </el-descriptions-item>
        <el-descriptions-item label="用户ID">
          {{ currentUser.userid }}
        </el-descriptions-item>
        <el-descriptions-item label="英文名">
          {{ currentUser.english_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="别名">
          {{ currentUser.alias || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ currentUser.mobile || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ currentUser.email || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="职位">
          {{ currentUser.position || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ currentUser.gender === 1 ? '男' : currentUser.gender === 2 ? '女' : '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentUser.status === 1 ? 'success' : 'danger'">
            {{ currentUser.status === 1 ? '已激活' : '未激活' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="是否启用">
          <el-tag :type="currentUser.enable === 1 ? 'success' : 'danger'">
            {{ currentUser.enable === 1 ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属部门" :span="2">
          <el-tag v-for="dept in currentUser.departments" :key="dept.id" style="margin-right: 5px;">
            {{ dept.name }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="直属上级" :span="2">
          <span v-if="currentUser.direct_leader && currentUser.direct_leader.length > 0">
            {{ currentUser.direct_leader.join(', ') }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="座机">
          {{ currentUser.telephone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          {{ currentUser.address || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="QQ号">
          {{ currentUser.qr_code || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="个人二维码">
          <img v-if="currentUser.qr_code" :src="currentUser.qr_code" style="width: 100px; height: 100px;" />
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
    
    <!-- 发送消息对话框 -->
    <el-dialog
      title="发送消息"
      v-model="messageDialogVisible"
      width="500px"
    >
      <el-form :model="messageForm" label-width="80px">
        <el-form-item label="接收人">
          <el-input :value="messageForm.touser" disabled />
        </el-form-item>
        
        <el-form-item label="消息类型">
          <el-radio-group v-model="messageForm.msgtype">
            <el-radio label="text">文本</el-radio>
            <el-radio label="textcard">文本卡片</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="messageForm.msgtype === 'text'" label="消息内容">
          <el-input
            v-model="messageForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入消息内容"
          />
        </el-form-item>
        
        <template v-if="messageForm.msgtype === 'textcard'">
          <el-form-item label="标题">
            <el-input v-model="messageForm.title" placeholder="请输入标题" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="messageForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入描述"
            />
          </el-form-item>
          <el-form-item label="跳转链接">
            <el-input v-model="messageForm.url" placeholder="请输入跳转链接" />
          </el-form-item>
        </template>
      </el-form>
      
      <template #footer>
        <el-button @click="messageDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendMessageConfirm" :loading="sending">
          发送
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, Search } from '@element-plus/icons-vue'
import {
  getDepartments,
  getUsers,
  syncDepartments as syncDepartmentsApi,
  syncUsers as syncUsersApi,
  sendMessage as sendMessageApi
} from '@/api/wework'

const loading = ref(false)
const syncing = ref(false)
const syncingUsers = ref(false)
const sending = ref(false)
const userDetailVisible = ref(false)
const messageDialogVisible = ref(false)

const searchQuery = ref('')
const currentDeptId = ref(1) // 根部门ID
const currentUser = ref(null)

const departmentTree = ref([])
const userList = ref([])
const total = ref(0)

const treeProps = {
  children: 'children',
  label: 'name'
}

const query = reactive({
  page: 1,
  limit: 20,
  department_id: 1,
  search: ''
})

const messageForm = reactive({
  touser: '',
  msgtype: 'text',
  content: '',
  title: '',
  description: '',
  url: ''
})

const getDepartmentData = async () => {
  try {
    const response = await getDepartments()
    departmentTree.value = response.data
  } catch (error) {
    console.error('获取部门数据失败:', error)
  }
}

const getUserData = async () => {
  try {
    loading.value = true
    const response = await getUsers(query)
    userList.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    console.error('获取用户数据失败:', error)
  } finally {
    loading.value = false
  }
}

const syncDepartments = async () => {
  try {
    syncing.value = true
    await syncDepartmentsApi()
    await getDepartmentData()
    ElMessage.success('部门同步成功')
  } catch (error) {
    ElMessage.error('部门同步失败: ' + error.message)
  } finally {
    syncing.value = false
  }
}

const syncUsers = async () => {
  try {
    syncingUsers.value = true
    await syncUsersApi({ department_id: currentDeptId.value })
    await getUserData()
    ElMessage.success('成员同步成功')
  } catch (error) {
    ElMessage.error('成员同步失败: ' + error.message)
  } finally {
    syncingUsers.value = false
  }
}

const handleDeptClick = (data) => {
  currentDeptId.value = data.id
  query.department_id = data.id
  query.page = 1
  getUserData()
}

const handleSearch = () => {
  query.search = searchQuery.value
  query.page = 1
  getUserData()
}

const handleSizeChange = (size) => {
  query.limit = size
  query.page = 1
  getUserData()
}

const handleCurrentChange = (page) => {
  query.page = page
  getUserData()
}

const viewUser = (user) => {
  currentUser.value = user
  userDetailVisible.value = true
}

const sendMessage = (user) => {
  messageForm.touser = user.userid
  messageForm.msgtype = 'text'
  messageForm.content = ''
  messageForm.title = ''
  messageForm.description = ''
  messageForm.url = ''
  messageDialogVisible.value = true
}

const sendMessageConfirm = async () => {
  try {
    if (messageForm.msgtype === 'text' && !messageForm.content) {
      ElMessage.error('请输入消息内容')
      return
    }
    
    if (messageForm.msgtype === 'textcard') {
      if (!messageForm.title || !messageForm.description) {
        ElMessage.error('请填写完整的卡片信息')
        return
      }
    }
    
    sending.value = true
    await sendMessageApi(messageForm)
    messageDialogVisible.value = false
    ElMessage.success('消息发送成功')
  } catch (error) {
    ElMessage.error('消息发送失败: ' + error.message)
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  getDepartmentData()
  getUserData()
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
  
  .tree-node {
    display: flex;
    align-items: center;
    gap: 5px;
    
    .node-count {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>