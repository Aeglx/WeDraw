<template>
  <div class="navbar">
    <hamburger
      id="hamburger-container"
      :is-active="sidebar.opened"
      class="hamburger-container"
      @toggleClick="toggleSideBar"
    />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" />

    <div class="right-menu">
      <template v-if="device !== 'mobile'">
        <screenfull id="screenfull" class="right-menu-item hover-effect" />
        <el-tooltip content="布局大小" effect="dark" placement="bottom">
          <size-select id="size-select" class="right-menu-item hover-effect" />
        </el-tooltip>
      </template>

      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="avatar" class="user-avatar" />
          <el-icon class="el-icon-caret-bottom">
            <CaretBottom />
          </el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/profile/index">
              <el-dropdown-item>个人中心</el-dropdown-item>
            </router-link>
            <el-dropdown-item divided @click="logout">
              <span style="display: block">退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CaretBottom } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'
import Breadcrumb from '@/components/Breadcrumb/index.vue'
import Hamburger from '@/components/Hamburger/index.vue'
import Screenfull from '@/components/Screenfull/index.vue'
import SizeSelect from '@/components/SizeSelect/index.vue'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const sidebar = computed(() => appStore.sidebar)
const device = computed(() => appStore.device)
const avatar = computed(() => userStore.avatar || '/src/assets/images/avatar.png')

const toggleSideBar = () => {
  appStore.toggleSideBar()
}

const logout = async () => {
  try {
    await ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await userStore.logout()
    router.push(`/login?redirect=${router.currentRoute.value.fullPath}`)
    ElMessage.success('退出成功')
  } catch (error) {
    console.log('取消退出')
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 60px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  .hamburger-container {
    line-height: 56px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: all 0.3s ease;
    -webkit-tap-highlight-color: transparent;
    padding: 0 15px;
    border-radius: 8px;
    margin: 0 8px;

    &:hover {
      background: rgba(64, 158, 255, 0.1);
      transform: scale(1.05);
    }
  }

  .breadcrumb-container {
    flex: 1;
    margin-left: 20px;
  }

  .right-menu {
    display: flex;
    align-items: center;
    height: 100%;
    line-height: 60px;
    padding-right: 20px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 12px;
      height: 100%;
      font-size: 18px;
      color: #606266;
      vertical-align: text-bottom;
      border-radius: 8px;
      margin: 0 4px;

      &.hover-effect {
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(64, 158, 255, 0.1);
          color: #409eff;
          transform: translateY(-2px);
        }
      }
    }

    .avatar-container {
      margin-right: 0;
      padding: 0 15px;
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(64, 158, 255, 0.05);
      }

      .avatar-wrapper {
        margin-top: 0;
        position: relative;
        display: flex;
        align-items: center;
        padding: 8px 0;

        .user-avatar {
          cursor: pointer;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;

          &:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
          }
        }

        .el-icon-caret-bottom {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #909399;
          transition: all 0.3s ease;

          &:hover {
            color: #409eff;
          }
        }
      }
    }
  }
}
</style>