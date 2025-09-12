import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '仪表盘',
          icon: 'DataBoard'
        }
      },
      {
        path: 'official',
        name: 'Official',
        redirect: '/official/fans',
        meta: {
          title: '公众号管理',
          icon: 'ChatDotRound'
        },
        children: [
          {
            path: 'fans',
            name: 'OfficialFans',
            component: () => import('@/views/official/fans/index.vue'),
            meta: {
              title: '粉丝管理',
              icon: 'User'
            }
          },
          {
            path: 'message',
            name: 'OfficialMessage',
            component: () => import('@/views/official/message/index.vue'),
            meta: {
              title: '消息管理',
              icon: 'Message'
            }
          },
          {
            path: 'menu',
            name: 'OfficialMenu',
            component: () => import('@/views/official/menu/index.vue'),
            meta: {
              title: '菜单管理',
              icon: 'Menu'
            }
          }
        ]
      },
      {
        path: 'wecom',
        name: 'Wecom',
        redirect: '/wecom/contacts',
        meta: {
          title: '企业微信管理',
          icon: 'OfficeBuilding'
        },
        children: [
          {
            path: 'contacts',
            name: 'WecomContacts',
            component: () => import('@/views/wecom/contacts/index.vue'),
            meta: {
              title: '通讯录管理',
              icon: 'Notebook'
            }
          },
          {
            path: 'groups',
            name: 'WecomGroups',
            component: () => import('@/views/wecom/groups/index.vue'),
            meta: {
              title: '群聊管理',
              icon: 'ChatLineRound'
            }
          },
          {
            path: 'robot',
            name: 'WecomRobot',
            component: () => import('@/views/wecom/robot/index.vue'),
            meta: {
              title: '机器人管理',
              icon: 'Service'
            }
          }
        ]
      },
      {
        path: 'miniprogram',
        name: 'Miniprogram',
        redirect: '/miniprogram/users',
        meta: {
          title: '小程序管理',
          icon: 'Iphone'
        },
        children: [
          {
            path: 'users',
            name: 'MiniprogramUsers',
            component: () => import('@/views/miniprogram/users/index.vue'),
            meta: {
              title: '用户管理',
              icon: 'UserFilled'
            }
          },
          {
            path: 'config',
            name: 'MiniprogramConfig',
            component: () => import('@/views/miniprogram/config/index.vue'),
            meta: {
              title: '配置管理',
              icon: 'Setting'
            }
          }
        ]
      },
      {
        path: 'points',
        name: 'Points',
        redirect: '/points/goods',
        meta: {
          title: '积分商城',
          icon: 'ShoppingBag'
        },
        children: [
          {
            path: 'goods',
            name: 'PointsGoods',
            component: () => import('@/views/points/goods/index.vue'),
            meta: {
              title: '商品管理',
              icon: 'Goods'
            }
          },
          {
            path: 'orders',
            name: 'PointsOrders',
            component: () => import('@/views/points/orders/index.vue'),
            meta: {
              title: '订单管理',
              icon: 'List'
            }
          },
          {
            path: 'points-rule',
            name: 'PointsRule',
            component: () => import('@/views/points/rule/index.vue'),
            meta: {
              title: '积分规则',
              icon: 'Medal'
            }
          }
        ]
      },
      {
        path: 'system',
        name: 'System',
        redirect: '/system/users',
        meta: {
          title: '系统管理',
          icon: 'Tools'
        },
        children: [
          {
            path: 'users',
            name: 'SystemUsers',
            component: () => import('@/views/system/users/index.vue'),
            meta: {
              title: '用户管理',
              icon: 'Avatar'
            }
          },
          {
            path: 'roles',
            name: 'SystemRoles',
            component: () => import('@/views/system/roles/index.vue'),
            meta: {
              title: '角色管理',
              icon: 'Stamp'
            }
          },
          {
            path: 'config',
            name: 'SystemConfig',
            component: () => import('@/views/system/config/index.vue'),
            meta: {
              title: '系统配置',
              icon: 'Operation'
            }
          }
        ]
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  const userStore = useUserStore()
  const token = userStore.token
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 企业微信生态管理后台` : '企业微信生态管理后台'
  
  if (to.path === '/login') {
    if (token) {
      next('/')
    } else {
      next()
    }
  } else {
    if (token) {
      if (!userStore.userInfo.id) {
        try {
          await userStore.getUserInfo()
          next()
        } catch (error) {
          userStore.logout()
          next('/login')
        }
      } else {
        next()
      }
    } else {
      next('/login')
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router