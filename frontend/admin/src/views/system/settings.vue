<template>
  <div class="system-settings">
    <div class="page-header">
      <h2>系统设置</h2>
      <p class="page-description">管理系统基础配置和参数设置</p>
    </div>

    <!-- 系统信息卡片 -->
    <el-card class="info-card" shadow="never">
      <div slot="header" class="card-header">
        <span>系统信息</span>
        <el-button type="text" @click="refreshSystemInfo" :loading="infoLoading">
          <i class="el-icon-refresh"></i> 刷新
        </el-button>
      </div>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="info-item">
            <div class="info-label">系统版本</div>
            <div class="info-value">{{ systemInfo.version || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <div class="info-label">运行时间</div>
            <div class="info-value">{{ systemInfo.uptime || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <div class="info-label">系统状态</div>
            <div class="info-value">
              <el-tag :type="systemInfo.status === 'healthy' ? 'success' : 'danger'">
                {{ systemInfo.status === 'healthy' ? '正常' : '异常' }}
              </el-tag>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="info-item">
            <div class="info-label">维护模式</div>
            <div class="info-value">
              <el-switch
                v-model="systemInfo.maintenanceMode"
                @change="toggleMaintenance"
                active-text="开启"
                inactive-text="关闭">
              </el-switch>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 系统配置 -->
    <el-card class="config-card" shadow="never">
      <div slot="header" class="card-header">
        <span>系统配置</span>
        <div>
          <el-button type="primary" size="small" @click="handleAdd">
            <i class="el-icon-plus"></i> 新增配置
          </el-button>
          <el-button type="success" size="small" @click="refreshCache">
            <i class="el-icon-refresh"></i> 刷新缓存
          </el-button>
        </div>
      </div>

      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
          <el-form-item label="参数名称" prop="configName">
            <el-input
              v-model="queryParams.configName"
              placeholder="请输入参数名称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="参数键名" prop="configKey">
            <el-input
              v-model="queryParams.configKey"
              placeholder="请输入参数键名"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="系统内置" prop="configType">
            <el-select v-model="queryParams.configType" placeholder="系统内置" clearable>
              <el-option label="是" value="Y" />
              <el-option label="否" value="N" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 配置列表 -->
      <el-table v-loading="loading" :data="configList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="参数主键" align="center" prop="configId" />
        <el-table-column label="参数名称" align="center" prop="configName" :show-overflow-tooltip="true" />
        <el-table-column label="参数键名" align="center" prop="configKey" :show-overflow-tooltip="true" />
        <el-table-column label="参数键值" align="center" prop="configValue" :show-overflow-tooltip="true" />
        <el-table-column label="系统内置" align="center" prop="configType">
          <template slot-scope="scope">
            <el-tag :type="scope.row.configType === 'Y' ? 'danger' : 'primary'">
              {{ scope.row.configType === 'Y' ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button size="small" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-if="scope.row.configType !== 'Y'"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 添加或修改参数配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input v-model="form.configKey" placeholder="请输入参数键名" />
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <el-input v-model="form.configValue" type="textarea" placeholder="请输入参数键值" />
        </el-form-item>
        <el-form-item label="系统内置" prop="configType">
          <el-radio-group v-model="form.configType">
            <el-radio label="Y">是</el-radio>
            <el-radio label="N">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listConfig, getConfig, delConfig, addConfig, updateConfig, refreshCache } from '@/api/system/config'
import { getSystemInfo, getSystemStatus, toggleMaintenanceMode } from '@/api/system/settings'
import { parseTime } from '@/utils/index'
import Pagination from '@/components/Pagination/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'SystemSettings',
  components: {
    Pagination
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      infoLoading: false,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 参数表格数据
      configList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        configName: null,
        configKey: null,
        configType: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        configName: [
          { required: true, message: '参数名称不能为空', trigger: 'blur' }
        ],
        configKey: [
          { required: true, message: '参数键名不能为空', trigger: 'blur' }
        ],
        configValue: [
          { required: true, message: '参数键值不能为空', trigger: 'blur' }
        ]
      },
      // 系统信息
      systemInfo: {
        version: '',
        uptime: '',
        status: '',
        maintenanceMode: false
      }
    }
  },
  created() {
    this.getList()
    this.getSystemInfo()
  },
  methods: {
    /** 查询参数列表 */
    getList() {
      this.loading = true
      listConfig(this.queryParams).then(response => {
        this.configList = response.data.rows || []
        this.total = response.data.total || 0
        this.loading = false
      })
    },
    /** 获取系统信息 */
    getSystemInfo() {
      this.infoLoading = true
      Promise.all([
        getSystemInfo(),
        getSystemStatus()
      ]).then(([infoRes, statusRes]) => {
        this.systemInfo = {
          ...infoRes.data,
          ...statusRes.data
        }
        this.infoLoading = false
      }).catch(() => {
        this.infoLoading = false
      })
    },
    /** 刷新系统信息 */
    refreshSystemInfo() {
      this.getSystemInfo()
    },
    /** 切换维护模式 */
     toggleMaintenance(enabled) {
       toggleMaintenanceMode(enabled).then(() => {
         ElMessage.success(enabled ? '维护模式已开启' : '维护模式已关闭')
       }).catch(() => {
         this.systemInfo.maintenanceMode = !enabled
       })
     },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        configId: null,
        configName: null,
        configKey: null,
        configValue: null,
        configType: 'Y',
        remark: null
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.configId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加参数'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const configId = row.configId || this.ids
      getConfig(configId).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改参数'
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.configId != null) {
             updateConfig(this.form).then(response => {
               ElMessage.success('修改成功')
               this.open = false
               this.getList()
             })
           } else {
             addConfig(this.form).then(response => {
               ElMessage.success('新增成功')
               this.open = false
               this.getList()
             })
           }
        }
      })
    },
    /** 删除按钮操作 */
     handleDelete(row) {
       const configIds = row.configId || this.ids
       ElMessageBox.confirm('是否确认删除参数编号为"' + configIds + '"的数据项？', '提示', {
         confirmButtonText: '确定',
         cancelButtonText: '取消',
         type: 'warning'
       }).then(() => {
         return delConfig(configIds)
       }).then(() => {
         this.getList()
         ElMessage.success('删除成功')
       }).catch(() => {})
     },
    /** 刷新缓存按钮操作 */
      refreshCache() {
        refreshCache().then(() => {
          ElMessage.success('刷新缓存成功')
        })
      },
     /** 重置表单 */
     resetForm(refName) {
       if (this.$refs[refName]) {
         this.$refs[refName].resetFields()
       }
     }
   }
 }
</script>

<style scoped>
.system-settings {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-description {
  color: #666;
  margin-top: 5px;
}

.info-card {
  margin-bottom: 20px;
}

.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item {
  text-align: center;
  padding: 10px;
}

.info-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 5px;
}

.info-value {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.search-area {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}
</style>