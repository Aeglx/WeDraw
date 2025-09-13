<template>
  <div class="message-templates-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>消息模板管理</h2>
        <p>管理系统消息模板，支持邮件、短信、站内信等多种类型</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新建模板
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.total }}</div>
              <div class="stats-label">总模板数</div>
            </div>
            <el-icon class="stats-icon"><Document /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.active }}</div>
              <div class="stats-label">启用模板</div>
            </div>
            <el-icon class="stats-icon"><Check /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.used }}</div>
              <div class="stats-label">已使用</div>
            </div>
            <el-icon class="stats-icon"><Message /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats.categories }}</div>
              <div class="stats-label">模板分类</div>
            </div>
            <el-icon class="stats-icon"><Folder /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="模板名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入模板名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="模板类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable style="width: 150px">
            <el-option label="邮件" value="email" />
            <el-option label="短信" value="sms" />
            <el-option label="站内信" value="notification" />
            <el-option label="微信" value="wechat" />
            <el-option label="钉钉" value="dingtalk" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="请选择分类" clearable style="width: 150px">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 模板列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="table-title">模板列表</div>
        <div class="table-actions">
          <el-button @click="handleBatchDelete" :disabled="!selectedTemplates.length">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
      
      <el-table
        :data="templates"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="模板名称" min-width="150">
          <template #default="{ row }">
            <div class="template-name">
              <span>{{ row.name }}</span>
              <el-tag v-if="row.isDefault" type="success" size="small">默认</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="subject" label="主题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="usageCount" label="使用次数" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button type="primary" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="primary" link @click="handleCopy(row)">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 模板详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
                <el-option label="邮件" value="email" />
                <el-option label="短信" value="sms" />
                <el-option label="站内信" value="notification" />
                <el-option label="微信" value="wechat" />
                <el-option label="钉钉" value="dingtalk" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio label="active">启用</el-radio>
                <el-radio label="inactive">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="主题" prop="subject">
          <el-input v-model="formData.subject" placeholder="请输入消息主题" />
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="8"
            placeholder="请输入模板内容，支持变量：{{name}}, {{email}}, {{phone}} 等"
          />
        </el-form-item>
        <el-form-item label="变量说明">
          <el-input
            v-model="formData.variables"
            type="textarea"
            :rows="3"
            placeholder="请输入变量说明，如：name-用户姓名，email-邮箱地址"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Refresh, Download, Delete, Edit, View, CopyDocument,
  Document, Check, Message, Folder
} from '@element-plus/icons-vue'
import {
  getTemplateList,
  getTemplateDetail,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  updateTemplateStatus,
  batchDeleteTemplates,
  exportTemplates,
  getTemplateStats,
  getTemplateCategories
} from '@/api/message-center/templates'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const selectedTemplates = ref([])

// 统计数据
const stats = reactive({
  total: 0,
  active: 0,
  used: 0,
  categories: 0
})

// 搜索表单
const searchForm = reactive({
  name: '',
  type: '',
  status: '',
  category: ''
})

// 分页数据
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 表格数据
const templates = ref([])
const categories = ref([])

// 表单数据
const formRef = ref()
const formData = reactive({
  id: null,
  name: '',
  type: '',
  category: '',
  subject: '',
  content: '',
  variables: '',
  status: 'active',
  remark: ''
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  subject: [{ required: true, message: '请输入主题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }]
}

// 获取类型标签样式
const getTypeTagType = (type) => {
  const typeMap = {
    email: 'primary',
    sms: 'success',
    notification: 'info',
    wechat: 'warning',
    dingtalk: 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取类型标签文本
const getTypeLabel = (type) => {
  const typeMap = {
    email: '邮件',
    sms: '短信',
    notification: '站内信',
    wechat: '微信',
    dingtalk: '钉钉'
  }
  return typeMap[type] || type
}

// 获取模板列表
const fetchTemplates = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: pagination.page,
      size: pagination.size
    }
    const response = await getTemplateList(params)
    templates.value = response.data.list
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取模板列表失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await getTemplateStats()
    Object.assign(stats, response.data)
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getTemplateCategories()
    categories.value = response.data
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchTemplates()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    type: '',
    status: '',
    category: ''
  })
  pagination.page = 1
  fetchTemplates()
}

// 新增模板
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新建模板'
  resetForm()
  dialogVisible.value = true
}

// 编辑模板
const handleEdit = async (row) => {
  try {
    isEdit.value = true
    dialogTitle.value = '编辑模板'
    const response = await getTemplateDetail(row.id)
    Object.assign(formData, response.data)
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取模板详情失败')
  }
}

// 查看模板
const handleView = async (row) => {
  try {
    const response = await getTemplateDetail(row.id)
    ElMessageBox.alert(
      `<div style="max-height: 400px; overflow-y: auto;">
        <p><strong>模板名称：</strong>${response.data.name}</p>
        <p><strong>类型：</strong>${getTypeLabel(response.data.type)}</p>
        <p><strong>分类：</strong>${response.data.category}</p>
        <p><strong>主题：</strong>${response.data.subject}</p>
        <p><strong>内容：</strong></p>
        <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 10px; border-radius: 4px;">${response.data.content}</pre>
        ${response.data.variables ? `<p><strong>变量说明：</strong>${response.data.variables}</p>` : ''}
        ${response.data.remark ? `<p><strong>备注：</strong>${response.data.remark}</p>` : ''}
      </div>`,
      '模板详情',
      {
        dangerouslyUseHTMLString: true,
        customClass: 'template-detail-dialog'
      }
    )
  } catch (error) {
    ElMessage.error('获取模板详情失败')
  }
}

// 复制模板
const handleCopy = async (row) => {
  try {
    const response = await getTemplateDetail(row.id)
    isEdit.value = false
    dialogTitle.value = '复制模板'
    Object.assign(formData, {
      ...response.data,
      id: null,
      name: `${response.data.name}_副本`
    })
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取模板详情失败')
  }
}

// 删除模板
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板 "${row.name}" 吗？`,
      '确认删除',
      {
        type: 'warning'
      }
    )
    await deleteTemplate(row.id)
    ElMessage.success('删除成功')
    fetchTemplates()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 状态变更
const handleStatusChange = async (row) => {
  try {
    await updateTemplateStatus(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
    fetchStats()
  } catch (error) {
    ElMessage.error('状态更新失败')
    // 恢复原状态
    row.status = row.status === 'active' ? 'inactive' : 'active'
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTemplates.value.length} 个模板吗？`,
      '确认批量删除',
      {
        type: 'warning'
      }
    )
    const ids = selectedTemplates.value.map(item => item.id)
    await batchDeleteTemplates({ ids })
    ElMessage.success('批量删除成功')
    fetchTemplates()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 导出
const handleExport = async () => {
  try {
    await exportTemplates(searchForm)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 选择变更
const handleSelectionChange = (selection) => {
  selectedTemplates.value = selection
}

// 分页大小变更
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchTemplates()
}

// 当前页变更
const handleCurrentChange = (page) => {
  pagination.page = page
  fetchTemplates()
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await updateTemplate(formData.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createTemplate(formData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    fetchTemplates()
    fetchStats()
  } catch (error) {
    if (error !== false) {
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    }
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: null,
    name: '',
    type: '',
    category: '',
    subject: '',
    content: '',
    variables: '',
    status: 'active',
    remark: ''
  })
  formRef.value?.clearValidate()
}

// 初始化
onMounted(() => {
  fetchTemplates()
  fetchStats()
  fetchCategories()
})
</script>

<style scoped>
.message-templates-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  position: relative;
  overflow: hidden;
}

.stats-content {
  position: relative;
  z-index: 2;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.stats-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40px;
  color: #409eff;
  opacity: 0.1;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
}

.template-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

:deep(.template-detail-dialog) {
  max-width: 800px;
}

:deep(.template-detail-dialog .el-message-box__message) {
  max-height: 500px;
  overflow-y: auto;
}
</style>