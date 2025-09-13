<template>
  <div class="data-overview">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">数据概览</h1>
        <p class="page-description">查看系统整体数据统计和趋势分析</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6" v-for="stat in statsData" :key="stat.key">
          <div class="stat-card">
            <div class="stat-icon" :class="stat.iconClass">
              <el-icon :size="24"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-change" :class="stat.changeClass">
                <el-icon><component :is="stat.changeIcon" /></el-icon>
                {{ stat.change }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 访问趋势图 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>访问趋势</span>
                <el-select v-model="visitTrendPeriod" size="small" style="width: 120px">
                  <el-option label="最近7天" value="7d" />
                  <el-option label="最近30天" value="30d" />
                  <el-option label="最近90天" value="90d" />
                </el-select>
              </div>
            </template>
            <div ref="visitTrendChart" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- 用户分布图 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <span>用户分布</span>
            </template>
            <div ref="userDistributionChart" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <!-- 热门功能 -->
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <span>热门功能</span>
            </template>
            <div class="feature-list">
              <div v-for="feature in popularFeatures" :key="feature.name" class="feature-item">
                <div class="feature-info">
                  <span class="feature-name">{{ feature.name }}</span>
                  <span class="feature-count">{{ feature.count }}次</span>
                </div>
                <div class="feature-progress">
                  <el-progress :percentage="feature.percentage" :show-text="false" :stroke-width="6" />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 实时数据 -->
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <span>实时数据</span>
            </template>
            <div class="realtime-data">
              <div v-for="item in realtimeData" :key="item.label" class="realtime-item">
                <div class="realtime-label">{{ item.label }}</div>
                <div class="realtime-value" :class="item.valueClass">{{ item.value }}</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 系统状态 -->
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <span>系统状态</span>
            </template>
            <div class="system-status">
              <div v-for="status in systemStatus" :key="status.name" class="status-item">
                <div class="status-info">
                  <span class="status-name">{{ status.name }}</span>
                  <el-tag :type="status.tagType" size="small">{{ status.status }}</el-tag>
                </div>
                <div class="status-value">{{ status.value }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download, User, ShoppingCart, ChatDotRound, TrendCharts, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getOverviewStats, getVisitTrend, getUserDistribution, getPopularFeatures, getRealtimeData, getSystemStatus } from '@/api/data-analysis/overview'

// 响应式数据
const visitTrendPeriod = ref('7d')
const visitTrendChart = ref(null)
const userDistributionChart = ref(null)

// 统计数据
const statsData = ref([
  {
    key: 'users',
    label: '总用户数',
    value: '12,345',
    change: '+12.5%',
    changeClass: 'positive',
    changeIcon: 'ArrowUp',
    icon: 'User',
    iconClass: 'user-icon'
  },
  {
    key: 'orders',
    label: '总订单数',
    value: '8,967',
    change: '+8.3%',
    changeClass: 'positive',
    changeIcon: 'ArrowUp',
    icon: 'ShoppingCart',
    iconClass: 'order-icon'
  },
  {
    key: 'messages',
    label: '消息总数',
    value: '45,678',
    change: '-2.1%',
    changeClass: 'negative',
    changeIcon: 'ArrowDown',
    icon: 'ChatDotRound',
    iconClass: 'message-icon'
  },
  {
    key: 'revenue',
    label: '总收入',
    value: '¥234,567',
    change: '+15.8%',
    changeClass: 'positive',
    changeIcon: 'ArrowUp',
    icon: 'TrendCharts',
    iconClass: 'revenue-icon'
  }
])

// 热门功能
const popularFeatures = ref([
  { name: '用户管理', count: 1234, percentage: 85 },
  { name: '订单管理', count: 987, percentage: 68 },
  { name: '商品管理', count: 756, percentage: 52 },
  { name: '数据分析', count: 543, percentage: 37 },
  { name: '系统设置', count: 321, percentage: 22 }
])

// 实时数据
const realtimeData = ref([
  { label: '在线用户', value: '1,234', valueClass: 'online' },
  { label: '今日访问', value: '5,678', valueClass: 'visit' },
  { label: '今日订单', value: '89', valueClass: 'order' },
  { label: '今日收入', value: '¥12,345', valueClass: 'income' }
])

// 系统状态
const systemStatus = ref([
  { name: 'CPU使用率', status: '正常', value: '45%', tagType: 'success' },
  { name: '内存使用率', status: '正常', value: '62%', tagType: 'success' },
  { name: '磁盘使用率', status: '警告', value: '85%', tagType: 'warning' },
  { name: '网络状态', status: '正常', value: '良好', tagType: 'success' }
])

// 方法
const refreshData = async () => {
  try {
    // 刷新所有数据
    await loadData()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  }
}

const exportReport = () => {
  ElMessage.success('报告导出功能开发中')
}

const loadData = async () => {
  try {
    // 加载统计数据
    // const stats = await getOverviewStats()
    // statsData.value = stats
    
    // 加载图表数据
    await loadCharts()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const loadCharts = async () => {
  await nextTick()
  
  // 访问趋势图
  if (visitTrendChart.value) {
    const chart = echarts.init(visitTrendChart.value)
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line',
        smooth: true,
        areaStyle: {
          opacity: 0.3
        }
      }]
    }
    chart.setOption(option)
  }
  
  // 用户分布图
  if (userDistributionChart.value) {
    const chart = echarts.init(userDistributionChart.value)
    const option = {
      tooltip: {
        trigger: 'item'
      },
      series: [{
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: '新用户' },
          { value: 735, name: '活跃用户' },
          { value: 580, name: '沉睡用户' },
          { value: 484, name: '流失用户' }
        ]
      }]
    }
    chart.setOption(option)
  }
}

// 生命周期
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.data-overview {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-description {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.order-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.message-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.revenue-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-change {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.charts-section {
  margin-top: 20px;
}

.chart-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 320px;
}

.feature-list {
  padding: 10px 0;
}

.feature-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.feature-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.feature-name {
  font-size: 14px;
  color: #303133;
}

.feature-count {
  font-size: 12px;
  color: #909399;
}

.realtime-data {
  padding: 10px 0;
}

.realtime-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.realtime-item:last-child {
  border-bottom: none;
}

.realtime-label {
  font-size: 14px;
  color: #606266;
}

.realtime-value {
  font-size: 16px;
  font-weight: 600;
}

.realtime-value.online {
  color: #67c23a;
}

.realtime-value.visit {
  color: #409eff;
}

.realtime-value.order {
  color: #e6a23c;
}

.realtime-value.income {
  color: #f56c6c;
}

.system-status {
  padding: 10px 0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-name {
  font-size: 14px;
  color: #606266;
}

.status-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
</style>