<template>
  <div class="status-view-sourcetree">
    <div v-if="loading" class="loading-container">
      <mdui-circular-progress></mdui-circular-progress>
    </div>

    <div v-else-if="!repoPath" class="empty-state">
      <mdui-icon name="folder_open" style="font-size: 64px; color: rgb(var(--mdui-color-outline));"></mdui-icon>
      <p style="margin-top: 16px; font-size: 16px; color: rgb(var(--mdui-color-on-surface-variant));">请先选择一个 Git 仓库</p>
      <mdui-button variant="filled" @click="goToRepoSelector" style="margin-top: 16px;">
        选择仓库
      </mdui-button>
    </div>

    <div v-else class="split-pane-container">
      <!-- 上部:文件列表区 -->
      <div class="file-list-pane">
        <!-- 当前分支和状态栏 -->
        <div class="status-bar">
          <div class="branch-info">
            <mdui-icon name="account_tree" style="font-size: 18px; color: rgb(var(--mdui-color-primary));"></mdui-icon>
            <strong>{{ status?.current || 'main' }}</strong>
            <span v-if="status?.ahead" class="badge ahead">↑ {{ status.ahead }}</span>
            <span v-if="status?.behind" class="badge behind">↓ {{ status.behind }}</span>
          </div>
          <mdui-chip v-if="isClean" style="background-color: #4caf50; color: white; height: 24px;">
            <mdui-icon slot="icon" name="check_circle" style="font-size: 16px;"></mdui-icon>
            干净
          </mdui-chip>
        </div>

        <!-- 文件搜索栏 -->
        <div v-if="!isClean" class="file-search-bar">
          <mdui-text-field
            v-model="fileSearchQuery"
            placeholder="搜索文件..."
            icon="search"
            clearable
            style="width: 100%;"
          ></mdui-text-field>
        </div>

        <!-- 文件列表 -->
        <div class="file-list-content">
          <!-- 未暂存的更改 -->
          <div class="file-section" v-if="filteredUnstagedFiles.length > 0">
            <div class="section-header">
              <div class="section-title">
                <mdui-icon name="edit" style="font-size: 16px;"></mdui-icon>
                <span>未暂存的更改</span>
                <span class="count">({{ filteredUnstagedFiles.length }})</span>
              </div>
              <div class="section-actions">
                <mdui-button variant="text" icon="add" @click="stageAll" size="small">全部暂存</mdui-button>
                <mdui-button variant="text" icon="undo" @click="discardAll" size="small">丢弃所有</mdui-button>
              </div>
            </div>
            <div
              v-for="file in filteredUnstagedFiles"
              :key="'unstaged-' + file.path"
              :class="['file-item', { selected: selectedFile?.path === file.path && selectedFile?.staged === false }]"
              @click="selectFile(file, false)"
            >
              <mdui-icon :name="getFileIcon(file.status)" :style="{ color: getFileColor(file.status), fontSize: '18px' }"></mdui-icon>
              <span class="file-path">{{ file.path }}</span>
              <span class="file-status">{{ getFileStatusText(file.status) }}</span>
              <div class="file-actions">
                <mdui-button-icon icon="add" @click.stop="stageFile(file.path)" size="small" title="暂存"></mdui-button-icon>
                <mdui-button-icon v-if="file.status === 'M'" icon="undo" @click.stop="discardFile(file.path)" size="small" title="丢弃"></mdui-button-icon>
              </div>
            </div>
          </div>

          <!-- 已暂存的更改 -->
          <div class="file-section" v-if="filteredStagedFiles.length > 0">
            <div class="section-header">
              <div class="section-title">
                <mdui-icon name="check_circle" style="font-size: 16px; color: #4caf50;"></mdui-icon>
                <span>已暂存的更改</span>
                <span class="count">({{ filteredStagedFiles.length }})</span>
              </div>
              <div class="section-actions">
                <mdui-button variant="text" icon="remove" @click="unstageAll" size="small">取消全部</mdui-button>
              </div>
            </div>
            <div
              v-for="file in filteredStagedFiles"
              :key="'staged-' + file"
              :class="['file-item', { selected: selectedFile?.path === file && selectedFile?.staged === true }]"
              @click="selectFile({ path: file, status: 'S' }, true)"
            >
              <mdui-icon name="check_circle" style="color: #4caf50; font-size: 18px;"></mdui-icon>
              <span class="file-path">{{ file }}</span>
              <span class="file-status">已暂存</span>
              <div class="file-actions">
                <mdui-button-icon icon="remove" @click.stop="unstageFile(file)" size="small" title="取消暂存"></mdui-button-icon>
              </div>
            </div>
          </div>

          <!-- 无更改 -->
          <div v-if="isClean" class="empty-file-list">
            <mdui-icon name="check_circle" style="font-size: 48px; color: #4caf50;"></mdui-icon>
            <p>工作目录干净,没有需要提交的更改</p>
          </div>
        </div>
      </div>

      <!-- 分隔条 -->
      <div class="resizer"></div>

      <!-- 下部:详情和提交区 -->
      <div class="detail-pane">
        <!-- 文件详情 -->
        <div v-if="selectedFile" class="file-detail">
          <div class="detail-header">
            <div class="detail-title">
              <mdui-icon name="description"></mdui-icon>
              <span>{{ selectedFile.path }}</span>
              <mdui-chip style="margin-left: 12px;">{{ getFileStatusText(selectedFile.status) }}</mdui-chip>
            </div>
          </div>
          <div class="detail-content">
            <DiffViewer
              :file-path="selectedFile.path"
              :is-staged="selectedFile.staged"
              :repo-path="repoPath"
            />
          </div>
        </div>

        <!-- 提交区域 -->
        <div v-else-if="stagedFiles.length > 0" class="commit-area">
          <div class="commit-header">
            <mdui-icon name="commit" style="font-size: 20px;"></mdui-icon>
            <span>提交更改</span>
          </div>
          <div class="commit-content">
            <mdui-text-field
              label="提交信息"
              placeholder="描述你的更改..."
              v-model="commitMessage"
              variant="outlined"
              style="width: 100%;"
              rows="4"
            ></mdui-text-field>
            <div class="commit-actions">
              <mdui-button
                variant="filled"
                icon="check"
                @click="commitChanges"
                :disabled="!commitMessage.trim()"
                :loading="committing"
              >
                提交 ({{ stagedFiles.length }} 个文件)
              </mdui-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="detail-empty">
          <mdui-icon name="info_outline" style="font-size: 48px; color: rgb(var(--mdui-color-outline));"></mdui-icon>
          <p>选择文件查看详情</p>
        </div>
      </div>
    </div>

    <!-- Stash 对话框 -->
    <mdui-dialog :open="stashDialogOpen" @close="stashDialogOpen = false">
      <div slot="headline">Stash 管理</div>
      <div slot="description">
        <div style="margin-bottom: 16px;">
          <mdui-button variant="outlined" @click="createStash" style="margin-right: 8px;">
            <mdui-icon slot="icon" name="save"></mdui-icon>
            保存当前更改到 Stash
          </mdui-button>
        </div>
        <div v-if="stashList && stashList.length > 0">
          <h4>Stash 列表</h4>
          <mdui-list>
            <mdui-list-item v-for="(stash, index) in stashList" :key="index">
              <div>
                <div style="font-weight: 500;">{{ stash.message || `Stash ${index}` }}</div>
                <div style="font-size: 12px; color: rgb(var(--mdui-color-on-surface-variant));">{{ stash.hash }}</div>
              </div>
              <mdui-button
                slot="end-icon"
                variant="text"
                @click="applyStash"
              >
                应用
              </mdui-button>
            </mdui-list-item>
          </mdui-list>
        </div>
        <div v-else style="text-align: center; padding: 16px; color: rgb(var(--mdui-color-on-surface-variant));">
          暂无 Stash
        </div>
      </div>
      <mdui-button slot="action" @click="stashDialogOpen = false">关闭</mdui-button>
    </mdui-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { snackbar, confirm } from 'mdui'
import DiffViewer from './DiffViewer.vue'

const loading = ref(false)
const status = ref(null)
const commitMessage = ref('')
const committing = ref(false)
const stashDialogOpen = ref(false)
const stashList = ref([])
const repoPath = ref('')
const selectedFile = ref(null)
const fileSearchQuery = ref('')

const isClean = computed(() => {
  if (!status.value) return false
  return (status.value.modified?.length || 0) === 0 &&
         (status.value.staged?.length || 0) === 0 &&
         (status.value.not_added?.length || 0) === 0
})

const unstagedFiles = computed(() => {
  if (!status.value) return []
  const files = []

  // Modified files
  if (status.value.modified) {
    files.push(...status.value.modified.map(path => ({ path, status: 'M' })))
  }

  // Not added files
  if (status.value.not_added) {
    files.push(...status.value.not_added.map(path => ({ path, status: '?' })))
  }

  return files
})

const stagedFiles = computed(() => {
  return status.value?.staged || []
})

const filteredUnstagedFiles = computed(() => {
  if (!fileSearchQuery.value.trim()) {
    return unstagedFiles.value
  }
  const query = fileSearchQuery.value.toLowerCase().trim()
  return unstagedFiles.value.filter(file =>
    file.path.toLowerCase().includes(query)
  )
})

const filteredStagedFiles = computed(() => {
  if (!fileSearchQuery.value.trim()) {
    return stagedFiles.value
  }
  const query = fileSearchQuery.value.toLowerCase().trim()
  return stagedFiles.value.filter(file =>
    file.toLowerCase().includes(query)
  )
})

const getFileIcon = (status) => {
  switch (status) {
    case 'M': return 'edit'
    case '?': return 'note_add'
    case 'D': return 'delete'
    default: return 'description'
  }
}

const getFileColor = (status) => {
  switch (status) {
    case 'M': return '#ff9800'
    case '?': return '#2196f3'
    case 'D': return '#f44336'
    default: return '#757575'
  }
}

const getFileStatusText = (status) => {
  switch (status) {
    case 'M': return '已修改'
    case '?': return '未跟踪'
    case 'D': return '已删除'
    case 'S': return '已暂存'
    default: return '未知'
  }
}

const selectFile = (file, staged) => {
  selectedFile.value = { ...file, staged }
}

const loadStatus = async () => {
  const savedRepoPath = localStorage.getItem('repoPath')
  if (!savedRepoPath) {
    return
  }

  repoPath.value = savedRepoPath
  loading.value = true

  try {
    const result = await window.gitAPI.status(savedRepoPath)
    if (result.success) {
      status.value = result.data
    } else {
      snackbar({ message: `加载失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  } finally {
    loading.value = false
  }
}

const stageFile = async (file) => {
  const result = await window.gitAPI.add(repoPath.value, file)
  if (result.success) {
    snackbar({ message: `已暂存: ${file}` })
    loadStatus()
  } else {
    snackbar({ message: `暂存失败: ${result.error}`, closeable: true })
  }
}

const stageAll = async () => {
  const result = await window.gitAPI.add(repoPath.value, '.')
  if (result.success) {
    snackbar({ message: '已暂存所有更改' })
    loadStatus()
  } else {
    snackbar({ message: `暂存失败: ${result.error}`, closeable: true })
  }
}

const unstageFile = async (file) => {
  const result = await window.gitAPI.unstage(repoPath.value, file)
  if (result.success) {
    snackbar({ message: `已取消暂存: ${file}` })
    loadStatus()
  } else {
    snackbar({ message: `取消暂存失败: ${result.error}`, closeable: true })
  }
}

const unstageAll = async () => {
  const result = await window.gitAPI.unstage(repoPath.value, '.')
  if (result.success) {
    snackbar({ message: '已取消全部暂存' })
    loadStatus()
  } else {
    snackbar({ message: `取消暂存失败: ${result.error}`, closeable: true })
  }
}

const discardFile = async (file) => {
  const confirmed = await confirm({
    headline: '确认丢弃更改',
    description: `确定要丢弃 ${file} 的所有更改吗？此操作不可撤销。`,
    confirmText: '丢弃',
    cancelText: '取消'
  })

  if (confirmed) {
    const result = await window.gitAPI.discard(repoPath.value, file)
    if (result.success) {
      snackbar({ message: `已丢弃 ${file} 的更改` })
      loadStatus()
    } else {
      snackbar({ message: `丢弃失败: ${result.error}`, closeable: true })
    }
  }
}

const discardAll = async () => {
  const confirmed = await confirm({
    headline: '确认丢弃所有更改',
    description: '确定要丢弃所有未暂存的更改吗？此操作不可撤销。',
    confirmText: '丢弃',
    cancelText: '取消'
  })

  if (confirmed) {
    const result = await window.gitAPI.discard(repoPath.value, '.')
    if (result.success) {
      snackbar({ message: '已丢弃所有更改' })
      loadStatus()
    } else {
      snackbar({ message: `丢弃失败: ${result.error}`, closeable: true })
    }
  }
}

const commitChanges = async () => {
  if (!commitMessage.value.trim()) {
    snackbar({ message: '请输入提交信息', closeable: true })
    return
  }

  committing.value = true
  const result = await window.gitAPI.commit(repoPath.value, commitMessage.value)

  if (result.success) {
    snackbar({ message: '提交成功！' })
    commitMessage.value = ''
    selectedFile.value = null
    loadStatus()
    window.dispatchEvent(new CustomEvent('branches-updated'))
  } else {
    snackbar({ message: `提交失败: ${result.error}`, closeable: true })
  }
  committing.value = false
}

const showStashDialog = async () => {
  stashDialogOpen.value = true
  const result = await window.gitAPI.stashList(repoPath.value)
  if (result.success) {
    stashList.value = result.data.all || []
  }
}

const createStash = async () => {
  const result = await window.gitAPI.stash(repoPath.value)
  if (result.success) {
    snackbar({ message: '已保存到 Stash' })
    loadStatus()
    showStashDialog()
  } else {
    snackbar({ message: `Stash 失败: ${result.error}`, closeable: true })
  }
}

const applyStash = async () => {
  const result = await window.gitAPI.stashPop(repoPath.value)
  if (result.success) {
    snackbar({ message: '已应用 Stash' })
    stashDialogOpen.value = false
    loadStatus()
  } else {
    snackbar({ message: `应用 Stash 失败: ${result.error}`, closeable: true })
  }
}

const goToRepoSelector = () => {
  window.dispatchEvent(new CustomEvent('go-to-repo-selector'))
}

onMounted(() => {
  loadStatus()

  // 监听事件
  window.addEventListener('repo-selected', loadStatus)
  window.addEventListener('refresh-content', loadStatus)
  window.addEventListener('git-push', async () => {
    const result = await window.gitAPI.push(repoPath.value)
    if (result.success) {
      snackbar({ message: '推送成功' })
      loadStatus()
    } else {
      snackbar({ message: `推送失败: ${result.error}`, closeable: true })
    }
  })
  window.addEventListener('git-pull', async () => {
    const result = await window.gitAPI.pull(repoPath.value)
    if (result.success) {
      snackbar({ message: '拉取成功' })
      loadStatus()
    } else {
      snackbar({ message: `拉取失败: ${result.error}`, closeable: true })
    }
  })
  window.addEventListener('git-stash', showStashDialog)
})
</script>

<style scoped>
.status-view-sourcetree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--mdui-color-surface-container-lowest));
}

.loading-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px;
}

/* 分栏布局 */
.split-pane-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.file-list-pane {
  flex: 0 0 50%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgb(var(--mdui-color-outline-variant));
  overflow: hidden;
}

.resizer {
  height: 4px;
  background-color: rgb(var(--mdui-color-surface-container));
  cursor: ns-resize;
  flex-shrink: 0;
}

.resizer:hover {
  background-color: rgb(var(--mdui-color-primary));
}

.detail-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 状态栏 */
.status-bar {
  padding: 12px 16px;
  background-color: rgb(var(--mdui-color-surface-container-low));
  border: 1px solid rgb(var(--mdui-color-outline-variant));
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.file-search-bar {
  padding: 8px 16px;
  background-color: rgb(var(--mdui-color-surface-container-low));
  border-bottom: 1px solid rgb(var(--mdui-color-outline-variant));
}

.branch-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.badge.ahead {
  background-color: rgba(var(--git-added), 0.1);
  color: var(--git-added);
}

.badge.behind {
  background-color: rgba(var(--git-modified), 0.1);
  color: var(--git-modified);
}

/* 文件列表 */
.file-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.file-section {
  margin-bottom: 16px;
}

.section-header {
  padding: 8px 16px;
  background-color: rgb(var(--mdui-color-surface-container));
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--mdui-color-on-surface));
}

.count {
  color: rgb(var(--mdui-color-on-surface-variant));
  font-weight: 400;
}

.section-actions {
  display: flex;
  gap: 4px;
}

.file-item {
  padding: 6px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  font-size: 13px;
}

.file-item:hover {
  background-color: rgb(var(--mdui-color-surface-container));
}

.file-item.selected {
  background-color: rgb(var(--mdui-color-primary-container));
}

.file-path {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-status {
  font-size: 11px;
  color: rgb(var(--mdui-color-on-surface-variant));
  padding: 2px 8px;
  background-color: rgb(var(--mdui-color-surface-container));
  border-radius: 8px;
}

.file-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.file-item:hover .file-actions {
  opacity: 1;
}

.empty-file-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: rgb(var(--mdui-color-on-surface-variant));
}

/* 详情面板 */
.file-detail,
.commit-area,
.detail-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header,
.commit-header {
  padding: 12px 16px;
  background-color: rgb(var(--mdui-color-surface-container-low));
  border: 1px solid rgb(var(--mdui-color-outline-variant));
  flex-shrink: 0;
}

.detail-title,
.commit-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  background-color: rgb(var(--mdui-color-surface-container-low));
}

.diff-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgb(var(--mdui-color-on-surface-variant));
}

.commit-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.commit-actions {
  display: flex;
  justify-content: flex-end;
}

.detail-empty {
  align-items: center;
  justify-content: center;
  color: rgb(var(--mdui-color-outline));
}

/* 滚动条 */
.file-list-content::-webkit-scrollbar,
.detail-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.file-list-content::-webkit-scrollbar-thumb,
.detail-content::-webkit-scrollbar-thumb {
  background-color: rgb(var(--mdui-color-outline));
  border-radius: 4px;
}

.file-list-content::-webkit-scrollbar-thumb:hover,
.detail-content::-webkit-scrollbar-thumb:hover {
  background-color: rgb(var(--mdui-color-outline-variant));
}
</style>