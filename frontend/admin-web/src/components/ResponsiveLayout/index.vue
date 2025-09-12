<template>
  <div class="responsive-layout" :class="layoutClasses">
    <slot />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'ResponsiveLayout',
  props: {
    // 断点配置
    breakpoints: {
      type: Object,
      default: () => ({
        xs: 480,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
        xxl: 1600
      })
    },
    // 是否启用移动端适配
    mobile: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const currentBreakpoint = ref('xl')
    const isMobile = ref(false)
    const screenWidth = ref(window.innerWidth)

    // 获取当前断点
    const getCurrentBreakpoint = () => {
      const width = window.innerWidth
      screenWidth.value = width
      
      if (width < props.breakpoints.xs) {
        return 'xs'
      } else if (width < props.breakpoints.sm) {
        return 'sm'
      } else if (width < props.breakpoints.md) {
        return 'md'
      } else if (width < props.breakpoints.lg) {
        return 'lg'
      } else if (width < props.breakpoints.xl) {
        return 'xl'
      } else {
        return 'xxl'
      }
    }

    // 检查是否为移动端
    const checkMobile = () => {
      const userAgent = navigator.userAgent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      return mobileRegex.test(userAgent) || window.innerWidth < props.breakpoints.md
    }

    // 处理窗口大小变化
    const handleResize = () => {
      currentBreakpoint.value = getCurrentBreakpoint()
      isMobile.value = checkMobile()
    }

    // 布局类名
    const layoutClasses = computed(() => {
      return {
        [`breakpoint-${currentBreakpoint.value}`]: true,
        'is-mobile': isMobile.value && props.mobile,
        'is-desktop': !isMobile.value
      }
    })

    onMounted(() => {
      handleResize()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      currentBreakpoint,
      isMobile,
      screenWidth,
      layoutClasses
    }
  }
}
</script>

<style lang="scss" scoped>
.responsive-layout {
  width: 100%;
  height: 100%;
  
  // 移动端适配
  &.is-mobile {
    .el-table {
      font-size: 12px;
      
      :deep(.el-table__cell) {
        padding: 8px 4px;
      }
    }
    
    .el-form {
      :deep(.el-form-item) {
        margin-bottom: 16px;
      }
      
      :deep(.el-form-item__label) {
        font-size: 14px;
        line-height: 1.4;
      }
    }
    
    .el-button {
      padding: 8px 12px;
      font-size: 12px;
    }
    
    .el-input {
      :deep(.el-input__inner) {
        height: 36px;
        line-height: 36px;
      }
    }
    
    .el-select {
      :deep(.el-input__inner) {
        height: 36px;
        line-height: 36px;
      }
    }
  }
  
  // 不同断点下的样式
  &.breakpoint-xs {
    .container {
      padding: 0 8px;
    }
  }
  
  &.breakpoint-sm {
    .container {
      padding: 0 12px;
    }
  }
  
  &.breakpoint-md {
    .container {
      padding: 0 16px;
    }
  }
  
  &.breakpoint-lg {
    .container {
      padding: 0 20px;
    }
  }
  
  &.breakpoint-xl,
  &.breakpoint-xxl {
    .container {
      padding: 0 24px;
    }
  }
}
</style>