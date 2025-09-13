<template>
  <div class="errLog-container">
    <el-icon class="errLog-icon" @click="checkErrorLogs">
      <Warning />
    </el-icon>
    <span v-if="errorLogs.length > 0" class="errLog-badge">{{ errorLogs.length }}</span>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const errorLogs = ref([])

const checkErrorLogs = () => {
  ElMessage.info('暂无错误日志')
}
</script>

<style scoped>
.errLog-container {
  position: relative;
  display: inline-block;
}

.errLog-icon {
  font-size: 20px;
  cursor: pointer;
}

.errLog-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f56c6c;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>