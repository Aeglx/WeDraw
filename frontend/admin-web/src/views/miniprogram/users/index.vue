<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>小程序用户管理</span>
          <div class="header-actions">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateChange"
              style="margin-right: 10px;"
            />
            <el-input
              v-model="searchQuery"
              placeholder="搜索用户昵称/OpenID"
              style="width: 200px; margin-right: 10px;"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="exportUsers" :loading="exporting">
              导出数据
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total_users || 0 }}</div>
              <div class="stat-label">总用户数</div>
            </div>
            <el-icon class="stat-icon"><User /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.new_users || 0 }}</div>
              <div class="stat-label">新增用户</div>
            </div>
            <el-icon class="stat-icon"><UserFilled /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.active_users || 0 }}</div>
              <div class="stat-label">活跃用户</div>
            </div>
            <el-icon class="stat-icon"><Avatar /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.retention_rate || '0%' }}</div>
              <div class="stat-label">留存率</div>
            </div>
            <el-icon class="stat-icon"><TrendCharts /></el-icon>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 用户列表 -->
      <el-table :data="userList" border style="width: 100%" v-loading="loading">
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar_url" :size="40">
              <img src="/src/assets/images/avatar.png" />
            </el-avatar>
          </template>
        </el-table-column>
        
        <el-table-column prop="nickname" label="昵称" width="120" show-overflow-tooltip />
        
        <el-table-column prop="openid" label="OpenID" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="openid-text">{{ row.openid }}</span>
            <el-button type="text" size="small" @click="copyOpenId(row.openid)">
              复制
            </el-button>
          </template>
        </el-table-column>
        
        <el-table-column label="性别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.gender === 1 ? 'primary' : row.gender === 2 ? 'danger' : 'info'" size="small">
              {{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="country" label="国家" width="100" show-overflow-tooltip />
        
        <el-table-column prop="province" label="省份" width="100" show-overflow-tooltip />
        
        <el-table-column prop="city" label="城市" width="100" show-overflow-tooltip />
        
        <el-table-column prop="language" label="语言" width="80" />
        
        <el-table-column label="首次访问" width="180">
          <template #default="{ row }">
            {{ formatTime(row.first_visit_time) }}
          </template>
        </el-table-column>
        
        <el-table-column label="最后访问" width="180">
          <template #default="{ row }">
            {{ formatTime(row.last_visit_time) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="visit_count" label="访问次数" width="100" />
        
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '活跃' : '沉默' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewUser(row)">
              详情
            </el-button>
            <el-button type="info" size="small" @click="viewUserPath(row)">
              路径
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
    
    <!-- 用户详情对话框 -->
    <el-dialog
      title="用户详情"
      v-model="userDetailVisible"
      width="600px"
    >
      <el-descriptions v-if="currentUser" :column="2" border>
        <el-descriptions-item label="头像" :span="2">
          <el-avatar :src="currentUser.avatar_url" :size="60">
            <img src="/src/assets/images/avatar.png" />
          </el-avatar>
        </el-descriptions-item>
        <el-descriptions-item label="昵称">
          {{ currentUser.nickname }}
        </el-descriptions-item>
        <el-descriptions-item label="OpenID">
          {{ currentUser.openid }}
        </el-descriptions-item>
        <el-descriptions-item label="UnionID">
          {{ currentUser.unionid || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ currentUser.gender === 1 ? '男' : currentUser.gender === 2 ? '女' : '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="国家">
          {{ currentUser.country || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="省份">
          {{ currentUser.province || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="城市">
          {{ currentUser.city || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="语言">
          {{ currentUser.language || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="首次访问">
          {{ formatTime(currentUser.first_visit_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="最后访问">
          {{ formatTime(currentUser.last_visit_time) }}
        </el-descriptions-item>
        <el-descriptions-item label="访问次数">
          {{ currentUser.visit_count }}
        </el-descriptions-item>
        <el-descriptions-item label="累计停留时长">
          {{ formatDuration(currentUser.total_duration) }}
        </el-descriptions-item>
        <el-descriptions-item label="用户标签" :span="2">
          <el-tag v-for="tag in currentUser.tags" :key="tag" style="margin-right: 5px;">
            {{ tag }}
          </el-tag>
          <span v-if="!currentUser.tags || currentUser.tags.length === 0">-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
    
    <!-- 用户路径对话框 -->
    <el-dialog
      title="用户访问路径"
      v-model="userPathVisible"
      width="800px"
    >
      <el-timeline v-if="userPath && userPath.length > 0">
        <el-timeline-item
          v-for="(item, index) in userPath"
          :key="index"
          :timestamp="formatTime(item.visit_time)"
          placement="top"
        >
          <el-card>
            <h4>{{ item.page_title || item.page_path }}</h4>
            <p><strong>页面路径：</strong>{{ item.page_path }}</p>
            <p><strong>停留时长：</strong>{{ formatDuration(item.duration) }}</p>
            <p v-if="item.scene"><strong>进入场景：</strong>{{ getSceneName(item.scene) }}</p>
            <p v-if="item.share_from"><strong>分享来源：</strong>{{ item.share_from }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <el-empty v-else description="暂无访问路径数据" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, User, UserFilled, Avatar, TrendCharts } from '@element-plus/icons-vue'
import {
  getUsers,
  getUserStatistics,
  getUserDetail,
  getUserPath,
  exportUsers as exportUsersApi
} from '@/api/miniprogram'

const loading = ref(false)
const exporting = ref(false)
const userDetailVisible = ref(false)
const userPathVisible = ref(false)

const searchQuery = ref('')
const dateRange = ref([])
const currentUser = ref(null)
const userPath = ref([])

const userList = ref([])
const total = ref(0)
const statistics = ref({})

const query = reactive({
  page: 1,
  limit: 20,
  search: '',
  start_date: '',
  end_date: ''
})

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

const getStatisticsData = async () => {
  try {
    const response = await getUserStatistics({
      start_date: query.start_date,
      end_date: query.end_date
    })
    statistics.value = response.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const handleSearch = () => {
  query.search = searchQuery.value
  query.page = 1
  getUserData()
}

const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    query.start_date = dates[0]
    query.end_date = dates[1]
  } else {
    query.start_date = ''
    query.end_date = ''
  }
  query.page = 1
  getUserData()
  getStatisticsData()
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

const copyOpenId = async (openid) => {
  try {
    await navigator.clipboard.writeText(openid)
    ElMessage.success('OpenID已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const viewUser = async (user) => {
  try {
    const response = await getUserDetail(user.openid)
    currentUser.value = response.data
    userDetailVisible.value = true
  } catch (error) {
    ElMessage.error('获取用户详情失败: ' + error.message)
  }
}

const viewUserPath = async (user) => {
  try {
    const response = await getUserPath(user.openid)
    userPath.value = response.data
    userPathVisible.value = true
  } catch (error) {
    ElMessage.error('获取用户路径失败: ' + error.message)
  }
}

const exportUsers = async () => {
  try {
    exporting.value = true
    const response = await exportUsersApi(query)
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `小程序用户数据_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString()
}

const formatDuration = (seconds) => {
  if (!seconds) return '0秒'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟${secs}秒`
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`
  } else {
    return `${secs}秒`
  }
}

const getSceneName = (scene) => {
  const sceneMap = {
    1001: '发现栏小程序主入口',
    1005: '顶部搜索框的搜索结果页',
    1006: '发现栏小程序主入口搜索框的搜索结果页',
    1007: '单人聊天会话中的小程序消息卡片',
    1008: '群聊会话中的小程序消息卡片',
    1011: '扫描二维码',
    1012: '长按图片识别二维码',
    1013: '手机相册选取二维码',
    1014: '小程序模版消息',
    1017: '前往体验版的入口页',
    1019: '微信钱包',
    1020: '公众号 profile 页相关小程序列表',
    1022: '聊天顶部置顶小程序入口',
    1023: '安卓系统桌面图标',
    1024: '小程序 profile 页',
    1025: '扫描一维码',
    1026: '附近的小程序列表',
    1027: '顶部搜索框搜索结果页「使用过的小程序」列表',
    1028: '我的卡包',
    1029: '卡券详情页',
    1030: '自动化测试下打开小程序',
    1031: '长按图片识别一维码',
    1032: '手机相册选取一维码',
    1034: '微信支付完成页',
    1035: '公众号自定义菜单',
    1036: 'App 分享消息卡片',
    1037: '小程序打开小程序',
    1038: '从另一个小程序返回',
    1039: '摇电视',
    1042: '添加到桌面图标',
    1043: '公众号模版消息',
    1044: '带 shareTicket 的小程序消息卡片',
    1045: '朋友圈广告',
    1046: '朋友圈广告详情页',
    1047: '扫描小程序码',
    1048: '长按图片识别小程序码',
    1049: '手机相册选取小程序码',
    1052: '卡券的适用门店列表',
    1053: '搜一搜的结果页',
    1054: '顶部搜索框小程序快捷入口',
    1056: '音乐播放器菜单',
    1057: '钱包中的银行卡详情页',
    1058: '公众号文章',
    1059: '体验版小程序绑定邀请页',
    1064: '微信连Wi-Fi状态栏',
    1067: '公众号文章广告',
    1068: '附近的小程序列表广告',
    1069: '移动应用',
    1071: '钱包中的银行卡列表页',
    1072: '二维码收款页面',
    1073: '客服消息列表下发的小程序消息卡片',
    1074: '公众号会话下发的小程序消息卡片',
    1077: '摇周边',
    1078: '连Wi-Fi成功页',
    1079: '微信游戏中心',
    1081: '客服消息下发的文字链',
    1082: '公众号会话下发的文字链',
    1084: '朋友圈广告原生页',
    1089: '微信聊天主界面下拉',
    1090: '长按小程序右上角菜单唤出最近使用历史',
    1091: '公众号文章商品广告',
    1092: '城市服务入口',
    1095: '小程序广告组件',
    1096: '聊天记录',
    1097: '微信支付签约页',
    1099: '页面内嵌插件',
    1102: '公众号 profile 页服务预览',
    1103: '发现-小程序主入口我的小程序列表',
    1104: '微信聊天主界面下拉，「我的小程序」栏目',
    1113: 'PC端微信-发现-小程序',
    1114: 'PC端微信-微信聊天主界面下拉，「我的小程序」栏目',
    1117: '公众号 profile 页相关小程序列表'
  }
  
  return sceneMap[scene] || `场景值: ${scene}`
}

onMounted(() => {
  getUserData()
  getStatisticsData()
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
  
  .stat-card {
    position: relative;
    overflow: hidden;
    
    .stat-content {
      .stat-number {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 5px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
    
    .stat-icon {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 40px;
      color: #409eff;
      opacity: 0.3;
    }
  }
  
  .openid-text {
    font-family: monospace;
    font-size: 12px;
  }
}
</style>