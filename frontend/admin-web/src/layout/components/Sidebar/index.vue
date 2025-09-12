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
  background-color: #304156;
  
  .sidebar-logo {
    width: 100%;
    height: 50px;
    line-height: 50px;
    background: #2b2f3a;
    text-align: center;
    overflow: hidden;
    
    .sidebar-logo-link {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-decoration: none;
      
      .sidebar-logo-img {
        width: 32px;
        height: 32px;
        margin-right: 8px;
      }
      
      .sidebar-title {
        font-size: 14px;
        color: #fff;
        font-weight: 600;
        margin: 0;
        white-space: nowrap;
      }
    }
  }
  
  .el-menu {
    border: none;
    height: calc(100% - 50px);
    width: 100% !important;
  }
}

:deep(.scrollbar-wrapper) {
  overflow-x: hidden !important;
}

:deep(.el-scrollbar__bar.is-vertical > div) {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>