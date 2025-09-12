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
            path: 'config',
            name: 'OfficialConfig',
            component: () => import('@/views/official/config/index.vue'),
            meta: {
              title: '基础配置',
              icon: 'Setting'
            }
          },
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
            path: 'menu',
            name: 'OfficialMenu',
            component: () => import('@/views/official/menu/index.vue'),
            meta: {
              title: '自定义菜单',
              icon: 'Menu'
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
            path: 'reply',
            name: 'OfficialReply',
            component: () => import('@/views/official/reply/index.vue'),
            meta: {
              title: '自动回复',
              icon: 'ChatLineRound'
            }
          },
          {
            path: 'material',
            name: 'OfficialMaterial',
            component: () => import('@/views/official/material/index.vue'),
            meta: {
              title: '素材管理',
              icon: 'Folder'
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
            path: 'apps',
            name: 'WecomApps',
            component: () => import('@/views/wecom/apps/index.vue'),
            meta: {
              title: '应用管理',
              icon: 'Grid'
            }
          },
          {
            path: 'departments',
            name: 'WecomDepartments',
            component: () => import('@/views/wecom/departments/index.vue'),
            meta: {
              title: '部门管理',
              icon: 'OfficeBuilding'
            }
          },
          {
            path: 'users',
            name: 'WecomUsers',
            component: () => import('@/views/wecom/users/index.vue'),
            meta: {
              title: '成员管理',
              icon: 'User'
            }
          },
          {
            path: 'contacts',
            name: 'WecomContacts',
            component: () => import('@/views/wecom/contacts/index.vue'),
            meta: {
              title: '外部联系人',
              icon: 'Phone'
            }
          },
          {
            path: 'message',
            name: 'WecomMessage',
            component: () => import('@/views/wecom/message/index.vue'),
            meta: {
              title: '消息推送',
              icon: 'Message'
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
            path: 'config',
            name: 'MiniprogramConfig',
            component: () => import('@/views/miniprogram/config/index.vue'),
            meta: {
              title: '基础配置',
              icon: 'Setting'
            }
          },
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
            path: 'behaviors',
            name: 'MiniprogramBehaviors',
            component: () => import('@/views/miniprogram/behaviors/index.vue'),
            meta: {
              title: '行为分析',
              icon: 'DataAnalysis'
            }
          },
          {
            path: 'pages',
            name: 'MiniprogramPages',
            component: () => import('@/views/miniprogram/pages/index.vue'),
            meta: {
              title: '页面管理',
              icon: 'Document'
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
            path: 'products',
            name: 'PointsProducts',
            component: () => import('@/views/points/products/index.vue'),
            meta: {
              title: '商品管理',
              icon: 'Goods'
            }
          },
          {
            path: 'categories',
            name: 'PointsCategories',
            component: () => import('@/views/points/categories/index.vue'),
            meta: {
              title: '分类管理',
              icon: 'Menu'
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
            path: 'transactions',
            name: 'PointsTransactions',
            component: () => import('@/views/points/transactions/index.vue'),
            meta: {
              title: '积分记录',
              icon: 'Coin'
            }
          },
          {
            path: 'levels',
            name: 'PointsLevels',
            component: () => import('@/views/points/levels/index.vue'),
            meta: {
              title: '等级管理',
              icon: 'Trophy'
            }
          },
          {
            path: 'rules',
            name: 'PointsRules',
            component: () => import('@/views/points/rules/index.vue'),
            meta: {
              title: '积分规则',
              icon: 'Medal'
            }
          },
          {
            path: 'coupons',
            name: 'PointsCoupons',
            component: () => import('@/views/points/coupons/index.vue'),
            meta: {
              title: '优惠券管理',
              icon: 'Ticket'
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
      },
      {
        path: 'message',
        name: 'Message',
        redirect: '/message/templates',
        meta: {
          title: '消息中心',
          icon: 'MessageBox'
        },
        children: [
          {
            path: 'templates',
            name: 'MessageTemplates',
            component: () => import('@/views/message/templates/index.vue'),
            meta: {
              title: '消息模板',
              icon: 'DocumentCopy'
            }
          },
          {
            path: 'queue',
            name: 'MessageQueue',
            component: () => import('@/views/message/queue/index.vue'),
            meta: {
              title: '消息队列',
              icon: 'Sort'
            }
          },
          {
            path: 'notifications',
            name: 'MessageNotifications',
            component: () => import('@/views/message/notifications/index.vue'),
            meta: {
              title: '系统通知',
              icon: 'Bell'
            }
          },
          {
            path: 'email',
            name: 'MessageEmail',
            component: () => import('@/views/message/email/index.vue'),
            meta: {
              title: '邮件配置',
              icon: 'Message'
            }
          },
          {
            path: 'sms',
            name: 'MessageSms',
            component: () => import('@/views/message/sms/index.vue'),
            meta: {
              title: '短信配置',
              icon: 'Iphone'
            }
          }
        ]
      },
      {
        path: 'analysis',
        name: 'Analysis',
        redirect: '/analysis/overview',
        meta: {
          title: '数据分析',
          icon: 'DataLine'
        },
        children: [
          {
            path: 'overview',
            name: 'AnalysisOverview',
            component: () => import('@/views/analysis/overview/index.vue'),
            meta: {
              title: '数据概览',
              icon: 'PieChart'
            }
          },
          {
            path: 'users',
            name: 'AnalysisUsers',
            component: () => import('@/views/analysis/users/index.vue'),
            meta: {
              title: '用户统计',
              icon: 'User'
            }
          },
          {
            path: 'messages',
            name: 'AnalysisMessages',
            component: () => import('@/views/analysis/messages/index.vue'),
            meta: {
              title: '消息统计',
              icon: 'Message'
            }
          },
          {
            path: 'points',
            name: 'AnalysisPoints',
            component: () => import('@/views/analysis/points/index.vue'),
            meta: {
              title: '积分统计',
              icon: 'Coin'
            }
          },
          {
            path: 'pages',
            name: 'AnalysisPages',
            component: () => import('@/views/analysis/pages/index.vue'),
            meta: {
              title: '页面访问',
              icon: 'View'
            }
          },
          {
            path: 'realtime',
            name: 'AnalysisRealtime',
            component: () => import('@/views/analysis/realtime/index.vue'),
            meta: {
              title: '实时数据',
              icon: 'Refresh'
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