/**
 * 全局组件注册
 */

// 导入组件
import ResponsiveLayout from './ResponsiveLayout/index.vue'
import Loading from './Loading/index.vue'
import Empty from './Empty/index.vue'

// 组件列表
const components = {
  ResponsiveLayout,
  Loading,
  Empty
}

/**
 * 注册全局组件
 * @param {Object} app Vue应用实例
 */
export function setupComponents(app) {
  Object.keys(components).forEach(key => {
    app.component(key, components[key])
  })
}

// 按需导出
export {
  ResponsiveLayout,
  Loading,
  Empty
}

export default components