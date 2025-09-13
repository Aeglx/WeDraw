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
  background-color: #f0f2f5;
  min-height: calc(100vh - 50px);
}

.dashboard-text {
  font-size: 32px;
  line-height: 46px;
  color: #303133;
  font-weight: 600;
  margin-bottom: 30px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-row {
  margin-bottom: 30px;
}

.stats-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  }
  
  .stats-content {
    display: flex;
    align-items: center;
    padding: 24px;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: translate(30px, -30px);
    }
    
    .stats-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      
      .el-icon {
        font-size: 28px;
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
      z-index: 1;
      
      .stats-number {
        font-size: 32px;
        font-weight: 700;
        color: #303133;
        line-height: 1;
        margin-bottom: 8px;
      }
      
      .stats-label {
        font-size: 15px;
        color: #909399;
        font-weight: 500;
      }
    }
  }
}

.chart-row {
  margin-bottom: 30px;
}

.chart-container {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  color: #6c757d;
  font-size: 16px;
  font-weight: 500;
  border: 2px dashed #dee2e6;
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
      border-radius: 8px;
      padding: 12px 20px;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 18px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 40px;
    height: 3px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
  }
}

:deep(.el-card) {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
  
  .el-card__header {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .el-card__body {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 15px;
  }
  
  .dashboard-text {
    font-size: 24px;
  }
  
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
    
    .el-button {
      padding: 10px 16px;
      font-size: 14px;
    }
  }
  
  .stats-card .stats-content {
    padding: 20px;
    
    .stats-icon {
      width: 56px;
      height: 56px;
      
      .el-icon {
        font-size: 24px;
      }
    }
    
    .stats-info .stats-number {
      font-size: 28px;
    }
  }
}
</style>