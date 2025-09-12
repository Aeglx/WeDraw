import { defineStore } from 'pinia'
import { login, getUserInfo, logout } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    userInfo: {},
    permissions: [],
    roles: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo.username || '',
    avatar: (state) => state.userInfo.avatar || '',
    hasPermission: (state) => (permission) => {
      return state.permissions.includes(permission)
    },
    hasRole: (state) => (role) => {
      return state.roles.includes(role)
    }
  },

  actions: {
    // 登录
    async login(loginForm) {
      try {
        const { data } = await login(loginForm)
        this.token = data.token
        setToken(data.token)
        return data
      } catch (error) {
        throw error
      }
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const { data } = await getUserInfo()
        this.userInfo = data.userInfo
        this.permissions = data.permissions || []
        this.roles = data.roles || []
        return data
      } catch (error) {
        throw error
      }
    },

    // 初始化用户信息
    async initUserInfo() {
      if (this.token && !this.userInfo.id) {
        try {
          await this.getUserInfo()
        } catch (error) {
          console.error('初始化用户信息失败:', error)
          this.logout()
        }
      }
    },

    // 登出
    async logout() {
      try {
        await logout()
      } catch (error) {
        console.error('登出请求失败:', error)
      } finally {
        this.token = ''
        this.userInfo = {}
        this.permissions = []
        this.roles = []
        removeToken()
        // 清除其他可能的缓存数据
        localStorage.clear()
        sessionStorage.clear()
      }
    },

    // 更新用户信息
    updateUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
    },

    // 设置权限
    setPermissions(permissions) {
      this.permissions = permissions
    },

    // 设置角色
    setRoles(roles) {
      this.roles = roles
    }
  }
})