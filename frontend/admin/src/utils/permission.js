import { useUserStore } from '@/stores/user'

/**
 * 检查用户是否有权限
 * @param {Array} value
 * @returns {Boolean}
 */
export function checkPermission(value) {
  if (value && value instanceof Array && value.length > 0) {
    const userStore = useUserStore()
    const roles = userStore.roles
    const permissionRoles = value

    const hasPermission = roles.some(role => {
      return permissionRoles.includes(role)
    })
    return hasPermission
  } else {
    console.error(`need roles! Like checkPermission(['admin','editor'])`)
    return false
  }
}

/**
 * 检查用户是否有指定角色
 * @param {string|Array} roles
 * @returns {Boolean}
 */
export function hasRole(roles) {
  const userStore = useUserStore()
  const userRoles = userStore.roles
  
  if (typeof roles === 'string') {
    return userRoles.includes(roles)
  }
  
  if (Array.isArray(roles)) {
    return roles.some(role => userRoles.includes(role))
  }
  
  return false
}

/**
 * 检查用户是否为管理员
 * @returns {Boolean}
 */
export function isAdmin() {
  return hasRole('admin')
}

/**
 * 检查用户是否为超级管理员
 * @returns {Boolean}
 */
export function isSuperAdmin() {
  return hasRole('super-admin')
}