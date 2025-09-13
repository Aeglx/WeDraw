<template>
  <div class="sidebar-logo-container" :class="{ collapse: collapse }">
    <transition name="sidebarLogoFade">
      <router-link
        v-if="collapse"
        key="collapse"
        class="sidebar-logo-link"
        to="/"
      >
        <img v-if="logo" :src="logo" class="sidebar-logo" />
        <h1 v-else class="sidebar-title">{{ title }}</h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo" />
        <h1 class="sidebar-title">{{ title }}</h1>
      </router-link>
    </transition>
  </div>
</template>

<script setup>
defineProps({
  collapse: {
    type: Boolean,
    required: true
  }
})

const title = 'WeDraw 管理后台'
const logo = null // 暂时不使用logo图片，显示文字标题
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 60px;
  line-height: 60px;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  text-align: center;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  & .sidebar-logo-link {
    display: inline-block;
    width: 100%;
    height: 60px;
    line-height: 60px;
    text-decoration: none;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.02);
    }
  }

  & .sidebar-logo {
    width: 36px;
    height: 36px;
    vertical-align: middle;
    margin-right: 12px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  & .sidebar-title {
    display: inline-block;
    margin: 0;
    color: #ffffff;
    font-weight: 700;
    line-height: 60px;
    font-size: 16px;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    vertical-align: middle;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
}
</style>