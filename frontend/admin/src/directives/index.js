import permission from './permission'

// 全局指令
const directives = {
  hasPermi: permission,
  permission: permission
}

export default {
  install(app) {
    Object.keys(directives).forEach(key => {
      app.directive(key, directives[key])
    })
  }
}