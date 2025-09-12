<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" type="card">
      <!-- 图片素材 -->
      <el-tab-pane label="图片素材" name="image">
        <div class="material-container">
          <div class="toolbar">
            <el-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeUpload"
              accept="image/*"
              multiple
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传图片
              </el-button>
            </el-upload>
            
            <el-button @click="refreshMaterials('image')">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
          
          <div class="material-grid">
            <div v-for="item in imageMaterials" :key="item.media_id" class="material-item">
              <div class="material-preview">
                <img :src="item.url" :alt="item.name" @click="previewImage(item.url)" />
              </div>
              <div class="material-info">
                <p class="material-name" :title="item.name">{{ item.name }}</p>
                <p class="material-time">{{ formatTime(item.update_time) }}</p>
              </div>
              <div class="material-actions">
                <el-button type="primary" size="small" @click="copyMediaId(item.media_id)">
                  复制ID
                </el-button>
                <el-button type="danger" size="small" @click="deleteMaterial(item)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
          
          <el-pagination
            v-if="imageTotal > 0"
            :current-page="imageQuery.page"
            :page-size="imageQuery.limit"
            :total="imageTotal"
            layout="total, prev, pager, next"
            @current-change="handleImagePageChange"
          />
        </div>
      </el-tab-pane>
      
      <!-- 语音素材 -->
      <el-tab-pane label="语音素材" name="voice">
        <div class="material-container">
          <div class="toolbar">
            <el-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :data="{ type: 'voice' }"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeVoiceUpload"
              accept="audio/*"
              multiple
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传语音
              </el-button>
            </el-upload>
            
            <el-button @click="refreshMaterials('voice')">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
          
          <el-table :data="voiceMaterials" border style="width: 100%">
            <el-table-column prop="name" label="文件名" show-overflow-tooltip />
            <el-table-column prop="media_id" label="媒体ID" width="200" show-overflow-tooltip />
            <el-table-column prop="update_time" label="更新时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.update_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="copyMediaId(row.media_id)">
                  复制ID
                </el-button>
                <el-button type="danger" size="small" @click="deleteMaterial(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-pagination
            v-if="voiceTotal > 0"
            :current-page="voiceQuery.page"
            :page-size="voiceQuery.limit"
            :total="voiceTotal"
            layout="total, prev, pager, next"
            @current-change="handleVoicePageChange"
          />
        </div>
      </el-tab-pane>
      
      <!-- 视频素材 -->
      <el-tab-pane label="视频素材" name="video">
        <div class="material-container">
          <div class="toolbar">
            <el-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :data="{ type: 'video' }"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeVideoUpload"
              accept="video/*"
              multiple
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传视频
              </el-button>
            </el-upload>
            
            <el-button @click="refreshMaterials('video')">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
          
          <div class="video-grid">
            <div v-for="item in videoMaterials" :key="item.media_id" class="video-item">
              <div class="video-preview">
                <video :src="item.url" controls preload="metadata"></video>
              </div>
              <div class="video-info">
                <p class="video-title" :title="item.title">{{ item.title }}</p>
                <p class="video-description" :title="item.description">{{ item.description }}</p>
                <p class="video-time">{{ formatTime(item.update_time) }}</p>
              </div>
              <div class="video-actions">
                <el-button type="primary" size="small" @click="copyMediaId(item.media_id)">
                  复制ID
                </el-button>
                <el-button type="danger" size="small" @click="deleteMaterial(item)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
          
          <el-pagination
            v-if="videoTotal > 0"
            :current-page="videoQuery.page"
            :page-size="videoQuery.limit"
            :total="videoTotal"
            layout="total, prev, pager, next"
            @current-change="handleVideoPageChange"
          />
        </div>
      </el-tab-pane>
      
      <!-- 图文素材 -->
      <el-tab-pane label="图文素材" name="news">
        <div class="material-container">
          <div class="toolbar">
            <el-button type="primary" @click="showAddNewsDialog">
              <el-icon><Plus /></el-icon>
              新建图文
            </el-button>
            
            <el-button @click="refreshMaterials('news')">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
          
          <div class="news-list">
            <div v-for="item in newsMaterials" :key="item.media_id" class="news-item">
              <el-card>
                <div class="news-content">
                  <div class="news-articles">
                    <div v-for="(article, index) in item.content.news_item" :key="index" class="article-item">
                      <div class="article-thumb">
                        <img :src="article.thumb_url" :alt="article.title" />
                      </div>
                      <div class="article-info">
                        <h4 class="article-title">{{ article.title }}</h4>
                        <p class="article-digest">{{ article.digest }}</p>
                        <p class="article-author">作者: {{ article.author }}</p>
                      </div>
                    </div>
                  </div>
                  <div class="news-meta">
                    <span class="news-time">{{ formatTime(item.update_time) }}</span>
                  </div>
                </div>
                <div class="news-actions">
                  <el-button type="primary" size="small" @click="editNews(item)">
                    编辑
                  </el-button>
                  <el-button type="info" size="small" @click="copyMediaId(item.media_id)">
                    复制ID
                  </el-button>
                  <el-button type="danger" size="small" @click="deleteMaterial(item)">
                    删除
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
          
          <el-pagination
            v-if="newsTotal > 0"
            :current-page="newsQuery.page"
            :page-size="newsQuery.limit"
            :total="newsTotal"
            layout="total, prev, pager, next"
            @current-change="handleNewsPageChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 图文编辑对话框 -->
    <el-dialog
      :title="newsDialogTitle"
      v-model="newsDialogVisible"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="newsForm" label-width="100px">
        <div v-for="(article, index) in newsForm.articles" :key="index" class="article-form">
          <el-divider v-if="index > 0">文章 {{ index + 1 }}</el-divider>
          
          <el-form-item label="标题">
            <el-input v-model="article.title" placeholder="请输入标题" maxlength="64" show-word-limit />
          </el-form-item>
          
          <el-form-item label="作者">
            <el-input v-model="article.author" placeholder="请输入作者" />
          </el-form-item>
          
          <el-form-item label="摘要">
            <el-input
              v-model="article.digest"
              type="textarea"
              :rows="3"
              placeholder="请输入摘要"
              maxlength="120"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="封面图片">
            <el-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :on-success="(response) => handleThumbUpload(response, index)"
              :before-upload="beforeThumbUpload"
              accept="image/*"
              :show-file-list="false"
            >
              <img v-if="article.thumb_url" :src="article.thumb_url" class="thumb-preview" />
              <el-button v-else type="primary">上传封面</el-button>
            </el-upload>
          </el-form-item>
          
          <el-form-item label="正文内容">
            <el-input
              v-model="article.content"
              type="textarea"
              :rows="8"
              placeholder="请输入正文内容"
            />
          </el-form-item>
          
          <el-form-item label="原文链接">
            <el-input v-model="article.content_source_url" placeholder="请输入原文链接" />
          </el-form-item>
          
          <el-form-item v-if="newsForm.articles.length > 1">
            <el-button type="danger" @click="removeArticle(index)">
              删除此文章
            </el-button>
          </el-form-item>
        </div>
        
        <el-form-item>
          <el-button type="dashed" @click="addArticle" :disabled="newsForm.articles.length >= 8">
            + 添加文章 ({{ newsForm.articles.length }}/8)
          </el-button>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="newsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNews">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewDialogVisible" width="60%">
      <img :src="previewImageUrl" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getMaterials,
  deleteMaterial as deleteMaterialApi,
  uploadMaterial,
  saveNewsMaterial
} from '@/api/official'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
const activeTab = ref('image')
const newsDialogVisible = ref(false)
const newsDialogTitle = ref('新建图文')
const previewDialogVisible = ref(false)
const previewImageUrl = ref('')
const isEditingNews = ref(false)

const uploadUrl = computed(() => '/api/official/material/upload')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

// 图片素材
const imageMaterials = ref([])
const imageTotal = ref(0)
const imageQuery = reactive({
  page: 1,
  limit: 20
})

// 语音素材
const voiceMaterials = ref([])
const voiceTotal = ref(0)
const voiceQuery = reactive({
  page: 1,
  limit: 20
})

// 视频素材
const videoMaterials = ref([])
const videoTotal = ref(0)
const videoQuery = reactive({
  page: 1,
  limit: 20
})

// 图文素材
const newsMaterials = ref([])
const newsTotal = ref(0)
const newsQuery = reactive({
  page: 1,
  limit: 10
})

const newsForm = reactive({
  media_id: null,
  articles: [
    {
      title: '',
      author: '',
      digest: '',
      content: '',
      content_source_url: '',
      thumb_url: ''
    }
  ]
})

const getMaterialData = async (type, query) => {
  try {
    const response = await getMaterials({ type, ...query })
    const data = response.data
    
    switch (type) {
      case 'image':
        imageMaterials.value = data.items
        imageTotal.value = data.total
        break
      case 'voice':
        voiceMaterials.value = data.items
        voiceTotal.value = data.total
        break
      case 'video':
        videoMaterials.value = data.items
        videoTotal.value = data.total
        break
      case 'news':
        newsMaterials.value = data.items
        newsTotal.value = data.total
        break
    }
  } catch (error) {
    console.error(`获取${type}素材失败:`, error)
  }
}

const refreshMaterials = (type) => {
  switch (type) {
    case 'image':
      getMaterialData('image', imageQuery)
      break
    case 'voice':
      getMaterialData('voice', voiceQuery)
      break
    case 'video':
      getMaterialData('video', videoQuery)
      break
    case 'news':
      getMaterialData('news', newsQuery)
      break
  }
}

const handleUploadSuccess = (response, file) => {
  ElMessage.success('上传成功')
  refreshMaterials(activeTab.value)
}

const handleUploadError = (error, file) => {
  ElMessage.error('上传失败: ' + error.message)
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

const beforeVoiceUpload = (file) => {
  const isAudio = file.type.startsWith('audio/')
  const isLt10M = file.size / 1024 / 1024 < 10
  
  if (!isAudio) {
    ElMessage.error('只能上传音频文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('音频大小不能超过 10MB!')
    return false
  }
  return true
}

const beforeVideoUpload = (file) => {
  const isVideo = file.type.startsWith('video/')
  const isLt50M = file.size / 1024 / 1024 < 50
  
  if (!isVideo) {
    ElMessage.error('只能上传视频文件!')
    return false
  }
  if (!isLt50M) {
    ElMessage.error('视频大小不能超过 50MB!')
    return false
  }
  return true
}

const beforeThumbUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('封面图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleThumbUpload = (response, index) => {
  newsForm.articles[index].thumb_url = response.data.url
}

const copyMediaId = async (mediaId) => {
  try {
    await navigator.clipboard.writeText(mediaId)
    ElMessage.success('媒体ID已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const deleteMaterial = async (item) => {
  try {
    await ElMessageBox.confirm('确定要删除这个素材吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteMaterialApi(item.media_id)
    refreshMaterials(activeTab.value)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

const previewImage = (url) => {
  previewImageUrl.value = url
  previewDialogVisible.value = true
}

const formatTime = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString()
}

const handleImagePageChange = (page) => {
  imageQuery.page = page
  getMaterialData('image', imageQuery)
}

const handleVoicePageChange = (page) => {
  voiceQuery.page = page
  getMaterialData('voice', voiceQuery)
}

const handleVideoPageChange = (page) => {
  videoQuery.page = page
  getMaterialData('video', videoQuery)
}

const handleNewsPageChange = (page) => {
  newsQuery.page = page
  getMaterialData('news', newsQuery)
}

const showAddNewsDialog = () => {
  resetNewsForm()
  newsDialogTitle.value = '新建图文'
  isEditingNews.value = false
  newsDialogVisible.value = true
}

const editNews = (item) => {
  newsForm.media_id = item.media_id
  newsForm.articles = item.content.news_item.map(article => ({ ...article }))
  newsDialogTitle.value = '编辑图文'
  isEditingNews.value = true
  newsDialogVisible.value = true
}

const resetNewsForm = () => {
  newsForm.media_id = null
  newsForm.articles = [
    {
      title: '',
      author: '',
      digest: '',
      content: '',
      content_source_url: '',
      thumb_url: ''
    }
  ]
}

const addArticle = () => {
  if (newsForm.articles.length < 8) {
    newsForm.articles.push({
      title: '',
      author: '',
      digest: '',
      content: '',
      content_source_url: '',
      thumb_url: ''
    })
  }
}

const removeArticle = (index) => {
  newsForm.articles.splice(index, 1)
}

const saveNews = async () => {
  try {
    // 验证必填字段
    for (let i = 0; i < newsForm.articles.length; i++) {
      const article = newsForm.articles[i]
      if (!article.title) {
        ElMessage.error(`第${i + 1}篇文章标题不能为空`)
        return
      }
      if (!article.content) {
        ElMessage.error(`第${i + 1}篇文章内容不能为空`)
        return
      }
      if (!article.thumb_url) {
        ElMessage.error(`第${i + 1}篇文章封面不能为空`)
        return
      }
    }
    
    await saveNewsMaterial(newsForm)
    newsDialogVisible.value = false
    refreshMaterials('news')
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  }
}

onMounted(() => {
  getMaterialData('image', imageQuery)
})
</script>

<style lang="scss" scoped>
.app-container {
  .material-container {
    .toolbar {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
    }
    
    .material-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
      
      .material-item {
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        overflow: hidden;
        
        .material-preview {
          height: 150px;
          overflow: hidden;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            cursor: pointer;
          }
        }
        
        .material-info {
          padding: 10px;
          
          .material-name {
            margin: 0 0 5px 0;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .material-time {
            margin: 0;
            font-size: 12px;
            color: #909399;
          }
        }
        
        .material-actions {
          padding: 10px;
          border-top: 1px solid #e4e7ed;
          display: flex;
          gap: 5px;
        }
      }
    }
    
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
      
      .video-item {
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        overflow: hidden;
        
        .video-preview {
          video {
            width: 100%;
            height: 200px;
          }
        }
        
        .video-info {
          padding: 10px;
          
          .video-title {
            margin: 0 0 5px 0;
            font-size: 14px;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .video-description {
            margin: 0 0 5px 0;
            font-size: 12px;
            color: #606266;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .video-time {
            margin: 0;
            font-size: 12px;
            color: #909399;
          }
        }
        
        .video-actions {
          padding: 10px;
          border-top: 1px solid #e4e7ed;
          display: flex;
          gap: 5px;
        }
      }
    }
    
    .news-list {
      .news-item {
        margin-bottom: 20px;
        
        .news-content {
          .news-articles {
            .article-item {
              display: flex;
              margin-bottom: 15px;
              
              .article-thumb {
                width: 80px;
                height: 80px;
                margin-right: 15px;
                
                img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  border-radius: 4px;
                }
              }
              
              .article-info {
                flex: 1;
                
                .article-title {
                  margin: 0 0 8px 0;
                  font-size: 16px;
                  font-weight: bold;
                  line-height: 1.4;
                }
                
                .article-digest {
                  margin: 0 0 8px 0;
                  font-size: 14px;
                  color: #606266;
                  line-height: 1.4;
                }
                
                .article-author {
                  margin: 0;
                  font-size: 12px;
                  color: #909399;
                }
              }
            }
          }
          
          .news-meta {
            border-top: 1px solid #e4e7ed;
            padding-top: 10px;
            
            .news-time {
              font-size: 12px;
              color: #909399;
            }
          }
        }
        
        .news-actions {
          margin-top: 15px;
          display: flex;
          gap: 10px;
        }
      }
    }
  }
  
  .article-form {
    margin-bottom: 20px;
    
    .thumb-preview {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 4px;
    }
  }
}
</style>