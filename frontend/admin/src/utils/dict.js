import { ref, reactive } from 'vue'

// 字典数据缓存
const dictCache = reactive({})

// 预定义的字典数据
const DICT_DATA = {
  sys_yes_no: [
    { label: '是', value: 'Y', type: 'success' },
    { label: '否', value: 'N', type: 'danger' }
  ],
  sys_normal_disable: [
    { label: '正常', value: '0', type: 'success' },
    { label: '停用', value: '1', type: 'danger' }
  ],
  sys_show_hide: [
    { label: '显示', value: '0', type: 'success' },
    { label: '隐藏', value: '1', type: 'info' }
  ]
}

/**
 * 获取字典数据
 * @param {string} dictType 字典类型
 * @returns {Array} 字典数据数组
 */
export function getDictData(dictType) {
  return DICT_DATA[dictType] || []
}

/**
 * 字典组合式函数
 * @param {...string} dictTypes 字典类型列表
 * @returns {Object} 包含各字典数据的响应式对象
 */
export function useDict(...dictTypes) {
  const result = {}
  
  dictTypes.forEach(dictType => {
    if (!dictCache[dictType]) {
      dictCache[dictType] = ref(getDictData(dictType))
    }
    result[dictType] = dictCache[dictType]
  })
  
  return result
}

/**
 * 根据字典值获取标签
 * @param {Array} dictData 字典数据
 * @param {string|number} value 字典值
 * @returns {string} 字典标签
 */
export function getDictLabel(dictData, value) {
  if (!dictData || !Array.isArray(dictData)) return value
  const item = dictData.find(item => item.value === String(value))
  return item ? item.label : value
}

/**
 * 根据字典值获取标签（多个值）
 * @param {Array} dictData 字典数据
 * @param {string} value 字典值（逗号分隔）
 * @param {string} separator 分隔符
 * @returns {string} 字典标签（分隔符连接）
 */
export function getDictLabels(dictData, value, separator = ',') {
  if (!dictData || !Array.isArray(dictData) || !value) return value
  
  const values = String(value).split(separator)
  const labels = values.map(val => {
    const item = dictData.find(item => item.value === String(val).trim())
    return item ? item.label : val
  })
  
  return labels.join(separator)
}

export default useDict