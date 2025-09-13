<template>
  <div class="redis-management">
    <div class="page-header">
      <h2>Redis数据库管理</h2>
      <p class="page-description">管理Redis缓存数据库，包括键值对管理、内存监控、数据备份等操作</p>
    </div>

    <!-- Redis连接状态 -->
    <el-card class="connection-card" shadow="never">
      <div slot="header" class="card-header">
        <span>Redis连接状态</span>
        <el-button type="text" @click="checkConnection" :loading="connectionLoading">
          <el-icon><Refresh /></el-icon> 刷新连接
        </el-button>
      </div>
      <el-row :gutter="20">
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">连接状态</div>
            <div class="status-value">
              <el-tag :type="connectionStatus.connected ? 'success' : 'danger'">
                {{ connectionStatus.connected ? '已连接' : '未连接' }}
              </el-tag>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">Redis版本</div>
            <div class="status-value">{{ connectionStatus.version || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">运行模式</div>
            <div class="status-value">{{ connectionStatus.mode || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">已用内存</div>
            <div class="status-value">{{ connectionStatus.usedMemory || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">键总数</div>
            <div class="status-value">{{ connectionStatus.totalKeys || 0 }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="status-item">
            <div class="status-label">连接数</div>
            <div class="status-value">{{ connectionStatus.connections || 0 }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="operation-card" shadow="never">
      <div class="operation-buttons">
        <el-button type="primary" @click="showBackupDialog" :disabled="!connectionStatus.connected">
          <el-icon><Download /></el-icon> 数据备份
        </el-button>
        <el-button type="warning" @click="showRestoreDialog" :disabled="!connectionStatus.connected">
          <el-icon><Upload /></el-icon> 数据恢复
        </el-button>
        <el-button type="info" @click="showScheduleDialog">
          <el-icon><Timer /></el-icon> 定时任务
        </el-button>
        <el-button type="success" @click="flushExpired" :loading="flushLoading" :disabled="!connectionStatus.connected">
          <el-icon><Delete /></el-icon> 清理过期键
        </el-button>
        <el-button type="danger" @click="flushAll" :disabled="!connectionStatus.connected">
          <el-icon><Warning /></el-icon> 清空所有数据
        </el-button>
      </div>
    </el-card>

    <!-- 数据库选择和键值管理 -->
    <el-card class="key-management-card" shadow="never">
      <div slot="header" class="card-header">
        <div class="header-left">
          <span>键值对管理</span>
          <el-select v-model="selectedDatabase" @change="switchDatabase" style="margin-left: 20px; width: 120px;">
            <el-option
              v-for="db in databaseList"
              :key="db.index"
              :label="`DB${db.index} (${db.keys})`"
              :value="db.index"
            />
          </el-select>
        </div>
        <div class="header-actions">
          <el-input
            v-model="keySearch"
            placeholder="搜索键名 (支持通配符 *)"
            style="width: 250px; margin-right: 10px;"
            clearable
            @keyup.enter="searchKeys"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button @click="searchKeys" :loading="keyLoading">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="showAddKeyDialog" type="primary">
            <el-icon><Plus /></el-icon> 新增
          </el-button>
        </div>
      </div>
      
      <el-table
        :data="keyList"
        v-loading="keyLoading"
        style="width: 100%"
        @selection-change="handleKeySelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="key" label="键名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="数据类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="100" align="right" />
        <el-table-column prop="ttl" label="过期时间" width="150">
          <template #default="{ row }">
            <span v-if="row.ttl === -1">永不过期</span>
            <span v-else-if="row.ttl === -2" class="expired">已过期</span>
            <span v-else>{{ formatTTL(row.ttl) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewKeyValue(row)">
              <el-icon><View /></el-icon> 查看
            </el-button>
            <el-button size="small" type="warning" @click="editKey(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button size="small" type="info" @click="setTTL(row)">
              <el-icon><Timer /></el-icon> 设置TTL
            </el-button>
            <el-button size="small" type="danger" @click="deleteKey(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="batch-operations" v-if="selectedKeys.length > 0">
        <span>已选择 {{ selectedKeys.length }} 个键</span>
        <el-button size="small" type="danger" @click="batchDeleteKeys">
          批量删除
        </el-button>
      </div>
      
      <el-pagination
        v-if="keyTotal > 0"
        :current-page="keyPage"
        :page-size="keyPageSize"
        :total="keyTotal"
        @current-change="handleKeyPageChange"
        layout="total, prev, pager, next"
        style="margin-top: 20px; text-align: right;"
      />
    </el-card>

    <!-- 备份对话框 -->
    <el-dialog v-model="backupDialogVisible" title="Redis数据备份" width="500px">
      <el-form :model="backupForm" label-width="100px">
        <el-form-item label="备份类型">
          <el-radio-group v-model="backupForm.type">
            <el-radio label="rdb">RDB快照</el-radio>
            <el-radio label="aof">AOF日志</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择数据库">
          <el-select v-model="backupForm.databases" multiple placeholder="选择要备份的数据库" style="width: 100%">
            <el-option
              v-for="db in databaseList"
              :key="db.index"
              :label="`DB${db.index} (${db.keys} keys)`"
              :value="db.index"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备份名称">
          <el-input v-model="backupForm.name" placeholder="输入备份文件名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="backupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="executeBackup" :loading="backupLoading">开始备份</el-button>
      </template>
    </el-dialog>

    <!-- 键值查看/编辑对话框 -->
    <el-dialog v-model="keyDialogVisible" :title="keyDialogTitle" width="800px">
      <el-form :model="keyForm" label-width="80px">
        <el-form-item label="键名">
          <el-input v-model="keyForm.key" :disabled="keyDialogMode === 'view'" />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select v-model="keyForm.type" :disabled="keyDialogMode === 'view' || keyDialogMode === 'edit'">
            <el-option label="String" value="string" />
            <el-option label="Hash" value="hash" />
            <el-option label="List" value="list" />
            <el-option label="Set" value="set" />
            <el-option label="ZSet" value="zset" />
          </el-select>
        </el-form-item>
        <el-form-item label="TTL(秒)">
          <el-input-number v-model="keyForm.ttl" :min="-1" :disabled="keyDialogMode === 'view'" style="width: 100%" />
          <div class="form-tip">-1表示永不过期</div>
        </el-form-item>
        <el-form-item label="值">
          <!-- String类型 -->
          <el-input
            v-if="keyForm.type === 'string'"
            v-model="keyForm.value"
            type="textarea"
            :rows="6"
            :disabled="keyDialogMode === 'view'"
          />
          <!-- Hash类型 -->
          <div v-else-if="keyForm.type === 'hash'">
            <el-button v-if="keyDialogMode !== 'view'" size="small" @click="addHashField" style="margin-bottom: 10px;">
              <el-icon><Plus /></el-icon> 添加字段
            </el-button>
            <el-table :data="keyForm.hashValue" style="width: 100%">
              <el-table-column label="字段">
                <template #default="{ row, $index }">
                  <el-input v-model="row.field" :disabled="keyDialogMode === 'view'" />
                </template>
              </el-table-column>
              <el-table-column label="值">
                <template #default="{ row, $index }">
                  <el-input v-model="row.value" :disabled="keyDialogMode === 'view'" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" v-if="keyDialogMode !== 'view'">
                <template #default="{ row, $index }">
                  <el-button size="small" type="danger" @click="removeHashField($index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <!-- List类型 -->
          <div v-else-if="keyForm.type === 'list'">
            <el-button v-if="keyDialogMode !== 'view'" size="small" @click="addListItem" style="margin-bottom: 10px;">
              <el-icon><Plus /></el-icon> 添加元素
            </el-button>
            <el-table :data="keyForm.listValue" style="width: 100%">
              <el-table-column label="索引" width="80">
                <template #default="{ $index }">
                  {{ $index }}
                </template>
              </el-table-column>
              <el-table-column label="值">
                <template #default="{ row, $index }">
                  <el-input v-model="row.value" :disabled="keyDialogMode === 'view'" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" v-if="keyDialogMode !== 'view'">
                <template #default="{ row, $index }">
                  <el-button size="small" type="danger" @click="removeListItem($index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="keyDialogVisible = false">{{ keyDialogMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button v-if="keyDialogMode !== 'view'" type="primary" @click="saveKey" :loading="saveKeyLoading">
          {{ keyDialogMode === 'add' ? '添加' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- TTL设置对话框 -->
    <el-dialog v-model="ttlDialogVisible" title="设置过期时间" width="400px">
      <el-form :model="ttlForm" label-width="100px">
        <el-form-item label="键名">
          <el-input v-model="ttlForm.key" disabled />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-radio-group v-model="ttlForm.type">
            <el-radio label="seconds">秒</el-radio>
            <el-radio label="timestamp">时间戳</el-radio>
            <el-radio label="datetime">日期时间</el-radio>
            <el-radio label="never">永不过期</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="ttlForm.type === 'seconds'" label="秒数">
          <el-input-number v-model="ttlForm.seconds" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="ttlForm.type === 'timestamp'" label="时间戳">
          <el-input-number v-model="ttlForm.timestamp" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="ttlForm.type === 'datetime'" label="日期时间">
          <el-date-picker
            v-model="ttlForm.datetime"
            type="datetime"
            placeholder="选择日期时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ttlDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTTL" :loading="saveTTLLoading">设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Download, Upload, Timer, Delete, Warning, Search, Plus, View, Edit
} from '@element-plus/icons-vue'
import {
  getRedisStatus,
  getRedisKeys,
  getRedisValue,
  setRedisValue,
  deleteRedisKey,
  clearRedisDatabase,
  backupRedisDatabase,
  getRedisBackupList,
  restoreRedisDatabase,
  deleteRedisBackup,
  createRedisScheduleTask,
  getRedisScheduleTasks,
  updateRedisScheduleTask,
  deleteRedisScheduleTask,
  getRedisInfo
} from '@/api/system/database'

export default {
  name: 'RedisManagement',
  components: {
    Refresh, Download, Upload, Timer, Delete, Warning, Search, Plus, View, Edit
  },
  setup() {
    // 响应式数据
    const connectionLoading = ref(false)
    const keyLoading = ref(false)
    const flushLoading = ref(false)
    const backupLoading = ref(false)
    const saveKeyLoading = ref(false)
    const saveTTLLoading = ref(false)
    
    const connectionStatus = reactive({
      connected: false,
      version: '',
      mode: '',
      usedMemory: '',
      totalKeys: 0,
      connections: 0
    })
    
    const selectedDatabase = ref(0)
    const databaseList = ref([])
    const keyList = ref([])
    const selectedKeys = ref([])
    const keySearch = ref('')
    const keyPage = ref(1)
    const keyPageSize = ref(50)
    const keyTotal = ref(0)
    
    const backupDialogVisible = ref(false)
    const keyDialogVisible = ref(false)
    const ttlDialogVisible = ref(false)
    const scheduleDialogVisible = ref(false)
    
    const keyDialogMode = ref('view') // view, edit, add
    const keyDialogTitle = computed(() => {
      const titles = {
        view: '查看键值',
        edit: '编辑键值',
        add: '添加键值'
      }
      return titles[keyDialogMode.value]
    })
    
    const backupForm = reactive({
      type: 'rdb',
      databases: [],
      name: ''
    })
    
    const keyForm = reactive({
      key: '',
      type: 'string',
      value: '',
      ttl: -1,
      hashValue: [],
      listValue: []
    })
    
    const ttlForm = reactive({
      key: '',
      type: 'seconds',
      seconds: 3600,
      timestamp: 0,
      datetime: null
    })
    
    // 方法
    const checkConnection = async () => {
      connectionLoading.value = true
      try {
        const response = await getRedisStatus()
        Object.assign(connectionStatus, response.data)
        ElMessage.success('连接状态已更新')
      } catch (error) {
        ElMessage.error('获取连接状态失败：' + error.message)
      } finally {
        connectionLoading.value = false
      }
    }
    
    const getDatabaseList = async () => {
      try {
        // Redis通常有16个数据库（0-15）
        databaseList.value = Array.from({ length: 16 }, (_, i) => ({ index: i, keys: 0 }))
      } catch (error) {
        ElMessage.error('获取数据库列表失败：' + error.message)
      }
    }
    
    const switchDatabase = (dbIndex) => {
      selectedDatabase.value = dbIndex
      keyPage.value = 1
      searchKeys()
    }
    
    const searchKeys = async () => {
      keyLoading.value = true
      try {
        const response = await getRedisKeys({
          database: selectedDatabase.value,
          pattern: keySearch.value || '*',
          page: keyPage.value,
          pageSize: keyPageSize.value
        })
        keyList.value = response.data.list
        keyTotal.value = response.data.total
      } catch (error) {
        ElMessage.error('搜索键失败：' + error.message)
      } finally {
        keyLoading.value = false
      }
    }
    
    const handleKeyPageChange = (page) => {
      keyPage.value = page
      searchKeys()
    }
    
    const handleKeySelectionChange = (selection) => {
      selectedKeys.value = selection
    }
    
    const getTypeColor = (type) => {
      const colors = {
        string: 'primary',
        hash: 'success',
        list: 'warning',
        set: 'info',
        zset: 'danger'
      }
      return colors[type] || 'default'
    }
    
    const formatTTL = (ttl) => {
      if (ttl < 60) return `${ttl}秒`
      if (ttl < 3600) return `${Math.floor(ttl / 60)}分钟`
      if (ttl < 86400) return `${Math.floor(ttl / 3600)}小时`
      return `${Math.floor(ttl / 86400)}天`
    }
    
    const viewKeyValue = async (key) => {
      try {
        const response = await getRedisValue({ key: key.key, database: selectedDatabase.value })
        Object.assign(keyForm, response.data)
        keyDialogMode.value = 'view'
        keyDialogVisible.value = true
      } catch (error) {
        ElMessage.error('获取键值失败：' + error.message)
      }
    }
    
    const editKey = async (key) => {
      try {
        const response = await getRedisValue({ key: key.key, database: selectedDatabase.value })
        Object.assign(keyForm, response.data)
        keyDialogMode.value = 'edit'
        keyDialogVisible.value = true
      } catch (error) {
        ElMessage.error('获取键值失败：' + error.message)
      }
    }
    
    const showAddKeyDialog = () => {
      Object.assign(keyForm, {
        key: '',
        type: 'string',
        value: '',
        ttl: -1,
        hashValue: [],
        listValue: []
      })
      keyDialogMode.value = 'add'
      keyDialogVisible.value = true
    }
    
    const saveKey = async () => {
      saveKeyLoading.value = true
      try {
        await setRedisValue({ database: selectedDatabase.value, ...keyForm })
        ElMessage.success('保存成功')
        keyDialogVisible.value = false
        searchKeys()
      } catch (error) {
        ElMessage.error('保存失败：' + error.message)
      } finally {
        saveKeyLoading.value = false
      }
    }
    
    const deleteKey = async (key) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除键 "${key.key}" 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await deleteRedisKey({ key: key.key, database: selectedDatabase.value })
        ElMessage.success('删除成功')
        searchKeys()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败：' + error.message)
        }
      }
    }
    
    const setTTL = (key) => {
      ttlForm.key = key.key
      ttlForm.type = 'seconds'
      ttlForm.seconds = 3600
      ttlDialogVisible.value = true
    }
    
    const saveTTL = async () => {
      saveTTLLoading.value = true
      try {
        let ttl = -1
        if (ttlForm.type === 'seconds') {
          ttl = ttlForm.seconds
        } else if (ttlForm.type === 'timestamp') {
          ttl = ttlForm.timestamp - Math.floor(Date.now() / 1000)
        } else if (ttlForm.type === 'datetime') {
          ttl = Math.floor(new Date(ttlForm.datetime).getTime() / 1000) - Math.floor(Date.now() / 1000)
        }
        
        await setRedisValue({ database: selectedDatabase.value, key: ttlForm.key, ttl: ttl })
        ElMessage.success('TTL设置成功')
        ttlDialogVisible.value = false
        searchKeys()
      } catch (error) {
        ElMessage.error('设置TTL失败：' + error.message)
      } finally {
        saveTTLLoading.value = false
      }
    }
    
    const flushExpired = async () => {
      flushLoading.value = true
      try {
        await clearRedisDatabase({ database: selectedDatabase.value, type: 'expired' })
        ElMessage.success('过期键清理完成')
        searchKeys()
        checkConnection()
      } catch (error) {
        ElMessage.error('清理过期键失败：' + error.message)
      } finally {
        flushLoading.value = false
      }
    }
    
    const flushAll = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要清空所有Redis数据吗？此操作不可恢复！',
          '危险操作',
          {
            confirmButtonText: '确定清空',
            cancelButtonText: '取消',
            type: 'error'
          }
        )
        
        await clearRedisDatabase({ database: selectedDatabase.value, type: 'all' })
        ElMessage.success('所有数据已清空')
        searchKeys()
        checkConnection()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('清空数据失败：' + error.message)
        }
      }
    }
    
    const showBackupDialog = () => {
      backupForm.name = `redis_backup_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`
      backupForm.databases = []
      backupDialogVisible.value = true
    }
    
    const showRestoreDialog = () => {
      ElMessage.info('恢复功能开发中...')
    }
    
    const showScheduleDialog = () => {
      scheduleDialogVisible.value = true
    }
    
    const executeBackup = async () => {
      backupLoading.value = true
      try {
        await backupRedisDatabase(backupForm)
        ElMessage.success('备份任务已启动')
        backupDialogVisible.value = false
      } catch (error) {
        ElMessage.error('启动备份失败：' + error.message)
      } finally {
        backupLoading.value = false
      }
    }
    
    // Hash字段操作
    const addHashField = () => {
      keyForm.hashValue.push({ field: '', value: '' })
    }
    
    const removeHashField = (index) => {
      keyForm.hashValue.splice(index, 1)
    }
    
    // List元素操作
    const addListItem = () => {
      keyForm.listValue.push({ value: '' })
    }
    
    const removeListItem = (index) => {
      keyForm.listValue.splice(index, 1)
    }
    
    const batchDeleteKeys = async () => {
      if (selectedKeys.value.length === 0) {
        ElMessage.warning('请选择要删除的键')
        return
      }
      
      try {
        await ElMessageBox.confirm(
          `确定要删除选中的 ${selectedKeys.value.length} 个键吗？`,
          '批量删除',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        for (const key of selectedKeys.value) {
          await deleteRedisKey({ key: key.key, database: selectedDatabase.value })
        }
        
        ElMessage.success('批量删除成功')
        selectedKeys.value = []
        searchKeys()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('批量删除失败：' + error.message)
        }
      }
    }
    
    // 生命周期
    onMounted(() => {
      checkConnection()
      getDatabaseList()
      searchKeys()
    })
    
    return {
      // 响应式数据
      connectionLoading,
      keyLoading,
      flushLoading,
      backupLoading,
      saveKeyLoading,
      saveTTLLoading,
      connectionStatus,
      selectedDatabase,
      databaseList,
      keyList,
      selectedKeys,
      keySearch,
      keyPage,
      keyPageSize,
      keyTotal,
      backupDialogVisible,
      keyDialogVisible,
      ttlDialogVisible,
      scheduleDialogVisible,
      keyDialogMode,
      keyDialogTitle,
      backupForm,
      keyForm,
      ttlForm,
      
      // 方法
      checkConnection,
      getDatabaseList,
      switchDatabase,
      searchKeys,
      handleKeyPageChange,
      handleKeySelectionChange,
      getTypeColor,
      formatTTL,
      viewKeyValue,
      editKey,
      showAddKeyDialog,
      saveKey,
      deleteKey,
      setTTL,
      saveTTL,
      flushExpired,
      flushAll,
      showBackupDialog,
      showRestoreDialog,
      showScheduleDialog,
      executeBackup,
      addHashField,
      removeHashField,
      addListItem,
      removeListItem,
      batchDeleteKeys
    }
  }
}
</script>

<style scoped>
.redis-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.connection-card,
.operation-card,
.key-management-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.status-item {
  text-align: center;
}

.status-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.status-value {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.operation-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.batch-operations {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.expired {
  color: #f56c6c;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>