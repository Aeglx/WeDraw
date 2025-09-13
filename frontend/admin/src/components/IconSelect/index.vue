<template>
  <div class="icon-body">
    <el-input v-model="name" style="position: relative;" clearable placeholder="请输入图标名称" @clear="filterIcons" @input="filterIcons">
      <template #suffix>
        <el-icon class="el-input__icon"><search /></el-icon>
      </template>
    </el-input>
    <div class="icon-list">
      <div v-for="(item, index) in iconList" :key="index" @click="selectedIcon(item)" :class="{'icon-item-active': item === activeIcon}" class="icon-item">
        <svg-icon :icon-class="item" style="height: 30px;width: 16px;" />
        <span>{{ item }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import icons from './requireIcons'

const { proxy } = getCurrentInstance()

const emit = defineEmits(['selected'])

const name = ref('')
const iconList = ref(icons)
const activeIcon = ref('')

function filterIcons() {
  if (name.value) {
    iconList.value = icons.filter(item => item.includes(name.value))
  } else {
    iconList.value = icons
  }
}

function selectedIcon(name) {
  activeIcon.value = name
  emit('selected', name)
}

function reset() {
  name.value = ''
  iconList.value = icons
  activeIcon.value = ''
}

defineExpose({
  reset
})
</script>

<style scoped>
.icon-body {
  width: 100%;
  padding: 10px;
}

.icon-list {
  height: 200px;
  overflow-y: scroll;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  background-color: #FFFFFF;
  margin-top: 10px;
}

.icon-item {
  display: inline-block;
  width: 15%;
  text-align: center;
  height: 40px;
  line-height: 40px;
  margin: 5px;
  cursor: pointer;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
}

.icon-item span {
  display: inline-block;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}

.icon-item:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.icon-item-active {
  border-color: #409EFF;
  color: #409EFF;
}
</style>