<template>
  <div class="sidebar-wrapper">
    <div class="sidebar-logo">
      <router-link to="/" class="sidebar-logo-link">
        <img src="@/assets/images/logo.png" class="sidebar-logo-img" alt="WeDraw" />
        <h1 v-show="!isCollapse" class="sidebar-title">WeDraw管理后台</h1>
      </router-link>
    </div>
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="false"
        :collapse-transition="false"
        mode="vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <sidebar-item
          v-for="route in routes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/store/modules/app'
import SidebarItem from './SidebarItem.vue'
import { asyncRoutes } from '@/router/modules'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const routes = computed(() => {
  // 使用预定义的路由配置
  return asyncRoutes.filter(route => {
    return route.meta && !route.meta.hidden
  })
})

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

const isCollapse = computed(() => !appStore.sidebar.opened)
</script>

<style lang="scss" scoped>
.sidebar-wrapper {
  height: 100%;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="%23ffffff" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>') repeat;
    pointer-events: none;
  }
  
  .sidebar-logo {
    width: 100%;
    height: 60px;
    line-height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    text-align: center;
    overflow: hidden;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .sidebar-logo-link {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-decoration: none;
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.02);
      }
      
      .sidebar-logo-img {
        width: 36px;
        height: 36px;
        margin-right: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      
      .sidebar-title {
        font-size: 16px;
        color: #fff;
        font-weight: 600;
        margin: 0;
        white-space: nowrap;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
    }
  }
  
  .el-menu {
    border: none;
    height: calc(100% - 60px);
    width: 100% !important;
    background: transparent;
  }
}

:deep(.scrollbar-wrapper) {
  overflow-x: hidden !important;
}

:deep(.el-scrollbar__bar.is-vertical > div) {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>