/**
 * 权限指令
 * 用法：v-permission="['admin', 'user']"
 */

import { useUserStore } from '@/store/modules/user'

function checkPermission(el, binding) {
  const { value } = binding
  const userStore = useUserStore()
  const roles = userStore.roles
  const permissions = userStore.permissions

  if (value && value instanceof Array) {
    if (value.length > 0) {
      const hasPermission = value.some(item => {
        // 检查角色权限
        if (roles.includes(item)) {
          return true
        }
        // 检查具体权限
        if (permissions.includes(item)) {
          return true
        }
        return false
      })

      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    }
  } else {
    throw new Error('权限指令需要传入数组参数，如 v-permission="[\'admin\', \'user\']"')
  }
}

export default {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  }
}