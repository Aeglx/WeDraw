/**
 * 通用工具函数
 */

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间
 * @param {boolean} immediate 是否立即执行
 * @returns {Function}
 */
export function debounce(func, wait, immediate) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(this, args)
  }
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间间隔
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 深拷贝
 * @param {*} obj 要拷贝的对象
 * @returns {*}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 格式化日期
 * @param {Date|string|number} date 日期
 * @param {string} format 格式化字符串
 * @returns {string}
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 生成随机字符串
 * @param {number} length 长度
 * @returns {string}
 */
export function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 验证邮箱格式
 * @param {string} email 邮箱地址
 * @returns {boolean}
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * 验证手机号格式
 * @param {string} phone 手机号
 * @returns {boolean}
 */
export function validatePhone(phone) {
  const re = /^1[3-9]\d{9}$/
  return re.test(phone)
}

/**
 * 验证身份证号格式
 * @param {string} idCard 身份证号
 * @returns {boolean}
 */
export function validateIdCard(idCard) {
  const re = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return re.test(idCard)
}

/**
 * 获取URL参数
 * @param {string} name 参数名
 * @param {string} url URL地址
 * @returns {string|null}
 */
export function getUrlParam(name, url = window.location.href) {
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

/**
 * 设置URL参数
 * @param {string} name 参数名
 * @param {string} value 参数值
 * @param {string} url URL地址
 * @returns {string}
 */
export function setUrlParam(name, value, url = window.location.href) {
  const regex = new RegExp('([?&])' + name + '=.*?(&|$)', 'i')
  const separator = url.indexOf('?') !== -1 ? '&' : '?'
  
  if (url.match(regex)) {
    return url.replace(regex, '$1' + name + '=' + value + '$2')
  } else {
    return url + separator + name + '=' + value
  }
}

/**
 * 树形数据转换为平铺数据
 * @param {Array} tree 树形数据
 * @param {string} childrenKey 子节点key
 * @returns {Array}
 */
export function treeToFlat(tree, childrenKey = 'children') {
  const result = []
  
  function traverse(nodes, parent = null) {
    nodes.forEach(node => {
      const item = { ...node }
      delete item[childrenKey]
      if (parent) {
        item.parentId = parent.id
      }
      result.push(item)
      
      if (node[childrenKey] && node[childrenKey].length > 0) {
        traverse(node[childrenKey], node)
      }
    })
  }
  
  traverse(tree)
  return result
}

/**
 * 平铺数据转换为树形数据
 * @param {Array} flat 平铺数据
 * @param {string} idKey ID字段名
 * @param {string} parentIdKey 父ID字段名
 * @param {string} childrenKey 子节点字段名
 * @returns {Array}
 */
export function flatToTree(flat, idKey = 'id', parentIdKey = 'parentId', childrenKey = 'children') {
  const tree = []
  const map = {}
  
  // 创建映射
  flat.forEach(item => {
    map[item[idKey]] = { ...item, [childrenKey]: [] }
  })
  
  // 构建树形结构
  flat.forEach(item => {
    const node = map[item[idKey]]
    if (item[parentIdKey] && map[item[parentIdKey]]) {
      map[item[parentIdKey]][childrenKey].push(node)
    } else {
      tree.push(node)
    }
  })
  
  return tree
}

/**
 * 下载文件
 * @param {Blob|string} data 文件数据或URL
 * @param {string} filename 文件名
 */
export function downloadFile(data, filename) {
  const link = document.createElement('a')
  
  if (typeof data === 'string') {
    link.href = data
  } else {
    const url = window.URL.createObjectURL(data)
    link.href = url
  }
  
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  if (typeof data !== 'string') {
    window.URL.revokeObjectURL(link.href)
  }
}

/**
 * 复制文本到剪贴板
 * @param {string} text 要复制的文本
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 兼容旧浏览器
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    }
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}

/**
 * 获取浏览器信息
 * @returns {Object}
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor)
  const isFirefox = /Firefox/.test(ua)
  const isSafari = /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor)
  const isEdge = /Edge/.test(ua)
  const isIE = /Trident/.test(ua)
  
  return {
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    isIE,
    isMobile: /Mobile|Android|iPhone|iPad/.test(ua)
  }
}

/**
 * 数字千分位格式化
 * @param {number} num 数字
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return ''
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 获取文件扩展名
 * @param {string} filename 文件名
 * @returns {string}
 */
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * 判断是否为空值
 * @param {*} value 值
 * @returns {boolean}
 */
export function isEmpty(value) {
  return value === null || value === undefined || value === '' || 
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'object' && Object.keys(value).length === 0)
}