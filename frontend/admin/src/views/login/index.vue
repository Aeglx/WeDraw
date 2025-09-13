<template>
  <div class="login-container">
    <el-form
      ref="loginForm"
      :model="state.loginForm"
      :rules="state.loginRules"
      class="login-form"
      auto-complete="on"
      label-position="left"
    >
      <div class="title-container">
        <h3 class="title">WeDraw 管理后台</h3>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <el-icon><User /></el-icon>
        </span>
        <el-input
          ref="username"
          v-model="state.loginForm.username"
          placeholder="用户名"
          name="username"
          type="text"
          tabindex="1"
          auto-complete="on"
        />
      </el-form-item>

      <el-form-item prop="password">
        <span class="svg-container">
          <el-icon><Lock /></el-icon>
        </span>
        <el-input
          :key="state.passwordType"
          ref="password"
          v-model="state.loginForm.password"
          :type="state.passwordType"
          placeholder="密码"
          name="password"
          tabindex="2"
          auto-complete="on"
          @keyup.enter="handleLogin"
        />
        <span class="show-pwd" @click="showPwd">
          <el-icon><component :is="state.passwordType === 'password' ? 'View' : 'Hide'" /></el-icon>
        </span>
      </el-form-item>

      <el-button
        :loading="state.loading"
        type="primary"
        style="width: 100%; margin-bottom: 30px"
        @click.prevent="handleLogin"
      >
        登录
      </el-button>

      <div class="tips">
        <span style="margin-right: 20px">用户名: admin</span>
        <span>密码: 任意</span>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, watch, toRefs } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, View, Hide } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { validUsername } from '@/utils/validate'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginForm = ref(null)
const username = ref(null)
const password = ref(null)

const state = reactive({
  loginForm: {
    username: 'admin',
    password: '123456'
  },
  loginRules: {
    username: [{ required: true, trigger: 'blur', validator: validateUsername }],
    password: [{ required: true, trigger: 'blur', validator: validatePassword }]
  },
  loading: false,
  passwordType: 'password',
  redirect: undefined
})

const { loginForm: loginFormData, loginRules, loading, passwordType } = toRefs(state)

function validateUsername(rule, value, callback) {
  if (!validUsername(value)) {
    callback(new Error('请输入正确的用户名'))
  } else {
    callback()
  }
}

function validatePassword(rule, value, callback) {
  if (value.length < 6) {
    callback(new Error('密码不能少于6位'))
  } else {
    callback()
  }
}

function showPwd() {
  if (state.passwordType === 'password') {
    state.passwordType = ''
  } else {
    state.passwordType = 'password'
  }
  nextTick(() => {
    password.value.focus()
  })
}

function handleLogin() {
  loginForm.value.validate(async (valid) => {
    if (valid) {
      state.loading = true
      try {
        await userStore.login(state.loginForm)
        router.push({ path: state.redirect || '/' })
        ElMessage.success('登录成功')
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error('登录失败，请检查用户名和密码')
      } finally {
        state.loading = false
      }
    } else {
      console.log('表单验证失败')
      return false
    }
  })
}

onMounted(() => {
  if (state.loginForm.username === '') {
    username.value.focus()
  } else if (state.loginForm.password === '') {
    password.value.focus()
  }
})

// 监听路由变化
watch(
  route,
  (route) => {
    state.redirect = route.query && route.query.redirect
  },
  { immediate: true }
)
</script>

<style lang="scss">
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg: #283443;
$light_gray: #fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (caret-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 50px;
    width: 85%;

    input {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 12px 15px;
      color: #495057;
      height: 50px;
      font-size: 14px;
      transition: all 0.3s ease;
      caret-color: #409eff;

      &:focus {
        border-color: #409eff;
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
        outline: none;
      }

      &::placeholder {
        color: #adb5bd;
        font-weight: 400;
      }

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px #f8f9fa inset !important;
        -webkit-text-fill-color: #495057 !important;
        border-radius: 12px !important;
      }
    }
  }

  .el-form-item {
    border: none;
    background: transparent;
    border-radius: 12px;
    margin-bottom: 25px;
    position: relative;
    
    &.is-error {
      .el-input input {
        border-color: #f56565;
        background: #fef5f5;
      }
    }
  }

  .el-button {
    height: 50px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    border: none;
    box-shadow: 0 4px 15px rgba(64, 158, 255, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &.is-loading {
      opacity: 0.8;
    }
  }
}
</style>

<style lang="scss" scoped>
$primary: #409eff;
$primary-light: #66b1ff;
$dark_gray: #889aa4;
$light_gray: #eee;
$white: #ffffff;
$shadow: rgba(0, 0, 0, 0.1);

.login-container {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  // 添加动态背景效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
    animation: float 20s ease-in-out infinite;
  }

  .login-form {
    position: relative;
    width: 450px;
    max-width: 90%;
    padding: 50px 40px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2);
    animation: slideUp 0.8s ease-out;
    z-index: 1;
  }

  .tips {
    font-size: 13px;
    color: #666;
    margin-bottom: 20px;
    text-align: center;
    padding: 15px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-radius: 10px;
    border-left: 4px solid $primary;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $primary;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
    transition: color 0.3s ease;
  }

  .title-container {
    position: relative;
    margin-bottom: 40px;

    .title {
      font-size: 32px;
      color: #2c3e50;
      margin: 0;
      text-align: center;
      font-weight: 700;
      background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 3px;
        background: linear-gradient(135deg, $primary 0%, $primary-light 100%);
        border-radius: 2px;
      }
    }
  }

  .show-pwd {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
    transition: color 0.3s ease;

    &:hover {
      color: $primary;
    }
  }
}

// 动画效果
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .login-container {
    .login-form {
      width: 95%;
      padding: 40px 30px;
      margin: 20px;
    }

    .title-container .title {
      font-size: 28px;
    }
  }
}
</style>