<template>
  <div>
    <el-icon v-if="icon" class="menu-icon">
      <component :is="icon" />
    </el-icon>
    <span v-if="title" slot="title">{{ title }}</span>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.menu-icon {
  margin-right: 8px;
}
</style>