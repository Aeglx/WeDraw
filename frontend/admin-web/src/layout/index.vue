<template>
  <div class="app-wrapper" :class="classObj">
    <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <sidebar class="sidebar-container" />
    <div class="main-container">
      <div :class="{ 'fixed-header': fixedHeader }">
        <navbar />
      </div>
      <app-main />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'
import Sidebar from './components/Sidebar/index.vue'
import Navbar from './components/Navbar.vue'
import AppMain from './components/AppMain.vue'

const appStore = useAppStore()

const sidebar = computed(() => appStore.sidebar)
const device = computed(() => appStore.device)
const fixedHeader = computed(() => appStore.fixedHeader)

const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile'
}))

const handleClickOutside = () => {
  appStore.closeSideBar({ withoutAnimation: false })
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  
  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{$sidebar-width});
  transition: width 0.28s;
}

.hideSidebar .fixed-header {
  width: calc(100% - #{$sidebar-width-collapsed});
}

.mobile .fixed-header {
  width: 100%;
}
</style>