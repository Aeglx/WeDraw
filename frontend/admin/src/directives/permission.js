/**
 * 权限指令
 * 用法：v-hasPermi="['system:user:add']"
 */

import { useUserStore } from '@/stores/user'

function checkPermission(el, binding) {
  const { value } = binding
  const userStore = useUserStore()
  const permissions = userStore.permissions

  if (value && value instanceof Array && value.length > 0) {
    const permissionRoles = value
    const hasPermission = permissions.some(permission => {
      // 超级管理员权限
      if (permission === '*:*:*') {
        return true
      }
      return permissionRoles.includes(permission)
    })

    if (!hasPermission) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  } else {
    throw new Error('权限指令需要传入权限数组，如 v-hasPermi="[\'system:user:add\']"')
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