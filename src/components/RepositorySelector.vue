<template>
  <div class="repo-container">
    <mdui-card variant="outlined" class="repo-selector">
      <div style="padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <mdui-icon name="folder_open" style="font-size: 64px; color: rgb(var(--mdui-color-primary));"></mdui-icon>
          <h2 style="margin-top: 16px;">选择 Git 仓库</h2>
          <p style="color: rgb(var(--mdui-color-on-surface-variant)); margin-top: 8px;">选择一个现有的仓库，或者初始化/克隆一个新仓库</p>
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
      <mdui-circular-progress></mdui-circular-progress>
      <p style="margin-top: 16px;">{{ loadingMessage }}</p>
    </mdui-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

  // 监听菜单选择仓库事件
  window.electronAPI.onMenuSelectRepo(() => {
    browseFolder()
  })
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
