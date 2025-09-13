<template>
  <div class="dashboard-container">
    <div class="dashboard-text">欢迎使用 WeDraw 管理后台</div>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ userCount }}</div>
              <div class="stats-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon wechat-icon">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ wechatFans }}</div>
              <div class="stats-label">微信粉丝</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon order-icon">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ orderCount }}</div>
              <div class="stats-label">订单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon revenue-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">¥{{ revenue }}</div>
              <div class="stats-label">总收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户增长趋势</span>
            </div>
          </template>
          <div class="chart-container" id="userChart"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>订单统计</span>
            </div>
          </template>
          <div class="chart-container" id="orderChart"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 快捷操作 -->
    <el-row :gutter="20" class="action-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="action-buttons">
            <el-button type="primary" @click="goToUserManagement">
              <el-icon><User /></el-icon>
              用户管理
            </el-button>
            <el-button type="success" @click="goToWechatManagement">
              <el-icon><ChatDotRound /></el-icon>
              公众号管理
            </el-button>
            <el-button type="warning" @click="goToPointsMall">
              <el-icon><ShoppingCart /></el-icon>
              积分商城
            </el-button>
            <el-button type="info" @click="goToDataAnalysis">
              <el-icon><DataAnalysis /></el-icon>
              数据分析
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, ChatDotRound, ShoppingCart, Money, DataAnalysis } from '@element-plus/icons-vue'

const router = useRouter()

// 统计数据
const userCount = ref(1234)
const wechatFans = ref(5678)
const orderCount = ref(890)
const revenue = ref(12345.67)

// 页面跳转方法
const goToUserManagement = () => {
  router.push('/user/list')
}

const goToWechatManagement = () => {
  router.push('/wechat/fans')
}

const goToPointsMall = () => {
  router.push('/points/products')
}

const goToDataAnalysis = () => {
  router.push('/data/overview')
}

// 初始化图表（这里可以集成 ECharts 或其他图表库）
const initCharts = () => {
  // TODO: 集成图表库，如 ECharts
  console.log('初始化图表')
}

onMounted(() => {
  initCharts()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-text {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 30px;
  text-align: center;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  .stats-content {
    display: flex;
    align-items: center;
    padding: 10px 0;
    
    .stats-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      
      .el-icon {
        font-size: 24px;
        color: #fff;
      }
      
      &.user-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.wechat-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      &.order-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
      
      &.revenue-icon {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }
    
    .stats-info {
      flex: 1;
      
      .stats-number {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
        line-height: 1;
      }
      
      .stats-label {
        font-size: 14px;
        color: #909399;
        margin-top: 5px;
      }
    }
  }
}

.chart-row {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
  color: #909399;
  font-size: 14px;
}

.action-row {
  .action-buttons {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    
    .el-button {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

@media (max-width: 768px) {
  .stats-row {
    .el-col {
      margin-bottom: 15px;
    }
  }
  
  .chart-row {
    .el-col {
      margin-bottom: 15px;
    }
  }
  
  .action-buttons {
    justify-content: center;
  }
}
</style>