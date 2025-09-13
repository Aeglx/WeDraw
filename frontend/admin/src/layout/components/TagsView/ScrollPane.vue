<template>
  <div ref="scrollContainer" class="scroll-container" @wheel.prevent="handleScroll">
    <div ref="scrollWrapper" class="scroll-wrapper" :style="{ transform: `translateX(${left}px)` }">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits(['scroll'])

const scrollContainer = ref(null)
const scrollWrapper = ref(null)
const left = ref(0)

const scrollWrapper_ = computed(() => scrollWrapper.value)

const handleScroll = (e) => {
  const eventDelta = e.wheelDelta || -e.deltaY * 40
  const $scrollWrapper = scrollWrapper_.value
  const $scrollContainer = scrollContainer.value
  const containerWidth = $scrollContainer.offsetWidth
  const wrapperWidth = $scrollWrapper.offsetWidth

  if (eventDelta > 0) {
    left.value = Math.min(0, left.value + eventDelta)
  } else {
    if (containerWidth - left.value < wrapperWidth) {
      left.value = Math.max(containerWidth - wrapperWidth, left.value + eventDelta)
    }
  }
  emit('scroll')
}

const moveToTarget = (currentTag) => {
  const $scrollContainer = scrollContainer.value
  const containerWidth = $scrollContainer.offsetWidth
  const $scrollWrapper = scrollWrapper_.value
  const tagList = $scrollWrapper.querySelectorAll('.tags-view-item') || []

  let firstTag = null
  let lastTag = null

  if (tagList.length > 0) {
    firstTag = tagList[0]
    lastTag = tagList[tagList.length - 1]
  }

  if (firstTag === currentTag) {
    left.value = 0
  } else if (lastTag === currentTag) {
    left.value = containerWidth - $scrollWrapper.offsetWidth
  } else {
    const currentIndex = [...tagList].findIndex(item => item === currentTag)
    const prevTag = tagList[currentIndex - 1]
    const nextTag = tagList[currentIndex + 1]

    const afterNextTagOffsetLeft = nextTag ? nextTag.offsetLeft + nextTag.offsetWidth + 4 : 0

    const beforePrevTagOffsetLeft = prevTag ? prevTag.offsetLeft - 4 : 0

    if (afterNextTagOffsetLeft > -left.value + containerWidth) {
      left.value = -(afterNextTagOffsetLeft - containerWidth)
    } else if (beforePrevTagOffsetLeft < -left.value) {
      left.value = -beforePrevTagOffsetLeft
    }
  }
}

defineExpose({
  moveToTarget
})
</script>

<style lang="scss" scoped>
.scroll-container {
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  width: 100%;

  .scroll-wrapper {
    position: absolute;
    transition: transform 0.3s ease-in-out;
  }
}
</style>