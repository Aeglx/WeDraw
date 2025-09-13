<template>
  <div class="points-mall-products">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>积分商城 - 商品管理</h1>
        <p>管理积分商城中的商品信息，包括商品的添加、编辑、删除和状态管理</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增商品
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入商品
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出商品
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #e1f3ff; color: #409eff;">
            <el-icon size="24"><Goods /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.total || 0 }}</div>
            <div class="stat-label">商品总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #e8f8f5; color: #67c23a;">
            <el-icon size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.active || 0 }}</div>
            <div class="stat-label">上架商品</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #fef0f0; color: #f56c6c;">
            <el-icon size="24"><WarningFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.low_stock || 0 }}</div>
            <div class="stat-label">库存预警</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #fdf6ec; color: #e6a23c;">
            <el-icon size="24"><Star /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ statistics.featured || 0 }}</div>
            <div class="stat-label">推荐商品</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form ref="searchFormRef" :model="searchForm" :inline="true">
        <el-form-item label="商品名称" prop="name">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入商品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="商品SKU" prop="sku">
          <el-input
            v-model="searchForm.sku"
            placeholder="请输入商品SKU"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="商品分类" prop="category_id">
          <el-select
            v-model="searchForm.category_id"
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
        <el-form-item label="商品状态" prop="status">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="上架" value="active" />
            <el-option label="下架" value="inactive" />
            <el-option label="售罄" value="sold_out" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearchForm">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 商品列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="productList"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.image"
              :src="row.image"
              :preview-src-list="[row.image]"
              style="width: 60px; height: 60px; border-radius: 4px;"
              fit="cover"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="image-slot">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="sku" label="商品SKU" width="120" />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            {{ getCategoryName(row.category_id) }}
          </template>
        </el-table-column>
        <el-table-column label="积分价格" width="100">
          <template #default="{ row }">
            <span class="points-price">{{ row.points }}积分</span>
          </template>
        </el-table-column>
        <el-table-column label="现金价格" width="100">
          <template #default="{ row }">
            <span v-if="row.cash_price > 0">¥{{ row.cash_price }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.stock <= row.low_stock_threshold" type="danger" size="small">
              {{ row.stock }}
            </el-tag>
            <span v-else>{{ row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否推荐" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_featured"
              @change="handleFeaturedChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="handleCopy(row)">
              复制
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <Pagination
          v-model:page="pagination.page"
          v-model:limit="pagination.limit"
          :total="pagination.total"
          @pagination="fetchProductList"
        />
      </div>
    </el-card>

    <!-- 添加/修改商品对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑商品' : '新增商品'"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="productForm.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品SKU" prop="sku">
              <el-input v-model="productForm.sku" placeholder="请输入商品SKU" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品分类" prop="category_id">
              <el-select v-model="productForm.category_id" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="category in categoryList"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品状态" prop="status">
              <el-select v-model="productForm.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="上架" value="active" />
                <el-option label="下架" value="inactive" />
                <el-option label="售罄" value="sold_out" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="积分价格" prop="points">
              <el-input-number
                v-model="productForm.points"
                :min="0"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="现金价格" prop="cash_price">
              <el-input-number
                v-model="productForm.cash_price"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库存数量" prop="stock">
              <el-input-number
                v-model="productForm.stock"
                :min="0"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="库存预警" prop="low_stock_threshold">
              <el-input-number
                v-model="productForm.low_stock_threshold"
                :min="0"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否推荐">
              <el-switch v-model="productForm.is_featured" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="商品图片">
          <el-upload
            class="upload-demo"
            action="#"
            :http-request="handleImageUpload"
            :before-upload="beforeImageUpload"
            :show-file-list="false"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png文件，且不超过2MB
              </div>
            </template>
          </el-upload>
          <div v-if="productForm.image" class="image-preview">
            <el-image
              :src="productForm.image"
              style="width: 100px; height: 100px; border-radius: 4px;"
              fit="cover"
            />
          </div>
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述"
          />
        </el-form-item>
        <el-form-item label="商品详情">
          <el-input
            v-model="productForm.detail"
            type="textarea"
            :rows="5"
            placeholder="请输入商品详情"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 商品详情对话框 -->
    <el-dialog v-model="detailVisible" title="商品详情" width="600px">
      <div v-if="currentProduct" class="product-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品名称">{{ currentProduct.name }}</el-descriptions-item>
          <el-descriptions-item label="商品SKU">{{ currentProduct.sku }}</el-descriptions-item>
          <el-descriptions-item label="商品分类">{{ getCategoryName(currentProduct.category_id) }}</el-descriptions-item>
          <el-descriptions-item label="商品状态">
            <el-tag :type="getStatusType(currentProduct.status)" size="small">
              {{ getStatusText(currentProduct.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="积分价格">{{ currentProduct.points }}积分</el-descriptions-item>
          <el-descriptions-item label="现金价格">
            <span v-if="currentProduct.cash_price > 0">¥{{ currentProduct.cash_price }}</span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="库存数量">{{ currentProduct.stock }}</el-descriptions-item>
          <el-descriptions-item label="库存预警">{{ currentProduct.low_stock_threshold }}</el-descriptions-item>
          <el-descriptions-item label="是否推荐">
            <el-tag :type="currentProduct.is_featured ? 'success' : 'info'" size="small">
              {{ currentProduct.is_featured ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentProduct.created_at }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="currentProduct.image" class="product-image">
          <h4>商品图片</h4>
          <el-image
            :src="currentProduct.image"
            :preview-src-list="[currentProduct.image]"
            style="width: 200px; height: 200px; border-radius: 4px;"
            fit="cover"
          />
        </div>
        <div v-if="currentProduct.description" class="product-description">
          <h4>商品描述</h4>
          <p>{{ currentProduct.description }}</p>
        </div>
        <div v-if="currentProduct.detail" class="product-detail-content">
          <h4>商品详情</h4>
          <div v-html="currentProduct.detail"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Download, Search, Refresh, Goods, CircleCheck,
  WarningFilled, Star, Picture
} from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination/index.vue'
import {
  getProductList, getProductDetail, createProduct, updateProduct,
  deleteProduct, batchDeleteProducts, updateProductStatus,
  copyProduct, exportProducts, importProducts,
  getCategoryList, getProductStatistics
} from '@/api/points-mall/products'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editingProduct = ref(null)
const currentProduct = ref(null)
const selectedProducts = ref([])

// 表单引用
const searchFormRef = ref()
const productFormRef = ref()

// 列表数据
const productList = ref([])
const categoryList = ref([])
const statistics = ref({})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  name: '',
  sku: '',
  category_id: '',
  status: ''
})

// 商品表单
const productForm = reactive({
  name: '',
  sku: '',
  category_id: '',
  description: '',
  points: 0,
  cash_price: 0,
  stock: 0,
  low_stock_threshold: 10,
  image: '',
  status: 'active',
  is_featured: false,
  detail: ''
})

// 表单验证规则
const productRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  sku: [{ required: true, message: '请输入商品SKU', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  points: [{ required: true, message: '请输入积分价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
}

// 获取商品列表
const fetchProductList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    const response = await getProductList(params)
    productList.value = response.data.list
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategoryList = async () => {
  try {
    const response = await getCategoryList()
    categoryList.value = response.data
  } catch (error) {
    ElMessage.error('获取分类列表失败')
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const response = await getProductStatistics()
    statistics.value = response.data
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchProductList()
}

// 重置搜索表单
const resetSearchForm = () => {
  Object.assign(searchForm, {
    name: '',
    sku: '',
    category_id: '',
    status: ''
  })
  if (searchFormRef.value) {
    searchFormRef.value.clearValidate()
  }
  handleSearch()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedProducts.value = selection
}

// 新增商品
const handleAdd = () => {
  isEdit.value = false
  editingProduct.value = null
  resetProductForm()
  dialogVisible.value = true
}

// 编辑商品
const handleEdit = async (row) => {
  try {
    isEdit.value = true
    editingProduct.value = row
    const response = await getProductDetail(row.id)
    Object.assign(productForm, response.data)
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取商品详情失败')
  }
}

// 查看商品
const handleView = async (row) => {
  try {
    const response = await getProductDetail(row.id)
    currentProduct.value = response.data
    detailVisible.value = true
  } catch (error) {
    ElMessage.error('获取商品详情失败')
  }
}

// 复制商品
const handleCopy = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要复制商品 "${row.name}" 吗？`,
      '确认复制',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await copyProduct(row.id)
    ElMessage.success('复制成功')
    fetchProductList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('复制失败')
    }
  }
}

// 删除商品
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品 "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteProduct(row.id)
    ElMessage.success('删除成功')
    fetchProductList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 推荐状态变化
const handleFeaturedChange = async (row) => {
  try {
    await updateProductStatus(row.id, { is_featured: row.is_featured })
    ElMessage.success('更新成功')
  } catch (error) {
    ElMessage.error('更新失败')
    row.is_featured = !row.is_featured
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await productFormRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await updateProduct(editingProduct.value.id, productForm)
      ElMessage.success('更新成功')
    } else {
      await createProduct(productForm)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    fetchProductList()
    fetchStatistics()
  } catch (error) {
    if (error !== false) {
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    }
  } finally {
    submitting.value = false
  }
}

// 导入商品
const handleImport = () => {
  ElMessage.info('导入功能开发中')
}

// 导出商品
const handleExport = async () => {
  try {
    await exportProducts(searchForm)
    ElMessage.success('导出任务已创建，请稍后下载')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 图片上传前验证
const beforeImageUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传图片只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

// 处理图片上传
const handleImageUpload = (options) => {
  // 这里应该调用实际的上传接口
  // 暂时模拟上传成功
  ElMessage.success('图片上传成功')
  productForm.image = 'https://via.placeholder.com/300x300'
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = categoryList.value.find(item => item.id === categoryId)
  return category ? category.name : '-'
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    active: 'success',
    inactive: 'warning',
    sold_out: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    active: '上架',
    inactive: '下架',
    sold_out: '售罄'
  }
  return statusMap[status] || '未知'
}

// 对话框关闭处理
const handleDialogClose = () => {
  resetProductForm()
}

// 重置表单
const resetProductForm = () => {
  Object.assign(productForm, {
    name: '',
    sku: '',
    category_id: '',
    description: '',
    points: 0,
    cash_price: 0,
    stock: 0,
    low_stock_threshold: 10,
    image: '',
    status: 'active',
    is_featured: false,
    detail: ''
  })
  editingProduct.value = null
  if (productFormRef.value) {
    productFormRef.value.clearValidate()
  }
}

// 生命周期
onMounted(() => {
  fetchProductList()
  fetchCategoryList()
  fetchStatistics()
})
</script>

<style scoped>
.points-mall-products {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.header-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.search-card,
.table-card {
  margin-bottom: 20px;
}

.points-price {
  color: #e6a23c;
  font-weight: bold;
}

.text-muted {
  color: #909399;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  background: #f5f7fa;
  color: #909399;
  border-radius: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.image-preview {
  margin-top: 10px;
}

.product-detail {
  .product-image,
  .product-description,
  .product-detail-content {
    margin-top: 20px;
  }
  
  h4 {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: #303133;
  }
  
  p {
    margin: 0;
    color: #606266;
    line-height: 1.6;
  }
}
</style>