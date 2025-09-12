<template>
  <div class="app-container">
    <div class="menu-container">
      <div class="menu-preview">
        <div class="phone-frame">
          <div class="phone-header">
            <span>{{ configData.name || '公众号名称' }}</span>
          </div>
          <div class="phone-content">
            <div class="chat-area">
              <div class="welcome-message">
                欢迎关注我们的公众号！
              </div>
            </div>
            <div class="menu-area">
              <div class="menu-buttons">
                <div
                  v-for="(menu, index) in menuData.button"
                  :key="index"
                  class="menu-button"
                  :class="{ active: activeMenu === index }"
                  @click="selectMenu(index)"
                >
                  <span>{{ menu.name }}</span>
                  <div v-if="menu.sub_button && menu.sub_button.length > 0" class="sub-menu">
                    <div
                      v-for="(subMenu, subIndex) in menu.sub_button"
                      :key="subIndex"
                      class="sub-menu-item"
                      @click.stop="selectSubMenu(index, subIndex)"
                    >
                      {{ subMenu.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="menu-editor">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>菜单编辑</span>
              <div>
                <el-button type="success" @click="publishMenu" :loading="publishLoading">
                  发布菜单
                </el-button>
                <el-button type="danger" @click="deleteMenu" :loading="deleteLoading">
                  删除菜单
                </el-button>
              </div>
            </div>
          </template>
          
          <el-tabs v-model="activeTab" type="card">
            <el-tab-pane
              v-for="(menu, index) in menuData.button"
              :key="index"
              :label="menu.name || `菜单${index + 1}`"
              :name="index.toString()"
            >
              <el-form :model="menu" label-width="100px">
                <el-form-item label="菜单名称">
                  <el-input v-model="menu.name" placeholder="请输入菜单名称" maxlength="5" />
                </el-form-item>
                
                <el-form-item label="菜单类型">
                  <el-radio-group v-model="menu.type">
                    <el-radio label="click">点击事件</el-radio>
                    <el-radio label="view">跳转链接</el-radio>
                    <el-radio label="miniprogram">小程序</el-radio>
                    <el-radio label="parent">父菜单</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item v-if="menu.type === 'click'" label="事件Key">
                  <el-input v-model="menu.key" placeholder="请输入事件Key" />
                </el-form-item>
                
                <el-form-item v-if="menu.type === 'view'" label="跳转链接">
                  <el-input v-model="menu.url" placeholder="请输入跳转链接" />
                </el-form-item>
                
                <el-form-item v-if="menu.type === 'miniprogram'" label="小程序AppID">
                  <el-input v-model="menu.appid" placeholder="请输入小程序AppID" />
                </el-form-item>
                
                <el-form-item v-if="menu.type === 'miniprogram'" label="小程序路径">
                  <el-input v-model="menu.pagepath" placeholder="请输入小程序页面路径" />
                </el-form-item>
                
                <el-form-item v-if="menu.type === 'miniprogram'" label="备用链接">
                  <el-input v-model="menu.url" placeholder="请输入备用链接" />
                </el-form-item>
                
                <!-- 子菜单 -->
                <div v-if="menu.type === 'parent'">
                  <el-divider>子菜单</el-divider>
                  <div v-for="(subMenu, subIndex) in menu.sub_button" :key="subIndex" class="sub-menu-editor">
                    <el-card shadow="never">
                      <template #header>
                        <div class="sub-menu-header">
                          <span>子菜单 {{ subIndex + 1 }}</span>
                          <el-button type="text" @click="removeSubMenu(index, subIndex)">
                            删除
                          </el-button>
                        </div>
                      </template>
                      
                      <el-form :model="subMenu" label-width="100px" size="small">
                        <el-form-item label="菜单名称">
                          <el-input v-model="subMenu.name" placeholder="请输入子菜单名称" maxlength="5" />
                        </el-form-item>
                        
                        <el-form-item label="菜单类型">
                          <el-radio-group v-model="subMenu.type">
                            <el-radio label="click">点击事件</el-radio>
                            <el-radio label="view">跳转链接</el-radio>
                            <el-radio label="miniprogram">小程序</el-radio>
                          </el-radio-group>
                        </el-form-item>
                        
                        <el-form-item v-if="subMenu.type === 'click'" label="事件Key">
                          <el-input v-model="subMenu.key" placeholder="请输入事件Key" />
                        </el-form-item>
                        
                        <el-form-item v-if="subMenu.type === 'view'" label="跳转链接">
                          <el-input v-model="subMenu.url" placeholder="请输入跳转链接" />
                        </el-form-item>
                        
                        <el-form-item v-if="subMenu.type === 'miniprogram'" label="小程序AppID">
                          <el-input v-model="subMenu.appid" placeholder="请输入小程序AppID" />
                        </el-form-item>
                        
                        <el-form-item v-if="subMenu.type === 'miniprogram'" label="小程序路径">
                          <el-input v-model="subMenu.pagepath" placeholder="请输入小程序页面路径" />
                        </el-form-item>
                        
                        <el-form-item v-if="subMenu.type === 'miniprogram'" label="备用链接">
                          <el-input v-model="subMenu.url" placeholder="请输入备用链接" />
                        </el-form-item>
                      </el-form>
                    </el-card>
                  </div>
                  
                  <el-button
                    v-if="!menu.sub_button || menu.sub_button.length < 5"
                    type="dashed"
                    style="width: 100%; margin-top: 10px"
                    @click="addSubMenu(index)"
                  >
                    + 添加子菜单
                  </el-button>
                </div>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane v-if="menuData.button.length < 3" name="add" disabled>
              <template #label>
                <el-button type="text" @click="addMenu">
                  + 添加菜单
                </el-button>
              </template>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMenu, createMenu, deleteMenu as deleteMenuApi, getOfficialConfig } from '@/api/official'

const activeTab = ref('0')
const activeMenu = ref(0)
const publishLoading = ref(false)
const deleteLoading = ref(false)

const configData = reactive({
  name: ''
})

const menuData = reactive({
  button: [
    {
      name: '菜单一',
      type: 'click',
      key: 'menu_1'
    }
  ]
})

const getMenuData = async () => {
  try {
    const response = await getMenu()
    if (response.data && response.data.button) {
      menuData.button = response.data.button
    }
  } catch (error) {
    console.error('获取菜单失败:', error)
  }
}

const getConfig = async () => {
  try {
    const response = await getOfficialConfig()
    configData.name = response.data.name
  } catch (error) {
    console.error('获取配置失败:', error)
  }
}

const publishMenu = async () => {
  try {
    publishLoading.value = true
    await createMenu(menuData)
    ElMessage.success('菜单发布成功')
  } catch (error) {
    ElMessage.error('菜单发布失败: ' + error.message)
  } finally {
    publishLoading.value = false
  }
}

const deleteMenu = async () => {
  try {
    await ElMessageBox.confirm('确定要删除当前菜单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    deleteLoading.value = true
    await deleteMenuApi()
    menuData.button = []
    ElMessage.success('菜单删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('菜单删除失败: ' + error.message)
    }
  } finally {
    deleteLoading.value = false
  }
}

const addMenu = () => {
  if (menuData.button.length >= 3) {
    ElMessage.warning('最多只能添加3个一级菜单')
    return
  }
  
  menuData.button.push({
    name: `菜单${menuData.button.length + 1}`,
    type: 'click',
    key: `menu_${menuData.button.length + 1}`
  })
  
  activeTab.value = (menuData.button.length - 1).toString()
}

const addSubMenu = (menuIndex) => {
  const menu = menuData.button[menuIndex]
  if (!menu.sub_button) {
    menu.sub_button = []
  }
  
  if (menu.sub_button.length >= 5) {
    ElMessage.warning('最多只能添加5个子菜单')
    return
  }
  
  menu.sub_button.push({
    name: `子菜单${menu.sub_button.length + 1}`,
    type: 'click',
    key: `submenu_${menuIndex}_${menu.sub_button.length + 1}`
  })
}

const removeSubMenu = (menuIndex, subMenuIndex) => {
  menuData.button[menuIndex].sub_button.splice(subMenuIndex, 1)
}

const selectMenu = (index) => {
  activeMenu.value = index
  activeTab.value = index.toString()
}

const selectSubMenu = (menuIndex, subMenuIndex) => {
  // 处理子菜单点击
}

onMounted(() => {
  getConfig()
  getMenuData()
})
</script>

<style lang="scss" scoped>
.app-container {
  .menu-container {
    display: flex;
    gap: 20px;
    
    .menu-preview {
      flex: 0 0 300px;
      
      .phone-frame {
        width: 300px;
        height: 500px;
        border: 2px solid #ddd;
        border-radius: 20px;
        overflow: hidden;
        background: #fff;
        
        .phone-header {
          height: 50px;
          background: #1aad19;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        .phone-content {
          height: calc(100% - 50px);
          display: flex;
          flex-direction: column;
          
          .chat-area {
            flex: 1;
            padding: 20px;
            background: #f5f5f5;
            
            .welcome-message {
              background: white;
              padding: 10px;
              border-radius: 5px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
          }
          
          .menu-area {
            height: 60px;
            border-top: 1px solid #ddd;
            
            .menu-buttons {
              display: flex;
              height: 100%;
              
              .menu-button {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                border-right: 1px solid #ddd;
                cursor: pointer;
                position: relative;
                background: white;
                transition: background-color 0.3s;
                
                &:last-child {
                  border-right: none;
                }
                
                &:hover {
                  background: #f5f5f5;
                }
                
                &.active {
                  background: #e7f4ff;
                }
                
                .sub-menu {
                  position: absolute;
                  bottom: 100%;
                  left: 0;
                  right: 0;
                  background: white;
                  border: 1px solid #ddd;
                  border-bottom: none;
                  display: none;
                  
                  .sub-menu-item {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                    cursor: pointer;
                    
                    &:hover {
                      background: #f5f5f5;
                    }
                    
                    &:last-child {
                      border-bottom: none;
                    }
                  }
                }
                
                &:hover .sub-menu {
                  display: block;
                }
              }
            }
          }
        }
      }
    }
    
    .menu-editor {
      flex: 1;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .sub-menu-editor {
        margin-bottom: 15px;
        
        .sub-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      }
    }
  }
}
</style>