<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 消息列表 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>消息列表</span>
              <el-button type="primary" size="small" @click="composeMessage">
                <el-icon><EditPen /></el-icon>
                写消息
              </el-button>
            </div>
          </template>
          
          <!-- 消息类型筛选 -->
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane label="系统消息" name="system" />
            <el-tab-pane label="用户消息" name="user" />
            <el-tab-pane label="通知消息" name="notification" />
          </el-tabs>
          
          <!-- 消息搜索 -->
          <el-input
            v-model="searchQuery"
            placeholder="搜索消息内容"
            style="margin-bottom: 15px;"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <!-- 消息列表 -->
          <div class="message-list" v-loading="loading">
            <div
              v-for="message in messageList"
              :key="message.id"
              class="message-item"
              :class="{ active: currentMessage && currentMessage.id === message.id, unread: !message.is_read }"
              @click="selectMessage(message)"
            >
              <div class="message-header">
                <div class="message-title">{{ message.title }}</div>
                <div class="message-time">{{ formatTime(message.created_at) }}</div>
              </div>
              <div class="message-preview">{{ message.content }}</div>
              <div class="message-meta">
                <el-tag :type="getTypeTagType(message.type)" size="small">
                  {{ getTypeName(message.type) }}
                </el-tag>
                <span v-if="!message.is_read" class="unread-dot"></span>
              </div>
            </div>
            
            <el-empty v-if="messageList.length === 0" description="暂无消息" />
          </div>
          
          <!-- 分页 -->
          <el-pagination
            v-if="total > 0"
            :current-page="query.page"
            :page-size="query.limit"
            :total="total"
            layout="prev, pager, next"
            @current-change="handleCurrentChange"
            style="margin-top: 15px;"
            small
          />
        </el-card>
      </el-col>
      
      <!-- 消息详情 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>消息详情</span>
              <div v-if="currentMessage">
                <el-button
                  v-if="!currentMessage.is_read"
                  type="primary"
                  size="small"
                  @click="markAsRead(currentMessage)"
                >
                  标记已读
                </el-button>
                <el-button type="danger" size="small" @click="deleteMessage(currentMessage)">
                  删除
                </el-button>
              </div>
            </div>
          </template>
          
          <div v-if="currentMessage" class="message-detail">
            <!-- 消息头部 -->
            <div class="detail-header">
              <h2>{{ currentMessage.title }}</h2>
              <div class="detail-meta">
                <el-tag :type="getTypeTagType(currentMessage.type)">
                  {{ getTypeName(currentMessage.type) }}
                </el-tag>
                <span class="detail-time">{{ formatTime(currentMessage.created_at) }}</span>
                <el-tag v-if="currentMessage.is_read" type="success" size="small">已读</el-tag>
                <el-tag v-else type="warning" size="small">未读</el-tag>
              </div>
            </div>
            
            <!-- 发送者信息 -->
            <div v-if="currentMessage.sender" class="sender-info">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="发送者">
                  <div class="sender-detail">
                    <el-avatar :src="currentMessage.sender.avatar" :size="30">
                      <img src="/src/assets/images/avatar.png" />
                    </el-avatar>
                    <span style="margin-left: 8px;">{{ currentMessage.sender.nickname || currentMessage.sender.name }}</span>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item label="发送时间">
                  {{ formatTime(currentMessage.created_at) }}
                </el-descriptions-item>
                <el-descriptions-item v-if="currentMessage.sender.openid" label="OpenID">
                  {{ currentMessage.sender.openid }}
                </el-descriptions-item>
                <el-descriptions-item v-if="currentMessage.priority" label="优先级">
                  <el-tag :type="getPriorityTagType(currentMessage.priority)" size="small">
                    {{ getPriorityName(currentMessage.priority) }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>
            
            <!-- 消息内容 -->
            <div class="message-content">
              <div class="content-text" v-html="formatContent(currentMessage.content)"></div>
              
              <!-- 附件 -->
              <div v-if="currentMessage.attachments && currentMessage.attachments.length > 0" class="attachments">
                <h4>附件:</h4>
                <div class="attachment-list">
                  <div
                    v-for="attachment in currentMessage.attachments"
                    :key="attachment.id"
                    class="attachment-item"
                  >
                    <el-icon><Paperclip /></el-icon>
                    <a :href="attachment.url" target="_blank">{{ attachment.name }}</a>
                    <span class="attachment-size">({{ formatFileSize(attachment.size) }})</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 回复区域 -->
            <div v-if="currentMessage.type === 'user'" class="reply-section">
              <h4>回复消息</h4>
              <el-input
                v-model="replyContent"
                type="textarea"
                :rows="4"
                placeholder="输入回复内容..."
                style="margin-bottom: 10px;"
              />
              <el-button type="primary" @click="sendReply" :loading="replying">
                发送回复
              </el-button>
            </div>
          </div>
          
          <el-empty v-else description="请选择一条消息查看详情" />
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 写消息对话框 -->
    <el-dialog
      title="发送消息"
      v-model="composeVisible"
      width="600px"
    >
      <el-form
        ref="composeFormRef"
        :model="composeForm"
        :rules="composeRules"
        label-width="100px"
      >
        <el-form-item label="消息类型" prop="type">
          <el-select v-model="composeForm.type" placeholder="请选择消息类型" style="width: 100%;">
            <el-option label="系统消息" value="system" />
            <el-option label="通知消息" value="notification" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="接收者" prop="receiver_type">
          <el-radio-group v-model="composeForm.receiver_type">
            <el-radio label="all">全部用户</el-radio>
            <el-radio label="specific">指定用户</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="composeForm.receiver_type === 'specific'" label="用户OpenID" prop="receiver_ids">
          <el-input
            v-model="composeForm.receiver_ids"
            type="textarea"
            :rows="3"
            placeholder="请输入用户OpenID，多个用换行分隔"
          />
        </el-form-item>
        
        <el-form-item label="消息标题" prop="title">
          <el-input v-model="composeForm.title" placeholder="请输入消息标题" />
        </el-form-item>
        
        <el-form-item label="消息内容" prop="content">
          <el-input
            v-model="composeForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入消息内容"
          />
        </el-form-item>
        
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="composeForm.priority" placeholder="请选择优先级" style="width: 100%;">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="composeVisible = false">取消</el-button>
          <el-button type="primary" @click="sendMessage" :loading="sending">
            发送
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  EditPen,
  Search,
  Paperclip
} from '@element-plus/icons-vue'
import {
  getMessages,
  getMessageDetail,
  markMessageAsRead,
  deleteMessage as deleteMessageApi,
  sendMessage as sendMessageApi,
  replyMessage
} from '@/api/message'

const loading = ref(false)
const sending = ref(false)
const replying = ref(false)
const composeVisible = ref(false)

const activeTab = ref('all')
const searchQuery = ref('')
const currentMessage = ref(null)
const replyContent = ref('')

const messageList = ref([])
const total = ref(0)

const query = reactive({
  page: 1,
  limit: 20,
  type: '',
  search: ''
})

const composeForm = reactive({
  type: 'system',
  receiver_type: 'all',
  receiver_ids: '',
  title: '',
  content: '',
  priority: 'medium'
})

const composeRules = {
  type: [{ required: true, message: '请选择消息类型', trigger: 'change' }],
  receiver_type: [{ required: true, message: '请选择接收者类型', trigger: 'change' }],
  receiver_ids: [
    {
      validator: (rule, value, callback) => {
        if (composeForm.receiver_type === 'specific' && !value) {
          callback(new Error('请输入用户OpenID'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  title: [{ required: true, message: '请输入消息标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入消息内容', trigger: 'blur' }]
}

const composeFormRef = ref()

const getMessageData = async () => {
  try {
    loading.value = true
    const response = await getMessages(query)
    messageList.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    console.error('获取消息数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tab) => {
  query.type = tab === 'all' ? '' : tab
  query.page = 1
  getMessageData()
}

const handleSearch = () => {
  query.search = searchQuery.value
  query.page = 1
  getMessageData()
}

const handleCurrentChange = (page) => {
  query.page = page
  getMessageData()
}

const selectMessage = async (message) => {
  try {
    const response = await getMessageDetail(message.id)
    currentMessage.value = response.data
    
    // 如果是未读消息，自动标记为已读
    if (!message.is_read) {
      await markAsRead(message)
    }
  } catch (error) {
    ElMessage.error('获取消息详情失败: ' + error.message)
  }
}

const markAsRead = async (message) => {
  try {
    await markMessageAsRead(message.id)
    message.is_read = true
    if (currentMessage.value && currentMessage.value.id === message.id) {
      currentMessage.value.is_read = true
    }
    ElMessage.success('已标记为已读')
  } catch (error) {
    ElMessage.error('标记失败: ' + error.message)
  }
}

const deleteMessage = async (message) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除消息「${message.title}」吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteMessageApi(message.id)
    ElMessage.success('删除成功')
    
    // 如果删除的是当前选中的消息，清空详情
    if (currentMessage.value && currentMessage.value.id === message.id) {
      currentMessage.value = null
    }
    
    getMessageData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

const composeMessage = () => {
  Object.assign(composeForm, {
    type: 'system',
    receiver_type: 'all',
    receiver_ids: '',
    title: '',
    content: '',
    priority: 'medium'
  })
  composeVisible.value = true
}

const sendMessage = async () => {
  try {
    await composeFormRef.value.validate()
    sending.value = true
    
    const data = { ...composeForm }
    if (data.receiver_type === 'specific') {
      data.receiver_ids = data.receiver_ids.split('\n').filter(id => id.trim())
    }
    
    await sendMessageApi(data)
    ElMessage.success('消息发送成功')
    composeVisible.value = false
    getMessageData()
  } catch (error) {
    if (error.message) {
      ElMessage.error('发送失败: ' + error.message)
    }
  } finally {
    sending.value = false
  }
}

const sendReply = async () => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  try {
    replying.value = true
    await replyMessage(currentMessage.value.id, {
      content: replyContent.value
    })
    
    ElMessage.success('回复发送成功')
    replyContent.value = ''
    
    // 刷新消息详情
    selectMessage(currentMessage.value)
  } catch (error) {
    ElMessage.error('回复失败: ' + error.message)
  } finally {
    replying.value = false
  }
}

const getTypeName = (type) => {
  const typeMap = {
    system: '系统消息',
    user: '用户消息',
    notification: '通知消息'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type) => {
  const typeMap = {
    system: 'primary',
    user: 'success',
    notification: 'warning'
  }
  return typeMap[type] || 'info'
}

const getPriorityName = (priority) => {
  const priorityMap = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return priorityMap[priority] || priority
}

const getPriorityTagType = (priority) => {
  const typeMap = {
    low: 'info',
    medium: 'warning',
    high: 'danger'
  }
  return typeMap[priority] || 'info'
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return Math.floor(diff / 60000) + '分钟前'
  } else if (diff < 86400000) { // 1天内
    return Math.floor(diff / 3600000) + '小时前'
  } else {
    return date.toLocaleDateString()
  }
}

const formatContent = (content) => {
  if (!content) return ''
  // 简单的文本格式化，将换行转换为<br>
  return content.replace(/\n/g, '<br>')
}

const formatFileSize = (size) => {
  if (!size) return '0B'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  
  return Math.round(size * 100) / 100 + units[index]
}

onMounted(() => {
  getMessageData()
})
</script>

<style lang="scss" scoped>
.app-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .message-list {
    max-height: 600px;
    overflow-y: auto;
    
    .message-item {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: #f5f7fa;
      }
      
      &.active {
        background-color: #e6f7ff;
        border-left: 3px solid #409eff;
      }
      
      &.unread {
        background-color: #fef9e7;
      }
      
      .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
        
        .message-title {
          font-weight: bold;
          font-size: 14px;
          color: #303133;
        }
        
        .message-time {
          font-size: 12px;
          color: #909399;
        }
      }
      
      .message-preview {
        font-size: 13px;
        color: #606266;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .message-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .unread-dot {
          width: 8px;
          height: 8px;
          background-color: #f56c6c;
          border-radius: 50%;
        }
      }
    }
  }
  
  .message-detail {
    .detail-header {
      margin-bottom: 20px;
      
      h2 {
        margin: 0 0 10px 0;
        color: #303133;
      }
      
      .detail-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        
        .detail-time {
          color: #909399;
          font-size: 14px;
        }
      }
    }
    
    .sender-info {
      margin-bottom: 20px;
      
      .sender-detail {
        display: flex;
        align-items: center;
      }
    }
    
    .message-content {
      margin-bottom: 20px;
      
      .content-text {
        line-height: 1.6;
        color: #303133;
        margin-bottom: 15px;
      }
      
      .attachments {
        h4 {
          margin: 0 0 10px 0;
          color: #606266;
        }
        
        .attachment-list {
          .attachment-item {
            display: flex;
            align-items: center;
            padding: 8px;
            background-color: #f5f7fa;
            border-radius: 4px;
            margin-bottom: 5px;
            
            a {
              margin-left: 8px;
              color: #409eff;
              text-decoration: none;
              
              &:hover {
                text-decoration: underline;
              }
            }
            
            .attachment-size {
              margin-left: 8px;
              color: #909399;
              font-size: 12px;
            }
          }
        }
      }
    }
    
    .reply-section {
      border-top: 1px solid #f0f0f0;
      padding-top: 20px;
      
      h4 {
        margin: 0 0 15px 0;
        color: #606266;
      }
    }
  }
}
</style>