<template>
  <div style="padding: 0 15px" @click="toggleClick">
    <el-icon class="hamburger" :class="{ 'is-active': isActive }">
      <Expand v-if="!isActive" />
      <Fold v-else />
    </el-icon>
  </div>
</template>

<script setup>
import { Expand, Fold } from '@element-plus/icons-vue'

defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggleClick'])

const toggleClick = () => {
  emit('toggleClick')
}
</script>

<style scoped>
.hamburger {
  display: inline-block;
  vertical-align: middle;
  width: 20px;
  height: 20px;
  cursor: pointer;
  transition: transform 0.38s;
  transform-origin: 50% 50%;
}

.hamburger.is-active {
  transform: rotate(90deg);
}
</style>