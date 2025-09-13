<template>
  <div @click="click">
    <el-icon class="screenfull-icon">
      <FullScreen v-if="!isFullscreen" />
      <Aim v-else />
    </el-icon>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { FullScreen, Aim } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const isFullscreen = ref(false)

const click = () => {
  if (!document.fullscreenEnabled) {
    ElMessage.warning('您的浏览器不支持全屏模式')
    return false
  }
  
  if (!isFullscreen.value) {
    requestFullscreen()
  } else {
    exitFullscreen()
  }
}

const requestFullscreen = () => {
  const element = document.documentElement
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  }
}

const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  }
}

const change = () => {
  isFullscreen.value = document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', change)
  document.addEventListener('webkitfullscreenchange', change)
  document.addEventListener('mozfullscreenchange', change)
  document.addEventListener('MSFullscreenChange', change)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', change)
  document.removeEventListener('webkitfullscreenchange', change)
  document.removeEventListener('mozfullscreenchange', change)
  document.removeEventListener('MSFullscreenChange', change)
})
</script>

<style scoped>
.screenfull-icon {
  font-size: 20px;
  cursor: pointer;
}
</style>