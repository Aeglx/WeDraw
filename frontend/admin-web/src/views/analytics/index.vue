<template>
  <div class="app-container">
    <!-- 时间筛选 -->
    <el-card style="margin-bottom: 20px;">
      <div class="filter-container">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
          style="margin-right: 15px;"
        />
        <el-select
          v-model="timeRange"
          placeholder="快速选择"
          style="width: 120px; margin-right: 15px;"
          @change="handleTimeRangeChange"
        >
          <el-option label="今天" value="today" />
          <el-option label="昨天" value="yesterday" />
          <el-option label="最近7天" value="week" />
          <el-option label="最近30天" value="month" />
          <el-option label="最近90天" value="quarter" />
        </el-select>
        <el-button type="primary" @click="refreshData" :loading="loading">
          刷新数据
        </el-button>
        <el-button @click="exportReport" :loading="exporting">
          导出报告
        </el-button>
      </div>
    </el-card>
    
    <!-- 概览统计 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ overview.total_users || 0 }}</div>
            <div class="stat-label">总用户数</div>
            <div class="stat-change" :class="getChangeClass(overview.user_growth)">
              <el-icon><TrendCharts /></el-icon>
              {{ formatChange(overview.user_growth) }}
            </div>
          </div>
          <el-icon class="stat-icon"><User /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ overview.total_orders || 0 }}</div>
            <div class="stat-label">总订单数</div>
            <div class="stat-change" :class="getChangeClass(overview.order_growth)">
              <el-icon><TrendCharts /></el-icon>
              {{ formatChange(overview.order_growth) }}
            </div>
          </div>
          <el-icon class="stat-icon"><Document /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ overview.total_points || 0 }}</div>
            <div class="stat-label">积分消耗</div>
            <div class="stat-change" :class="getChangeClass(overview.points_growth)">
              <el-icon><TrendCharts /></el-icon>
              {{ formatChange(overview.points_growth) }}
            </div>
          </div>
          <el-icon class="stat-icon"><Coin /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ overview.active_rate || '0%' }}</div>
            <div class="stat-label">活跃率</div>
            <div class="stat-change" :class="getChangeClass(overview.active_growth)">
              <el-icon><TrendCharts /></el-icon>
              {{ formatChange(overview.active_growth) }}
            </div>
          </div>
          <el-icon class="stat-icon"><Avatar /></el-icon>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <!-- 用户趋势图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>用户增长趋势</span>
          </template>
          <div ref="userTrendChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <!-- 订单趋势图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>订单趋势</span>
          </template>
          <div ref="orderTrendChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <!-- 积分消耗分析 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>积分消耗分析</span>
          </template>
          <div ref="pointsChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <!-- 商品销量排行 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>商品销量排行</span>
          </template>
          <div ref="goodsRankChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 详细数据表格 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>用户地域分布</span>
          </template>
          <el-table :data="regionData" border style="width: 100%" max-height="400">
            <el-table-column prop="region" label="地区" width="120" />
            <el-table-column prop="user_count" label="用户数" width="100" />
            <el-table-column label="占比" width="100">
              <template #default="{ row }">
                {{ ((row.user_count / overview.total_users) * 100).toFixed(1) }}%
              </template>
            </el-table-column>
            <el-table-column label="活跃度">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.active_rate"
                  :color="getProgressColor(row.active_rate)"
                  :show-text="false"
                  style="width: 80px;"
                />
                <span style="margin-left: 10px;">{{ row.active_rate }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>热门功能使用统计</span>
          </template>
          <el-table :data="featureData" border style="width: 100%" max-height="400">
            <el-table-column prop="feature" label="功能" width="150" />
            <el-table-column prop="usage_count" label="使用次数" width="120" />
            <el-table-column label="使用率">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.usage_rate"
                  :color="getProgressColor(row.usage_rate)"
                  :show-text="false"
                  style="width: 80px;"
                />
                <span style="margin-left: 10px;">{{ row.usage_rate }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  Document,
  Coin,
  Avatar,
  TrendCharts
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getAnalyticsOverview,
  getUserTrend,
  getOrderTrend,
  getPointsTrend,
  getGoodsRank,
  getRegionData,
  getFeatureData,
  exportAnalyticsReport
} from '@/api/analytics'

const loading = ref(false)
const exporting = ref(false)

const dateRange = ref([])
const timeRange = ref('week')

const overview = ref({})
const regionData = ref([])
const featureData = ref([])

// 图表实例
const userTrendChart = ref()
const orderTrendChart = ref()
const pointsChart = ref()
const goodsRankChart = ref()

let userChart = null
let orderChart = null
let pointsChartInstance = null
let goodsChart = null

const query = reactive({
  start_date: '',
  end_date: ''
})

const getAnalyticsData = async () => {
  try {
    loading.value = true
    
    // 获取概览数据
    const overviewResponse = await getAnalyticsOverview(query)
    overview.value = overviewResponse.data
    
    // 获取地域数据
    const regionResponse = await getRegionData(query)
    regionData.value = regionResponse.data
    
    // 获取功能数据
    const featureResponse = await getFeatureData(query)
    featureData.value = featureResponse.data
    
    // 渲染图表
    await nextTick()
    renderCharts()
    
  } catch (error) {
    console.error('获取分析数据失败:', error)
    ElMessage.error('获取数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const renderCharts = async () => {
  try {
    // 用户趋势图
    const userTrendResponse = await getUserTrend(query)
    renderUserTrendChart(userTrendResponse.data)
    
    // 订单趋势图
    const orderTrendResponse = await getOrderTrend(query)
    renderOrderTrendChart(orderTrendResponse.data)
    
    // 积分消耗图
    const pointsTrendResponse = await getPointsTrend(query)
    renderPointsChart(pointsTrendResponse.data)
    
    // 商品排行图
    const goodsRankResponse = await getGoodsRank(query)
    renderGoodsRankChart(goodsRankResponse.data)
    
  } catch (error) {
    console.error('渲染图表失败:', error)
  }
}

const renderUserTrendChart = (data) => {
  if (userChart) {
    userChart.dispose()
  }
  
  userChart = echarts.init(userTrendChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['新增用户', '活跃用户']
    },
    xAxis: {
      type: 'category',
      data: data.dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        data: data.new_users,
        smooth: true,
        itemStyle: {
          color: '#409eff'
        }
      },
      {
        name: '活跃用户',
        type: 'line',
        data: data.active_users,
        smooth: true,
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }
  
  userChart.setOption(option)
}

const renderOrderTrendChart = (data) => {
  if (orderChart) {
    orderChart.dispose()
  }
  
  orderChart = echarts.init(orderTrendChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['订单数量', '完成订单']
    },
    xAxis: {
      type: 'category',
      data: data.dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: data.total_orders,
        itemStyle: {
          color: '#e6a23c'
        }
      },
      {
        name: '完成订单',
        type: 'bar',
        data: data.completed_orders,
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }
  
  orderChart.setOption(option)
}

const renderPointsChart = (data) => {
  if (pointsChartInstance) {
    pointsChartInstance.dispose()
  }
  
  pointsChartInstance = echarts.init(pointsChart.value)
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '积分消耗',
        type: 'pie',
        radius: '50%',
        data: data.categories,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  pointsChartInstance.setOption(option)
}

const renderGoodsRankChart = (data) => {
  if (goodsChart) {
    goodsChart.dispose()
  }
  
  goodsChart = echarts.init(goodsRankChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data.goods_names
    },
    series: [
      {
        name: '销量',
        type: 'bar',
        data: data.sales,
        itemStyle: {
          color: '#f56c6c'
        }
      }
    ]
  }
  
  goodsChart.setOption(option)
}

const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    query.start_date = dates[0]
    query.end_date = dates[1]
  } else {
    query.start_date = ''
    query.end_date = ''
  }
  timeRange.value = ''
}

const handleTimeRangeChange = (range) => {
  const today = new Date()
  let startDate, endDate
  
  switch (range) {
    case 'today':
      startDate = endDate = today.toISOString().slice(0, 10)
      break
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate = endDate = yesterday.toISOString().slice(0, 10)
      break
    case 'week':
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      startDate = weekAgo.toISOString().slice(0, 10)
      endDate = today.toISOString().slice(0, 10)
      break
    case 'month':
      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)
      startDate = monthAgo.toISOString().slice(0, 10)
      endDate = today.toISOString().slice(0, 10)
      break
    case 'quarter':
      const quarterAgo = new Date(today)
      quarterAgo.setDate(quarterAgo.getDate() - 90)
      startDate = quarterAgo.toISOString().slice(0, 10)
      endDate = today.toISOString().slice(0, 10)
      break
  }
  
  dateRange.value = [startDate, endDate]
  query.start_date = startDate
  query.end_date = endDate
}

const refreshData = () => {
  getAnalyticsData()
}

const exportReport = async () => {
  try {
    exporting.value = true
    const response = await exportAnalyticsReport(query)
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `数据分析报告_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}

const getChangeClass = (change) => {
  if (!change) return ''
  return change > 0 ? 'positive' : change < 0 ? 'negative' : ''
}

const formatChange = (change) => {
  if (!change) return '0%'
  const prefix = change > 0 ? '+' : ''
  return `${prefix}${change}%`
}

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#e6a23c'
  if (percentage >= 40) return '#f56c6c'
  return '#909399'
}

onMounted(() => {
  // 默认显示最近7天数据
  handleTimeRangeChange('week')
  getAnalyticsData()
})
</script>

<style lang="scss" scoped>
.app-container {
  .filter-container {
    display: flex;
    align-items: center;
  }
  
  .stat-card {
    position: relative;
    overflow: hidden;
    
    .stat-content {
      .stat-number {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 5px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }
      
      .stat-change {
        font-size: 12px;
        display: flex;
        align-items: center;
        
        &.positive {
          color: #67c23a;
        }
        
        &.negative {
          color: #f56c6c;
        }
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
    
    .stat-icon {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 50px;
      color: #409eff;
      opacity: 0.2;
    }
  }
}
</style>