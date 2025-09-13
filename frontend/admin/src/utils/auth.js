import Cookies from 'js-cookie'

const TokenKey = 'WeDraw-Admin-Token'
const RefreshTokenKey = 'WeDraw-Admin-Refresh-Token'

/**
 * 获取token
 * @returns {string}
 */
export function getToken() {
  return Cookies.get(TokenKey)
}

/**
 * 设置token
 * @param {string} token
 * @returns {string}
 */
export function setToken(token) {
  return Cookies.set(TokenKey, token, { expires: 7 }) // 7天过期
}

/**
 * 移除token
 * @returns {void}
 */
export function removeToken() {
  return Cookies.remove(TokenKey)
}

/**
 * 获取刷新token
 * @returns {string}
 */
export function getRefreshToken() {
  return Cookies.get(RefreshTokenKey)
}

/**
 * 设置刷新token
 * @param {string} token
 * @returns {string}
 */
export function setRefreshToken(token) {
  return Cookies.set(RefreshTokenKey, token, { expires: 30 }) // 30天过期
}

/**
 * 移除刷新token
 * @returns {void}
 */
export function removeRefreshToken() {
  return Cookies.remove(RefreshTokenKey)
}

/**
 * 清除所有认证信息
 * @returns {void}
 */
export function clearAuth() {
  removeToken()
  removeRefreshToken()
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!getToken()
}