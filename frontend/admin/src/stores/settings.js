import { defineStore } from 'pinia'
import defaultSettings from '@/settings'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    title: defaultSettings.title,
    theme: defaultSettings.theme,
    sideTheme: defaultSettings.sideTheme,
    showSettings: defaultSettings.showSettings,
    topNav: defaultSettings.topNav,
    tagsView: defaultSettings.tagsView,
    fixedHeader: defaultSettings.fixedHeader,
    sidebarLogo: defaultSettings.sidebarLogo,
    dynamicTitle: defaultSettings.dynamicTitle
  }),

  actions: {
    // 修改布局设置
    changeSetting({ key, value }) {
      if (this.hasOwnProperty(key)) {
        this[key] = value
      }
    }
  }
})