import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import NProgress from 'nprogress'

// 路由组件
const Layout = () => import('@/layout/index.vue')
const Login = () => import('@/views/login/index.vue')
const Dashboard = () => import('@/views/dashboard/index.vue')
const NotFound = () => import('@/views/error/404.vue')

// 基础路由
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      hidden: true
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '页面不存在',
      hidden: true
    }
  }
]

// 动态路由
export const asyncRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: '仪表盘',
          icon: 'Dashboard',
          affix: true
        }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    redirect: '/user/list',
    meta: {
      title: '用户管理',
      icon: 'User',
      roles: ['admin', 'user-manager']
    },
    children: [
      {
        path: 'list',
        name: 'UserList',
        component: () => import('@/views/user/list.vue'),
        meta: {
          title: '用户列表',
          icon: 'UserFilled'
        }
      },
      {
        path: 'roles',
        name: 'RoleList',
        component: () => import('@/views/user/roles.vue'),
        meta: {
          title: '角色管理',
          icon: 'Avatar'
        }
      }
    ]
  },
  {
    path: '/wechat',
    component: Layout,
    redirect: '/wechat/fans',
    meta: {
      title: '公众号管理',
      icon: 'ChatDotRound',
      roles: ['admin', 'wechat-manager']
    },
    children: [
      {
        path: 'fans',
        name: 'WechatFans',
        component: () => import('@/views/wechat/fans.vue'),
        meta: {
          title: '粉丝管理',
          icon: 'UserFilled'
        }
      },
      {
        path: 'menu',
        name: 'WechatMenu',
        component: () => import('@/views/wechat/menu.vue'),
        meta: {
          title: '菜单配置',
          icon: 'Menu'
        }
      },
      {
        path: 'message',
        name: 'WechatMessage',
        component: () => import('@/views/wechat/message.vue'),
        meta: {
          title: '消息管理',
          icon: 'ChatLineRound'
        }
      }
    ]
  },
  {
    path: '/wecom',
    component: Layout,
    redirect: '/wecom/contacts',
    meta: {
      title: '企业微信',
      icon: 'OfficeBuilding',
      roles: ['admin', 'wecom-manager']
    },
    children: [
      {
        path: 'contacts',
        name: 'WecomContacts',
        component: () => import('@/views/wecom/contacts.vue'),
        meta: {
          title: '通讯录',
          icon: 'Notebook'
        }
      },
      {
        path: 'groups',
        name: 'WecomGroups',
        component: () => import('@/views/wecom/groups.vue'),
        meta: {
          title: '群聊管理',
          icon: 'ChatDotSquare'
        }
      },
      {
        path: 'robot',
        name: 'WecomRobot',
        component: () => import('@/views/wecom/robot.vue'),
        meta: {
          title: '机器人',
          icon: 'Service'
        }
      }
    ]
  },
  {
    path: '/miniprogram',
    component: Layout,
    redirect: '/miniprogram/users',
    meta: {
      title: '小程序',
      icon: 'Iphone',
      roles: ['admin', 'miniprogram-manager']
    },
    children: [
      {
        path: 'users',
        name: 'MiniprogramUsers',
        component: () => import('@/views/miniprogram/users.vue'),
        meta: {
          title: '用户管理',
          icon: 'UserFilled'
        }
      },
      {
        path: 'templates',
        name: 'MiniprogramTemplates',
        component: () => import('@/views/miniprogram/templates.vue'),
        meta: {
          title: '模板消息',
          icon: 'Document'
        }
      }
    ]
  },
  {
    path: '/points',
    component: Layout,
    redirect: '/points/products',
    meta: {
      title: '积分商城',
      icon: 'ShoppingCart',
      roles: ['admin', 'points-manager']
    },
    children: [
      {
        path: 'products',
        name: 'PointsProducts',
        component: () => import('@/views/points/products.vue'),
        meta: {
          title: '商品管理',
          icon: 'Goods'
        }
      },
      {
        path: 'orders',
        name: 'PointsOrders',
        component: () => import('@/views/points/orders.vue'),
        meta: {
          title: '订单管理',
          icon: 'List'
        }
      },
      {
        path: 'coupons',
        name: 'PointsCoupons',
        component: () => import('@/views/points/coupons.vue'),
        meta: {
          title: '优惠券',
          icon: 'Ticket'
        }
      }
    ]
  },
  {
    path: '/message',
    component: Layout,
    redirect: '/message/templates',
    meta: {
      title: '消息中心',
      icon: 'Bell',
      roles: ['admin', 'message-manager']
    },
    children: [
      {
        path: 'templates',
        name: 'MessageTemplates',
        component: () => import('@/views/message/templates.vue'),
        meta: {
          title: '消息模板',
          icon: 'Document'
        }
      },
      {
        path: 'history',
        name: 'MessageHistory',
        component: () => import('@/views/message/history.vue'),
        meta: {
          title: '发送记录',
          icon: 'Clock'
        }
      }
    ]
  },
  {
    path: '/analytics',
    component: Layout,
    redirect: '/analytics/overview',
    meta: {
      title: '数据分析',
      icon: 'TrendCharts',
      roles: ['admin', 'analyst']
    },
    children: [
      {
        path: 'overview',
        name: 'AnalyticsOverview',
        component: () => import('@/views/analytics/overview.vue'),
        meta: {
          title: '数据概览',
          icon: 'DataAnalysis'
        }
      },
      {
        path: 'reports',
        name: 'AnalyticsReports',
        component: () => import('@/views/analytics/reports.vue'),
        meta: {
          title: '报表管理',
          icon: 'Document'
        }
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/settings',
    meta: {
      title: '系统管理',
      icon: 'Setting',
      roles: ['admin']
    },
    children: [
      {
        path: 'settings',
        name: 'SystemSettings',
        component: () => import('@/views/system/settings.vue'),
        meta: {
          title: '系统设置',
          icon: 'Tools'
        }
      },
      {
        path: 'logs',
        name: 'SystemLogs',
        component: () => import('@/views/system/logs.vue'),
        meta: {
          title: '系统日志',
          icon: 'Document'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: {
      hidden: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ top: 0 })
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  const userStore = useUserStore()
  const token = userStore.token
  
  if (to.path === '/login') {
    if (token) {
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    if (token) {
      if (userStore.roles.length === 0) {
        try {
          await userStore.getUserInfo()
          const accessRoutes = await userStore.generateRoutes(asyncRoutes)
          accessRoutes.forEach(route => {
            router.addRoute(route)
          })
          next({ ...to, replace: true })
        } catch (error) {
          await userStore.logout()
          next(`/login?redirect=${to.path}`)
        }
      } else {
        next()
      }
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router