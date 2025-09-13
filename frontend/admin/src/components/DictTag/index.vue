<template>
  <el-tag
    :type="tagType"
    :size="size"
    :effect="effect"
    :closable="closable"
    @close="handleClose"
  >
    {{ displayValue }}
  </el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 字典值
  value: {
    type: [String, Number],
    default: ''
  },
  // 字典选项数组
  options: {
    type: Array,
    default: () => []
  },
  // 标签类型
  type: {
    type: String,
    default: ''
  },
  // 标签大小
  size: {
    type: String,
    default: 'default'
  },
  // 标签效果
  effect: {
    type: String,
    default: 'light'
  },
  // 是否可关闭
  closable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// 显示值
const displayValue = computed(() => {
  if (!props.options || props.options.length === 0) {
    return props.value
  }
  
  const option = props.options.find(item => item.value === props.value)
  return option ? option.label : props.value
})

// 标签类型
const tagType = computed(() => {
  if (props.type) {
    return props.type
  }
  
  if (!props.options || props.options.length === 0) {
    return 'info'
  }
  
  const option = props.options.find(item => item.value === props.value)
  return option?.type || 'info'
})

// 关闭事件
const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>