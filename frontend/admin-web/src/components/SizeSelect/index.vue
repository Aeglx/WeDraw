<template>
  <el-dropdown trigger="click" @command="handleSetSize">
    <div>
      <svg
        class="svg-icon size-icon"
        aria-hidden="true"
      >
        <use xlink:href="#icon-size" />
      </svg>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item of sizeOptions"
          :key="item.value"
          :disabled="size === item.value"
          :command="item.value"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()

const size = computed(() => appStore.size)

const sizeOptions = [
  { label: 'Default', value: 'default' },
  { label: 'Large', value: 'large' },
  { label: 'Small', value: 'small' }
]

const handleSetSize = (size) => {
  appStore.setSize(size)
  location.reload()
}
</script>

<style scoped>
.size-icon {
  width: 20px;
  height: 20px;
}
</style>