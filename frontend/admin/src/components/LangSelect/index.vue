<template>
  <el-dropdown trigger="click" @command="handleSetLanguage">
    <div>
      <el-icon class="lang-icon">
        <Globe />
      </el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item :disabled="language === 'zh-cn'" command="zh-cn">
          <span class="lang-item">
            <span class="flag">🇨🇳</span>
            <span>简体中文</span>
          </span>
        </el-dropdown-item>
        <el-dropdown-item :disabled="language === 'en'" command="en">
          <span class="lang-item">
            <span class="flag">🇺🇸</span>
            <span>English</span>
          </span>
        </el-dropdown-item>
        <el-dropdown-item :disabled="language === 'zh-tw'" command="zh-tw">
          <span class="lang-item">
            <span class="flag">🇹🇼</span>
            <span>繁體中文</span>
          </span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { Globe } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'

const appStore = useAppStore()

const language = computed(() => appStore.language)

const handleSetLanguage = (lang) => {
  appStore.setLanguage(lang)
  
  const langMap = {
    'zh-cn': '简体中文',
    'en': 'English',
    'zh-tw': '繁體中文'
  }
  
  ElMessage.success(`语言已切换为 ${langMap[lang]}`)
  
  // 刷新页面以应用新的语言设置
  window.location.reload()
}
</script>

<style scoped>
.lang-icon {
  font-size: 20px;
  cursor: pointer;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flag {
  font-size: 16px;
}
</style>