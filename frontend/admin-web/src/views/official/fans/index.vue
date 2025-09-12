<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.nickname"
        placeholder="请输入昵称"
        style="width: 200px"
        class="filter-item"
        @keyup.enter="handleFilter"
      />
      <el-select
        v-model="listQuery.subscribe_status"
        placeholder="关注状态"
        clearable
        style="width: 120px"
        class="filter-item"
      >
        <el-option label="已关注" value="1" />
        <el-option label="已取消" value="0" />
      </el-select>
      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="Search"
        @click="handleFilter"
      >
        搜索
      </el-button>
      <el-button
        class="filter-item"
        style="margin-left: 10px"
        type="primary"
        icon="Download"
        @click="handleDownload"
      >
        导出
      </el-button>
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
    >
      <el-table-column label="头像" width="80px" align="center">
        <template #default="{ row }">
          <el-avatar :src="row.headimgurl" :size="40">
            <img src="@/assets/images/avatar.png" />
          </el-avatar>
        </template>
      </el-table-column>
      <el-table-column label="昵称" prop="nickname" sortable="custom" align="center" width="150px">
        <template #default="{ row }">
          <span>{{ row.nickname }}</span>
        </template>
      </el-table-column>
      <el-table-column label="性别" width="80px" align="center">
        <template #default="{ row }">
          <span>{{ row.sex === 1 ? '男' : row.sex === 2 ? '女' : '未知' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="地区" width="150px" align="center">
        <template #default="{ row }">
          <span>{{ `${row.country || ''} ${row.province || ''} ${row.city || ''}`.trim() }}</span>
        </template>
      </el-table-column>
      <el-table-column label="关注状态" width="100px" align="center">
        <template #default="{ row }">
          <el-tag :type="row.subscribe_status === 1 ? 'success' : 'danger'">
            {{ row.subscribe_status === 1 ? '已关注' : '已取消' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关注时间" width="180px" align="center">
        <template #default="{ row }">
          <span>{{ parseTime(row.subscribe_time) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后互动" width="180px" align="center">
        <template #default="{ row }">
          <span>{{ parseTime(row.last_interaction_time) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="标签" width="150px" align="center">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.tags"
            :key="tag.id"
            size="small"
            style="margin-right: 5px"
          >
            {{ tag.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200px" class-name="small-padding fixed-width">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button type="success" size="small" @click="handleSendMessage(row)">
            发消息
          </el-button>
          <el-button type="warning" size="small" @click="handleTag(row)">
            标签
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <!-- 编辑粉丝对话框 -->
    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="100px"
        style="width: 400px; margin-left: 50px"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="temp.nickname" disabled />
        </el-form-item>
        <el-form-item label="备注名" prop="remark">
          <el-input v-model="temp.remark" />
        </el-form-item>
        <el-form-item label="分组">
          <el-select v-model="temp.group_id" placeholder="请选择分组">
            <el-option
              v-for="group in groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="updateData()">
          确定
        </el-button>
      </div>
    </el-dialog>

    <!-- 发送消息对话框 -->
    <el-dialog title="发送消息" v-model="messageDialogVisible">
      <el-form :model="messageForm" label-width="80px">
        <el-form-item label="消息类型">
          <el-radio-group v-model="messageForm.type">
            <el-radio label="text">文本</el-radio>
            <el-radio label="image">图片</el-radio>
            <el-radio label="news">图文</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="messageForm.type === 'text'" label="消息内容">
          <el-input
            v-model="messageForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入消息内容"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="messageDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="sendMessage()">
          发送
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFansList, updateFan, sendCustomMessage } from '@/api/official'
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination/index.vue'

const tableKey = ref(0)
const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const dialogFormVisible = ref(false)
const messageDialogVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
  update: '编辑粉丝',
  create: '创建粉丝'
}

const listQuery = reactive({
  page: 1,
  limit: 20,
  nickname: undefined,
  subscribe_status: undefined,
  sort: '+id'
})

const temp = reactive({
  id: undefined,
  nickname: '',
  remark: '',
  group_id: undefined
})

const messageForm = reactive({
  type: 'text',
  content: '',
  openid: ''
})

const groups = ref([])

const rules = {
  remark: [{ required: true, message: '备注名是必填项', trigger: 'blur' }]
}

const getList = () => {
  listLoading.value = true
  getFansList(listQuery).then(response => {
    list.value = response.data.items
    total.value = response.data.total
    listLoading.value = false
  })
}

const handleFilter = () => {
  listQuery.page = 1
  getList()
}

const handleUpdate = (row) => {
  temp.id = row.id
  temp.nickname = row.nickname
  temp.remark = row.remark
  temp.group_id = row.group_id
  dialogStatus.value = 'update'
  dialogFormVisible.value = true
}

const updateData = () => {
  updateFan(temp.id, temp).then(() => {
    const index = list.value.findIndex(v => v.id === temp.id)
    list.value.splice(index, 1, temp)
    dialogFormVisible.value = false
    ElMessage.success('更新成功')
  })
}

const handleSendMessage = (row) => {
  messageForm.openid = row.openid
  messageDialogVisible.value = true
}

const sendMessage = () => {
  sendCustomMessage(messageForm).then(() => {
    messageDialogVisible.value = false
    ElMessage.success('消息发送成功')
  })
}

const handleTag = (row) => {
  // 标签管理功能
  ElMessage.info('标签管理功能开发中')
}

const handleDownload = () => {
  // 导出功能
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.app-container {
  .filter-container {
    padding-bottom: 10px;
    
    .filter-item {
      display: inline-block;
      vertical-align: middle;
      margin-bottom: 10px;
      margin-right: 10px;
    }
  }
}
</style>