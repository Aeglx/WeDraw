<template>
  <div class="app-container">
    <el-card class="box-card">
      <!-- 搜索区域 -->
      <div class="filter-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="queryParams.nickname"
              placeholder="请输入粉丝昵称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="关注状态" prop="subscribe">
            <el-select v-model="queryParams.subscribe" placeholder="关注状态" clearable>
              <el-option label="已关注" value="true" />
              <el-option label="未关注" value="false" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="用户状态" clearable>
              <el-option label="正常" value="active" />
              <el-option label="非活跃" value="inactive" />
              <el-option label="已拉黑" value="blocked" />
            </el-select>
          </el-form-item>
          <el-form-item label="标签" prop="tagId">
            <el-select v-model="queryParams.tagId" placeholder="选择标签" clearable>
              <el-option
                v-for="tag in tagList"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作按钮 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="el-icon-refresh"
            size="mini"
            @click="handleSync"
            v-hasPermi="['wechat:fans:sync']"
          >同步粉丝</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
            v-hasPermi="['wechat:fans:export']"
          >导出</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="warning"
            plain
            icon="el-icon-price-tag"
            size="mini"
            @click="handleBatchTag"
            :disabled="multiple"
            v-hasPermi="['wechat:fans:tag']"
          >批量打标签</el-button>
        </el-col>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <!-- 粉丝列表 -->
      <el-table v-loading="loading" :data="fanList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="头像" align="center" prop="avatar" width="80">
          <template slot-scope="scope">
            <el-avatar :size="40" :src="scope.row.avatar" icon="el-icon-user-solid"></el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="昵称" align="center" prop="nickname" :show-overflow-tooltip="true" />
        <el-table-column label="性别" align="center" prop="gender" width="80">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.sys_user_sex" :value="scope.row.gender"/>
          </template>
        </el-table-column>
        <el-table-column label="地区" align="center" prop="location" width="120">
          <template slot-scope="scope">
            {{ formatLocation(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="关注状态" align="center" prop="subscribe" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.subscribe ? 'success' : 'danger'">
              {{ scope.row.subscribe ? '已关注' : '未关注' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签" align="center" prop="tags" width="150">
          <template slot-scope="scope">
            <el-tag
              v-for="tag in scope.row.tags"
              :key="tag.id"
              size="mini"
              :color="tag.color"
              class="mr5"
            >
              {{ tag.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关注时间" align="center" prop="subscribe_time" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.subscribe_time, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-view"
              @click="handleView(scope.row)"
              v-hasPermi="['wechat:fans:query']"
            >详情</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['wechat:fans:edit']"
            >编辑</el-button>
            <el-button
              v-if="scope.row.status !== 'blocked'"
              size="mini"
              type="text"
              icon="el-icon-remove-outline"
              @click="handleBlock(scope.row)"
              v-hasPermi="['wechat:fans:block']"
            >拉黑</el-button>
            <el-button
              v-else
              size="mini"
              type="text"
              icon="el-icon-circle-check"
              @click="handleUnblock(scope.row)"
              v-hasPermi="['wechat:fans:unblock']"
            >解除拉黑</el-button>
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

    <!-- 粉丝详情对话框 -->
    <el-dialog title="粉丝详情" :visible.sync="viewOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="头像">
          <el-avatar :size="60" :src="viewForm.avatar" icon="el-icon-user-solid"></el-avatar>
        </el-descriptions-item>
        <el-descriptions-item label="昵称">{{ viewForm.nickname }}</el-descriptions-item>
        <el-descriptions-item label="OpenID">{{ viewForm.openid }}</el-descriptions-item>
        <el-descriptions-item label="UnionID">{{ viewForm.unionid || '无' }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          <dict-tag :options="dict.type.sys_user_sex" :value="viewForm.gender"/>
        </el-descriptions-item>
        <el-descriptions-item label="地区">{{ formatLocation(viewForm) }}</el-descriptions-item>
        <el-descriptions-item label="语言">{{ viewForm.language }}</el-descriptions-item>
        <el-descriptions-item label="关注状态">
          <el-tag :type="viewForm.subscribe ? 'success' : 'danger'">
            {{ viewForm.subscribe ? '已关注' : '未关注' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关注时间">{{ parseTime(viewForm.subscribe_time) }}</el-descriptions-item>
        <el-descriptions-item label="取消关注时间">{{ parseTime(viewForm.unsubscribe_time) || '无' }}</el-descriptions-item>
        <el-descriptions-item label="关注场景">{{ viewForm.subscribe_scene || '无' }}</el-descriptions-item>
        <el-descriptions-item label="二维码场景">{{ viewForm.qr_scene || '无' }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag
            v-for="tag in viewForm.tags"
            :key="tag.id"
            size="small"
            :color="tag.color"
            class="mr5"
          >
            {{ tag.name }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ viewForm.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 编辑粉丝对话框 -->
    <el-dialog title="编辑粉丝" :visible.sync="editOpen" width="600px" append-to-body>
      <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" type="textarea" placeholder="请输入备注" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="标签" prop="tagIds">
          <el-select v-model="editForm.tagIds" multiple placeholder="选择标签" style="width: 100%">
            <el-option
              v-for="tag in tagList"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitEditForm">确 定</el-button>
        <el-button @click="cancelEdit">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 批量打标签对话框 -->
    <el-dialog title="批量打标签" :visible.sync="batchTagOpen" width="500px" append-to-body>
      <el-form ref="batchTagForm" :model="batchTagForm" label-width="80px">
        <el-form-item label="选择标签">
          <el-select v-model="batchTagForm.tagIds" multiple placeholder="选择标签" style="width: 100%">
            <el-option
              v-for="tag in tagList"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-radio-group v-model="batchTagForm.action">
            <el-radio label="add">添加标签</el-radio>
            <el-radio label="remove">移除标签</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitBatchTag">确 定</el-button>
        <el-button @click="cancelBatchTag">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listFans, getFan, updateFan, blockFan, unblockFan, syncFans, exportFans, batchTagFans } from '@/api/wechat/fans'
import { listTags } from '@/api/wechat/tag'

export default {
  name: 'WechatFans',
  dicts: ['sys_user_sex'],
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
      // 粉丝表格数据
      fanList: [],
      // 标签列表
      tagList: [],
      // 弹出层标题
      title: '',
      // 是否显示详情弹出层
      viewOpen: false,
      // 是否显示编辑弹出层
      editOpen: false,
      // 是否显示批量标签弹出层
      batchTagOpen: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        nickname: null,
        subscribe: null,
        status: null,
        tagId: null
      },
      // 详情表单参数
      viewForm: {},
      // 编辑表单参数
      editForm: {},
      // 批量标签表单参数
      batchTagForm: {
        tagIds: [],
        action: 'add'
      },
      // 编辑表单校验
      editRules: {
        remark: [
          { max: 200, message: '备注不能超过200个字符', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getTagList()
  },
  methods: {
    /** 查询粉丝列表 */
    getList() {
      this.loading = true
      listFans(this.queryParams).then(response => {
        this.fanList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    /** 查询标签列表 */
    getTagList() {
      listTags().then(response => {
        this.tagList = response.data
      })
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
    /** 详情按钮操作 */
    handleView(row) {
      this.reset()
      const fanId = row.id || this.ids
      getFan(fanId).then(response => {
        this.viewForm = response.data
        this.viewOpen = true
      })
    },
    /** 编辑按钮操作 */
    handleUpdate(row) {
      this.reset()
      const fanId = row.id || this.ids
      getFan(fanId).then(response => {
        this.editForm = {
          id: response.data.id,
          remark: response.data.remark,
          tagIds: response.data.tags ? response.data.tags.map(tag => tag.id) : []
        }
        this.editOpen = true
      })
    },
    /** 拉黑按钮操作 */
    handleBlock(row) {
      const fanIds = row.id || this.ids
      this.$modal.confirm('是否确认拉黑该粉丝？').then(function() {
        return blockFan(fanIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('拉黑成功')
      }).catch(() => {})
    },
    /** 解除拉黑按钮操作 */
    handleUnblock(row) {
      const fanIds = row.id || this.ids
      this.$modal.confirm('是否确认解除拉黑该粉丝？').then(function() {
        return unblockFan(fanIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('解除拉黑成功')
      }).catch(() => {})
    },
    /** 同步粉丝按钮操作 */
    handleSync() {
      this.$modal.confirm('是否确认同步微信粉丝数据？此操作可能需要较长时间。').then(function() {
        return syncFans()
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('同步成功')
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('wechat/fans/export', {
        ...this.queryParams
      }, `fans_${new Date().getTime()}.xlsx`)
    },
    /** 批量打标签按钮操作 */
    handleBatchTag() {
      this.batchTagForm = {
        tagIds: [],
        action: 'add'
      }
      this.batchTagOpen = true
    },
    /** 提交编辑表单 */
    submitEditForm() {
      this.$refs['editForm'].validate(valid => {
        if (valid) {
          updateFan(this.editForm).then(response => {
            this.$modal.msgSuccess('修改成功')
            this.editOpen = false
            this.getList()
          })
        }
      })
    },
    /** 取消编辑 */
    cancelEdit() {
      this.editOpen = false
      this.reset()
    },
    /** 提交批量标签 */
    submitBatchTag() {
      if (this.batchTagForm.tagIds.length === 0) {
        this.$modal.msgError('请选择标签')
        return
      }
      const data = {
        fanIds: this.ids,
        tagIds: this.batchTagForm.tagIds,
        action: this.batchTagForm.action
      }
      batchTagFans(data).then(response => {
        this.$modal.msgSuccess('操作成功')
        this.batchTagOpen = false
        this.getList()
      })
    },
    /** 取消批量标签 */
    cancelBatchTag() {
      this.batchTagOpen = false
    },
    /** 表单重置 */
    reset() {
      this.viewForm = {}
      this.editForm = {
        id: null,
        remark: null,
        tagIds: []
      }
      this.resetForm('editForm')
    },
    /** 格式化地区 */
    formatLocation(row) {
      const parts = []
      if (row.country) parts.push(row.country)
      if (row.province) parts.push(row.province)
      if (row.city) parts.push(row.city)
      return parts.join(' ') || '未知'
    },
    /** 获取状态类型 */
    getStatusType(status) {
      const statusMap = {
        active: 'success',
        inactive: 'warning',
        blocked: 'danger'
      }
      return statusMap[status] || 'info'
    },
    /** 获取状态文本 */
    getStatusText(status) {
      const statusMap = {
        active: '正常',
        inactive: '非活跃',
        blocked: '已拉黑'
      }
      return statusMap[status] || '未知'
    }
  }
}
</script>

<style scoped>
.mr5 {
  margin-right: 5px;
}
</style>