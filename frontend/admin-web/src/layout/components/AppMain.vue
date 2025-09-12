<template>
  <section class="app-main">
    <transition name="fade-transform" mode="out-in">
      <keep-alive :include="cachedViews">
        <router-view :key="key" />
      </keep-alive>
    </transition>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTagsViewStore } from '@/store/modules/tagsView'

const route = useRoute()
const tagsViewStore = useTagsViewStore()

const cachedViews = computed(() => tagsViewStore.cachedViews)
const key = computed(() => route.path)
</script>

<style lang="scss" scoped>
.app-main {
  min-height: calc(100vh - 60px);
  width: 100%;
  position: relative;
  overflow: hidden;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  background-attachment: fixed;
}

.fixed-header + .app-main {
  padding-top: 84px;
}

.hasTagsView {
  .app-main {
    min-height: calc(100vh - 94px);
  }

  .fixed-header + .app-main {
    padding-top: 118px;
  }
}
</style>

<style lang="scss">
// fade-transform
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.5s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>