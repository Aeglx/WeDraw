<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="filter-container">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="商品名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入商品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-select
            v-model="queryParams.categoryId"
            placeholder="请选择分类"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="category in categoryList"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="上架" value="1" />
            <el-option label="下架" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作区域 -->
    <el-card class="operate-container">
      <div class="operate-buttons">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增商品</el-button>
        <el-button
          type="success"
          icon="el-icon-edit"
          :disabled="single"
          @click="handleUpdate"
        >修改</el-button>
        <el-button
          type="danger"
          icon="el-icon-delete"
          :disabled="multiple"
          @click="handleDelete"
        >删除</el-button>
        <el-button type="info" icon="el-icon-upload2" @click="handleImport">导入</el-button>
        <el-button type="warning" icon="el-icon-download" @click="handleExport">导出</el-button>
      </div>
    </el-card>

    <!-- 商品列表 -->
    <el-card class="table-container">
      <el-table
        v-loading="loading"
        :data="productList"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="商品图片" align="center" width="100">
          <template slot-scope="scope">
            <el-image
              style="width: 60px; height: 60px"
              :src="scope.row.image"
              :preview-src-list="[scope.row.image]"
              fit="cover"
            >
              <div slot="error" class="image-slot">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column label="商品名称" prop="name" :show-overflow-tooltip="true" />
        <el-table-column label="分类" prop="categoryName" width="120" />
        <el-table-column label="积分价格" prop="points" width="100" sortable="custom">
          <template slot-scope="scope">
            <span class="points-price">{{ scope.row.points }}积分</span>
          </template>
        </el-table-column>
        <el-table-column label="库存" prop="stock" width="80" sortable="custom">
          <template slot-scope="scope">
            <el-tag :type="scope.row.stock > 10 ? 'success' : scope.row.stock > 0 ? 'warning' : 'danger'">
              {{ scope.row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="销量" prop="salesCount" width="80" sortable="custom" />
        <el-table-column label="状态" prop="status" width="80">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" sortable="custom" />
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
            <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button size="mini" type="text" icon="el-icon-copy-document" @click="handleCopy(scope.row)">复制</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              style="color: #f56c6c"
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 添加或修改商品对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="category in categoryList"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="积分价格" prop="points">
              <el-input-number
                v-model="form.points"
                :min="1"
                :max="999999"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存数量" prop="stock">
              <el-input-number
                v-model="form.stock"
                :min="0"
                :max="999999"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="商品图片" prop="image">
          <el-upload
            class="upload-demo"
            action="#"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="handleUpload"
          >
            <el-button size="small" type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过2MB</div>
          </el-upload>
          <div v-if="form.image" class="image-preview">
            <el-image
              style="width: 100px; height: 100px"
              :src="form.image"
              fit="cover"
            />
          </div>
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>
        <el-form-item label="商品状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 商品详情对话框 -->
    <el-dialog title="商品详情" :visible.sync="detailOpen" width="600px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商品名称">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="商品分类">{{ detailData.categoryName }}</el-descriptions-item>
        <el-descriptions-item label="积分价格">{{ detailData.points }}积分</el-descriptions-item>
        <el-descriptions-item label="库存数量">{{ detailData.stock }}</el-descriptions-item>
        <el-descriptions-item label="销量">{{ detailData.salesCount }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'">
            {{ detailData.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ detailData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="商品图片" :span="2">
          <el-image
            v-if="detailData.image"
            style="width: 200px; height: 200px"
            :src="detailData.image"
            :preview-src-list="[detailData.image]"
            fit="cover"
          />
        </el-descriptions-item>
        <el-descriptions-item label="商品描述" :span="2">{{ detailData.description }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import {
  getProductList,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  batchDeleteProducts,
  copyProduct,
  getCategoryList,
  exportProducts,
  importProducts
} from '@/api/points-mall/products'
import Pagination from '@/components/Pagination/index.vue'

export default {
  name: 'PointsProducts',
  components: {
    Pagination
  },
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
      // 商品表格数据
      productList: [],
      // 分类列表
      categoryList: [],
      // 弹出层标题
      title: '',
      // 是否显示弹出层
      open: false,
      // 是否显示详情弹出层
      detailOpen: false,
      // 详情数据
      detailData: {},
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        categoryId: null,
        status: null,
        orderByColumn: null,
        isAsc: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        name: [
          { required: true, message: '商品名称不能为空', trigger: 'blur' }
        ],
        categoryId: [
          { required: true, message: '商品分类不能为空', trigger: 'change' }
        ],
        points: [
          { required: true, message: '积分价格不能为空', trigger: 'blur' }
        ],
        stock: [
          { required: true, message: '库存数量不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getCategoryList()
  },
  methods: {
    /** 查询商品列表 */
    getList() {
      this.loading = true
      getProductList(this.queryParams).then(response => {
        this.productList = response.data.list
        this.total = response.data.total
        this.loading = false
      })
    },
    /** 查询分类列表 */
    getCategoryList() {
      getCategoryList().then(response => {
        this.categoryList = response.data
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
        id: null,
        name: null,
        categoryId: null,
        points: null,
        stock: null,
        image: null,
        description: null,
        status: 1
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
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    // 排序触发事件
    handleSortChange(column) {
      this.queryParams.orderByColumn = column.prop
      this.queryParams.isAsc = column.order === 'ascending' ? 'asc' : 'desc'
      this.getList()
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '添加商品'
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getProductDetail(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改商品'
      })
    },
    /** 查看按钮操作 */
    handleView(row) {
      getProductDetail(row.id).then(response => {
        this.detailData = response.data
        this.detailOpen = true
      })
    },
    /** 复制按钮操作 */
    handleCopy(row) {
      this.$confirm('是否确认复制该商品?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return copyProduct(row.id)
      }).then(() => {
        this.getList()
        this.$message.success('复制成功')
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateProduct(this.form.id, this.form).then(response => {
              this.$message.success('修改成功')
              this.open = false
              this.getList()
            })
          } else {
            createProduct(this.form).then(response => {
              this.$message.success('新增成功')
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$confirm('是否确认删除选中的商品数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        if (Array.isArray(ids)) {
          return batchDeleteProducts(ids)
        } else {
          return deleteProduct(ids)
        }
      }).then(() => {
        this.getList()
        this.$message.success('删除成功')
      })
    },
    /** 状态修改 */
    handleStatusChange(row) {
      const text = row.status === 1 ? '上架' : '下架'
      this.$confirm('确认要"' + text + '""' + row.name + '"商品吗?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return updateProductStatus(row.id, { status: row.status })
      }).then(() => {
        this.$message.success(text + '成功')
      }).catch(() => {
        row.status = row.status === 0 ? 1 : 0
      })
    },
    /** 导出按钮操作 */
    handleExport() {
      this.$confirm('是否确认导出所有商品数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return exportProducts(this.queryParams)
      }).then(response => {
        this.download(response.data)
      })
    },
    /** 导入按钮操作 */
    handleImport() {
      this.$message.info('导入功能开发中')
    },
    /** 文件上传前的钩子 */
    beforeUpload(file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPG) {
        this.$message.error('上传图片只能是 JPG/PNG 格式!')
      }
      if (!isLt2M) {
        this.$message.error('上传图片大小不能超过 2MB!')
      }
      return isJPG && isLt2M
    },
    /** 自定义上传 */
    handleUpload(options) {
      // 这里应该调用实际的上传接口
      // 暂时模拟上传成功
      this.$message.success('图片上传成功')
      this.form.image = 'https://via.placeholder.com/300x300'
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-container {
  margin-bottom: 20px;
}

.operate-container {
  margin-bottom: 20px;
  
  .operate-buttons {
    .el-button {
      margin-right: 10px;
    }
  }
}

.table-container {
  .points-price {
    color: #e6a23c;
    font-weight: bold;
  }
  
  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #909399;
    font-size: 20px;
  }
}

.image-preview {
  margin-top: 10px;
}

.upload-demo {
  .el-upload__tip {
    margin-top: 5px;
    font-size: 12px;
    color: #606266;
  }
}
</style>