<template>
  <el-dropdown trigger="click" @command="handleSetSize">
    <div>
      <el-icon class="size-icon">
        <Operation />
      </el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item :disabled="size === 'default'" command="default">
          默认
        </el-dropdown-item>
        <el-dropdown-item :disabled="size === 'large'" command="large">
          大型
        </el-dropdown-item>
        <el-dropdown-item :disabled="size === 'small'" command="small">
          小型
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { Operation } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'

const appStore = useAppStore()

const size = computed(() => appStore.size)

const handleSetSize = (size) => {
  appStore.setSize(size)
  ElMessage.success('切换尺寸成功')
  // 刷新页面以应用新的尺寸设置
  window.location.reload()
}
</script>

<style scoped>
.size-icon {
  font-size: 20px;
  cursor: pointer;
}
</style>