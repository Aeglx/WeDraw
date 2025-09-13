<template>
  <div @click="switchTheme">
    <el-icon class="theme-icon">
      <Sunny v-if="isDark" />
      <Moon v-else />
    </el-icon>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Sunny, Moon } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'

const appStore = useAppStore()

const isDark = computed(() => appStore.theme === 'dark')

const switchTheme = () => {
  const newTheme = isDark.value ? 'light' : 'dark'
  appStore.setTheme(newTheme)
  
  // 切换HTML根元素的class
  const html = document.documentElement
  if (newTheme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
  
  ElMessage.success(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}主题`)
}
</script>

<style scoped>
.theme-icon {
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.theme-icon:hover {
  transform: scale(1.1);
}
</style>