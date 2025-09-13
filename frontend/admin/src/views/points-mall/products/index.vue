<template>
  <div class="points-mall-products">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">商品管理</h1>
        <p class="page-description">管理积分商城商品信息、库存和价格</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加商品
        </el-button>
        <el-button @click="showImportDialog = true">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button @click="exportProducts">
          <el-icon><Download /></el-icon>
          导出商品
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><Goods /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.total_products }}</div>
              <div class="stat-label">商品总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.active_products }}</div>
              <div class="stat-label">上架商品</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon stock">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.low_stock_products }}</div>
              <div class="stat-label">库存预警</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon value">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statistics.total_value }}</div>
              <div class="stat-label">商品总价值</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="商品名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入商品名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="商品分类">
          <el-select
            v-model="searchForm.category_id"
            placeholder="请选择分类"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
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
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="上架" value="active" />
            <el-option label="下架" value="inactive" />
            <el-option label="售罄" value="sold_out" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分范围">
          <el-input
            v-model="searchForm.min_points"
            placeholder="最低积分"
            style="width: 100px"
          />
          <span style="margin: 0 8px">-</span>
          <el-input
            v-model="searchForm.max_points"
            placeholder="最高积分"
            style="width: 100px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 商品列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="productList"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="商品信息" min-width="300">
          <template #default="{ row }">
            <div class="product-info">
              <el-image
                :src="row.image"
                :preview-src-list="[row.image]"
                class="product-image"
                fit="cover"
              />
              <div class="product-details">
                <div class="product-name">{{ row.name }}</div>
                <div class="product-desc">{{ row.description }}</div>
                <div class="product-sku">SKU: {{ row.sku }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column label="积分价格" width="120">
          <template #default="{ row }">
            <span class="points-price">{{ row.points }}积分</span>
          </template>
        </el-table-column>
        <el-table-column label="现金价格" width="120">
          <template #default="{ row }">
            <span v-if="row.cash_price > 0" class="cash-price">¥{{ row.cash_price }}</span>
            <span v-else class="no-cash">纯积分</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100">
          <template #default="{ row }">
            <span :class="{ 'low-stock': row.stock <= row.low_stock_threshold }">
              {{ row.stock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="sales_count" label="销量" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="editProduct(row)"
            >
              编辑
            </el-button>
            <el-button
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '下架' : '上架' }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteProduct(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
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
    </div>

    <!-- 添加/编辑商品对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingProduct ? '编辑商品' : '添加商品'"
      width="800px"
      :before-close="handleDialogClose"
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
        
        <el-form-item label="商品分类" prop="category_id">
          <el-select v-model="productForm.category_id" placeholder="请选择商品分类" style="width: 100%">
            <el-option
              v-for="category in categoryList"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="商品描述">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入商品描述"
          />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="积分价格" prop="points">
              <el-input-number
                v-model="productForm.points"
                :min="0"
                :step="10"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="现金价格">
              <el-input-number
                v-model="productForm.cash_price"
                :min="0"
                :precision="2"
                :step="0.01"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="库存数量" prop="stock">
              <el-input-number
                v-model="productForm.stock"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存预警">
              <el-input-number
                v-model="productForm.low_stock_threshold"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="商品图片">
          <el-upload
            class="image-uploader"
            action="/api/upload/image"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
          >
            <img v-if="productForm.image" :src="productForm.image" class="uploaded-image" />
            <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品状态">
              <el-radio-group v-model="productForm.status">
                <el-radio label="active">上架</el-radio>
                <el-radio label="inactive">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否推荐">
              <el-switch v-model="productForm.is_featured" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="商品详情">
          <el-input
            v-model="productForm.detail"
            type="textarea"
            :rows="5"
            placeholder="请输入商品详细信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProduct" :loading="saving">
          {{ editingProduct ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="批量导入商品"
      width="600px"
    >
      <div class="import-section">
        <div class="import-tips">
          <h4>导入说明：</h4>
          <ul>
            <li>支持Excel文件格式（.xlsx, .xls）</li>
            <li>文件大小不超过10MB</li>
            <li>请按照模板格式填写数据</li>
            <li>必填字段：商品名称、SKU、分类、积分价格、库存</li>
          </ul>
          <el-button type="primary" @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
        </div>
        
        <el-upload
          class="upload-demo"
          drag
          action="/api/products/import"
          :on-success="handleImportSuccess"
          :on-error="handleImportError"
          :before-upload="beforeImportUpload"
          accept=".xlsx,.xls"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传Excel文件，且不超过10MB
            </div>
          </template>
        </el-upload>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Upload,
  Download,
  Goods,
  Check,
  Warning,
  Money,
  Search,
  Refresh,
  UploadFilled
} from '@element-plus/icons-vue'
import {
  getProductList,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct as deleteProductAPI,
  updateProductStatus,
  getProductStatistics,
  getCategoryList,
  exportProducts as exportProductsAPI,
  importProducts,
  getProductTemplate
} from '@/api/points-mall/products'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const showAddDialog = ref(false)
const showImportDialog = ref(false)
const editingProduct = ref(null)

const productList = ref([])
const categoryList = ref([])

const statistics = ref({
  total_products: 0,
  active_products: 0,
  low_stock_products: 0,
  total_value: 0
})

const searchForm = reactive({
  name: '',
  category_id: '',
  status: '',
  min_points: '',
  max_points: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

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

const productRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  sku: [{ required: true, message: '请输入商品SKU', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  points: [{ required: true, message: '请输入积分价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
}

// 方法
const fetchProductList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    
    const { data } = await getProductList(params)
    productList.value = data.list
    pagination.total = data.total
  } catch (error) {
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const fetchCategoryList = async () => {
  try {
    const { data } = await getCategoryList()
    categoryList.value = data.list
  } catch (error) {
    ElMessage.error('获取分类列表失败')
  }
}

const fetchStatistics = async () => {
  try {
    const { data } = await getProductStatistics()
    statistics.value = data
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchProductList()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    category_id: '',
    status: '',
    min_points: '',
    max_points: ''
  })
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.size = size
  fetchProductList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchProductList()
}

const editProduct = async (row) => {
  try {
    const { data } = await getProductDetail(row.id)
    Object.assign(productForm, data)
    editingProduct.value = row
    showAddDialog.value = true
  } catch (error) {
    ElMessage.error('获取商品详情失败')
  }
}

const saveProduct = async () => {
  try {
    saving.value = true
    
    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id, productForm)
      ElMessage.success('商品更新成功')
    } else {
      await createProduct(productForm)
      ElMessage.success('商品添加成功')
    }
    
    showAddDialog.value = false
    resetProductForm()
    fetchProductList()
    fetchStatistics()
  } catch (error) {
    ElMessage.error(editingProduct.value ? '商品更新失败' : '商品添加失败')
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (row) => {
  try {
    const newStatus = row.status === 'active' ? 'inactive' : 'active'
    await updateProductStatus(row.id, { status: newStatus })
    ElMessage.success('商品状态更新成功')
    fetchProductList()
    fetchStatistics()
  } catch (error) {
    ElMessage.error('商品状态更新失败')
  }
}

const deleteProduct = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除此商品？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteProductAPI(id)
    ElMessage.success('商品删除成功')
    fetchProductList()
    fetchStatistics()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('商品删除失败')
    }
  }
}

const exportProducts = async () => {
  try {
    const { data } = await exportProductsAPI(searchForm)
    ElMessage.success('导出任务已创建，请稍后下载')
    // 这里可以添加下载逻辑
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const downloadTemplate = async () => {
  try {
    const { data } = await getProductTemplate()
    // 创建下载链接
    const link = document.createElement('a')
    link.href = data.download_url
    link.download = '商品导入模板.xlsx'
    link.click()
  } catch (error) {
    ElMessage.error('模板下载失败')
  }
}

const handleImageSuccess = (response) => {
  productForm.image = response.data.url
}

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

const beforeImportUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传Excel文件!')
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
  }
  return isExcel && isLt10M
}

const handleImportSuccess = (response) => {
  ElMessage.success(`导入成功，共导入${response.data.success_count}个商品`)
  showImportDialog.value = false
  fetchProductList()
  fetchStatistics()
}

const handleImportError = () => {
  ElMessage.error('导入失败，请检查文件格式')
}

const getStatusType = (status) => {
  const statusMap = {
    active: 'success',
    inactive: 'warning',
    sold_out: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    active: '上架',
    inactive: '下架',
    sold_out: '售罄'
  }
  return statusMap[status] || '未知'
}

const handleDialogClose = () => {
  resetProductForm()
}

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
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.stock {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.value {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-sku {
  font-size: 12px;
  color: #C0C4CC;
}

.points-price {
  color: #E6A23C;
  font-weight: 500;
}

.cash-price {
  color: #F56C6C;
  font-weight: 500;
}

.no-cash {
  color: #909399;
  font-size: 12px;
}

.low-stock {
  color: #F56C6C;
  font-weight: 500;
}

.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: 0.2s;
}

.image-uploader:hover {
  border-color: #409eff;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  text-align: center;
  line-height: 120px;
}

.uploaded-image {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: cover;
}

.import-section {
  padding: 20px 0;
}

.import-tips {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.import-tips h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

.import-tips ul {
  margin: 0 0 16px 0;
  padding-left: 20px;
}

.import-tips li {
  margin-bottom: 4px;
  color: #606266;
  font-size: 14px;
}
</style>