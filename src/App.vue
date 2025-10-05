<template>
  <mdui-layout class="app-layout">
    <!-- 顶部工具栏 -->
    <mdui-top-app-bar>
      <mdui-button-icon icon="menu" @click="drawer = !drawer"></mdui-button-icon>
      <mdui-top-app-bar-title>ZiXiao Version Manager</mdui-top-app-bar-title>
      <div style="flex-grow: 1"></div>
      <mdui-chip v-if="currentRepo" style="margin-right: 12px;">
        <mdui-icon slot="icon" name="folder"></mdui-icon>
        {{ getRepoName(currentRepo) }}
      </mdui-chip>
    </mdui-top-app-bar>

    <!-- 侧边栏 -->
    <mdui-navigation-drawer :open="drawer" @close="drawer = false">
      <div style="padding: 16px; border-bottom: 1px solid #e0e0e0;">
        <h3 style="margin: 0 0 8px 0;">导航</h3>
        <p v-if="currentRepo" style="font-size: 12px; color: #666; margin: 0; word-break: break-all;">
          {{ currentRepo }}
        </p>
      </div>
      <mdui-list>
        <mdui-list-item
          v-for="menu in menus"
          :key="menu.value"
          :active="activeMenu === menu.value"
          @click="selectMenu(menu.value)"
        >
          <mdui-icon slot="icon" :name="menu.icon"></mdui-icon>
          {{ menu.label }}
        </mdui-list-item>
      </mdui-list>
    </mdui-navigation-drawer>

    <!-- 主内容区 -->
    <mdui-layout-main class="main-content">
      <component :is="currentComponent" />
    </mdui-layout-main>
  </mdui-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import RepositorySelector from './components/RepositorySelector.vue'
import StatusView from './components/StatusView.vue'
import CommitHistory from './components/CommitHistory.vue'
import BranchManager from './components/BranchManager.vue'

const drawer = ref(false)
const activeMenu = ref('repo')
const currentRepo = ref('')

const menus = [
  { label: '选择仓库', value: 'repo', icon: 'folder_open' },
  { label: '状态', value: 'status', icon: 'difference' },
  { label: '提交历史', value: 'history', icon: 'history' },
  { label: '分支管理', value: 'branches', icon: 'account_tree' }
]

const components = {
  repo: RepositorySelector,
  status: StatusView,
  history: CommitHistory,
  branches: BranchManager
}

const currentComponent = computed(() => components[activeMenu.value])

const selectMenu = (menu) => {
  activeMenu.value = menu
  drawer.value = false
}

const getRepoName = (path) => {
  if (!path) return ''
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

const updateCurrentRepo = () => {
  const repoPath = localStorage.getItem('repoPath')
  currentRepo.value = repoPath || ''
}

onMounted(() => {
  updateCurrentRepo()

  // 监听仓库选择事件
  window.addEventListener('repo-selected', () => {
    updateCurrentRepo()
    activeMenu.value = 'status'
  })

  // 监听返回仓库选择器事件
  window.addEventListener('go-to-repo-selector', () => {
    activeMenu.value = 'repo'
  })

  // 如果有已保存的仓库，自动跳转到状态页
  if (currentRepo.value) {
    activeMenu.value = 'status'
  }
})
</script>

<style scoped>
.app-layout {
  height: 100vh;
}

.main-content {
  padding: 16px;
  height: calc(100vh - 64px);
  overflow-y: auto;
  background-color: #f5f5f5;
}

h3 {
  font-size: 16px;
  font-weight: 500;
}
</style>
