<template>
  <div class="mysql-management">
    <div class="page-header">
      <h2>MySQL数据库管理</h2>
      <p class="page-description">管理MySQL数据库连接、表结构、数据备份等操作</p>
    </div>

    <!-- 数据库连接状态 -->
    <el-card class="connection-card" shadow="never">
      <div slot="header" class="card-header">
        <span>数据库连接状态</span>
        <el-button type="text" @click="checkConnection" :loading="connectionLoading">
          <el-icon><Refresh /></el-icon> 刷新连接
        </el-button>
      </div>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="status-item">
            <div class="status-label">连接状态</div>
            <div class="status-value">
              <el-tag :type="connectionStatus.connected ? 'success' : 'danger'">
                {{ connectionStatus.connected ? '已连接' : '未连接' }}
              </el-tag>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="status-item">
            <div class="status-label">数据库版本</div>
            <div class="status-value">{{ connectionStatus.version || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="status-item">
            <div class="status-label">当前数据库</div>
            <div class="status-value">{{ connectionStatus.database || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
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
        <el-button type="success" @click="optimizeDatabase" :loading="optimizeLoading" :disabled="!connectionStatus.connected">
          <el-icon><Tools /></el-icon> 优化数据库
        </el-button>
      </div>
    </el-card>

    <!-- 数据库表列表 -->
    <el-card class="table-list-card" shadow="never">
      <div slot="header" class="card-header">
        <span>数据库表管理</span>
        <div class="header-actions">
          <el-input
            v-model="tableSearch"
            placeholder="搜索表名"
            style="width: 200px; margin-right: 10px;"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button @click="getTableList" :loading="tableLoading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
      </div>
      
      <el-table
        :data="filteredTables"
        v-loading="tableLoading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="tableName" label="表名" min-width="200" />
        <el-table-column prop="engine" label="存储引擎" width="120" />
        <el-table-column prop="rows" label="记录数" width="100" align="right" />
        <el-table-column prop="dataSize" label="数据大小" width="120" align="right" />
        <el-table-column prop="indexSize" label="索引大小" width="120" align="right" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewTableStructure(row)">
              <el-icon><View /></el-icon> 查看结构
            </el-button>
            <el-button size="small" type="warning" @click="truncateTable(row)">
              <el-icon><Delete /></el-icon> 清空
            </el-button>
            <el-button size="small" type="danger" @click="dropTable(row)">
              <el-icon><Close /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="batch-operations" v-if="selectedTables.length > 0">
        <span>已选择 {{ selectedTables.length }} 个表</span>
        <el-button size="small" type="warning" @click="batchTruncate">
          批量清空
        </el-button>
        <el-button size="small" type="danger" @click="batchDrop">
          批量删除
        </el-button>
      </div>
    </el-card>

    <!-- 备份对话框 -->
    <el-dialog v-model="backupDialogVisible" title="数据备份" width="500px">
      <el-form :model="backupForm" label-width="100px">
        <el-form-item label="备份类型">
          <el-radio-group v-model="backupForm.type">
            <el-radio label="full">完整备份</el-radio>
            <el-radio label="structure">仅结构</el-radio>
            <el-radio label="data">仅数据</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择表">
          <el-select v-model="backupForm.tables" multiple placeholder="选择要备份的表" style="width: 100%">
            <el-option
              v-for="table in tableList"
              :key="table.tableName"
              :label="table.tableName"
              :value="table.tableName"
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

    <!-- 恢复对话框 -->
    <el-dialog v-model="restoreDialogVisible" title="数据恢复" width="500px">
      <el-form :model="restoreForm" label-width="100px">
        <el-form-item label="备份文件">
          <el-select v-model="restoreForm.backupFile" placeholder="选择备份文件" style="width: 100%">
            <el-option
              v-for="backup in backupList"
              :key="backup.id"
              :label="backup.name"
              :value="backup.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-alert
            title="警告：恢复操作将覆盖现有数据，请谨慎操作！"
            type="warning"
            show-icon
            :closable="false"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="restoreDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="executeRestore" :loading="restoreLoading">确认恢复</el-button>
      </template>
    </el-dialog>

    <!-- 定时任务对话框 -->
    <el-dialog v-model="scheduleDialogVisible" title="定时任务管理" width="800px">
      <div class="schedule-header">
        <el-button type="primary" @click="showAddScheduleForm">
          <el-icon><Plus /></el-icon> 新增任务
        </el-button>
      </div>
      
      <el-table :data="scheduleList" style="width: 100%">
        <el-table-column prop="name" label="任务名称" />
        <el-table-column prop="type" label="任务类型" />
        <el-table-column prop="cron" label="执行时间" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastRun" label="最后执行" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="editSchedule(row)">编辑</el-button>
            <el-button size="small" :type="row.status === 'active' ? 'warning' : 'success'" @click="toggleSchedule(row)">
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteSchedule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 表结构查看对话框 -->
    <el-dialog v-model="structureDialogVisible" :title="`表结构 - ${currentTable?.tableName}`" width="900px">
      <el-table :data="tableStructure" style="width: 100%">
        <el-table-column prop="field" label="字段名" />
        <el-table-column prop="type" label="数据类型" />
        <el-table-column prop="null" label="允许空值" width="100">
          <template #default="{ row }">
            <el-tag :type="row.null === 'YES' ? 'success' : 'danger'">
              {{ row.null === 'YES' ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="key" label="键" width="80" />
        <el-table-column prop="default" label="默认值" />
        <el-table-column prop="extra" label="额外" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Download, Upload, Timer, Tools, Search, View, Delete, Close, Plus
} from '@element-plus/icons-vue'
import {
  getMySQLStatus,
  getMySQLTables,
  getTableStructure,
  backupDatabase,
  restoreDatabase,
  optimizeDatabase,
  truncateTable,
  dropTable,
  getBackupList,
  getScheduleList,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  toggleSchedule
} from '@/api/system/mysql'

export default {
  name: 'MySQLManagement',
  components: {
    Refresh, Download, Upload, Timer, Tools, Search, View, Delete, Close, Plus
  },
  setup() {
    // 响应式数据
    const connectionLoading = ref(false)
    const tableLoading = ref(false)
    const optimizeLoading = ref(false)
    const backupLoading = ref(false)
    const restoreLoading = ref(false)
    
    const connectionStatus = reactive({
      connected: false,
      version: '',
      database: '',
      connections: 0
    })
    
    const tableList = ref([])
    const selectedTables = ref([])
    const tableSearch = ref('')
    
    const backupDialogVisible = ref(false)
    const restoreDialogVisible = ref(false)
    const scheduleDialogVisible = ref(false)
    const structureDialogVisible = ref(false)
    
    const backupForm = reactive({
      type: 'full',
      tables: [],
      name: ''
    })
    
    const restoreForm = reactive({
      backupFile: ''
    })
    
    const backupList = ref([])
    const scheduleList = ref([])
    const tableStructure = ref([])
    const currentTable = ref(null)
    
    // 计算属性
    const filteredTables = computed(() => {
      if (!tableSearch.value) return tableList.value
      return tableList.value.filter(table => 
        table.tableName.toLowerCase().includes(tableSearch.value.toLowerCase())
      )
    })
    
    // 方法
    const checkConnection = async () => {
      connectionLoading.value = true
      try {
        const response = await getMySQLStatus()
        Object.assign(connectionStatus, response.data)
        ElMessage.success('连接状态已更新')
      } catch (error) {
        ElMessage.error('获取连接状态失败：' + error.message)
      } finally {
        connectionLoading.value = false
      }
    }
    
    const getTableList = async () => {
      tableLoading.value = true
      try {
        const response = await getMySQLTables()
        tableList.value = response.data
      } catch (error) {
        ElMessage.error('获取表列表失败：' + error.message)
      } finally {
        tableLoading.value = false
      }
    }
    
    const handleSelectionChange = (selection) => {
      selectedTables.value = selection
    }
    
    const viewTableStructure = async (table) => {
      currentTable.value = table
      try {
        const response = await getTableStructure(table.tableName)
        tableStructure.value = response.data
        structureDialogVisible.value = true
      } catch (error) {
        ElMessage.error('获取表结构失败：' + error.message)
      }
    }
    
    const truncateTable = async (table) => {
      try {
        await ElMessageBox.confirm(
          `确定要清空表 "${table.tableName}" 的所有数据吗？此操作不可恢复！`,
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await truncateTable(table.tableName)
        ElMessage.success('表已清空')
        getTableList()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('清空表失败：' + error.message)
        }
      }
    }
    
    const dropTable = async (table) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除表 "${table.tableName}" 吗？此操作不可恢复！`,
          '危险操作',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'error'
          }
        )
        
        await dropTable(table.tableName)
        ElMessage.success('表已删除')
        getTableList()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除表失败：' + error.message)
        }
      }
    }
    
    const showBackupDialog = async () => {
      backupForm.name = `backup_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`
      backupForm.tables = []
      backupDialogVisible.value = true
    }
    
    const executeBackup = async () => {
      backupLoading.value = true
      try {
        await backupDatabase(backupForm)
        ElMessage.success('备份任务已启动')
        backupDialogVisible.value = false
      } catch (error) {
        ElMessage.error('启动备份失败：' + error.message)
      } finally {
        backupLoading.value = false
      }
    }
    
    const showRestoreDialog = async () => {
      try {
        const response = await getBackupList()
        backupList.value = response.data
        restoreDialogVisible.value = true
      } catch (error) {
        ElMessage.error('获取备份列表失败：' + error.message)
      }
    }
    
    const executeRestore = async () => {
      restoreLoading.value = true
      try {
        await restoreDatabase(restoreForm.backupFile)
        ElMessage.success('恢复任务已启动')
        restoreDialogVisible.value = false
        getTableList()
      } catch (error) {
        ElMessage.error('启动恢复失败：' + error.message)
      } finally {
        restoreLoading.value = false
      }
    }
    
    const optimizeDatabase = async () => {
      optimizeLoading.value = true
      try {
        await optimizeDatabase()
        ElMessage.success('数据库优化完成')
      } catch (error) {
        ElMessage.error('数据库优化失败：' + error.message)
      } finally {
        optimizeLoading.value = false
      }
    }
    
    const showScheduleDialog = async () => {
      try {
        const response = await getScheduleList()
        scheduleList.value = response.data
        scheduleDialogVisible.value = true
      } catch (error) {
        ElMessage.error('获取定时任务列表失败：' + error.message)
      }
    }
    
    // 生命周期
    onMounted(() => {
      checkConnection()
      getTableList()
    })
    
    return {
      // 响应式数据
      connectionLoading,
      tableLoading,
      optimizeLoading,
      backupLoading,
      restoreLoading,
      connectionStatus,
      tableList,
      selectedTables,
      tableSearch,
      backupDialogVisible,
      restoreDialogVisible,
      scheduleDialogVisible,
      structureDialogVisible,
      backupForm,
      restoreForm,
      backupList,
      scheduleList,
      tableStructure,
      currentTable,
      
      // 计算属性
      filteredTables,
      
      // 方法
      checkConnection,
      getTableList,
      handleSelectionChange,
      viewTableStructure,
      truncateTable,
      dropTable,
      showBackupDialog,
      executeBackup,
      showRestoreDialog,
      executeRestore,
      optimizeDatabase,
      showScheduleDialog
    }
  }
}
</script>

<style scoped>
.mysql-management {
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
.table-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
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

.header-actions {
  display: flex;
  align-items: center;
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

.schedule-header {
  margin-bottom: 16px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>