<template>
  <div class="repo-container">
    <mdui-card
      variant="outlined"
      class="repo-selector"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <!-- Drag & Drop overlay -->
      <div v-if="isDragOver" class="drag-overlay">
        <mdui-icon name="upload_file" style="font-size: 72px; color: rgb(var(--mdui-color-primary));"></mdui-icon>
        <p style="font-size: 18px; font-weight: 500; margin-top: 16px;">拖放文件夹打开Git仓库</p>
      </div>

      <div style="padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <mdui-icon name="folder_open" style="font-size: 64px; color: rgb(var(--mdui-color-primary));"></mdui-icon>
          <h2 style="margin-top: 16px;">选择 Git 仓库</h2>
          <p style="color: rgb(var(--mdui-color-on-surface-variant)); margin-top: 8px;">选择一个现有的仓库，或者初始化/克隆一个新仓库，也可以直接拖放文件夹</p>
        </div>

        <!-- 选择现有仓库 -->
        <mdui-card variant="elevated" style="margin-bottom: 16px; padding: 16px;">
          <h3 style="margin-bottom: 12px;">打开现有仓库</h3>
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <mdui-text-field
              label="仓库路径"
              placeholder="点击浏览按钮选择文件夹"
              v-model="localRepoPath"
              style="flex: 1;"
              :error="pathError"
              :helper="pathError ? '请选择有效的 Git 仓库' : ''"
            ></mdui-text-field>
            <mdui-button
              variant="filled"
              icon="folder_open"
              @click="browseFolder"
            >
              浏览
            </mdui-button>
            <mdui-button
              variant="tonal"
              icon="check"
              @click="selectRepository"
              :disabled="!localRepoPath"
            >
              确认
            </mdui-button>
          </div>
        </mdui-card>

        <!-- 初始化新仓库 -->
        <mdui-card variant="elevated" style="margin-bottom: 16px; padding: 16px;">
          <h3 style="margin-bottom: 12px;">初始化新仓库</h3>
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <mdui-text-field
              label="文件夹路径"
              placeholder="选择要初始化的文件夹"
              v-model="initPath"
              style="flex: 1;"
            ></mdui-text-field>
            <mdui-button
              variant="filled"
              icon="folder_open"
              @click="browseInitFolder"
            >
              浏览
            </mdui-button>
            <mdui-button
              variant="tonal"
              icon="add"
              @click="initRepository"
              :disabled="!initPath"
            >
              初始化
            </mdui-button>
          </div>
        </mdui-card>

        <!-- 克隆仓库 -->
        <mdui-card variant="elevated" style="padding: 16px;">
          <h3 style="margin-bottom: 12px;">克隆远程仓库</h3>
          <mdui-text-field
            label="仓库 URL"
            placeholder="https://github.com/username/repo.git"
            v-model="cloneUrl"
            style="width: 100%; margin-bottom: 8px;"
          ></mdui-text-field>
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <mdui-text-field
              label="本地路径"
              placeholder="选择克隆到的位置"
              v-model="clonePath"
              style="flex: 1;"
            ></mdui-text-field>
            <mdui-button
              variant="filled"
              icon="folder_open"
              @click="browseCloneFolder"
            >
              浏览
            </mdui-button>
            <mdui-button
              variant="tonal"
              icon="cloud_download"
              @click="cloneRepository"
              :disabled="!cloneUrl || !clonePath"
              :loading="cloning"
            >
              克隆
            </mdui-button>
          </div>
        </mdui-card>

        <!-- 最近打开的仓库 -->
        <div v-if="recentRepos.length > 0" style="margin-top: 24px;">
          <h3 style="margin-bottom: 12px;">最近打开</h3>
          <mdui-list>
            <mdui-list-item
              v-for="(repo, index) in recentRepos"
              :key="index"
              @click="quickSelect(repo)"
              style="cursor: pointer;"
            >
              <mdui-icon slot="icon" name="history"></mdui-icon>
              <div>
                <div style="font-weight: 500;">{{ getRepoName(repo) }}</div>
                <div style="font-size: 12px; color: rgb(var(--mdui-color-on-surface-variant));">{{ repo }}</div>
              </div>
              <mdui-button-icon
                slot="end-icon"
                icon="close"
                @click.stop="removeRecent(index)"
              ></mdui-button-icon>
            </mdui-list-item>
          </mdui-list>
        </div>

        <!-- 状态消息 -->
        <div v-if="message" style="margin-top: 16px;">
          <mdui-chip
            :style="{
              backgroundColor: messageType === 'error' ? '#f44336' : '#4caf50',
              color: 'white'
            }"
          >
            {{ message }}
          </mdui-chip>
        </div>
      </div>
    </mdui-card>

    <!-- 加载对话框 -->
    <mdui-dialog :open="loading" style="text-align: center;">
      <div v-if="cloning && cloneProgress.inProgress" style="padding: 16px;">
        <div style="margin-bottom: 16px;">
          <span>{{ cloneProgress.message }}</span>
          <span v-if="cloneProgress.value > 0" style="margin-left: 8px;">{{ cloneProgress.value }}%</span>
        </div>
        <mdui-linear-progress
          :value="cloneProgress.value > 0 ? cloneProgress.value / 100 : undefined"
        ></mdui-linear-progress>
      </div>
      <div v-else>
        <mdui-circular-progress></mdui-circular-progress>
        <p style="margin-top: 16px;">{{ loadingMessage }}</p>
      </div>
    </mdui-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { snackbar } from 'mdui'

const localRepoPath = ref('')
const initPath = ref('')
const cloneUrl = ref('')
const clonePath = ref('')
const message = ref('')
const messageType = ref('success')
const pathError = ref(false)
const loading = ref(false)
const loadingMessage = ref('')
const cloning = ref(false)
const recentRepos = ref([])
const isDragOver = ref(false)

// 克隆进度状态
const cloneProgress = reactive({
  inProgress: false,
  value: 0,
  message: ''
})
let unsubscribeProgress = null

// 进度阶段的中文翻译
const stageLabels = {
  'compressing': '压缩中',
  'counting': '计算对象中',
  'receiving': '接收数据中',
  'resolving': '解析中',
  'writing': '写入中',
  'remote': '远程处理中',
  'complete': '完成'
}

const setupProgressListener = () => {
  if (unsubscribeProgress) {
    unsubscribeProgress()
  }
  unsubscribeProgress = window.electronAPI.onGitProgress((data) => {
    if (data.operation === 'clone') {
      cloneProgress.inProgress = true
      cloneProgress.value = data.progress || 0
      const stageLabel = stageLabels[data.stage] || data.stage || ''
      cloneProgress.message = `克隆仓库${stageLabel ? ' - ' + stageLabel : ''}`

      if (data.stage === 'complete') {
        setTimeout(() => {
          cloneProgress.inProgress = false
          cloneProgress.value = 0
          cloneProgress.message = ''
        }, 500)
      }
    }
  })
}

const browseFolder = async () => {
  const result = await window.electronAPI.selectFolder()
  if (result.success) {
    localRepoPath.value = result.path
    pathError.value = false
  }
}

const browseInitFolder = async () => {
  const result = await window.electronAPI.selectFolder()
  if (result.success) {
    initPath.value = result.path
  }
}

const browseCloneFolder = async () => {
  const result = await window.electronAPI.selectFolder()
  if (result.success) {
    clonePath.value = result.path
  }
}

const selectRepository = async () => {
  if (!localRepoPath.value) {
    showMessage('请输入仓库路径', 'error')
    return
  }

  loading.value = true
  loadingMessage.value = '检查仓库...'

  try {
    // 检查是否是有效的 Git 仓库
    const checkResult = await window.gitAPI.isRepo(localRepoPath.value)

    if (!checkResult.success || !checkResult.isRepo) {
      pathError.value = true
      showMessage('所选文件夹不是有效的 Git 仓库', 'error')
      loading.value = false
      return
    }

    const result = await window.gitAPI.status(localRepoPath.value)
    if (result.success) {
      localStorage.setItem('repoPath', localRepoPath.value)
      addToRecent(localRepoPath.value)
      showMessage('仓库加载成功！', 'success')
      pathError.value = false

      // 通知父组件切换到状态页面
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('repo-selected'))
      }, 500)
    } else {
      pathError.value = true
      showMessage(`加载失败: ${result.error}`, 'error')
    }
  } catch (error) {
    pathError.value = true
    showMessage(`错误: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const initRepository = async () => {
  if (!initPath.value) {
    showMessage('请选择要初始化的文件夹', 'error')
    return
  }

  loading.value = true
  loadingMessage.value = '初始化仓库...'

  try {
    const result = await window.gitAPI.init(initPath.value)
    if (result.success) {
      showMessage('仓库初始化成功！', 'success')
      localRepoPath.value = initPath.value
      initPath.value = ''

      // 自动选择新初始化的仓库
      setTimeout(() => {
        selectRepository()
      }, 500)
    } else {
      showMessage(`初始化失败: ${result.error}`, 'error')
    }
  } catch (error) {
    showMessage(`错误: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const cloneRepository = async () => {
  if (!cloneUrl.value || !clonePath.value) {
    showMessage('请填写仓库 URL 和本地路径', 'error')
    return
  }

  cloning.value = true
  loading.value = true
  loadingMessage.value = '克隆仓库中，请稍候...'

  try {
    const result = await window.gitAPI.clone(cloneUrl.value, clonePath.value)
    if (result.success) {
      showMessage('仓库克隆成功！', 'success')
      localRepoPath.value = clonePath.value
      cloneUrl.value = ''
      clonePath.value = ''

      // 自动选择新克隆的仓库
      setTimeout(() => {
        selectRepository()
      }, 500)
    } else {
      showMessage(`克隆失败: ${result.error}`, 'error')
    }
  } catch (error) {
    showMessage(`错误: ${error.message}`, 'error')
  } finally {
    cloning.value = false
    loading.value = false
  }
}

const quickSelect = (repo) => {
  localRepoPath.value = repo
  selectRepository()
}

const getRepoName = (path) => {
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

const addToRecent = (path) => {
  const recent = [...recentRepos.value]
  const index = recent.indexOf(path)

  if (index > -1) {
    recent.splice(index, 1)
  }

  recent.unshift(path)
  recentRepos.value = recent.slice(0, 5) // 只保留最近5个

  localStorage.setItem('recentRepos', JSON.stringify(recentRepos.value))
}

const removeRecent = (index) => {
  recentRepos.value.splice(index, 1)
  localStorage.setItem('recentRepos', JSON.stringify(recentRepos.value))
}

const showMessage = (msg, type = 'success') => {
  message.value = msg
  messageType.value = type

  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// Drag & Drop handlers
const handleDragOver = (event) => {
  isDragOver.value = true
  event.dataTransfer.dropEffect = 'copy'
}

const handleDragLeave = (event) => {
  // Only set isDragOver to false if we're leaving the card entirely
  if (event.target.classList.contains('repo-selector') || event.target.classList.contains('drag-overlay')) {
    isDragOver.value = false
  }
}

const handleDrop = async (event) => {
  isDragOver.value = false

  const items = event.dataTransfer.items
  if (!items || items.length === 0) {
    snackbar({ message: '请拖放文件夹', closeable: true })
    return
  }

  // Get the first item (folder)
  const item = items[0]
  if (item.kind === 'file') {
    const entry = item.webkitGetAsEntry()
    if (entry && entry.isDirectory) {
      const path = entry.fullPath
      // Convert to absolute path by reading the file system
      // Unfortunately, Electron doesn't provide direct path from drag events
      // We'll use a workaround: show snackbar to guide user to browse button
      snackbar({
        message: '请使用浏览按钮选择文件夹，或将文件夹路径粘贴到输入框',
        closeable: true
      })
    } else {
      snackbar({ message: '请拖放文件夹而不是文件', closeable: true })
    }
  }
}

// 监听菜单事件
onMounted(() => {
  // 加载最近打开的仓库
  const savedRecent = localStorage.getItem('recentRepos')
  if (savedRecent) {
    try {
      recentRepos.value = JSON.parse(savedRecent)
    } catch (e) {
      recentRepos.value = []
    }
  }

  // 尝试加载之前保存的路径
  const savedPath = localStorage.getItem('repoPath')
  if (savedPath) {
    localRepoPath.value = savedPath
  }

  // 设置进度监听
  setupProgressListener()

  // 监听菜单选择仓库事件
  window.electronAPI.onMenuSelectRepo(() => {
    browseFolder()
  })
})

onUnmounted(() => {
  // 清理进度监听
  if (unsubscribeProgress) {
    unsubscribeProgress()
  }
})
</script>

<style scoped>
.repo-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
  min-height: 100%;
}

.repo-selector {
  max-width: 800px;
  width: 100%;
  position: relative;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.repo-selector.drag-over {
  border-color: rgb(var(--mdui-color-primary));
  box-shadow: 0 0 0 3px rgba(var(--mdui-color-primary-rgb), 0.2);
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(var(--mdui-color-primary-container-rgb), 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: inherit;
  pointer-events: none;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

h2 {
  margin: 0;
  font-size: 24px;
}

h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}
</style>
