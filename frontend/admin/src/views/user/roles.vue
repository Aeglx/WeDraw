<template>
  <div class="user-roles">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h2>角色管理</h2>
        <p>管理系统角色和权限配置</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd" :icon="Plus">
          新增角色
        </el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="68px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input
            v-model="queryParams.roleName"
            placeholder="请输入角色名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="权限字符" prop="roleKey">
          <el-input
            v-model="queryParams.roleKey"
            placeholder="请输入权限字符"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="角色状态" clearable style="width: 200px">
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" style="width: 308px">
          <el-date-picker
            v-model="dateRange"
            value-format="YYYY-MM-DD"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 角色列表 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">角色列表</div>
        <div class="table-actions">
          <el-button
            type="danger"
            plain
            :icon="Delete"
            :disabled="multiple"
            @click="handleDelete"
          >
            删除
          </el-button>
        </div>
      </div>
      
      <el-table
        v-loading="loading"
        :data="roleList"
        @selection-change="handleSelectionChange"
        @sort-change="sortChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="角色编号" prop="roleId" width="120" />
        <el-table-column label="角色名称" prop="roleName" :show-overflow-tooltip="true" width="150" />
        <el-table-column label="权限字符" prop="roleKey" :show-overflow-tooltip="true" width="150" />
        <el-table-column label="显示顺序" prop="roleSort" width="100" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top" v-if="scope.row.roleId !== 1">
              <el-button
                link
                type="primary"
                :icon="Edit"
                @click="handleUpdate(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top" v-if="scope.row.roleId !== 1">
              <el-button
                link
                type="danger"
                :icon="Delete"
                @click="handleDelete(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="数据权限" placement="top" v-if="scope.row.roleId !== 1">
              <el-button
                link
                type="warning"
                :icon="CircleCheck"
                @click="handleDataScope(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="分配用户" placement="top" v-if="scope.row.roleId !== 1">
              <el-button
                link
                type="info"
                :icon="User"
                @click="handleAuthUser(scope.row)"
              ></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      
      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 添加或修改角色配置对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <div v-loading="dialogLoading" element-loading-text="加载中...">
      <el-form ref="roleRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item prop="roleKey">
          <template #label>
            <span>
              <el-tooltip content="控制器中定义的权限字符，如：@PreAuthorize(`@ss.hasRole('admin')`)"
                placement="top">
                <el-icon><question-filled /></el-icon>
              </el-tooltip>
              权限字符
            </span>
          </template>
          <el-input v-model="form.roleKey" placeholder="请输入权限字符" />
        </el-form-item>
        <el-form-item label="角色顺序" prop="roleSort">
          <el-input-number v-model="form.roleSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event, 'menu')">展开/折叠</el-checkbox>
          <el-checkbox v-model="menuNodeAll" @change="handleCheckedTreeNodeAll($event, 'menu')">全选/全不选</el-checkbox>
          <el-checkbox v-model="form.menuCheckStrictly" @change="handleCheckedTreeConnect($event, 'menu')">父子联动</el-checkbox>
          <div class="tree-border" style="height: 300px; overflow: auto;">
            <el-tree
              :data="menuOptions"
              show-checkbox
              ref="menuRef"
              node-key="id"
              :check-strictly="!form.menuCheckStrictly"
              empty-text="加载中，请稍候"
              :props="{ label: 'label', children: 'children' }"
              :render-after-expand="false"
              :lazy="false"
              :load="loadMenuNode"
              :default-expanded-keys="expandedMenuKeys"
            ></el-tree>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配角色数据权限对话框 -->
    <el-dialog :title="title" v-model="openDataScope" width="500px" append-to-body>
      <div v-loading="dialogLoading" element-loading-text="加载中...">
      <el-form :model="form" label-width="80px">
        <el-form-item label="角色名称">
          <el-input v-model="form.roleName" :disabled="true" />
        </el-form-item>
        <el-form-item label="权限字符">
          <el-input v-model="form.roleKey" :disabled="true" />
        </el-form-item>
        <el-form-item label="权限范围">
          <el-select v-model="form.dataScope" @change="dataScopeSelectChange">
            <el-option
              v-for="item in dataScopeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="数据权限" v-show="form.dataScope == 2">
          <el-checkbox v-model="deptExpand" @change="handleCheckedTreeExpand($event, 'dept')">展开/折叠</el-checkbox>
          <el-checkbox v-model="deptNodeAll" @change="handleCheckedTreeNodeAll($event, 'dept')">全选/全不选</el-checkbox>
          <el-checkbox v-model="form.deptCheckStrictly" @change="handleCheckedTreeConnect($event, 'dept')">父子联动</el-checkbox>
          <div class="tree-border" style="height: 300px; overflow: auto;">
            <el-tree
              :data="deptOptions"
              show-checkbox
              ref="deptRef"
              node-key="id"
              :check-strictly="!form.deptCheckStrictly"
              empty-text="加载中，请稍候"
              :props="{ label: 'label', children: 'children' }"
              :render-after-expand="false"
              :lazy="false"
              :load="loadDeptNode"
              :default-expanded-keys="expandedDeptKeys"
            ></el-tree>
          </div>
        </el-form-item>
      </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitDataScope">确 定</el-button>
          <el-button @click="cancelDataScope">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Search, Refresh, Edit, Delete, CircleCheck, User, QuestionFilled 
} from '@element-plus/icons-vue'
import { 
  listRole, getRole, delRole, addRole, updateRole, dataScope, changeRoleStatus,
  deptTreeSelect, roleMenuTreeselect, roleDeptTreeselect
} from '@/api/system/role'
import { treeselect as menuTreeselect } from '@/api/system/menu'
import { parseTime } from '@/utils/ruoyi'

// 响应式数据
const loading = ref(true)
const dialogLoading = ref(false)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const showSearch = ref(true)
const total = ref(0)
const roleList = ref([])
const title = ref('')
const open = ref(false)
const openDataScope = ref(false)
const menuExpand = ref(false)
const menuNodeAll = ref(false)
const deptExpand = ref(true)
const deptNodeAll = ref(false)
const dateRange = ref([])
const menuOptions = ref([])
const deptOptions = ref([])

// 缓存标识
const menuDataLoaded = ref(false)
const deptDataLoaded = ref(false)

// 树形组件优化
const expandedMenuKeys = ref([])
const expandedDeptKeys = ref([])
const loadMenuNode = ref(null)
const loadDeptNode = ref(null)

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  roleName: undefined,
  roleKey: undefined,
  status: undefined
})

// 表单参数
const form = reactive({
  roleId: undefined,
  roleName: undefined,
  roleKey: undefined,
  roleSort: 0,
  status: '0',
  menuIds: [],
  deptIds: [],
  menuCheckStrictly: true,
  deptCheckStrictly: true,
  remark: undefined,
  dataScope: undefined
})

// 表单校验
const rules = reactive({
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
  roleSort: [{ required: true, message: '角色顺序不能为空', trigger: 'blur' }]
})

// 数据范围选项
const dataScopeOptions = ref([
  { value: '1', label: '全部数据权限' },
  { value: '2', label: '自定数据权限' },
  { value: '3', label: '本部门数据权限' },
  { value: '4', label: '本部门及以下数据权限' },
  { value: '5', label: '仅本人数据权限' }
])

// refs
const queryRef = ref()
const roleRef = ref()
const menuRef = ref()
const deptRef = ref()

// 方法
const getList = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      ...dateRange.value && {
        beginTime: dateRange.value[0],
        endTime: dateRange.value[1]
      }
    }
    const response = await listRole(params)
    roleList.value = response.data.rows || []
    total.value = response.data.total || 0
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  dateRange.value = []
  queryRef.value?.resetFields()
  handleQuery()
}

const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.roleId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

const sortChange = (column) => {
  queryParams.orderByColumn = column.prop
  queryParams.isAsc = column.order === 'ascending' ? 'asc' : 'desc'
  getList()
}

const handleAdd = async () => {
  reset()
  dialogLoading.value = true
  try {
    await getMenuTreeselect()
    open.value = true
    title.value = '添加角色'
  } catch (error) {
    ElMessage.error('加载菜单数据失败')
  } finally {
    dialogLoading.value = false
  }
}

const handleUpdate = async (row) => {
  reset()
  const roleId = row.roleId || ids.value[0]
  const roleMenu = await roleMenuTreeselect(roleId)
  Object.assign(form, roleMenu.role)
  await nextTick()
  let checkedKeys = roleMenu.checkedKeys
  checkedKeys.forEach((v) => {
    nextTick(() => {
      menuRef.value.setChecked(v, true, false)
    })
  })
  open.value = true
  title.value = '修改角色'
}

const handleDelete = async (row) => {
  const roleIds = row.roleId || ids.value
  try {
    await ElMessageBox.confirm('是否确认删除角色编号为"' + roleIds + '"的数据项？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await delRole(roleIds)
    await getList()
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleStatusChange = async (row) => {
  let text = row.status === '0' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm('确认要"' + text + '""' + row.roleName + '"角色吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await changeRoleStatus(row.roleId, row.status)
    ElMessage.success(text + '成功')
  } catch (error) {
    row.status = row.status === '0' ? '1' : '0'
    if (error !== 'cancel') {
      ElMessage.error(text + '失败')
    }
  }
}

const handleDataScope = async (row) => {
  reset()
  dialogLoading.value = true
  try {
    // 并行加载部门树和角色部门数据
    const [_, roleDeptResponse] = await Promise.all([
      getDeptTreeselect(),
      roleDeptTreeselect(row.roleId)
    ])
    
    Object.assign(form, roleDeptResponse.role)
    openDataScope.value = true
    await nextTick()
    
    let checkedKeys = roleDeptResponse.checkedKeys
    checkedKeys.forEach((v) => {
      nextTick(() => {
        deptRef.value.setChecked(v, true, false)
      })
    })
    title.value = '分配数据权限'
  } catch (error) {
    ElMessage.error('加载数据权限失败')
  } finally {
    dialogLoading.value = false
  }
}

const handleAuthUser = (row) => {
  // 跳转到分配用户页面
  ElMessage.info('分配用户功能开发中')
}

const submitForm = () => {
  roleRef.value?.validate(async (valid) => {
    if (valid) {
      if (form.roleId !== undefined) {
        form.menuIds = getMenuAllCheckedKeys()
        try {
          await updateRole(form)
          ElMessage.success('修改成功')
          open.value = false
          await getList()
        } catch (error) {
          ElMessage.error('修改失败')
        }
      } else {
        form.menuIds = getMenuAllCheckedKeys()
        try {
          await addRole(form)
          ElMessage.success('新增成功')
          open.value = false
          await getList()
        } catch (error) {
          ElMessage.error('新增失败')
        }
      }
    }
  })
}

const submitDataScope = () => {
  if (form.roleId !== undefined) {
    form.deptIds = getDeptAllCheckedKeys()
    dataScope(form).then(() => {
      ElMessage.success('修改成功')
      openDataScope.value = false
      getList()
    }).catch(() => {
      ElMessage.error('修改失败')
    })
  }
}

const cancel = () => {
  open.value = false
  reset()
}

const cancelDataScope = () => {
  openDataScope.value = false
  reset()
}

const reset = () => {
  if (menuRef.value !== undefined) {
    menuRef.value.setCheckedKeys([])
  }
  menuExpand.value = false
  menuNodeAll.value = false
  deptExpand.value = true
  deptNodeAll.value = false
  Object.assign(form, {
    roleId: undefined,
    roleName: undefined,
    roleKey: undefined,
    roleSort: 0,
    status: '0',
    menuIds: [],
    deptIds: [],
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    remark: undefined,
    dataScope: undefined
  })
  roleRef.value?.resetFields()
}

const getMenuTreeselect = async () => {
  // 如果已经加载过菜单数据，直接返回
  if (menuDataLoaded.value && menuOptions.value.length > 0) {
    return Promise.resolve()
  }
  
  try {
    const response = await menuTreeselect()
    menuOptions.value = response.data
    menuDataLoaded.value = true
  } catch (error) {
    ElMessage.error('获取菜单数据失败')
    throw error
  }
}

const getDeptTreeselect = async () => {
  // 如果已经加载过部门数据，直接返回
  if (deptDataLoaded.value && deptOptions.value.length > 0) {
    return Promise.resolve()
  }
  
  try {
    const response = await deptTreeSelect()
    deptOptions.value = response.data
    deptDataLoaded.value = true
  } catch (error) {
    ElMessage.error('获取部门数据失败')
    throw error
  }
}

const getMenuAllCheckedKeys = () => {
  let checkedKeys = menuRef.value.getCheckedKeys()
  let halfCheckedKeys = menuRef.value.getHalfCheckedKeys()
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
  return checkedKeys
}

const getDeptAllCheckedKeys = () => {
  let checkedKeys = deptRef.value.getCheckedKeys()
  let halfCheckedKeys = deptRef.value.getHalfCheckedKeys()
  checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
  return checkedKeys
}

const handleCheckedTreeExpand = (value, type) => {
  if (type === 'menu') {
    let treeList = menuOptions.value
    for (let i = 0; i < treeList.length; i++) {
      menuRef.value.store.nodesMap[treeList[i].id].expanded = value
    }
  } else if (type === 'dept') {
    let treeList = deptOptions.value
    for (let i = 0; i < treeList.length; i++) {
      deptRef.value.store.nodesMap[treeList[i].id].expanded = value
    }
  }
}

const handleCheckedTreeNodeAll = (value, type) => {
  if (type === 'menu') {
    menuRef.value.setCheckedNodes(value ? menuOptions.value : [])
  } else if (type === 'dept') {
    deptRef.value.setCheckedNodes(value ? deptOptions.value : [])
  }
}

const handleCheckedTreeConnect = (value, type) => {
  if (type === 'menu') {
    form.menuCheckStrictly = value
  } else if (type === 'dept') {
    form.deptCheckStrictly = value
  }
}

const dataScopeSelectChange = (value) => {
  if (value !== '2') {
    deptRef.value.setCheckedKeys([])
  }
}

// 生命周期
onMounted(() => {
  getList()
})
</script>

<style scoped>
.user-roles {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.header-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
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
  color: #303133;
}

.tree-border {
  margin-top: 5px;
  border: 1px solid #e5e6e7;
  background: #ffffff none;
  border-radius: 4px;
  width: 100%;
  position: relative;
}

/* 树形组件性能优化样式 */
.tree-border :deep(.el-tree) {
  /* 启用硬件加速 */
  transform: translateZ(0);
  will-change: scroll-position;
}

.tree-border :deep(.el-tree-node) {
  /* 优化节点渲染 */
  contain: layout style paint;
}

.tree-border :deep(.el-tree-node__content) {
  /* 减少重绘 */
  backface-visibility: hidden;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 10px;
}

:deep(.el-table .cell) {
  padding: 0 8px;
}

:deep(.el-button + .el-button) {
  margin-left: 8px;
}
</style>