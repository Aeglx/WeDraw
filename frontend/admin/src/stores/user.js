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
    permissions: [],
    routes: []
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
        // 模拟登录逻辑，用于演示
        if (username.trim() === 'admin' && password.length >= 1) {
          const mockToken = 'mock-token-' + Date.now()
          const mockResponse = {
            data: {
              token: mockToken
            }
          }
          this.token = mockToken
          setToken(mockToken)
          
          // 设置模拟用户信息
          this.name = 'Administrator'
          this.avatar = ''
          this.email = 'admin@wedraw.com'
          this.roles = ['admin', 'wechat-manager', 'user-manager']
          this.permissions = ['*']
          
          return mockResponse
        } else {
          throw new Error('用户名或密码错误')
        }
        
        // 真实API调用（当后端服务可用时）
        // const response = await login({ username: username.trim(), password })
        // const { token } = response.data
        // this.token = token
        // setToken(token)
        // return response
      } catch (error) {
        throw error
      }
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        // 模拟用户信息（开发环境）
        if (this.token && this.token.startsWith('mock-token-')) {
          const mockUserInfo = {
            name: this.name || 'Admin',
            avatar: this.avatar || 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
            email: this.email || 'admin@wedraw.com',
            roles: this.roles.length > 0 ? this.roles : ['admin'],
            permissions: this.permissions.length > 0 ? this.permissions : ['*:*:*']
          }
          
          this.name = mockUserInfo.name
          this.avatar = mockUserInfo.avatar
          this.email = mockUserInfo.email
          this.roles = mockUserInfo.roles
          this.permissions = mockUserInfo.permissions
          
          return mockUserInfo
        }
        
        // 真实API调用（当后端服务可用时）
        // const response = await getUserInfo()
        // const { data } = response
        // 
        // if (!data) {
        //   throw new Error('验证失败，请重新登录')
        // }
        //
        // const { name, avatar, email, roles, permissions } = data
        // 
        // // 角色必须是非空数组
        // if (!roles || roles.length <= 0) {
        //   throw new Error('用户角色不能为空')
        // }
        //
        // this.name = name
        // this.avatar = avatar
        // this.email = email
        // this.roles = roles
        // this.permissions = permissions || []
        // 
        // return data
        
        throw new Error('后端服务未启动，请使用模拟登录')
      } catch (error) {
        throw error
      }
    },

    // 用户登出
    async logout() {
      try {
        // 模拟登出（开发环境）
        if (this.token && this.token.startsWith('mock-token-')) {
          // 模拟登出成功，直接清理本地状态
          console.log('模拟登出成功')
        } else {
          // 真实API调用（当后端服务可用时）
          // await logout()
          console.log('后端服务未启动，执行本地登出')
        }
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
      this.routes = []
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
        
        // 添加调试信息
        console.log('User roles:', this.roles)
        console.log('Generated routes:', accessedRoutes.length)
        console.log('Routes details:', accessedRoutes.map(r => ({ path: r.path, name: r.name })))
        
        this.routes = accessedRoutes
        resolve(accessedRoutes)
      })
    },

    // 设置路由
    setRoutes(routes) {
      this.routes = routes
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