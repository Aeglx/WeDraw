<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>企业微信基础配置</span>
          </template>
          
          <el-form :model="configForm" :rules="configRules" ref="configFormRef" label-width="120px">
            <el-form-item label="企业ID" prop="corp_id">
              <el-input v-model="configForm.corp_id" placeholder="请输入企业ID" />
              <div class="form-tip">
                在企业微信管理后台的「我的企业」-「企业信息」中获取
              </div>
            </el-form-item>
            
            <el-form-item label="应用Secret" prop="corp_secret">
              <el-input v-model="configForm.corp_secret" type="password" show-password placeholder="请输入应用Secret" />
              <div class="form-tip">
                在企业微信管理后台的「应用管理」-「自建应用」中获取
              </div>
            </el-form-item>
            
            <el-form-item label="应用ID" prop="agent_id">
              <el-input v-model="configForm.agent_id" placeholder="请输入应用ID" />
              <div class="form-tip">
                在企业微信管理后台的「应用管理」-「自建应用」中获取
              </div>
            </el-form-item>
            
            <el-form-item label="通讯录Secret" prop="contact_secret">
              <el-input v-model="configForm.contact_secret" type="password" show-password placeholder="请输入通讯录Secret" />
              <div class="form-tip">
                在企业微信管理后台的「管理工具」-「通讯录同步」中获取（可选）
              </div>
            </el-form-item>
            
            <el-form-item label="回调URL">
              <el-input v-model="configForm.callback_url" placeholder="请输入回调URL" />
              <div class="form-tip">
                用于接收企业微信推送的消息和事件
              </div>
            </el-form-item>
            
            <el-form-item label="Token" prop="token">
              <el-input v-model="configForm.token" placeholder="请输入Token" />
              <div class="form-tip">
                用于验证回调URL的有效性，3-32位字符
              </div>
            </el-form-item>
            
            <el-form-item label="EncodingAESKey" prop="encoding_aes_key">
              <el-input v-model="configForm.encoding_aes_key" placeholder="请输入EncodingAESKey" />
              <div class="form-tip">
                用于消息加解密，43位字符
              </div>
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
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>企业信息</span>
            <el-button type="text" @click="refreshCorpInfo" :loading="refreshing">
              刷新
            </el-button>
          </template>
          
          <el-descriptions v-if="corpInfo" :column="1" border>
            <el-descriptions-item label="企业名称">
              {{ corpInfo.corp_name }}
            </el-descriptions-item>
            <el-descriptions-item label="企业类型">
              {{ corpInfo.corp_type_name }}
            </el-descriptions-item>
            <el-descriptions-item label="企业规模">
              {{ corpInfo.corp_scale_name }}
            </el-descriptions-item>
            <el-descriptions-item label="所属行业">
              {{ corpInfo.corp_industry_name }}
            </el-descriptions-item>
            <el-descriptions-item label="企业简称">
              {{ corpInfo.corp_short_name }}
            </el-descriptions-item>
            <el-descriptions-item label="企业方形头像">
              <img v-if="corpInfo.corp_square_logo_url" :src="corpInfo.corp_square_logo_url" style="width: 50px; height: 50px;" />
            </el-descriptions-item>
          </el-descriptions>
          
          <el-empty v-else description="暂无企业信息" />
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>应用信息</span>
            <el-button type="text" @click="refreshAppInfo" :loading="refreshingApp">
              刷新
            </el-button>
          </template>
          
          <el-descriptions v-if="appInfo" :column="1" border>
            <el-descriptions-item label="应用名称">
              {{ appInfo.name }}
            </el-descriptions-item>
            <el-descriptions-item label="应用描述">
              {{ appInfo.description }}
            </el-descriptions-item>
            <el-descriptions-item label="应用头像">
              <img v-if="appInfo.square_logo_url" :src="appInfo.square_logo_url" style="width: 50px; height: 50px;" />
            </el-descriptions-item>
            <el-descriptions-item label="可见范围">
              <el-tag v-for="dept in appInfo.allow_party" :key="dept" style="margin-right: 5px;">
                部门ID: {{ dept }}
              </el-tag>
              <el-tag v-for="user in appInfo.allow_user" :key="user" type="success" style="margin-right: 5px;">
                用户: {{ user }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <el-empty v-else description="暂无应用信息" />
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>配置说明</span>
          </template>
          
          <div class="config-help">
            <h4>配置步骤：</h4>
            <ol>
              <li>登录企业微信管理后台</li>
              <li>在「我的企业」-「企业信息」中获取企业ID</li>
              <li>在「应用管理」中创建自建应用，获取应用ID和Secret</li>
              <li>配置应用的可信域名和回调URL</li>
              <li>填写上述信息并保存配置</li>
              <li>点击「测试连接」验证配置是否正确</li>
            </ol>
            
            <h4>注意事项：</h4>
            <ul>
              <li>企业ID是企业的唯一标识，不可更改</li>
              <li>应用Secret需要妥善保管，不要泄露</li>
              <li>回调URL必须是HTTPS协议</li>
              <li>Token和EncodingAESKey用于消息加解密</li>
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
  getWeworkConfig,
  saveWeworkConfig,
  testWeworkConnection,
  getCorpInfo,
  getAppInfo
} from '@/api/wework'

const configFormRef = ref(null)
const saving = ref(false)
const testing = ref(false)
const refreshing = ref(false)
const refreshingApp = ref(false)

const configForm = reactive({
  corp_id: '',
  corp_secret: '',
  agent_id: '',
  contact_secret: '',
  callback_url: '',
  token: '',
  encoding_aes_key: '',
  enabled: true
})

const configRules = {
  corp_id: [{ required: true, message: '请输入企业ID', trigger: 'blur' }],
  corp_secret: [{ required: true, message: '请输入应用Secret', trigger: 'blur' }],
  agent_id: [{ required: true, message: '请输入应用ID', trigger: 'blur' }],
  token: [
    { required: true, message: '请输入Token', trigger: 'blur' },
    { min: 3, max: 32, message: 'Token长度应为3-32位字符', trigger: 'blur' }
  ],
  encoding_aes_key: [
    { required: true, message: '请输入EncodingAESKey', trigger: 'blur' },
    { len: 43, message: 'EncodingAESKey长度应为43位字符', trigger: 'blur' }
  ]
}

const corpInfo = ref(null)
const appInfo = ref(null)

const getConfigData = async () => {
  try {
    const response = await getWeworkConfig()
    Object.assign(configForm, response.data)
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

const saveConfig = async () => {
  try {
    await configFormRef.value.validate()
    saving.value = true
    await saveWeworkConfig(configForm)
    ElMessage.success('配置保存成功')
  } catch (error) {
    if (error.message) {
      ElMessage.error('保存失败: ' + error.message)
    }
  } finally {
    saving.value = false
  }
}

const testConnection = async () => {
  try {
    await configFormRef.value.validate()
    testing.value = true
    const response = await testWeworkConnection(configForm)
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

const refreshCorpInfo = async () => {
  try {
    refreshing.value = true
    const response = await getCorpInfo()
    corpInfo.value = response.data
  } catch (error) {
    ElMessage.error('获取企业信息失败: ' + error.message)
  } finally {
    refreshing.value = false
  }
}

const refreshAppInfo = async () => {
  try {
    refreshingApp.value = true
    const response = await getAppInfo()
    appInfo.value = response.data
  } catch (error) {
    ElMessage.error('获取应用信息失败: ' + error.message)
  } finally {
    refreshingApp.value = false
  }
}

onMounted(() => {
  getConfigData()
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