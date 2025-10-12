<template>
  <div class="sourcetree-layout">
    <!-- 左侧固定侧边栏 -->
    <aside class="sidebar">
      <!-- 仓库信息 -->
      <div class="repo-header">
        <div class="repo-info">
          <mdui-icon name="folder" style="font-size: 24px; color: rgb(var(--mdui-color-primary));"></mdui-icon>
          <div class="repo-details">
            <div class="repo-name">{{ getRepoName(currentRepo) || 'ZiXiao' }}</div>
            <div class="repo-path" :title="currentRepo">{{ currentRepo || '未选择仓库' }}</div>
          </div>
        </div>
      </div>

      <!-- 导航菜单 -->
      <div class="navigation">
        <div class="nav-section">
          <div class="nav-section-title">工作区</div>
          <div
            v-for="menu in workspaceMenus"
            :key="menu.value"
            :class="['nav-item', { active: activeMenu === menu.value }]"
            @click="selectMenu(menu.value)"
          >
            <mdui-icon :name="menu.icon"></mdui-icon>
            <span>{{ menu.label }}</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">仓库</div>
          <div
            v-for="menu in repoMenus"
            :key="menu.value"
            :class="['nav-item', { active: activeMenu === menu.value }]"
            @click="selectMenu(menu.value)"
          >
            <mdui-icon :name="menu.icon"></mdui-icon>
            <span>{{ menu.label }}</span>
          </div>
        </div>

        <!-- 分支列表 -->
        <div class="nav-section" v-if="branches.length > 0">
          <div class="nav-section-title">
            <span>分支</span>
            <mdui-button-icon icon="refresh" @click="loadBranches" style="--mdui-comp-button-icon-size: 20px;"></mdui-button-icon>
          </div>
          <div
            v-for="branch in branches"
            :key="branch.name"
            :class="['nav-item', 'branch-item', { current: branch.current }]"
            @click="switchBranch(branch.name)"
            :title="branch.name"
          >
            <mdui-icon :name="branch.current ? 'check_circle' : 'radio_button_unchecked'" style="font-size: 16px;"></mdui-icon>
            <span>{{ branch.name }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧主内容区 -->
    <main class="main-area">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="toolbar-actions">
          <mdui-button-group v-if="currentRepo && activeMenu !== 'repo'">
            <mdui-button icon="refresh" @click="refreshContent">刷新</mdui-button>
            <mdui-button icon="cloud_upload" v-if="activeMenu === 'status'" @click="pushChanges">推送</mdui-button>
            <mdui-button icon="cloud_download" v-if="activeMenu === 'status'" @click="pullChanges">拉取</mdui-button>
            <mdui-button icon="stacks" v-if="activeMenu === 'status'" @click="stashChanges">Stash</mdui-button>
          </mdui-button-group>
        </div>
        <div class="toolbar-search">
          <mdui-text-field
            v-if="activeMenu === 'history'"
            placeholder="搜索提交..."
            icon="search"
            clearable
            style="width: 300px;"
          ></mdui-text-field>
          <!-- 主题切换 -->
          <mdui-button-icon :icon="getThemeIcon(currentTheme)" @click="cycleTheme" :title="getThemeLabel(currentTheme)"></mdui-button-icon>
          <!-- 设置按钮 -->
          <mdui-button-icon icon="settings" @click="settingsDialogOpen = true" title="设置"></mdui-button-icon>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
        <component :is="currentComponent" :key="activeMenu" />
      </div>
    </main>

    <!-- 设置对话框 -->
    <mdui-dialog :open="settingsDialogOpen" @close="settingsDialogOpen = false">
      <div slot="headline">设置</div>
      <div slot="description">
        <div style="padding: 16px 0;">
          <div class="settings-section">
            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: rgb(var(--mdui-color-on-surface-variant));">外观</h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <mdui-list>
                <mdui-list-item
                  v-for="theme in themeOptions"
                  :key="theme.value"
                  @click="setTheme(theme.value)"
                  style="cursor: pointer;"
                >
                  <mdui-icon slot="icon" :name="theme.icon"></mdui-icon>
                  <div>{{ theme.label }}</div>
                  <mdui-icon
                    v-if="currentTheme === theme.value"
                    slot="end-icon"
                    name="check"
                    style="color: rgb(var(--mdui-color-primary));"
                  ></mdui-icon>
                </mdui-list-item>
              </mdui-list>
            </div>
          </div>
        </div>
      </div>
      <mdui-button slot="action" @click="settingsDialogOpen = false">关闭</mdui-button>
    </mdui-dialog>

    <!-- 更新对话框 -->
    <mdui-dialog :open="updateDialogOpen" @close="updateDialogOpen = false">
      <div slot="headline">
        <div style="display: flex; align-items: center; gap: 8px;">
          <mdui-icon name="system_update" style="color: rgb(var(--mdui-color-primary));"></mdui-icon>
          <span>发现新版本</span>
        </div>
      </div>
      <div slot="description" v-if="updateInfo">
        <div style="padding: 16px 0;">
          <div style="margin-bottom: 16px;">
            <div style="font-size: 14px; color: rgb(var(--mdui-color-on-surface-variant)); margin-bottom: 8px;">
              当前版本: {{ updateInfo.currentVersion }}
            </div>
            <div style="font-size: 16px; font-weight: 500; color: rgb(var(--mdui-color-primary));">
              最新版本: {{ updateInfo.version }}
            </div>
          </div>

          <div v-if="updateInfo.name" style="font-size: 15px; font-weight: 500; margin-bottom: 12px;">
            {{ updateInfo.name }}
          </div>

          <div v-if="updateInfo.body" style="font-size: 13px; color: rgb(var(--mdui-color-on-surface-variant)); max-height: 200px; overflow-y: auto; padding: 12px; background-color: rgb(var(--mdui-color-surface-container)); border-radius: 8px; white-space: pre-wrap;">{{ updateInfo.body }}</div>

          <div style="margin-top: 12px; font-size: 12px; color: rgb(var(--mdui-color-on-surface-variant));">
            发布时间: {{ new Date(updateInfo.publishedAt).toLocaleDateString('zh-CN') }}
          </div>
        </div>
      </div>
      <mdui-button slot="action" variant="text" @click="skipThisVersion">跳过此版本</mdui-button>
      <mdui-button slot="action" variant="text" @click="updateDialogOpen = false">稍后提醒</mdui-button>
      <mdui-button slot="action" variant="tonal" @click="downloadUpdate">立即下载</mdui-button>
    </mdui-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { snackbar, confirm } from 'mdui'
import RepositorySelector from './components/RepositorySelector.vue'
import StatusView from './components/StatusView.vue'
import CommitHistory from './components/CommitHistory.vue'
import BranchManager from './components/BranchManager.vue'
import TagManager from './components/TagManager.vue'
import {
  initTheme as initThemeUtil,
  toggleTheme,
  applyTheme,
  saveTheme as saveThemeUtil,
  getThemeIcon as getThemeIconUtil,
  getThemeLabel as getThemeLabelUtil,
  THEMES
} from './utils/theme.js'
import {
  autoCheckForUpdates,
  skipVersion,
  getPlatformAsset
} from './utils/updater.js'

const activeMenu = ref('repo')
const currentRepo = ref('')
const branches = ref([])
const currentTheme = ref(THEMES.AUTO)
const settingsDialogOpen = ref(false)
const updateDialogOpen = ref(false)
const updateInfo = ref(null)

const themeOptions = [
  { value: THEMES.LIGHT, icon: 'light_mode', label: '浅色模式' },
  { value: THEMES.DARK, icon: 'dark_mode', label: '深色模式' },
  { value: THEMES.AUTO, icon: 'brightness_auto', label: '跟随系统' }
]

const workspaceMenus = [
  { label: '文件状态', value: 'status', icon: 'edit_note' },
  { label: '提交历史', value: 'history', icon: 'history' }
]

const repoMenus = [
  { label: '选择仓库', value: 'repo', icon: 'folder_open' },
  { label: '分支管理', value: 'branches', icon: 'account_tree' },
  { label: '标签管理', value: 'tags', icon: 'label' }
]

const components = {
  repo: RepositorySelector,
  status: StatusView,
  history: CommitHistory,
  branches: BranchManager,
  tags: TagManager
}

const currentComponent = computed(() => components[activeMenu.value])

const selectMenu = (menu) => {
  activeMenu.value = menu
}

const getRepoName = (path) => {
  if (!path) return ''
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

const updateCurrentRepo = () => {
  const repoPath = localStorage.getItem('repoPath')
  currentRepo.value = repoPath || ''
  if (repoPath) {
    loadBranches()
  }
}

const loadBranches = async () => {
  if (!currentRepo.value) return

  try {
    const result = await window.gitAPI.getBranches(currentRepo.value)
    if (result.success) {
      branches.value = result.data.branches
    }
  } catch (error) {
    console.error('Failed to load branches:', error)
  }
}

const switchBranch = async (branchName) => {
  if (!currentRepo.value) return

  try {
    const result = await window.gitAPI.checkout(currentRepo.value, branchName)
    if (result.success) {
      snackbar({ message: `已切换到分支: ${branchName}` })
      loadBranches()
      refreshContent()
    } else {
      snackbar({ message: `切换失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `切换失败: ${error.message}`, closeable: true })
  }
}

const refreshContent = () => {
  window.dispatchEvent(new CustomEvent('refresh-content'))
}

const pushChanges = () => {
  window.dispatchEvent(new CustomEvent('git-push'))
}

const pullChanges = () => {
  window.dispatchEvent(new CustomEvent('git-pull'))
}

const stashChanges = () => {
  window.dispatchEvent(new CustomEvent('git-stash'))
}

const cycleTheme = () => {
  const newTheme = toggleTheme(currentTheme.value)
  currentTheme.value = newTheme
  snackbar({ message: `已切换到${getThemeLabelUtil(newTheme)}` })
}

const setTheme = (theme) => {
  currentTheme.value = theme
  saveThemeUtil(theme)
  applyTheme(theme)
  snackbar({ message: `已切换到${getThemeLabelUtil(theme)}` })
}

const getThemeIcon = (theme) => getThemeIconUtil(theme)
const getThemeLabel = (theme) => getThemeLabelUtil(theme)

const checkForUpdates = async () => {
  try {
    const update = await autoCheckForUpdates()
    if (update) {
      updateInfo.value = update
      updateDialogOpen.value = true
    }
  } catch (error) {
    console.error('Failed to check for updates:', error)
  }
}

const downloadUpdate = async () => {
  if (!updateInfo.value) return

  const asset = getPlatformAsset(updateInfo.value.assets)
  if (asset) {
    try {
      await window.electronAPI.openExternal(asset.downloadUrl)
      updateDialogOpen.value = false
    } catch (error) {
      snackbar({ message: `无法打开下载链接: ${error.message}`, closeable: true })
    }
  } else {
    await window.electronAPI.openExternal(updateInfo.value.htmlUrl)
    updateDialogOpen.value = false
  }
}

const skipThisVersion = () => {
  if (updateInfo.value) {
    skipVersion(updateInfo.value.version)
    snackbar({ message: '已跳过此版本' })
    updateDialogOpen.value = false
  }
}

onMounted(() => {
  currentTheme.value = initThemeUtil()
  updateCurrentRepo()

  // Check for updates
  checkForUpdates()

  // 监听仓库选择事件
  window.addEventListener('repo-selected', () => {
    updateCurrentRepo()
    activeMenu.value = 'status'
  })

  // 监听返回仓库选择器事件
  window.addEventListener('go-to-repo-selector', () => {
    activeMenu.value = 'repo'
  })

  // 监听分支变化事件
  window.addEventListener('branches-updated', () => {
    loadBranches()
  })

  // 如果有已保存的仓库，自动跳转到状态页
  if (currentRepo.value) {
    activeMenu.value = 'status'
  }
})
</script>

<style scoped>
.sourcetree-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: rgb(var(--mdui-color-background));
}

/* 左侧边栏 */
.sidebar {
  width: 250px;
  background-color: rgb(var(--mdui-color-surface-container-lowest));
  border-right: 1px solid rgb(var(--mdui-color-outline-variant));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.repo-header {
  padding: 16px;
  border-bottom: 1px solid rgb(var(--mdui-color-outline-variant));
  background-color: rgb(var(--mdui-color-surface-container-low));
}

.repo-info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.repo-details {
  flex: 1;
  min-width: 0;
}

.repo-name {
  font-size: 16px;
  font-weight: 600;
  color: rgb(var(--mdui-color-on-surface));
  margin-bottom: 4px;
}

.repo-path {
  font-size: 11px;
  color: rgb(var(--mdui-color-on-surface-variant));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 导航区域 */
.navigation {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.nav-section {
  margin-bottom: 16px;
}

.nav-section-title {
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--mdui-color-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: rgb(var(--mdui-color-on-surface));
  font-size: 14px;
}

.nav-item:hover {
  background-color: rgb(var(--mdui-color-surface-container-high));
}

.nav-item.active {
  background-color: rgb(var(--mdui-color-primary-container));
  color: rgb(var(--mdui-color-on-primary-container));
  font-weight: 500;
}

.nav-item mdui-icon {
  font-size: 20px;
}

.branch-item {
  padding-left: 24px;
  font-size: 13px;
}

.branch-item.current {
  color: rgb(var(--mdui-color-primary));
  font-weight: 500;
}

.branch-item span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 右侧主区域 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  height: 56px;
  background-color: rgb(var(--mdui-color-surface-container-lowest));
  border-bottom: 1px solid rgb(var(--mdui-color-outline-variant));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 16px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.toolbar-search {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 内容区域 */
.content-area {
  flex: 1;
  overflow: hidden;
  background-color: rgb(var(--mdui-color-surface-container-low));
}

/* 滚动条样式 */
.navigation::-webkit-scrollbar {
  width: 6px;
}

.navigation::-webkit-scrollbar-thumb {
  background-color: rgb(var(--mdui-color-outline));
  border-radius: 3px;
}

.navigation::-webkit-scrollbar-thumb:hover {
  background-color: rgb(var(--mdui-color-outline-variant));
}
</style>
