<template>
  <div class="login-container">
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      autocomplete="on"
      label-position="left"
    >
      <div class="title-container">
        <h3 class="title">企业微信生态管理后台</h3>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <el-icon><User /></el-icon>
        </span>
        <el-input
          ref="username"
          v-model="loginForm.username"
          placeholder="用户名"
          name="username"
          type="text"
          tabindex="1"
          autocomplete="on"
        />
      </el-form-item>

      <el-tooltip v-model="capsTooltip" content="大写锁定已开启" placement="right" manual>
        <el-form-item prop="password">
          <span class="svg-container">
            <el-icon><Lock /></el-icon>
          </span>
          <el-input
            :key="passwordType"
            ref="password"
            v-model="loginForm.password"
            :type="passwordType"
            placeholder="密码"
            name="password"
            tabindex="2"
            autocomplete="on"
            @keyup="checkCapslock"
            @blur="capsTooltip = false"
            @keyup.enter="handleLogin"
          />
          <span class="show-pwd" @click="showPwd">
            <el-icon><component :is="passwordType === 'password' ? 'View' : 'Hide'" /></el-icon>
          </span>
        </el-form-item>
      </el-tooltip>

      <el-button
        :loading="loading"
        type="primary"
        style="width: 100%; margin-bottom: 30px"
        @click.prevent="handleLogin"
      >
        登录
      </el-button>

      <div class="tips">
        <span>用户名: admin</span>
        <span>密码: admin123</span>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, View, Hide } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref()
const username = ref()
const password = ref()

const loginForm = ref({
  username: 'admin',
  password: 'admin123'
})

const loginRules = {
  username: [{ required: true, trigger: 'blur', message: '请输入用户名' }],
  password: [{ required: true, trigger: 'blur', message: '请输入密码' }]
}

const passwordType = ref('password')
const capsTooltip = ref(false)
const loading = ref(false)

const showPwd = () => {
  if (passwordType.value === 'password') {
    passwordType.value = ''
  } else {
    passwordType.value = 'password'
  }
  nextTick(() => {
    password.value.focus()
  })
}

const checkCapslock = (e) => {
  const { key } = e
  capsTooltip.value = key && key.length === 1 && (key >= 'A' && key <= 'Z')
}

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm.value)
        ElMessage.success('登录成功')
        const redirect = route.query.redirect || '/'
        router.push(redirect)
      } catch (error) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(() => {
  if (loginForm.value.username === '') {
    username.value.focus()
  } else if (loginForm.value.password === '') {
    password.value.focus()
  }
})
</script>

<style lang="scss" scoped>
$bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$light_gray: #fff;
$cursor: #fff;
$card-bg: rgba(255, 255, 255, 0.95);
$shadow: 0 15px 35px rgba(0, 0, 0, 0.1);

.login-container {
  min-height: 100vh;
  width: 100%;
  background: $bg;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  // 添加装饰性背景元素
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
    animation: float 20s ease-in-out infinite;
  }

  .login-form {
    position: relative;
    width: 420px;
    max-width: 90%;
    padding: 40px;
    margin: 0 auto;
    background: $card-bg;
    border-radius: 16px;
    box-shadow: $shadow;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 1;
  }

  .tips {
    font-size: 13px;
    color: #666;
    margin-top: 20px;
    padding: 16px;
    background: rgba(103, 194, 58, 0.1);
    border-radius: 8px;
    border-left: 4px solid #67c23a;

    span {
      display: block;
      margin-bottom: 4px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: #409eff;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;
    margin-bottom: 40px;

    .title {
      font-size: 28px;
      color: #303133;
      margin: 0;
      text-align: center;
      font-weight: 600;
      background: linear-gradient(135deg, #409eff, #667eea);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: #909399;
    cursor: pointer;
    user-select: none;
    transition: color 0.3s ease;
    
    &:hover {
      color: #409eff;
    }
  }

  .thirdparty-button {
    position: absolute;
    right: 0;
    bottom: 6px;
  }
}

// 添加动画
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

// 表单项动画
:deep(.el-form-item) {
  margin-bottom: 24px;
  
  .el-input {
    .el-input__wrapper {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
      }
      
      &.is-focus {
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
      }
    }
  }
}

// 按钮样式优化
:deep(.el-button--primary) {
  background: linear-gradient(135deg, #409eff, #667eea);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #337ecc, #5a67d8);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}
</style>