import permission from './permission'

const install = function(app) {
  app.directive('permission', permission)
}

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export default install
export { permission }