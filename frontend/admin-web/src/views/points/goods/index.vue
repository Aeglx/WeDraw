<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品管理</span>
          <div class="header-actions">
            <el-input
              v-model="searchQuery"
              placeholder="搜索商品名称"
              style="width: 200px; margin-right: 10px;"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="statusFilter"
              placeholder="商品状态"
              style="width: 120px; margin-right: 10px;"
              clearable
              @change="handleStatusFilter"
            >
              <el-option label="上架" value="1" />
              <el-option label="下架" value="0" />
            </el-select>
            <el-button type="primary" @click="addGoods">
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 商品列表 -->
      <el-table :data="goodsList" border style="width: 100%" v-loading="loading">
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image
              :src="row.image_url"
              :preview-src-list="[row.image_url]"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px;"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="商品名称" min-width="150" show-overflow-tooltip />
        
        <el-table-column label="商品类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="所需积分" width="100">
          <template #default="{ row }">
            <span class="points-text">{{ row.points }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="stock" label="库存" width="80" />
        
        <el-table-column prop="sales" label="销量" width="80" />
        
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="sort" label="排序" width="80" />
        
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editGoods(row)">
              编辑
            </el-button>
            <el-button type="info" size="small" @click="viewGoods(row)">
              详情
            </el-button>
            <el-button type="danger" size="small" @click="deleteGoods(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-if="total > 0"
        :current-page="query.page"
        :page-size="query.limit"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px;"
      />
    </el-card>
    
    <!-- 商品编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择商品类型" style="width: 100%;">
                <el-option label="实物商品" value="physical" />
                <el-option label="虚拟商品" value="virtual" />
                <el-option label="优惠券" value="coupon" />
                <el-option label="会员权益" value="membership" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所需积分" prop="points">
              <el-input-number
                v-model="form.points"
                :min="1"
                :max="999999"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存数量" prop="stock">
              <el-input-number
                v-model="form.stock"
                :min="0"
                :max="999999"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number
                v-model="form.sort"
                :min="0"
                :max="999"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="form.status"
                :active-value="1"
                :inactive-value="0"
                active-text="上架"
                inactive-text="下架"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="商品图片" prop="image_url">
          <el-upload
            class="image-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
          >
            <img v-if="form.image_url" :src="form.image_url" class="uploaded-image" />
            <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
          />
        </el-form-item>
        
        <el-form-item label="详细说明" prop="detail">
          <el-input
            v-model="form.detail"
            type="textarea"
            :rows="6"
            placeholder="请输入详细说明"
          />
        </el-form-item>
        
        <!-- 实物商品特有字段 -->
        <template v-if="form.type === 'physical'">
          <el-form-item label="收货信息" prop="need_address">
            <el-switch
              v-model="form.need_address"
              active-text="需要收货地址"
              inactive-text="无需收货地址"
            />
          </el-form-item>
        </template>
        
        <!-- 优惠券特有字段 -->
        <template v-if="form.type === 'coupon'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="优惠金额" prop="coupon_amount">
                <el-input-number
                  v-model="form.coupon_amount"
                  :min="0"
                  :precision="2"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最低消费" prop="min_amount">
                <el-input-number
                  v-model="form.min_amount"
                  :min="0"
                  :precision="2"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="有效期(天)" prop="valid_days">
                <el-input-number
                  v-model="form.valid_days"
                  :min="1"
                  :max="365"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 商品详情对话框 -->
    <el-dialog
      title="商品详情"
      v-model="detailVisible"
      width="600px"
    >
      <el-descriptions v-if="currentGoods" :column="2" border>
        <el-descriptions-item label="商品图片" :span="2">
          <el-image
            :src="currentGoods.image_url"
            :preview-src-list="[currentGoods.image_url]"
            fit="cover"
            style="width: 100px; height: 100px;"
          />
        </el-descriptions-item>
        <el-descriptions-item label="商品名称">
          {{ currentGoods.name }}
        </el-descriptions-item>
        <el-descriptions-item label="商品类型">
          {{ getTypeName(currentGoods.type) }}
        </el-descriptions-item>
        <el-descriptions-item label="所需积分">
          {{ currentGoods.points }}
        </el-descriptions-item>
        <el-descriptions-item label="库存">
          {{ currentGoods.stock }}
        </el-descriptions-item>
        <el-descriptions-item label="销量">
          {{ currentGoods.sales }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentGoods.status ? 'success' : 'danger'">
            {{ currentGoods.status ? '上架' : '下架' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="排序">
          {{ currentGoods.sort }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatTime(currentGoods.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="商品描述" :span="2">
          {{ currentGoods.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="详细说明" :span="2">
          <div style="white-space: pre-wrap;">{{ currentGoods.detail || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Picture } from '@element-plus/icons-vue'
import {
  getGoods,
  createGoods,
  updateGoods,
  deleteGoods as deleteGoodsApi,
  updateGoodsStatus
} from '@/api/points'
import { getToken } from '@/utils/auth'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)

const searchQuery = ref('')
const statusFilter = ref('')
const currentGoods = ref(null)

const goodsList = ref([])
const total = ref(0)

const query = reactive({
  page: 1,
  limit: 20,
  search: '',
  status: ''
})

const form = reactive({
  id: null,
  name: '',
  type: 'physical',
  points: 1,
  stock: 0,
  sort: 0,
  status: 1,
  image_url: '',
  description: '',
  detail: '',
  need_address: true,
  coupon_amount: 0,
  min_amount: 0,
  valid_days: 30
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
  points: [{ required: true, message: '请输入所需积分', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }],
  image_url: [{ required: true, message: '请上传商品图片', trigger: 'blur' }]
}

const formRef = ref()

const dialogTitle = computed(() => {
  return form.id ? '编辑商品' : '添加商品'
})

const uploadUrl = computed(() => {
  return process.env.VUE_APP_BASE_API + '/upload/image'
})

const uploadHeaders = computed(() => {
  return {
    Authorization: 'Bearer ' + getToken()
  }
})

const getGoodsData = async () => {
  try {
    loading.value = true
    const response = await getGoods(query)
    goodsList.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    console.error('获取商品数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.search = searchQuery.value
  query.page = 1
  getGoodsData()
}

const handleStatusFilter = () => {
  query.status = statusFilter.value
  query.page = 1
  getGoodsData()
}

const handleSizeChange = (size) => {
  query.limit = size
  query.page = 1
  getGoodsData()
}

const handleCurrentChange = (page) => {
  query.page = page
  getGoodsData()
}

const addGoods = () => {
  resetForm()
  dialogVisible.value = true
}

const editGoods = (goods) => {
  Object.assign(form, goods)
  dialogVisible.value = true
}

const viewGoods = (goods) => {
  currentGoods.value = goods
  detailVisible.value = true
}

const deleteGoods = async (goods) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品「${goods.name}」吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteGoodsApi(goods.id)
    ElMessage.success('删除成功')
    getGoodsData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

const handleStatusChange = async (goods) => {
  try {
    await updateGoodsStatus(goods.id, goods.status)
    ElMessage.success('状态更新成功')
  } catch (error) {
    // 恢复原状态
    goods.status = goods.status ? 0 : 1
    ElMessage.error('状态更新失败: ' + error.message)
  }
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (form.id) {
      await updateGoods(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await createGoods(form)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    getGoodsData()
  } catch (error) {
    if (error.message) {
      ElMessage.error('操作失败: ' + error.message)
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    type: 'physical',
    points: 1,
    stock: 0,
    sort: 0,
    status: 1,
    image_url: '',
    description: '',
    detail: '',
    need_address: true,
    coupon_amount: 0,
    min_amount: 0,
    valid_days: 30
  })
  
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleImageSuccess = (response) => {
  if (response.code === 200) {
    form.image_url = response.data.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传失败: ' + response.message)
  }
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

const getTypeName = (type) => {
  const typeMap = {
    physical: '实物商品',
    virtual: '虚拟商品',
    coupon: '优惠券',
    membership: '会员权益'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type) => {
  const typeMap = {
    physical: 'primary',
    virtual: 'success',
    coupon: 'warning',
    membership: 'danger'
  }
  return typeMap[type] || 'info'
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString()
}

onMounted(() => {
  getGoodsData()
})
</script>

<style lang="scss" scoped>
.app-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
  }
  
  .points-text {
    color: #e6a23c;
    font-weight: bold;
  }
  
  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 60px;
    height: 60px;
    background: #f5f7fa;
    color: #909399;
    font-size: 20px;
    border-radius: 4px;
  }
}

.image-uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: 0.2s;
    
    &:hover {
      border-color: #409eff;
    }
  }
  
  .image-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    text-align: center;
    line-height: 178px;
  }
  
  .uploaded-image {
    width: 178px;
    height: 178px;
    display: block;
  }
}
</style>