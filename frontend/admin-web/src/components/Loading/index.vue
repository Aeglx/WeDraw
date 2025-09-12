<template>
  <div v-if="visible" class="loading-container" :class="containerClasses">
    <div class="loading-content">
      <div class="loading-spinner" :class="spinnerClasses">
        <div v-if="type === 'spinner'" class="spinner">
          <div class="bounce1"></div>
          <div class="bounce2"></div>
          <div class="bounce3"></div>
        </div>
        <div v-else-if="type === 'dots'" class="dots">
          <div class="dot1"></div>
          <div class="dot2"></div>
          <div class="dot3"></div>
        </div>
        <div v-else-if="type === 'pulse'" class="pulse"></div>
        <div v-else class="default-spinner">
          <svg class="circular" viewBox="25 25 50 50">
            <circle class="path" cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="2" stroke-miterlimit="10"/>
          </svg>
        </div>
      </div>
      <div v-if="text" class="loading-text">{{ text }}</div>
    </div>
    <div v-if="overlay" class="loading-overlay"></div>
  </div>
</template>

<script>
export default {
  name: 'Loading',
  props: {
    // 是否显示
    visible: {
      type: Boolean,
      default: false
    },
    // 加载文本
    text: {
      type: String,
      default: ''
    },
    // 加载类型
    type: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'spinner', 'dots', 'pulse'].includes(value)
    },
    // 大小
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    // 是否全屏
    fullscreen: {
      type: Boolean,
      default: false
    },
    // 是否显示遮罩
    overlay: {
      type: Boolean,
      default: true
    },
    // 背景色
    background: {
      type: String,
      default: 'rgba(255, 255, 255, 0.9)'
    }
  },
  computed: {
    containerClasses() {
      return {
        'loading-fullscreen': this.fullscreen,
        'loading-inline': !this.fullscreen
      }
    },
    spinnerClasses() {
      return {
        [`loading-${this.size}`]: true,
        [`loading-${this.type}`]: true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.loading-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.loading-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }
  
  &.loading-inline {
    width: 100%;
    height: 100%;
    min-height: 100px;
  }
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.loading-small {
    width: 24px;
    height: 24px;
  }
  
  &.loading-medium {
    width: 32px;
    height: 32px;
  }
  
  &.loading-large {
    width: 48px;
    height: 48px;
  }
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: v-bind(background);
  z-index: 0;
}

// 默认加载动画
.default-spinner {
  .circular {
    width: 100%;
    height: 100%;
    animation: rotate 2s linear infinite;
  }
  
  .path {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

// 弹跳加载动画
.spinner {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  > div {
    width: 18%;
    height: 100%;
    background-color: #409EFF;
    border-radius: 50%;
    animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  }
  
  .bounce1 {
    animation-delay: -0.32s;
  }
  
  .bounce2 {
    animation-delay: -0.16s;
  }
}

@keyframes sk-bouncedelay {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1.0);
  }
}

// 点状加载动画
.dots {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  > div {
    width: 6px;
    height: 6px;
    background-color: #409EFF;
    border-radius: 100%;
    animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  }
  
  .dot1 {
    animation-delay: -0.32s;
  }
  
  .dot2 {
    animation-delay: -0.16s;
  }
}

// 脉冲加载动画
.pulse {
  width: 100%;
  height: 100%;
  background-color: #409EFF;
  border-radius: 100%;
  animation: sk-scaleout 1.0s infinite ease-in-out;
}

@keyframes sk-scaleout {
  0% {
    transform: scale(0);
  } 100% {
    transform: scale(1.0);
    opacity: 0;
  }
}
</style>