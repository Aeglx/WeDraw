import { useErrorLogStore } from '@/stores/errorLog'

/**
 * 检查是否需要记录错误
 * @param {Error} err
 * @returns {boolean}
 */
function checkNeed(err) {
  const env = import.meta.env.VITE_NODE_ENV
  if (env !== 'production') {
    return true
  }
  return false
}

/**
 * 记录错误日志
 * @param {Error} err
 * @param {Object} vm
 * @param {string} info
 */
export function logError(err, vm, info) {
  if (checkNeed(err)) {
    const errorLogStore = useErrorLogStore()
    const errorLog = {
      err: {
        message: err.message,
        stack: err.stack
      },
      info,
      url: window.location.href,
      time: new Date().getTime()
    }
    errorLogStore.addErrorLog(errorLog)
  }
  
  console.error(err, info)
}

/**
 * 清除错误日志
 */
export function clearErrorLog() {
  const errorLogStore = useErrorLogStore()
  errorLogStore.clearErrorLog()
}

/**
 * 获取错误日志
 * @returns {Array}
 */
export function getErrorLog() {
  const errorLogStore = useErrorLogStore()
  return errorLogStore.errorLogs
}