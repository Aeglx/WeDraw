<template>
  <div class="header-search" :class="{ 'show': show }">
    <el-icon class="search-icon" @click="click">
      <Search />
    </el-icon>
    <el-select
      ref="headerSearchSelect"
      v-model="search"
      :remote-method="querySearch"
      filterable
      default-first-option
      remote
      placeholder="搜索页面"
      class="header-search-select"
      @change="change"
    >
      <el-option
        v-for="option in options"
        :key="option.item.path"
        :value="option.item"
        :label="option.item.title.join(' > ')"
      />
    </el-select>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import Fuse from 'fuse.js'

const router = useRouter()
const search = ref('')
const options = ref([])
const searchPool = ref([])
const show = ref(false)
const fuse = ref(null)
const headerSearchSelect = ref(null)

// 生成搜索池
const generateRoutes = (routes, basePath = '/', prefixTitle = []) => {
  let res = []
  for (const route of routes) {
    if (route.hidden) { continue }
    const data = {
      path: basePath + route.path,
      title: [...prefixTitle]
    }
    if (route.meta && route.meta.title) {
      data.title = [...data.title, route.meta.title]
      if (route.redirect !== 'noRedirect') {
        res.push(data)
      }
    }
    if (route.children) {
      const tempRoutes = generateRoutes(route.children, data.path + '/', data.title)
      if (tempRoutes.length >= 1) {
        res = [...res, ...tempRoutes]
      }
    }
  }
  return res
}

const initFuse = (list) => {
  fuse.value = new Fuse(list, {
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    minMatchCharLength: 1,
    keys: [{
      name: 'title',
      weight: 0.7
    }, {
      name: 'path',
      weight: 0.3
    }]
  })
}

// 初始化
const init = () => {
  const routes = router.getRoutes()
  searchPool.value = generateRoutes(routes)
  initFuse(searchPool.value)
}

const querySearch = (query) => {
  if (query !== '') {
    options.value = fuse.value.search(query)
  } else {
    options.value = []
  }
}

const click = () => {
  show.value = !show.value
  if (show.value) {
    headerSearchSelect.value && headerSearchSelect.value.focus()
  }
}

const change = (val) => {
  router.push(val.path)
  search.value = ''
  options.value = []
  show.value = false
}

watch(show, (value) => {
  if (value) {
    document.body.addEventListener('click', close)
  } else {
    document.body.removeEventListener('click', close)
  }
})

const close = () => {
  headerSearchSelect.value && headerSearchSelect.value.blur()
  options.value = []
  show.value = false
}

init()
</script>

<style lang="scss" scoped>
.header-search {
  font-size: 0 !important;

  .search-icon {
    cursor: pointer;
    font-size: 18px;
    vertical-align: middle;
  }

  .header-search-select {
    font-size: 18px;
    transition: width 0.2s;
    width: 0;
    overflow: hidden;
    background: transparent;
    border-radius: 0;
    display: inline-block;
    vertical-align: middle;

    :deep(.el-input__inner) {
      border-radius: 0;
      border: 0;
      padding-left: 0;
      padding-right: 0;
      box-shadow: none !important;
      border-bottom: 1px solid #d9d9d9;
      vertical-align: middle;
    }
  }

  &.show {
    .header-search-select {
      width: 210px;
      margin-left: 10px;
    }
  }
}
</style>