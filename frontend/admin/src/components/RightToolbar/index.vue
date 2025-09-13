<template>
  <div class="top-right-btn" :style="style">
    <el-row>
      <el-col :span="showSearch ? 6 : 0">
        <el-tooltip class="item" effect="dark" :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top" v-if="search">
          <el-button size="small" circle icon="Search" @click="toggleSearch()" />
        </el-tooltip>
      </el-col>
      <el-col :span="showSearch ? 6 : 0">
        <el-tooltip class="item" effect="dark" content="刷新" placement="top">
          <el-button size="small" circle icon="Refresh" @click="refresh()" />
        </el-tooltip>
      </el-col>
      <el-col :span="showSearch ? 6 : 0">
        <el-tooltip class="item" effect="dark" content="显隐列" placement="top" v-if="columns">
          <el-button size="small" circle icon="Menu" @click="showColumn()" />
        </el-tooltip>
      </el-col>
    </el-row>
    <el-drawer v-model="open" title="显示/隐藏" direction="rtl" size="20%">
      <el-transfer
        :titles="['显示', '隐藏']"
        v-model="value"
        :data="columns"
        @change="dataChange"
      ></el-transfer>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  showSearch: {
    type: Boolean,
    default: true
  },
  columns: {
    type: Array
  },
  search: {
    type: Boolean,
    default: true
  },
  gutter: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:showSearch', 'queryTable', 'update:columns'])

const open = ref(false)
const value = ref([])

const style = computed(() => {
  const ret = {}
  if (props.gutter) {
    ret.marginRight = props.gutter / 2 + 'px'
  }
  return ret
})

// 搜索
function toggleSearch() {
  emit('update:showSearch', !props.showSearch)
}

// 刷新
function refresh() {
  emit('queryTable')
}

// 右侧列表元素变化
function dataChange(data) {
  for (let item in props.columns) {
    const key = props.columns[item].key
    props.columns[item].visible = !data.includes(key)
  }
}

// 打开显隐列dialog
function showColumn() {
  open.value = true
  for (let item in props.columns) {
    if (props.columns[item].visible === false) {
      value.value.push(parseInt(props.columns[item].key))
    }
  }
}
</script>

<style lang='scss' scoped>
.top-right-btn {
  margin-left: auto;
}
</style>