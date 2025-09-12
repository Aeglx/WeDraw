// 路由模块配置
import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

// 基础路由
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    hidden: true,
    meta: {
      title: '登录',
      noAuth: true
    }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    hidden: true,
    meta: {
      title: '页面不存在'
    }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: {
          title: '工作台',
          icon: 'el-icon-monitor',
          affix: true
        }
      }
    ]
  }
]

// 动态路由 - 公众号管理
const officialRoutes = {
  path: '/official',
  component: Layout,
  redirect: '/official/config',
  name: 'Official',
  meta: {
    title: '公众号管理',
    icon: 'el-icon-chat-dot-round'
  },
  children: [
    {
      path: 'config',
      name: 'OfficialConfig',
      component: () => import('@/views/official/config/index.vue'),
      meta: {
        title: '基础配置',
        icon: 'el-icon-setting'
      }
    },
    {
      path: 'fans',
      name: 'OfficialFans',
      component: () => import('@/views/official/fans/index.vue'),
      meta: {
        title: '粉丝管理',
        icon: 'el-icon-user'
      }
    },
    {
      path: 'menu',
      name: 'OfficialMenu',
      component: () => import('@/views/official/menu/index.vue'),
      meta: {
        title: '自定义菜单',
        icon: 'el-icon-menu'
      }
    },
    {
      path: 'message',
      name: 'OfficialMessage',
      component: () => import('@/views/official/message/index.vue'),
      meta: {
        title: '消息管理',
        icon: 'el-icon-message'
      }
    },
    {
      path: 'reply',
      name: 'OfficialReply',
      component: () => import('@/views/official/reply/index.vue'),
      meta: {
        title: '自动回复',
        icon: 'el-icon-chat-line-round'
      }
    },
    {
      path: 'material',
      name: 'OfficialMaterial',
      component: () => import('@/views/official/material/index.vue'),
      meta: {
        title: '素材管理',
        icon: 'el-icon-folder'
      }
    }
  ]
}

// 动态路由 - 企业微信管理
const wecomRoutes = {
  path: '/wecom',
  component: Layout,
  redirect: '/wecom/apps',
  name: 'Wecom',
  meta: {
    title: '企业微信',
    icon: 'el-icon-office-building'
  },
  children: [
    {
      path: 'apps',
      name: 'WecomApps',
      component: () => import('@/views/wecom/apps/index.vue'),
      meta: {
        title: '应用管理',
        icon: 'el-icon-grid'
      }
    },
    {
      path: 'departments',
      name: 'WecomDepartments',
      component: () => import('@/views/wecom/departments/index.vue'),
      meta: {
        title: '部门管理',
        icon: 'el-icon-s-home'
      }
    },
    {
      path: 'users',
      name: 'WecomUsers',
      component: () => import('@/views/wecom/users/index.vue'),
      meta: {
        title: '成员管理',
        icon: 'el-icon-user'
      }
    },
    {
      path: 'message',
      name: 'WecomMessage',
      component: () => import('@/views/wecom/message/index.vue'),
      meta: {
        title: '消息推送',
        icon: 'el-icon-message'
      }
    },
    {
      path: 'contacts',
      name: 'WecomContacts',
      component: () => import('@/views/wecom/contacts/index.vue'),
      meta: {
        title: '外部联系人',
        icon: 'el-icon-phone'
      }
    }
  ]
}

// 动态路由 - 小程序管理
const miniprogramRoutes = {
  path: '/miniprogram',
  component: Layout,
  redirect: '/miniprogram/config',
  name: 'Miniprogram',
  meta: {
    title: '小程序管理',
    icon: 'el-icon-mobile-phone'
  },
  children: [
    {
      path: 'config',
      name: 'MiniprogramConfig',
      component: () => import('@/views/miniprogram/config/index.vue'),
      meta: {
        title: '基础配置',
        icon: 'el-icon-setting'
      }
    },
    {
      path: 'users',
      name: 'MiniprogramUsers',
      component: () => import('@/views/miniprogram/users/index.vue'),
      meta: {
        title: '用户管理',
        icon: 'el-icon-user'
      }
    },
    {
      path: 'behaviors',
      name: 'MiniprogramBehaviors',
      component: () => import('@/views/miniprogram/behaviors/index.vue'),
      meta: {
        title: '行为分析',
        icon: 'el-icon-data-analysis'
      }
    },
    {
      path: 'pages',
      name: 'MiniprogramPages',
      component: () => import('@/views/miniprogram/pages/index.vue'),
      meta: {
        title: '页面管理',
        icon: 'el-icon-document'
      }
    }
  ]
}

// 动态路由 - 积分商城管理
const pointsRoutes = {
  path: '/points',
  component: Layout,
  redirect: '/points/products',
  name: 'Points',
  meta: {
    title: '积分商城',
    icon: 'el-icon-shopping-cart-2'
  },
  children: [
    {
      path: 'products',
      name: 'PointsProducts',
      component: () => import('@/views/points/products/index.vue'),
      meta: {
        title: '商品管理',
        icon: 'el-icon-goods'
      }
    },
    {
      path: 'categories',
      name: 'PointsCategories',
      component: () => import('@/views/points/categories/index.vue'),
      meta: {
        title: '分类管理',
        icon: 'el-icon-menu'
      }
    },
    {
      path: 'orders',
      name: 'PointsOrders',
      component: () => import('@/views/points/orders/index.vue'),
      meta: {
        title: '订单管理',
        icon: 'el-icon-s-order'
      }
    },
    {
      path: 'transactions',
      name: 'PointsTransactions',
      component: () => import('@/views/points/transactions/index.vue'),
      meta: {
        title: '积分记录',
        icon: 'el-icon-coin'
      }
    },
    {
      path: 'levels',
      name: 'PointsLevels',
      component: () => import('@/views/points/levels/index.vue'),
      meta: {
        title: '等级管理',
        icon: 'el-icon-trophy'
      }
    },
    {
      path: 'rules',
      name: 'PointsRules',
      component: () => import('@/views/points/rules/index.vue'),
      meta: {
        title: '积分规则',
        icon: 'el-icon-document'
      }
    },
    {
      path: 'coupons',
      name: 'PointsCoupons',
      component: () => import('@/views/points/coupons/index.vue'),
      meta: {
        title: '优惠券管理',
        icon: 'el-icon-ticket'
      }
    }
  ]
}

// 动态路由 - 消息中心
const messageRoutes = {
  path: '/message',
  component: Layout,
  redirect: '/message/templates',
  name: 'Message',
  meta: {
    title: '消息中心',
    icon: 'el-icon-message-solid'
  },
  children: [
    {
      path: 'templates',
      name: 'MessageTemplates',
      component: () => import('@/views/message/templates/index.vue'),
      meta: {
        title: '消息模板',
        icon: 'el-icon-document-copy'
      }
    },
    {
      path: 'queue',
      name: 'MessageQueue',
      component: () => import('@/views/message/queue/index.vue'),
      meta: {
        title: '消息队列',
        icon: 'el-icon-sort'
      }
    },
    {
      path: 'notifications',
      name: 'MessageNotifications',
      component: () => import('@/views/message/notifications/index.vue'),
      meta: {
        title: '系统通知',
        icon: 'el-icon-bell'
      }
    },
    {
      path: 'email',
      name: 'MessageEmail',
      component: () => import('@/views/message/email/index.vue'),
      meta: {
        title: '邮件配置',
        icon: 'el-icon-message'
      }
    },
    {
      path: 'sms',
      name: 'MessageSms',
      component: () => import('@/views/message/sms/index.vue'),
      meta: {
        title: '短信配置',
        icon: 'el-icon-mobile'
      }
    }
  ]
}

// 动态路由 - 数据分析
const analysisRoutes = {
  path: '/analysis',
  component: Layout,
  redirect: '/analysis/overview',
  name: 'Analysis',
  meta: {
    title: '数据分析',
    icon: 'el-icon-data-line'
  },
  children: [
    {
      path: 'overview',
      name: 'AnalysisOverview',
      component: () => import('@/views/analysis/overview/index.vue'),
      meta: {
        title: '数据概览',
        icon: 'el-icon-pie-chart'
      }
    },
    {
      path: 'users',
      name: 'AnalysisUsers',
      component: () => import('@/views/analysis/users/index.vue'),
      meta: {
        title: '用户统计',
        icon: 'el-icon-user'
      }
    },
    {
      path: 'messages',
      name: 'AnalysisMessages',
      component: () => import('@/views/analysis/messages/index.vue'),
      meta: {
        title: '消息统计',
        icon: 'el-icon-message'
      }
    },
    {
      path: 'points',
      name: 'AnalysisPoints',
      component: () => import('@/views/analysis/points/index.vue'),
      meta: {
        title: '积分统计',
        icon: 'el-icon-coin'
      }
    },
    {
      path: 'pages',
      name: 'AnalysisPages',
      component: () => import('@/views/analysis/pages/index.vue'),
      meta: {
        title: '页面访问',
        icon: 'el-icon-view'
      }
    },
    {
      path: 'realtime',
      name: 'AnalysisRealtime',
      component: () => import('@/views/analysis/realtime/index.vue'),
      meta: {
        title: '实时数据',
        icon: 'el-icon-refresh'
      }
    }
  ]
}

// 动态路由 - 系统管理
const systemRoutes = {
  path: '/system',
  component: Layout,
  redirect: '/system/users',
  name: 'System',
  meta: {
    title: '系统管理',
    icon: 'el-icon-setting'
  },
  children: [
    {
      path: 'users',
      name: 'SystemUsers',
      component: () => import('@/views/system/users/index.vue'),
      meta: {
        title: '用户管理',
        icon: 'el-icon-user'
      }
    },
    {
      path: 'roles',
      name: 'SystemRoles',
      component: () => import('@/views/system/roles/index.vue'),
      meta: {
        title: '角色管理',
        icon: 'el-icon-s-custom'
      }
    },
    {
      path: 'permissions',
      name: 'SystemPermissions',
      component: () => import('@/views/system/permissions/index.vue'),
      meta: {
        title: '权限管理',
        icon: 'el-icon-key'
      }
    },
    {
      path: 'logs',
      name: 'SystemLogs',
      component: () => import('@/views/system/logs/index.vue'),
      meta: {
        title: '操作日志',
        icon: 'el-icon-document'
      }
    },
    {
      path: 'config',
      name: 'SystemConfig',
      component: () => import('@/views/system/config/index.vue'),
      meta: {
        title: '系统配置',
        icon: 'el-icon-tools'
      }
    }
  ]
}

// 所有动态路由
export const asyncRoutes = [
  officialRoutes,
  wecomRoutes,
  miniprogramRoutes,
  pointsRoutes,
  messageRoutes,
  analysisRoutes,
  systemRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    hidden: true
  }
]

export default constantRoutes