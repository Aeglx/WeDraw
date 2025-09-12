<template>
  <div @click="click">
    <svg
      :class="{ 'is-active': isFullscreen }"
      class="svg-icon"
      aria-hidden="true"
    >
      <use :xlink:href="isFullscreen ? '#icon-exit-fullscreen' : '#icon-fullscreen'" />
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import screenfull from 'screenfull'
import { ElMessage } from 'element-plus'

const isFullscreen = ref(false)

const click = () => {
  if (!screenfull.isEnabled) {
    ElMessage({
      message: '你的浏览器不支持全屏',
      type: 'warning'
    })
    return false
  }
  screenfull.toggle()
}

const change = () => {
  isFullscreen.value = screenfull.isFullscreen
}

onMounted(() => {
  if (screenfull.isEnabled) {
    screenfull.on('change', change)
  }
})

onUnmounted(() => {
  if (screenfull.isEnabled) {
    screenfull.off('change', change)
  }
})
</script>

<style scoped>
.svg-icon {
  width: 20px;
  height: 20px;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>