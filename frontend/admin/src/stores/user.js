import { defineStore } from 'pinia'
import { login, logout, getUserInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    name: '',
    avatar: '',
    email: '',
    roles: [],
    permissions: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    hasRole: (state) => (role) => state.roles.includes(role),
    hasPermission: (state) => (permission) => state.permissions.includes(permission)
  },

  actions: {
    // 用户登录
    async login(userInfo) {
      const { username, password } = userInfo
      try {
        const response = await login({ username: username.trim(), password })
        const { token } = response.data
        this.token = token
        setToken(token)
        return response
      } catch (error) {
        throw error
      }
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const response = await getUserInfo()
        const { data } = response
        
        if (!data) {
          throw new Error('验证失败，请重新登录')
        }

        const { name, avatar, email, roles, permissions } = data
        
        // 角色必须是非空数组
        if (!roles || roles.length <= 0) {
          throw new Error('用户角色不能为空')
        }

        this.name = name
        this.avatar = avatar
        this.email = email
        this.roles = roles
        this.permissions = permissions || []
        
        return data
      } catch (error) {
        throw error
      }
    },

    // 用户登出
    async logout() {
      try {
        await logout()
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        this.resetToken()
        resetRouter()
      }
    },

    // 重置token
    resetToken() {
      this.token = ''
      this.name = ''
      this.avatar = ''
      this.email = ''
      this.roles = []
      this.permissions = []
      removeToken()
    },

    // 生成路由
    async generateRoutes(asyncRoutes) {
      return new Promise(resolve => {
        let accessedRoutes
        if (this.roles.includes('admin')) {
          accessedRoutes = asyncRoutes || []
        } else {
          accessedRoutes = filterAsyncRoutes(asyncRoutes, this.roles)
        }
        resolve(accessedRoutes)
      })
    }
  }
})

/**
 * 通过递归过滤异步路由表
 * @param routes asyncRoutes
 * @param roles
 */
function filterAsyncRoutes(routes, roles) {
  const res = []

  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })

  return res
}

/**
 * 判断是否有权限
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}