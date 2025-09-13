<template>
  <div class="app-container">
    <el-card class="box-card">
      <!-- 查询条件 -->
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="消息标题" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入消息标题"
            clearable
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="消息类型" prop="messageType">
          <el-select v-model="queryParams.messageType" placeholder="请选择消息类型" clearable>
            <el-option label="文本消息" value="text" />
            <el-option label="图文消息" value="news" />
            <el-option label="图片消息" value="image" />
            <el-option label="语音消息" value="voice" />
            <el-option label="视频消息" value="video" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择发送状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="发送中" value="sending" />
            <el-option label="已发送" value="sent" />
            <el-option label="发送失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="发送时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd HH:mm:ss"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="el-icon-plus"
            size="small"
            @click="handleAdd"
            v-hasPermi="['wechat:message:add']"
          >新增消息</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="el-icon-s-promotion"
            size="small"
            @click="handleBroadcast"
            :disabled="multiple"
            v-hasPermi="['wechat:message:broadcast']"
          >群发消息</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="small"
            @click="handleExport"
            v-hasPermi="['wechat:message:export']"
          >导出</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="el-icon-delete"
            size="small"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['wechat:message:remove']"
          >删除</el-button>
        </el-col>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <!-- 消息列表 -->
      <el-table v-loading="loading" :data="messageList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="消息标题" align="left" prop="title" :show-overflow-tooltip="true" />
        <el-table-column label="消息类型" align="center" prop="messageType" width="100">
          <template #default="scope">
            <el-tag :type="getMessageTypeTag(scope.row.messageType)">{{ getMessageTypeText(scope.row.messageType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="消息内容" align="left" prop="content" width="200" :show-overflow-tooltip="true" />
        <el-table-column label="发送状态" align="center" prop="status" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阅读数" align="center" prop="readCount" width="80" />
        <el-table-column label="点赞数" align="center" prop="likeCount" width="80" />
        <el-table-column label="分享数" align="center" prop="shareCount" width="80" />
        <el-table-column label="发送时间" align="center" prop="sendTime" width="180">
          <template #default="scope">
            <span>{{ scope.row.sendTime || '-' }}</span>
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
              icon="el-icon-view"
              @click="handleView(scope.row)"
              v-hasPermi="['wechat:message:query']"
            >详情</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['wechat:message:edit']"
            >修改</el-button>
            <el-button
              v-if="scope.row.status === 'draft'"
              size="small"
              type="text"
              icon="el-icon-s-promotion"
              @click="handleSend(scope.row)"
              v-hasPermi="['wechat:message:send']"
            >发送</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-view"
              @click="handlePreview(scope.row)"
              v-hasPermi="['wechat:message:preview']"
            >预览</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['wechat:message:remove']"
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

    <!-- 添加或修改消息对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="消息标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入消息标题" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="消息类型" prop="messageType">
          <el-select v-model="form.messageType" placeholder="选择消息类型" @change="handleMessageTypeChange">
            <el-option label="文本消息" value="text" />
            <el-option label="图文消息" value="news" />
            <el-option label="图片消息" value="image" />
            <el-option label="语音消息" value="voice" />
            <el-option label="视频消息" value="video" />
          </el-select>
        </el-form-item>
        <el-form-item label="消息内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请输入消息内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="form.messageType === 'image'" label="图片地址" prop="imageUrl">
          <el-input v-model="form.imageUrl" placeholder="请输入图片地址" />
        </el-form-item>
        <el-form-item v-if="form.messageType === 'news'" label="跳转链接" prop="linkUrl">
          <el-input v-model="form.linkUrl" placeholder="请输入跳转链接" />
        </el-form-item>
        <el-form-item label="定时发送">
          <el-switch v-model="form.scheduled" @change="handleScheduledChange" />
        </el-form-item>
        <el-form-item v-if="form.scheduled" label="发送时间" prop="sendTime">
          <el-date-picker
            v-model="form.sendTime"
            type="datetime"
            placeholder="选择发送时间"
            value-format="yyyy-MM-dd HH:mm:ss"
          ></el-date-picker>
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

    <!-- 消息详情对话框 -->
    <el-dialog title="消息详情" :visible.sync="detailOpen" width="600px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="消息标题">{{ messageDetail.title }}</el-descriptions-item>
        <el-descriptions-item label="消息类型">
          <el-tag :type="getMessageTypeTag(messageDetail.messageType)">{{ getMessageTypeText(messageDetail.messageType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发送状态">
          <el-tag :type="getStatusTag(messageDetail.status)">{{ getStatusText(messageDetail.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="阅读数">{{ messageDetail.readCount }}</el-descriptions-item>
        <el-descriptions-item label="点赞数">{{ messageDetail.likeCount }}</el-descriptions-item>
        <el-descriptions-item label="分享数">{{ messageDetail.shareCount }}</el-descriptions-item>
        <el-descriptions-item label="发送时间" :span="2">{{ messageDetail.sendTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ parseTime(messageDetail.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</el-descriptions-item>
        <el-descriptions-item label="消息内容" :span="2">
          <div class="message-content">{{ messageDetail.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="messageDetail.remark" label="备注" :span="2">{{ messageDetail.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 群发消息对话框 -->
    <el-dialog title="群发消息" :visible.sync="broadcastOpen" width="500px" append-to-body>
      <el-form ref="broadcastForm" :model="broadcastForm" :rules="broadcastRules" label-width="80px">
        <el-form-item label="发送对象" prop="targetType">
          <el-select v-model="broadcastForm.targetType" placeholder="选择发送对象">
            <el-option label="全部粉丝" value="all" />
            <el-option label="按标签发送" value="tag" />
            <el-option label="按性别发送" value="gender" />
            <el-option label="按地区发送" value="region" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="broadcastForm.targetType === 'tag'" label="选择标签" prop="tagIds">
          <el-select v-model="broadcastForm.tagIds" multiple placeholder="请选择标签">
            <el-option label="VIP用户" value="1" />
            <el-option label="新用户" value="2" />
            <el-option label="活跃用户" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="broadcastForm.targetType === 'gender'" label="选择性别" prop="gender">
          <el-select v-model="broadcastForm.gender" placeholder="请选择性别">
            <el-option label="男" value="1" />
            <el-option label="女" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计发送" prop="estimatedCount">
          <el-input v-model="broadcastForm.estimatedCount" placeholder="预计发送人数" readonly />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitBroadcast">确认群发</el-button>
        <el-button @click="cancelBroadcast">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listMessages, getMessage, addMessage, updateMessage, delMessage, sendMessage, broadcastMessage, exportMessage, previewMessage } from '@/api/wechat/message'
import { parseTime } from '@/utils/index'

export default {
  name: 'WechatMessage',
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
      // 消息表格数据
      messageList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 是否显示详情弹出层
      detailOpen: false,
      // 是否显示群发弹出层
      broadcastOpen: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: null,
        messageType: null,
        status: null,
        startTime: null,
        endTime: null
      },
      // 表单参数
      form: {},
      // 消息详情
      messageDetail: {},
      // 群发表单
      broadcastForm: {
        targetType: 'all',
        tagIds: [],
        gender: null,
        estimatedCount: '5000'
      },
      // 表单校验
      rules: {
        title: [
          { required: true, message: '消息标题不能为空', trigger: 'blur' },
          { max: 50, message: '消息标题不能超过50个字符', trigger: 'blur' }
        ],
        messageType: [
          { required: true, message: '消息类型不能为空', trigger: 'change' }
        ],
        content: [
          { required: true, message: '消息内容不能为空', trigger: 'blur' },
          { max: 2000, message: '消息内容不能超过2000个字符', trigger: 'blur' }
        ],
        sendTime: [
          { required: true, message: '发送时间不能为空', trigger: 'change' }
        ]
      },
      // 群发表单校验
      broadcastRules: {
        targetType: [
          { required: true, message: '发送对象不能为空', trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询消息列表 */
    getList() {
      this.loading = true
      if (this.dateRange && this.dateRange.length === 2) {
        this.queryParams.startTime = this.dateRange[0]
        this.queryParams.endTime = this.dateRange[1]
      } else {
        this.queryParams.startTime = null
        this.queryParams.endTime = null
      }
      listMessages(this.queryParams).then(response => {
        this.messageList = response.data.rows || []
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
        title: null,
        messageType: null,
        content: null,
        imageUrl: null,
        linkUrl: null,
        scheduled: false,
        sendTime: null,
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
      this.dateRange = []
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
      this.title = '添加消息'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const messageId = row.id || this.ids
      getMessage(messageId).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改消息'
      })
    },
    /** 详情按钮操作 */
    handleView(row) {
      const messageId = row.id
      getMessage(messageId).then(response => {
        this.messageDetail = response.data
        this.detailOpen = true
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateMessage(this.form).then(response => {
              this.$modal.msgSuccess('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            addMessage(this.form).then(response => {
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
      const messageIds = row.id || this.ids
      this.$modal.confirm('是否确认删除消息编号为"' + messageIds + '"的数据项？').then(function() {
        return delMessage(messageIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    /** 发送消息 */
    handleSend(row) {
      const messageId = row.id
      this.$modal.confirm('是否确认发送该消息？').then(function() {
        return sendMessage({ messageId })
      }).then(() => {
        this.$modal.msgSuccess('发送成功')
        this.getList()
      }).catch(() => {})
    },
    /** 预览消息 */
    handlePreview(row) {
      previewMessage({ messageId: row.id }).then(response => {
        window.open(response.data.previewUrl, '_blank')
      })
    },
    /** 群发消息 */
    handleBroadcast() {
      if (this.ids.length === 0) {
        this.$modal.msgError('请选择要群发的消息')
        return
      }
      this.broadcastOpen = true
    },
    /** 提交群发 */
    submitBroadcast() {
      this.$refs['broadcastForm'].validate(valid => {
        if (valid) {
          const data = {
            messageIds: this.ids,
            ...this.broadcastForm
          }
          broadcastMessage(data).then(response => {
            this.$modal.msgSuccess('群发任务已提交，任务ID：' + response.data.taskId)
            this.broadcastOpen = false
            this.getList()
          })
        }
      })
    },
    /** 取消群发 */
    cancelBroadcast() {
      this.broadcastOpen = false
      this.broadcastForm = {
        targetType: 'all',
        tagIds: [],
        gender: null,
        estimatedCount: '5000'
      }
    },
    /** 导出按钮操作 */
    handleExport() {
      this.$modal.confirm('是否确认导出所有消息数据项？').then(() => {
        this.loading = true
        return exportMessage(this.queryParams)
      }).then(response => {
        this.$modal.msgSuccess('导出成功，下载地址：' + response.data.downloadUrl)
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    /** 消息类型改变 */
    handleMessageTypeChange(value) {
      // 清空相关字段
      this.form.imageUrl = null
      this.form.linkUrl = null
    },
    /** 定时发送改变 */
    handleScheduledChange(value) {
      if (!value) {
        this.form.sendTime = null
      }
    },
    /** 获取消息类型标签 */
    getMessageTypeTag(type) {
      const typeMap = {
        text: 'primary',
        news: 'success',
        image: 'warning',
        voice: 'info',
        video: 'danger'
      }
      return typeMap[type] || 'info'
    },
    /** 获取消息类型文本 */
    getMessageTypeText(type) {
      const typeMap = {
        text: '文本消息',
        news: '图文消息',
        image: '图片消息',
        voice: '语音消息',
        video: '视频消息'
      }
      return typeMap[type] || '未知'
    },
    /** 获取状态标签 */
    getStatusTag(status) {
      const statusMap = {
        draft: 'info',
        sending: 'warning',
        sent: 'success',
        failed: 'danger'
      }
      return statusMap[status] || 'info'
    },
    /** 获取状态文本 */
    getStatusText(status) {
      const statusMap = {
        draft: '草稿',
        sending: '发送中',
        sent: '已发送',
        failed: '发送失败'
      }
      return statusMap[status] || '未知'
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

.message-content {
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>