<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>公众号基础配置</span>
        </div>
      </template>
      
      <el-form
        ref="configForm"
        :model="configData"
        :rules="rules"
        label-width="120px"
        style="max-width: 600px"
      >
        <el-form-item label="公众号名称" prop="name">
          <el-input v-model="configData.name" placeholder="请输入公众号名称" />
        </el-form-item>
        
        <el-form-item label="AppID" prop="app_id">
          <el-input v-model="configData.app_id" placeholder="请输入AppID" />
        </el-form-item>
        
        <el-form-item label="AppSecret" prop="app_secret">
          <el-input
            v-model="configData.app_secret"
            type="password"
            placeholder="请输入AppSecret"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="Token" prop="token">
          <el-input v-model="configData.token" placeholder="请输入Token">
            <template #append>
              <el-button @click="generateToken">生成</el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="EncodingAESKey" prop="encoding_aes_key">
          <el-input v-model="configData.encoding_aes_key" placeholder="请输入EncodingAESKey">
            <template #append>
              <el-button @click="generateAESKey">生成</el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="服务器URL">
          <el-input v-model="serverUrl" readonly>
            <template #append>
              <el-button @click="copyUrl">复制</el-button>
            </template>
          </el-input>
          <div class="form-tip">
            请将此URL配置到微信公众平台的服务器配置中
          </div>
        </el-form-item>
        
        <el-form-item label="消息加解密方式">
          <el-radio-group v-model="configData.encrypt_type">
            <el-radio label="0">明文模式</el-radio>
            <el-radio label="1">兼容模式</el-radio>
            <el-radio label="2">安全模式</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch
            v-model="configData.status"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="saveConfig" :loading="loading">
            保存配置
          </el-button>
          <el-button @click="testConnection" :loading="testLoading">
            测试连接
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="box-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>公众号信息</span>
          <el-button type="text" @click="refreshInfo" :loading="refreshLoading">
            刷新
          </el-button>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="公众号类型">
          {{ accountInfo.service_type_info?.id === 0 ? '订阅号' : accountInfo.service_type_info?.id === 1 ? '由历史老帐号升级后的订阅号' : accountInfo.service_type_info?.id === 2 ? '服务号' : '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="认证状态">
          <el-tag :type="accountInfo.verify_type_info?.id === -1 ? 'danger' : 'success'">
            {{ accountInfo.verify_type_info?.id === -1 ? '未认证' : '已认证' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="原始ID">
          {{ accountInfo.user_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="主体名称">
          {{ accountInfo.principal_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="功能介绍" :span="2">
          {{ accountInfo.signature || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOfficialConfig, saveOfficialConfig, testOfficialConnection, getAccountInfo } from '@/api/official'

const configForm = ref(null)
const loading = ref(false)
const testLoading = ref(false)
const refreshLoading = ref(false)

const configData = reactive({
  name: '',
  app_id: '',
  app_secret: '',
  token: '',
  encoding_aes_key: '',
  encrypt_type: '0',
  status: true
})

const accountInfo = reactive({
  service_type_info: {},
  verify_type_info: {},
  user_name: '',
  principal_name: '',
  signature: ''
})

const serverUrl = ref('https://your-domain.com/api/wechat/official/callback')

const rules = {
  name: [{ required: true, message: '请输入公众号名称', trigger: 'blur' }],
  app_id: [{ required: true, message: '请输入AppID', trigger: 'blur' }],
  app_secret: [{ required: true, message: '请输入AppSecret', trigger: 'blur' }],
  token: [{ required: true, message: '请输入Token', trigger: 'blur' }]
}

const getConfig = async () => {
  try {
    const response = await getOfficialConfig()
    Object.assign(configData, response.data)
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

const saveConfig = async () => {
  try {
    await configForm.value.validate()
    loading.value = true
    await saveOfficialConfig(configData)
    ElMessage.success('配置保存成功')
  } catch (error) {
    console.error('保存配置失败:', error)
  } finally {
    loading.value = false
  }
}

const testConnection = async () => {
  try {
    testLoading.value = true
    await testOfficialConnection(configData)
    ElMessage.success('连接测试成功')
  } catch (error) {
    ElMessage.error('连接测试失败: ' + error.message)
  } finally {
    testLoading.value = false
  }
}

const refreshInfo = async () => {
  try {
    refreshLoading.value = true
    const response = await getAccountInfo()
    Object.assign(accountInfo, response.data)
  } catch (error) {
    ElMessage.error('获取公众号信息失败')
  } finally {
    refreshLoading.value = false
  }
}

const generateToken = () => {
  configData.token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

const generateAESKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 43; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  configData.encoding_aes_key = result
}

const copyUrl = () => {
  navigator.clipboard.writeText(serverUrl.value).then(() => {
    ElMessage.success('URL已复制到剪贴板')
  })
}

onMounted(() => {
  getConfig()
  refreshInfo()
})
</script>

<style lang="scss" scoped>
.app-container {
  .box-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
  }
}
</style>