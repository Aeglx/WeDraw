import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebar: {
      opened: localStorage.getItem('sidebarStatus') ? !!+localStorage.getItem('sidebarStatus') : true,
      withoutAnimation: false
    },
    device: 'desktop',
    size: localStorage.getItem('size') || 'default',
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('language') || 'zh-cn'
  }),

  getters: {
    sidebarOpened: (state) => state.sidebar.opened,
    sidebarWithoutAnimation: (state) => state.sidebar.withoutAnimation,
    isDarkTheme: (state) => state.theme === 'dark'
  },

  actions: {
    toggleSidebar() {
      this.sidebar.opened = !this.sidebar.opened
      this.sidebar.withoutAnimation = false
      if (this.sidebar.opened) {
        localStorage.setItem('sidebarStatus', '1')
      } else {
        localStorage.setItem('sidebarStatus', '0')
      }
    },

    closeSidebar(withoutAnimation) {
      localStorage.setItem('sidebarStatus', '0')
      this.sidebar.opened = false
      this.sidebar.withoutAnimation = withoutAnimation
    },

    toggleDevice(device) {
      this.device = device
    },

    setSize(size) {
      this.size = size
      localStorage.setItem('size', size)
    },

    setTheme(theme) {
      this.theme = theme
      localStorage.setItem('theme', theme)
      document.documentElement.setAttribute('data-theme', theme)
    },

    setLanguage(language) {
      this.language = language
      localStorage.setItem('language', language)
    }
  }
})