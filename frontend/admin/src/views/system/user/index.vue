<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用户名称" prop="userName">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入用户名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机号码" prop="phonenumber">
        <el-input
          v-model="queryParams.phonenumber"
          placeholder="请输入手机号码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="用户状态" clearable>
          <el-option
            v-for="dict in sys_normal_disable"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
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
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-permission="['system:user:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-permission="['system:user:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-permission="['system:user:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Upload"
          @click="handleImport"
          v-permission="['system:user:import']"
        >导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-permission="['system:user:export']"
        >导出</el-button>
      </el-col>
      <RightToolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns"></RightToolbar>
    </el-row>

    <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="用户编号" align="center" key="userId" prop="userId" v-if="columns[0].visible" />
      <el-table-column label="用户名称" align="center" key="userName" prop="userName" v-if="columns[1].visible" :show-overflow-tooltip="true" />
      <el-table-column label="用户昵称" align="center" key="nickName" prop="nickName" v-if="columns[2].visible" :show-overflow-tooltip="true" />
      <el-table-column label="部门" align="center" key="deptName" prop="dept.deptName" v-if="columns[3].visible" :show-overflow-tooltip="true" />
      <el-table-column label="手机号码" align="center" key="phonenumber" prop="phonenumber" v-if="columns[4].visible" width="120" />
      <el-table-column label="状态" align="center" key="status" v-if="columns[5].visible">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            active-value="0"
            inactive-value="1"
            @change="handleStatusChange(scope.row)"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" v-if="columns[6].visible" width="160">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip content="修改" placement="top" v-if="scope.row.userId !== 1">
            <el-button
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              v-permission="['system:user:edit']"
            ></el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top" v-if="scope.row.userId !== 1">
            <el-button
              link
              type="primary"
              icon="Delete"
              @click="handleDelete(scope.row)"
              v-permission="['system:user:remove']"
            ></el-button>
          </el-tooltip>
          <el-tooltip content="重置密码" placement="top" v-if="scope.row.userId !== 1">
            <el-button
              link
              type="primary"
              icon="Key"
              @click="handleResetPwd(scope.row)"
              v-permission="['system:user:resetPwd']"
            ></el-button>
          </el-tooltip>
          <el-tooltip content="分配角色" placement="top" v-if="scope.row.userId !== 1">
            <el-button
              link
              type="primary"
              icon="CircleCheck"
              @click="handleAuthRole(scope.row)"
              v-permission="['system:user:edit']"
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

    <!-- 添加或修改用户配置对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="userRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属部门" prop="deptId">
              <el-tree-select
                v-model="form.deptId"
                :data="deptOptions"
                :props="{ value: 'id', label: 'label', children: 'children' }"
                value-key="id"
                placeholder="请选择归属部门"
                check-strictly
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户名称" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
              <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户性别">
              <el-select v-model="form.sex" placeholder="请选择性别">
                <el-option
                  v-for="dict in sys_user_sex"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in sys_normal_disable"
                  :key="dict.value"
                  :label="dict.value"
                >{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="岗位">
              <el-select v-model="form.postIds" multiple placeholder="请选择岗位">
                <el-option
                  v-for="item in postOptions"
                  :key="item.postId"
                  :label="item.postName"
                  :value="item.postId"
                  :disabled="item.status == 1"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色">
              <el-select v-model="form.roleIds" multiple placeholder="请选择角色">
                <el-option
                  v-for="item in roleOptions"
                  :key="item.roleId"
                  :label="item.roleName"
                  :value="item.roleId"
                  :disabled="item.status == 1"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { parseTime } from '@/utils/ruoyi'
import { getToken } from '@/utils/auth'
import { listUser, getUser, addUser, updateUser, delUser, resetUserPwd, changeUserStatus, deptTreeSelect } from '@/api/system/user'

const { proxy } = getCurrentInstance()
import Pagination from '@/components/Pagination/index.vue'
import RightToolbar from '@/components/RightToolbar/index.vue'

// 遮罩层
const loading = ref(true)
// 选中数组
const ids = ref([])
// 非单个禁用
const single = ref(true)
// 非多个禁用
const multiple = ref(true)
// 显示搜索条件
const showSearch = ref(true)
// 总条数
const total = ref(0)
// 用户表格数据
const userList = ref([])
// 弹出层标题
const title = ref('')
// 部门树选项
const deptOptions = ref([])
// 是否显示弹出层
const open = ref(false)
// 部门名称
const deptName = ref('')
// 默认密码
const initPassword = ref('123456')
// 日期范围
const dateRange = ref([])
// 岗位选项
const postOptions = ref([])
// 角色选项
const roleOptions = ref([])
// 表单参数
const form = ref({})
// 用户导入参数
const upload = reactive({
  // 是否显示弹出层（用户导入）
  open: false,
  // 弹出层标题（用户导入）
  title: '',
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: { Authorization: 'Bearer ' + getToken() },
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + '/system/user/importData'
})
// 列显隐信息
const columns = ref([
  { key: 0, label: `用户编号`, visible: true },
  { key: 1, label: `用户名称`, visible: true },
  { key: 2, label: `用户昵称`, visible: true },
  { key: 3, label: `部门`, visible: true },
  { key: 4, label: `手机号码`, visible: true },
  { key: 5, label: `状态`, visible: true },
  { key: 6, label: `创建时间`, visible: true }
])

// 查询参数
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  userName: undefined,
  phonenumber: undefined,
  status: undefined,
  deptId: undefined
})

// 表单校验
const rules = {
  userName: [{ required: true, message: '用户名称不能为空', trigger: 'blur' }],
  nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '用户密码不能为空', trigger: 'blur' }],
  email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: ['blur', 'change']
    }
  ],
  phonenumber: [
    {
      pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur'
    }
  ]
}

// 字典数据
const sys_normal_disable = ref([
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
])
const sys_user_sex = ref([
  { label: '男', value: '0' },
  { label: '女', value: '1' },
  { label: '未知', value: '2' }
])

/** 查询用户列表 */
function getList() {
  loading.value = true
  const params = {
    ...queryParams.value
  }
  if (dateRange.value && dateRange.value.length === 2) {
    params.beginTime = dateRange.value[0]
    params.endTime = dateRange.value[1]
  }
  
  listUser(params).then(response => {
    if (response.code === 200) {
      userList.value = response.data.list
      total.value = response.data.total
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = []
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    userName: undefined,
    phonenumber: undefined,
    status: undefined,
    deptId: undefined
  }
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.userId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

/** 用户状态修改 */
function handleStatusChange(row) {
  let text = row.status === '0' ? '启用' : '停用'
  ElMessageBox.confirm('确认要"' + text + '""' + row.userName + '"用户吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(function() {
    return changeUserStatus(row.userId, row.status)
  }).then(() => {
    ElMessage.success(text + '成功')
  }).catch(function() {
    row.status = row.status === '0' ? '1' : '0'
  })
}

/** 获取部门树选择框列表 */
function getDeptTree() {
  deptTreeSelect().then(response => {
    if (response.code === 200) {
      deptOptions.value = response.data
    }
  })
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  getDeptTree()
  open.value = true
  title.value = '添加用户'
  form.value.password = initPassword.value
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  getDeptTree()
  const userId = row.userId || ids.value
  getUser(userId).then(response => {
    if (response.code === 200) {
      form.value = response.data
      open.value = true
      title.value = '修改用户'
    }
  })
}

/** 重置密码按钮操作 */
function handleResetPwd(row) {
  ElMessageBox.prompt('请输入"' + row.userName + '"的新密码', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    closeOnClickModal: false,
    inputPattern: /^.{5,20}$/,
    inputErrorMessage: '用户密码长度必须介于 5 和 20 之间'
  }).then(({ value }) => {
    return resetUserPwd(row.userId, value)
  }).then(() => {
    ElMessage.success('修改成功')
  })
}

/** 分配角色操作 */
function handleAuthRole(row) {
  const userId = row.userId
  ElMessage.info('分配角色功能开发中...')
}

/** 删除按钮操作 */
function handleDelete(row) {
  const userIds = row.userId || ids.value
  ElMessageBox.confirm('是否确认删除用户编号为"' + userIds + '"的数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(function() {
    return delUser(userIds)
  }).then(() => {
    ElMessage.success('删除成功')
    getList()
  })
}

/** 导出按钮操作 */
function handleExport() {
  ElMessage.info('导出功能开发中...')
}

/** 导入按钮操作 */
function handleImport() {
  ElMessage.info('导入功能开发中...')
}

/** 提交按钮 */
function submitForm() {
  const userRef = proxy.$refs['userRef']
  userRef.validate(valid => {
    if (valid) {
      if (form.value.userId != undefined) {
        updateUser(form.value).then(response => {
          if (response.code === 200) {
            ElMessage.success('修改成功')
            open.value = false
            getList()
          }
        })
      } else {
        addUser(form.value).then(response => {
          if (response.code === 200) {
            ElMessage.success('新增成功')
            open.value = false
            getList()
          }
        })
      }
    }
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    userId: undefined,
    deptId: undefined,
    userName: undefined,
    nickName: undefined,
    password: undefined,
    phonenumber: undefined,
    email: undefined,
    sex: undefined,
    status: '0',
    remark: undefined,
    postIds: [],
    roleIds: []
  }
}

onMounted(() => {
  getList()
})
</script>