<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>小程序基础配置</span>
          </template>
          
          <el-form :model="configForm" :rules="configRules" ref="configFormRef" label-width="120px">
            <el-form-item label="小程序名称" prop="app_name">
              <el-input v-model="configForm.app_name" placeholder="请输入小程序名称" />
            </el-form-item>
            
            <el-form-item label="AppID" prop="app_id">
              <el-input v-model="configForm.app_id" placeholder="请输入小程序AppID" />
              <div class="form-tip">
                在微信公众平台的「开发」-「开发管理」-「开发设置」中获取
              </div>
            </el-form-item>
            
            <el-form-item label="AppSecret" prop="app_secret">
              <el-input v-model="configForm.app_secret" type="password" show-password placeholder="请输入小程序AppSecret" />
              <div class="form-tip">
                在微信公众平台的「开发」-「开发管理」-「开发设置」中获取
              </div>
            </el-form-item>
            
            <el-form-item label="服务器域名">
              <el-input v-model="configForm.server_domain" placeholder="请输入服务器域名" />
              <div class="form-tip">
                小程序后端服务器域名，需要在微信公众平台配置服务器域名
              </div>
            </el-form-item>
            
            <el-form-item label="消息推送URL">
              <el-input v-model="configForm.message_url" placeholder="请输入消息推送URL" />
              <div class="form-tip">
                用于接收微信推送的消息和事件
              </div>
            </el-form-item>
            
            <el-form-item label="Token" prop="token">
              <el-input v-model="configForm.token" placeholder="请输入Token" />
              <div class="form-tip">
                用于验证消息推送URL的有效性，3-32位字符
              </div>
            </el-form-item>
            
            <el-form-item label="EncodingAESKey">
              <el-input v-model="configForm.encoding_aes_key" placeholder="请输入EncodingAESKey" />
              <div class="form-tip">
                用于消息加解密，43位字符（可选）
              </div>
            </el-form-item>
            
            <el-form-item label="消息加解密方式">
              <el-radio-group v-model="configForm.encrypt_mode">
                <el-radio label="plaintext">明文模式</el-radio>
                <el-radio label="compatible">兼容模式</el-radio>
                <el-radio label="safe">安全模式</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="版本号">
              <el-input v-model="configForm.version" placeholder="请输入当前版本号" />
            </el-form-item>
            
            <el-form-item label="启用状态">
              <el-switch v-model="configForm.enabled" active-text="启用" inactive-text="禁用" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveConfig" :loading="saving">
                保存配置
              </el-button>
              <el-button @click="testConnection" :loading="testing">
                测试连接
              </el-button>
              <el-button @click="resetForm">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>域名配置</span>
          </template>
          
          <el-form :model="domainForm" label-width="120px">
            <el-form-item label="request域名">
              <el-input
                v-model="domainForm.request_domain"
                type="textarea"
                :rows="3"
                placeholder="请输入request合法域名，每行一个"
              />
              <div class="form-tip">
                小程序可以发起网络请求的域名列表
              </div>
            </el-form-item>
            
            <el-form-item label="socket域名">
              <el-input
                v-model="domainForm.socket_domain"
                type="textarea"
                :rows="2"
                placeholder="请输入socket合法域名，每行一个"
              />
              <div class="form-tip">
                小程序可以进行socket通信的域名列表
              </div>
            </el-form-item>
            
            <el-form-item label="uploadFile域名">
              <el-input
                v-model="domainForm.upload_domain"
                type="textarea"
                :rows="2"
                placeholder="请输入uploadFile合法域名，每行一个"
              />
              <div class="form-tip">
                小程序可以上传文件的域名列表
              </div>
            </el-form-item>
            
            <el-form-item label="downloadFile域名">
              <el-input
                v-model="domainForm.download_domain"
                type="textarea"
                :rows="2"
                placeholder="请输入downloadFile合法域名，每行一个"
              />
              <div class="form-tip">
                小程序可以下载文件的域名列表
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveDomainConfig" :loading="savingDomain">
                保存域名配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>小程序信息</span>
            <el-button type="text" @click="refreshAppInfo" :loading="refreshing">
              刷新
            </el-button>
          </template>
          
          <el-descriptions v-if="appInfo" :column="1" border>
            <el-descriptions-item label="小程序名称">
              {{ appInfo.nickname }}
            </el-descriptions-item>
            <el-descriptions-item label="头像">
              <img v-if="appInfo.head_img" :src="appInfo.head_img" style="width: 50px; height: 50px; border-radius: 4px;" />
            </el-descriptions-item>
            <el-descriptions-item label="认证状态">
              <el-tag :type="appInfo.verify_type_info ? 'success' : 'warning'">
                {{ appInfo.verify_type_info ? '已认证' : '未认证' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="主体名称">
              {{ appInfo.principal_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="功能介绍">
              {{ appInfo.signature || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="小程序码">
              <img v-if="appInfo.qrcode_url" :src="appInfo.qrcode_url" style="width: 100px; height: 100px;" />
            </el-descriptions-item>
          </el-descriptions>
          
          <el-empty v-else description="暂无小程序信息" />
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>访问统计</span>
          </template>
          
          <el-descriptions v-if="statistics" :column="1" border>
            <el-descriptions-item label="今日访问量">
              {{ statistics.today_pv || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="今日访客数">
              {{ statistics.today_uv || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="累计用户数">
              {{ statistics.total_users || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="累计访问量">
              {{ statistics.total_pv || 0 }}
            </el-descriptions-item>
          </el-descriptions>
          
          <el-empty v-else description="暂无统计数据" />
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>配置说明</span>
          </template>
          
          <div class="config-help">
            <h4>配置步骤：</h4>
            <ol>
              <li>登录微信公众平台</li>
              <li>在「开发」-「开发管理」-「开发设置」中获取AppID和AppSecret</li>
              <li>配置服务器域名和消息推送</li>
              <li>填写上述信息并保存配置</li>
              <li>点击「测试连接」验证配置是否正确</li>
            </ol>
            
            <h4>注意事项：</h4>
            <ul>
              <li>AppSecret需要妥善保管，不要泄露</li>
              <li>服务器域名必须是HTTPS协议</li>
              <li>域名需要在微信公众平台进行配置</li>
              <li>消息推送URL用于接收微信推送的消息</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getMiniprogramConfig,
  saveMiniprogramConfig,
  testMiniprogramConnection,
  getAppInfo,
  getStatistics,
  saveDomainConfig as saveDomainConfigApi
} from '@/api/miniprogram'

const configFormRef = ref(null)
const saving = ref(false)
const savingDomain = ref(false)
const testing = ref(false)
const refreshing = ref(false)

const configForm = reactive({
  app_name: '',
  app_id: '',
  app_secret: '',
  server_domain: '',
  message_url: '',
  token: '',
  encoding_aes_key: '',
  encrypt_mode: 'plaintext',
  version: '1.0.0',
  enabled: true
})

const domainForm = reactive({
  request_domain: '',
  socket_domain: '',
  upload_domain: '',
  download_domain: ''
})

const configRules = {
  app_name: [{ required: true, message: '请输入小程序名称', trigger: 'blur' }],
  app_id: [{ required: true, message: '请输入小程序AppID', trigger: 'blur' }],
  app_secret: [{ required: true, message: '请输入小程序AppSecret', trigger: 'blur' }],
  token: [
    { required: true, message: '请输入Token', trigger: 'blur' },
    { min: 3, max: 32, message: 'Token长度应为3-32位字符', trigger: 'blur' }
  ]
}

const appInfo = ref(null)
const statistics = ref(null)

const getConfigData = async () => {
  try {
    const response = await getMiniprogramConfig()
    Object.assign(configForm, response.data.config)
    Object.assign(domainForm, response.data.domain)
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

const saveConfig = async () => {
  try {
    await configFormRef.value.validate()
    saving.value = true
    await saveMiniprogramConfig(configForm)
    ElMessage.success('配置保存成功')
  } catch (error) {
    if (error.message) {
      ElMessage.error('保存失败: ' + error.message)
    }
  } finally {
    saving.value = false
  }
}

const saveDomainConfig = async () => {
  try {
    savingDomain.value = true
    await saveDomainConfigApi(domainForm)
    ElMessage.success('域名配置保存成功')
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    savingDomain.value = false
  }
}

const testConnection = async () => {
  try {
    await configFormRef.value.validate()
    testing.value = true
    const response = await testMiniprogramConnection(configForm)
    if (response.data.success) {
      ElMessage.success('连接测试成功')
    } else {
      ElMessage.error('连接测试失败: ' + response.data.message)
    }
  } catch (error) {
    ElMessage.error('连接测试失败: ' + error.message)
  } finally {
    testing.value = false
  }
}

const resetForm = () => {
  configFormRef.value.resetFields()
}

const refreshAppInfo = async () => {
  try {
    refreshing.value = true
    const [appResponse, statsResponse] = await Promise.all([
      getAppInfo(),
      getStatistics()
    ])
    appInfo.value = appResponse.data
    statistics.value = statsResponse.data
  } catch (error) {
    ElMessage.error('获取信息失败: ' + error.message)
  } finally {
    refreshing.value = false
  }
}

onMounted(() => {
  getConfigData()
  refreshAppInfo()
})
</script>

<style lang="scss" scoped>
.app-container {
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
    line-height: 1.4;
  }
  
  .config-help {
    font-size: 14px;
    line-height: 1.6;
    
    h4 {
      margin: 15px 0 10px 0;
      color: #303133;
    }
    
    ol, ul {
      margin: 0;
      padding-left: 20px;
      
      li {
        margin-bottom: 5px;
        color: #606266;
      }
    }
  }
}
</style>