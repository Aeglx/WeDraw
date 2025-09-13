<template>
  <div class="app-container">
    <el-card class="box-card">
      <!-- 操作按钮 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="el-icon-plus"
            size="small"
            @click="handleAdd"
            v-hasPermi="['wechat:menu:add']"
          >新增菜单</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="el-icon-upload2"
            size="small"
            @click="handlePublish"
            v-hasPermi="['wechat:menu:publish']"
          >发布到微信</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="info"
            plain
            icon="el-icon-refresh"
            size="small"
            @click="handleSync"
            v-hasPermi="['wechat:menu:sync']"
          >同步微信菜单</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="el-icon-delete"
            size="small"
            @click="handleDeleteWechatMenu"
            v-hasPermi="['wechat:menu:delete']"
          >删除微信菜单</el-button>
        </el-col>
      </el-row>

      <!-- 菜单列表 -->
      <el-table v-loading="loading" :data="menuList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="菜单名称" align="left" prop="name" :show-overflow-tooltip="true" />
        <el-table-column label="菜单类型" align="center" prop="type" width="100">
          <template #default="scope">
            <el-tag :type="getMenuTypeTag(scope.row.type)">{{ getMenuTypeText(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="菜单键值" align="center" prop="key" width="120" :show-overflow-tooltip="true" />
        <el-table-column label="链接地址" align="center" prop="url" width="200" :show-overflow-tooltip="true" />
        <el-table-column label="排序" align="center" prop="order" width="80" />
        <el-table-column label="发布状态" align="center" prop="published" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.published ? 'success' : 'warning'">
              {{ scope.row.published ? '已发布' : '未发布' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['wechat:menu:edit']"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['wechat:menu:remove']"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 添加或修改菜单对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称" maxlength="16" show-word-limit />
        </el-form-item>
        <el-form-item label="菜单类型" prop="type">
          <el-select v-model="form.type" placeholder="选择菜单类型" @change="handleTypeChange">
            <el-option label="点击推事件" value="click" />
            <el-option label="跳转URL" value="view" />
            <el-option label="扫码推事件" value="scancode_push" />
            <el-option label="扫码推事件且弹出'等待用户'" value="scancode_waitmsg" />
            <el-option label="弹出系统拍照发图" value="pic_sysphoto" />
            <el-option label="弹出拍照或者相册发图" value="pic_photo_or_album" />
            <el-option label="弹出微信相册发图器" value="pic_weixin" />
            <el-option label="弹出地理位置选择器" value="location_select" />
            <el-option label="下发消息（除文本消息）" value="media_id" />
            <el-option label="跳转图文消息URL" value="view_limited" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="showKey" label="菜单键值" prop="key">
          <el-input v-model="form.key" placeholder="请输入菜单键值" maxlength="128" show-word-limit />
        </el-form-item>
        <el-form-item v-if="showUrl" label="链接地址" prop="url">
          <el-input v-model="form.url" placeholder="请输入链接地址" maxlength="1024" show-word-limit />
        </el-form-item>
        <el-form-item v-if="showMediaId" label="媒体ID" prop="mediaId">
          <el-input v-model="form.mediaId" placeholder="请输入媒体ID" />
        </el-form-item>
        <el-form-item label="排序" prop="order">
          <el-input-number v-model="form.order" :min="1" :max="3" controls-position="right" style="width: 100px" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" maxlength="500" show-word-limit />
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
import { listMenus, getMenu, addMenu, updateMenu, delMenu, publishMenu, syncWechatMenu, deleteWechatMenu } from '@/api/wechat/menu'
import { parseTime } from '@/utils/index'

export default {
  name: 'WechatMenu',
  data() {
    return {
      // 遮罩层
      loading: true,
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
      // 菜单表格数据
      menuList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        name: [
          { required: true, message: '菜单名称不能为空', trigger: 'blur' },
          { max: 16, message: '菜单名称不能超过16个字符', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '菜单类型不能为空', trigger: 'change' }
        ],
        key: [
          { max: 128, message: '菜单键值不能超过128个字符', trigger: 'blur' }
        ],
        url: [
          { max: 1024, message: '链接地址不能超过1024个字符', trigger: 'blur' }
        ],
        order: [
          { required: true, message: '排序不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    showKey() {
      return this.form.type && !['view', 'view_limited'].includes(this.form.type)
    },
    showUrl() {
      return ['view', 'view_limited'].includes(this.form.type)
    },
    showMediaId() {
      return ['media_id', 'view_limited'].includes(this.form.type)
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询菜单列表 */
    getList() {
      this.loading = true
      listMenus(this.queryParams).then(response => {
        this.menuList = response.data.list || []
        this.total = response.data.total || 0
        this.loading = false
      })
    },
    /** 取消按钮 */
    cancel() {
      this.open = false
      this.reset()
    },
    /** 表单重置 */
    reset() {
      this.form = {
        id: null,
        name: null,
        type: null,
        key: null,
        url: null,
        mediaId: null,
        order: 1,
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
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加菜单'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const menuId = row.id || this.ids
      getMenu(menuId).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改菜单'
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateMenu(this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addMenu(this.form).then(response => {
              this.$modal.msgSuccess('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const menuIds = row.id || this.ids
      this.$modal.confirm('是否确认删除菜单编号为"' + menuIds + '"的数据项？').then(function() {
        return delMenu(menuIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    /** 发布菜单 */
    handlePublish() {
      this.$modal.confirm('是否确认发布菜单到微信公众号？').then(function() {
        return publishMenu()
      }).then(() => {
        this.$modal.msgSuccess('发布成功')
        this.getList()
      }).catch(() => {})
    },
    /** 同步微信菜单 */
    handleSync() {
      this.$modal.confirm('是否确认同步微信公众号菜单？此操作将覆盖本地菜单数据。').then(function() {
        return syncWechatMenu()
      }).then(() => {
        this.$modal.msgSuccess('同步成功')
        this.getList()
      }).catch(() => {})
    },
    /** 删除微信菜单 */
    handleDeleteWechatMenu() {
      this.$modal.confirm('是否确认删除微信公众号菜单？此操作不可恢复。').then(function() {
        return deleteWechatMenu()
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    /** 菜单类型改变 */
    handleTypeChange(value) {
      // 清空相关字段
      this.form.key = null
      this.form.url = null
      this.form.mediaId = null
    },
    /** 获取菜单类型标签 */
    getMenuTypeTag(type) {
      const typeMap = {
        click: 'primary',
        view: 'success',
        scancode_push: 'info',
        scancode_waitmsg: 'info',
        pic_sysphoto: 'warning',
        pic_photo_or_album: 'warning',
        pic_weixin: 'warning',
        location_select: 'danger',
        media_id: 'success',
        view_limited: 'success'
      }
      return typeMap[type] || 'info'
    },
    /** 获取菜单类型文本 */
    getMenuTypeText(type) {
      const typeMap = {
        click: '点击推事件',
        view: '跳转URL',
        scancode_push: '扫码推事件',
        scancode_waitmsg: '扫码推事件且弹出',
        pic_sysphoto: '系统拍照发图',
        pic_photo_or_album: '拍照或相册发图',
        pic_weixin: '微信相册发图',
        location_select: '地理位置选择',
        media_id: '下发消息',
        view_limited: '跳转图文消息'
      }
      return typeMap[type] || '未知'
    },
    /** 时间格式化 */
    parseTime
  }
}
</script>

<style scoped>
.mb8 {
  margin-bottom: 8px;
}
</style>