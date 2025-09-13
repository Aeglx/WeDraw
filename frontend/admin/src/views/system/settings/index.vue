<template>
  <div class="system-settings">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">系统设置</h1>
        <p class="page-description">管理系统基础配置和参数设置</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="saveAllSettings">
          <el-icon><Check /></el-icon>
          保存所有设置
        </el-button>
        <el-button @click="resetSettings">
          <el-icon><RefreshLeft /></el-icon>
          重置设置
        </el-button>
      </div>
    </div>

    <!-- 设置分类标签 -->
    <el-card class="tabs-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 基础设置 -->
        <el-tab-pane label="基础设置" name="basic">
          <div class="settings-section">
            <h3 class="section-title">网站信息</h3>
            <el-form :model="basicSettings" label-width="120px" class="settings-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="网站名称">
                    <el-input v-model="basicSettings.siteName" placeholder="请输入网站名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="网站标题">
                    <el-input v-model="basicSettings.siteTitle" placeholder="请输入网站标题" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="网站域名">
                    <el-input v-model="basicSettings.siteDomain" placeholder="请输入网站域名" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="联系邮箱">
                    <el-input v-model="basicSettings.contactEmail" placeholder="请输入联系邮箱" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="网站描述">
                <el-input
                  v-model="basicSettings.siteDescription"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入网站描述"
                />
              </el-form-item>
              <el-form-item label="网站关键词">
                <el-input v-model="basicSettings.siteKeywords" placeholder="请输入网站关键词，用逗号分隔" />
              </el-form-item>
              <el-form-item label="网站Logo">
                <el-upload
                  class="logo-uploader"
                  action="/api/upload"
                  :show-file-list="false"
                  :on-success="handleLogoSuccess"
                  :before-upload="beforeLogoUpload"
                >
                  <img v-if="basicSettings.siteLogo" :src="basicSettings.siteLogo" class="logo" />
                  <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
                </el-upload>
              </el-form-item>
            </el-form>
          </div>

          <div class="settings-section">
            <h3 class="section-title">系统配置</h3>
            <el-form :model="basicSettings" label-width="120px" class="settings-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="时区设置">
                    <el-select v-model="basicSettings.timezone" placeholder="请选择时区" style="width: 100%">
                      <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                      <el-option label="东京时间 (UTC+9)" value="Asia/Tokyo" />
                      <el-option label="纽约时间 (UTC-5)" value="America/New_York" />
                      <el-option label="伦敦时间 (UTC+0)" value="Europe/London" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="默认语言">
                    <el-select v-model="basicSettings.defaultLanguage" placeholder="请选择默认语言" style="width: 100%">
                      <el-option label="简体中文" value="zh-CN" />
                      <el-option label="繁体中文" value="zh-TW" />
                      <el-option label="English" value="en-US" />
                      <el-option label="日本語" value="ja-JP" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="维护模式">
                    <el-switch
                      v-model="basicSettings.maintenanceMode"
                      active-text="开启"
                      inactive-text="关闭"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="用户注册">
                    <el-switch
                      v-model="basicSettings.allowRegistration"
                      active-text="允许"
                      inactive-text="禁止"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 邮件设置 -->
        <el-tab-pane label="邮件设置" name="email">
          <div class="settings-section">
            <h3 class="section-title">SMTP配置</h3>
            <el-form :model="emailSettings" label-width="120px" class="settings-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="SMTP服务器">
                    <el-input v-model="emailSettings.smtpHost" placeholder="请输入SMTP服务器地址" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="SMTP端口">
                    <el-input-number v-model="emailSettings.smtpPort" :min="1" :max="65535" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="用户名">
                    <el-input v-model="emailSettings.smtpUsername" placeholder="请输入SMTP用户名" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="密码">
                    <el-input
                      v-model="emailSettings.smtpPassword"
                      type="password"
                      placeholder="请输入SMTP密码"
                      show-password
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="发件人邮箱">
                    <el-input v-model="emailSettings.fromEmail" placeholder="请输入发件人邮箱" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="发件人名称">
                    <el-input v-model="emailSettings.fromName" placeholder="请输入发件人名称" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="加密方式">
                    <el-select v-model="emailSettings.encryption" placeholder="请选择加密方式" style="width: 100%">
                      <el-option label="无加密" value="none" />
                      <el-option label="SSL" value="ssl" />
                      <el-option label="TLS" value="tls" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="测试邮件">
                    <el-button @click="testEmailConnection">发送测试邮件</el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 存储设置 -->
        <el-tab-pane label="存储设置" name="storage">
          <div class="settings-section">
            <h3 class="section-title">文件存储</h3>
            <el-form :model="storageSettings" label-width="120px" class="settings-form">
              <el-form-item label="存储方式">
                <el-radio-group v-model="storageSettings.driver">
                  <el-radio label="local">本地存储</el-radio>
                  <el-radio label="oss">阿里云OSS</el-radio>
                  <el-radio label="cos">腾讯云COS</el-radio>
                  <el-radio label="qiniu">七牛云</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <!-- 本地存储配置 -->
              <div v-if="storageSettings.driver === 'local'">
                <el-form-item label="存储路径">
                  <el-input v-model="storageSettings.local.path" placeholder="请输入存储路径" />
                </el-form-item>
                <el-form-item label="访问域名">
                  <el-input v-model="storageSettings.local.domain" placeholder="请输入访问域名" />
                </el-form-item>
              </div>
              
              <!-- 阿里云OSS配置 -->
              <div v-if="storageSettings.driver === 'oss'">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="AccessKey ID">
                      <el-input v-model="storageSettings.oss.accessKeyId" placeholder="请输入AccessKey ID" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="AccessKey Secret">
                      <el-input
                        v-model="storageSettings.oss.accessKeySecret"
                        type="password"
                        placeholder="请输入AccessKey Secret"
                        show-password
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="Bucket">
                      <el-input v-model="storageSettings.oss.bucket" placeholder="请输入Bucket名称" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="地域">
                      <el-input v-model="storageSettings.oss.region" placeholder="请输入地域" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="自定义域名">
                  <el-input v-model="storageSettings.oss.domain" placeholder="请输入自定义域名（可选）" />
                </el-form-item>
              </div>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 安全设置 -->
        <el-tab-pane label="安全设置" name="security">
          <div class="settings-section">
            <h3 class="section-title">登录安全</h3>
            <el-form :model="securitySettings" label-width="120px" class="settings-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="密码最小长度">
                    <el-input-number v-model="securitySettings.minPasswordLength" :min="6" :max="20" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="登录失败次数">
                    <el-input-number v-model="securitySettings.maxLoginAttempts" :min="3" :max="10" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="锁定时间(分钟)">
                    <el-input-number v-model="securitySettings.lockoutDuration" :min="5" :max="60" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="会话超时(分钟)">
                    <el-input-number v-model="securitySettings.sessionTimeout" :min="30" :max="1440" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="强制HTTPS">
                    <el-switch
                      v-model="securitySettings.forceHttps"
                      active-text="开启"
                      inactive-text="关闭"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="双因子认证">
                    <el-switch
                      v-model="securitySettings.twoFactorAuth"
                      active-text="开启"
                      inactive-text="关闭"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <div class="settings-section">
            <h3 class="section-title">API安全</h3>
            <el-form :model="securitySettings" label-width="120px" class="settings-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="API限流">
                    <el-switch
                      v-model="securitySettings.apiRateLimit"
                      active-text="开启"
                      inactive-text="关闭"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="每分钟请求数">
                    <el-input-number v-model="securitySettings.apiRatePerMinute" :min="10" :max="1000" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="IP白名单">
                <el-input
                  v-model="securitySettings.ipWhitelist"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入IP地址，每行一个"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 缓存设置 -->
        <el-tab-pane label="缓存设置" name="cache">
          <div class="settings-section">
            <h3 class="section-title">Redis配置</h3>
            <el-form :model="cacheSettings" label-width="120px" class="settings-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Redis主机">
                    <el-input v-model="cacheSettings.redis.host" placeholder="请输入Redis主机地址" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Redis端口">
                    <el-input-number v-model="cacheSettings.redis.port" :min="1" :max="65535" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="Redis密码">
                    <el-input
                      v-model="cacheSettings.redis.password"
                      type="password"
                      placeholder="请输入Redis密码（可选）"
                      show-password
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="数据库索引">
                    <el-input-number v-model="cacheSettings.redis.database" :min="0" :max="15" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="连接测试">
                <el-button @click="testRedisConnection">测试Redis连接</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="settings-section">
            <h3 class="section-title">缓存策略</h3>
            <el-form :model="cacheSettings" label-width="120px" class="settings-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="默认过期时间">
                    <el-input-number v-model="cacheSettings.defaultTtl" :min="60" :max="86400" style="width: 100%" />
                    <span class="form-help">单位：秒</span>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="缓存前缀">
                    <el-input v-model="cacheSettings.prefix" placeholder="请输入缓存前缀" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="清空缓存">
                <el-button type="danger" @click="clearCache">清空所有缓存</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, RefreshLeft, Plus } from '@element-plus/icons-vue'
import {
  getSystemSettings, updateSystemSettings, testEmailSettings,
  testRedisConnection as testRedis, clearSystemCache
} from '@/api/system/settings'

// 响应式数据
const activeTab = ref('basic')

// 基础设置
const basicSettings = reactive({
  siteName: 'WeDraw',
  siteTitle: 'WeDraw - 智能绘图平台',
  siteDomain: 'https://wedraw.com',
  contactEmail: 'contact@wedraw.com',
  siteDescription: 'WeDraw是一个智能绘图平台，提供丰富的绘图工具和模板',
  siteKeywords: 'WeDraw,绘图,设计,模板',
  siteLogo: '',
  timezone: 'Asia/Shanghai',
  defaultLanguage: 'zh-CN',
  maintenanceMode: false,
  allowRegistration: true
})

// 邮件设置
const emailSettings = reactive({
  smtpHost: 'smtp.qq.com',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  fromEmail: '',
  fromName: 'WeDraw',
  encryption: 'tls'
})

// 存储设置
const storageSettings = reactive({
  driver: 'local',
  local: {
    path: '/uploads',
    domain: 'https://wedraw.com'
  },
  oss: {
    accessKeyId: '',
    accessKeySecret: '',
    bucket: '',
    region: 'oss-cn-hangzhou',
    domain: ''
  }
})

// 安全设置
const securitySettings = reactive({
  minPasswordLength: 8,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  sessionTimeout: 120,
  forceHttps: false,
  twoFactorAuth: false,
  apiRateLimit: true,
  apiRatePerMinute: 100,
  ipWhitelist: ''
})

// 缓存设置
const cacheSettings = reactive({
  redis: {
    host: '127.0.0.1',
    port: 6379,
    password: '',
    database: 0
  },
  defaultTtl: 3600,
  prefix: 'wedraw:'
})

// 方法
const loadSettings = async () => {
  try {
    const { data } = await getSystemSettings()
    Object.assign(basicSettings, data.basic || {})
    Object.assign(emailSettings, data.email || {})
    Object.assign(storageSettings, data.storage || {})
    Object.assign(securitySettings, data.security || {})
    Object.assign(cacheSettings, data.cache || {})
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

const saveAllSettings = async () => {
  try {
    const settings = {
      basic: basicSettings,
      email: emailSettings,
      storage: storageSettings,
      security: securitySettings,
      cache: cacheSettings
    }
    
    await updateSystemSettings(settings)
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('设置保存失败')
  }
}

const resetSettings = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有设置吗？此操作不可恢复。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 重新加载默认设置
    await loadSettings()
    ElMessage.success('设置重置成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('设置重置失败')
    }
  }
}

const handleTabChange = (tabName) => {
  console.log('切换到标签:', tabName)
}

const handleLogoSuccess = (response) => {
  if (response.code === 200) {
    basicSettings.siteLogo = response.data.url
    ElMessage.success('Logo上传成功')
  } else {
    ElMessage.error('Logo上传失败')
  }
}

const beforeLogoUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB')
    return false
  }
  return true
}

const testEmailConnection = async () => {
  try {
    await testEmailSettings(emailSettings)
    ElMessage.success('邮件测试发送成功')
  } catch (error) {
    ElMessage.error('邮件测试发送失败')
  }
}

const testRedisConnection = async () => {
  try {
    await testRedis(cacheSettings.redis)
    ElMessage.success('Redis连接测试成功')
  } catch (error) {
    ElMessage.error('Redis连接测试失败')
  }
}

const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有缓存吗？',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await clearSystemCache()
    ElMessage.success('缓存清空成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('缓存清空失败')
    }
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.system-settings {
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

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-description {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.tabs-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-section {
  margin-bottom: 30px;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 10px;
}

.settings-form {
  max-width: 800px;
}

.logo-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.logo-uploader:hover {
  border-color: #409eff;
}

.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
  display: block;
}

.logo {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

.form-help {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

:deep(.el-tabs__content) {
  padding: 20px 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>