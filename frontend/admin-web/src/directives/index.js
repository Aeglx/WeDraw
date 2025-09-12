/**
 * 全局指令注册
 */

import permission from './permission'

// 自定义指令集合
const directives = {
  permission
}

/**
 * 注册全局指令
 * @param {Object} app Vue应用实例
 */
export function setupDirectives(app) {
  Object.keys(directives).forEach(key => {
    app.directive(key, directives[key])
  })
}

export default directives