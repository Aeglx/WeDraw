<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" type="card">
      <!-- 关注回复 -->
      <el-tab-pane label="关注回复" name="subscribe">
        <el-card>
          <template #header>
            <span>用户关注时自动回复</span>
          </template>
          
          <el-form :model="subscribeReply" label-width="100px">
            <el-form-item label="回复状态">
              <el-switch v-model="subscribeReply.enabled" active-text="启用" inactive-text="禁用" />
            </el-form-item>
            
            <el-form-item label="回复类型">
              <el-radio-group v-model="subscribeReply.type">
                <el-radio label="text">文本消息</el-radio>
                <el-radio label="news">图文消息</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item v-if="subscribeReply.type === 'text'" label="回复内容">
              <el-input
                v-model="subscribeReply.content"
                type="textarea"
                :rows="4"
                placeholder="请输入关注回复内容"
              />
            </el-form-item>
            
            <el-form-item v-if="subscribeReply.type === 'news'" label="图文消息">
              <div class="news-list">
                <div v-for="(news, index) in subscribeReply.news" :key="index" class="news-item">
                  <el-card shadow="never">
                    <el-form :model="news" label-width="80px" size="small">
                      <el-form-item label="标题">
                        <el-input v-model="news.title" placeholder="请输入标题" />
                      </el-form-item>
                      <el-form-item label="描述">
                        <el-input v-model="news.description" type="textarea" :rows="2" placeholder="请输入描述" />
                      </el-form-item>
                      <el-form-item label="封面图片">
                        <el-input v-model="news.pic_url" placeholder="请输入图片URL" />
                      </el-form-item>
                      <el-form-item label="跳转链接">
                        <el-input v-model="news.url" placeholder="请输入跳转链接" />
                      </el-form-item>
                      <el-form-item>
                        <el-button type="danger" size="small" @click="removeNews('subscribe', index)">
                          删除
                        </el-button>
                      </el-form-item>
                    </el-form>
                  </el-card>
                </div>
                <el-button type="dashed" style="width: 100%" @click="addNews('subscribe')">
                  + 添加图文
                </el-button>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveReply('subscribe')">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
      
      <!-- 默认回复 -->
      <el-tab-pane label="默认回复" name="default">
        <el-card>
          <template #header>
            <span>用户发送未匹配关键词时的默认回复</span>
          </template>
          
          <el-form :model="defaultReply" label-width="100px">
            <el-form-item label="回复状态">
              <el-switch v-model="defaultReply.enabled" active-text="启用" inactive-text="禁用" />
            </el-form-item>
            
            <el-form-item label="回复类型">
              <el-radio-group v-model="defaultReply.type">
                <el-radio label="text">文本消息</el-radio>
                <el-radio label="news">图文消息</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item v-if="defaultReply.type === 'text'" label="回复内容">
              <el-input
                v-model="defaultReply.content"
                type="textarea"
                :rows="4"
                placeholder="请输入默认回复内容"
              />
            </el-form-item>
            
            <el-form-item v-if="defaultReply.type === 'news'" label="图文消息">
              <div class="news-list">
                <div v-for="(news, index) in defaultReply.news" :key="index" class="news-item">
                  <el-card shadow="never">
                    <el-form :model="news" label-width="80px" size="small">
                      <el-form-item label="标题">
                        <el-input v-model="news.title" placeholder="请输入标题" />
                      </el-form-item>
                      <el-form-item label="描述">
                        <el-input v-model="news.description" type="textarea" :rows="2" placeholder="请输入描述" />
                      </el-form-item>
                      <el-form-item label="封面图片">
                        <el-input v-model="news.pic_url" placeholder="请输入图片URL" />
                      </el-form-item>
                      <el-form-item label="跳转链接">
                        <el-input v-model="news.url" placeholder="请输入跳转链接" />
                      </el-form-item>
                      <el-form-item>
                        <el-button type="danger" size="small" @click="removeNews('default', index)">
                          删除
                        </el-button>
                      </el-form-item>
                    </el-form>
                  </el-card>
                </div>
                <el-button type="dashed" style="width: 100%" @click="addNews('default')">
                  + 添加图文
                </el-button>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveReply('default')">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
      
      <!-- 关键词回复 -->
      <el-tab-pane label="关键词回复" name="keyword">
        <div class="keyword-reply-container">
          <div class="toolbar">
            <el-button type="primary" @click="showAddKeywordDialog">
              添加关键词回复
            </el-button>
          </div>
          
          <el-table :data="keywordReplies" border style="width: 100%">
            <el-table-column prop="keyword" label="关键词" width="150" />
            <el-table-column prop="match_type" label="匹配方式" width="100">
              <template #default="{ row }">
                <el-tag :type="row.match_type === 'exact' ? 'success' : 'info'">
                  {{ row.match_type === 'exact' ? '完全匹配' : '模糊匹配' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reply_type" label="回复类型" width="100">
              <template #default="{ row }">
                {{ row.reply_type === 'text' ? '文本' : '图文' }}
              </template>
            </el-table-column>
            <el-table-column prop="content" label="回复内容" show-overflow-tooltip />
            <el-table-column prop="enabled" label="状态" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="updateKeywordStatus(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="editKeyword(row)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="deleteKeyword(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 关键词回复对话框 -->
    <el-dialog
      :title="keywordDialogTitle"
      v-model="keywordDialogVisible"
      width="600px"
    >
      <el-form :model="keywordForm" :rules="keywordRules" ref="keywordFormRef" label-width="100px">
        <el-form-item label="关键词" prop="keyword">
          <el-input v-model="keywordForm.keyword" placeholder="请输入关键词" />
        </el-form-item>
        
        <el-form-item label="匹配方式">
          <el-radio-group v-model="keywordForm.match_type">
            <el-radio label="exact">完全匹配</el-radio>
            <el-radio label="fuzzy">模糊匹配</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="回复类型">
          <el-radio-group v-model="keywordForm.reply_type">
            <el-radio label="text">文本消息</el-radio>
            <el-radio label="news">图文消息</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="keywordForm.reply_type === 'text'" label="回复内容" prop="content">
          <el-input
            v-model="keywordForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
          />
        </el-form-item>
        
        <el-form-item v-if="keywordForm.reply_type === 'news'" label="图文消息">
          <div class="news-list">
            <div v-for="(news, index) in keywordForm.news" :key="index" class="news-item">
              <el-card shadow="never">
                <el-form :model="news" label-width="80px" size="small">
                  <el-form-item label="标题">
                    <el-input v-model="news.title" placeholder="请输入标题" />
                  </el-form-item>
                  <el-form-item label="描述">
                    <el-input v-model="news.description" type="textarea" :rows="2" placeholder="请输入描述" />
                  </el-form-item>
                  <el-form-item label="封面图片">
                    <el-input v-model="news.pic_url" placeholder="请输入图片URL" />
                  </el-form-item>
                  <el-form-item label="跳转链接">
                    <el-input v-model="news.url" placeholder="请输入跳转链接" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="danger" size="small" @click="removeKeywordNews(index)">
                      删除
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-card>
            </div>
            <el-button type="dashed" style="width: 100%" @click="addKeywordNews">
              + 添加图文
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="启用状态">
          <el-switch v-model="keywordForm.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="keywordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveKeyword">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAutoReply,
  saveAutoReply,
  getKeywordReplies,
  saveKeywordReply,
  deleteKeywordReply,
  updateKeywordReplyStatus
} from '@/api/official'

const activeTab = ref('subscribe')
const keywordDialogVisible = ref(false)
const keywordDialogTitle = ref('添加关键词回复')
const keywordFormRef = ref(null)
const isEditingKeyword = ref(false)

const subscribeReply = reactive({
  enabled: true,
  type: 'text',
  content: '',
  news: []
})

const defaultReply = reactive({
  enabled: true,
  type: 'text',
  content: '',
  news: []
})

const keywordReplies = ref([])

const keywordForm = reactive({
  id: null,
  keyword: '',
  match_type: 'exact',
  reply_type: 'text',
  content: '',
  news: [],
  enabled: true
})

const keywordRules = {
  keyword: [{ required: true, message: '请输入关键词', trigger: 'blur' }],
  content: [{ required: true, message: '请输入回复内容', trigger: 'blur' }]
}

const getAutoReplyData = async () => {
  try {
    const response = await getAutoReply()
    const data = response.data
    
    if (data.subscribe) {
      Object.assign(subscribeReply, data.subscribe)
    }
    
    if (data.default) {
      Object.assign(defaultReply, data.default)
    }
  } catch (error) {
    console.error('获取自动回复设置失败:', error)
  }
}

const getKeywordReplyData = async () => {
  try {
    const response = await getKeywordReplies()
    keywordReplies.value = response.data
  } catch (error) {
    console.error('获取关键词回复失败:', error)
  }
}

const saveReply = async (type) => {
  try {
    const data = type === 'subscribe' ? subscribeReply : defaultReply
    await saveAutoReply({ type, ...data })
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

const addNews = (type) => {
  const newsItem = {
    title: '',
    description: '',
    pic_url: '',
    url: ''
  }
  
  if (type === 'subscribe') {
    subscribeReply.news.push(newsItem)
  } else if (type === 'default') {
    defaultReply.news.push(newsItem)
  }
}

const removeNews = (type, index) => {
  if (type === 'subscribe') {
    subscribeReply.news.splice(index, 1)
  } else if (type === 'default') {
    defaultReply.news.splice(index, 1)
  }
}

const showAddKeywordDialog = () => {
  resetKeywordForm()
  keywordDialogTitle.value = '添加关键词回复'
  isEditingKeyword.value = false
  keywordDialogVisible.value = true
}

const editKeyword = (row) => {
  Object.assign(keywordForm, row)
  keywordDialogTitle.value = '编辑关键词回复'
  isEditingKeyword.value = true
  keywordDialogVisible.value = true
}

const resetKeywordForm = () => {
  keywordForm.id = null
  keywordForm.keyword = ''
  keywordForm.match_type = 'exact'
  keywordForm.reply_type = 'text'
  keywordForm.content = ''
  keywordForm.news = []
  keywordForm.enabled = true
}

const saveKeyword = async () => {
  try {
    await keywordFormRef.value.validate()
    await saveKeywordReply(keywordForm)
    keywordDialogVisible.value = false
    await getKeywordReplyData()
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

const deleteKeyword = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个关键词回复吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteKeywordReply(row.id)
    await getKeywordReplyData()
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

const updateKeywordStatus = async (row) => {
  try {
    await updateKeywordReplyStatus(row.id, row.enabled)
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败: ' + error.message)
    row.enabled = !row.enabled // 回滚状态
  }
}

const addKeywordNews = () => {
  keywordForm.news.push({
    title: '',
    description: '',
    pic_url: '',
    url: ''
  })
}

const removeKeywordNews = (index) => {
  keywordForm.news.splice(index, 1)
}

onMounted(() => {
  getAutoReplyData()
  getKeywordReplyData()
})
</script>

<style lang="scss" scoped>
.app-container {
  .news-list {
    .news-item {
      margin-bottom: 15px;
    }
  }
  
  .keyword-reply-container {
    .toolbar {
      margin-bottom: 20px;
    }
  }
}
</style>