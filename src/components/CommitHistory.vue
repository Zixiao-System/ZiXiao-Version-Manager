<template>
  <div class="commit-history-sourcetree">
    <div v-if="loading" class="loading-container">
      <mdui-circular-progress></mdui-circular-progress>
    </div>

    <div v-else class="split-pane-container">
      <!-- 上部:提交列表 -->
      <div class="commit-list-pane">
        <!-- 搜索栏 -->
        <div class="search-bar">
          <mdui-text-field
            v-model="searchQuery"
            placeholder="搜索提交 (消息、作者、Hash)..."
            icon="search"
            clearable
            @input="handleSearch"
            style="width: 100%;"
          ></mdui-text-field>
          <mdui-button-group v-if="searchQuery" style="margin-top: 8px;">
            <mdui-chip
              v-for="filter in activeFilters"
              :key="filter"
              closable
              @close="removeFilter(filter)"
            >
              {{ getFilterLabel(filter) }}
            </mdui-chip>
          </mdui-button-group>
        </div>

        <div v-if="filteredCommits.length > 0" class="commit-list">
          <div
            v-for="commit in filteredCommits"
            :key="commit.hash"
            :class="['commit-item', { selected: selectedCommit?.hash === commit.hash }]"
            @click="selectCommit(commit)"
          >
            <div class="commit-graph">
              <div class="commit-dot"></div>
              <div class="commit-line"></div>
            </div>
            <div class="commit-info">
              <div class="commit-message">{{ commit.message }}</div>
              <div class="commit-meta">
                <mdui-icon name="person" style="font-size: 14px;"></mdui-icon>
                <span>{{ commit.author_name }}</span>
                <span class="separator">·</span>
                <mdui-icon name="schedule" style="font-size: 14px;"></mdui-icon>
                <span>{{ formatDate(commit.date) }}</span>
                <span class="separator">·</span>
                <span class="commit-hash">{{ commit.hash.substring(0, 7) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-list">
          <mdui-icon name="history" style="font-size: 64px; color: rgb(var(--mdui-color-outline));"></mdui-icon>
          <p>暂无提交历史</p>
        </div>
      </div>

      <!-- 分隔条 -->
      <div class="resizer"></div>

      <!-- 下部:提交详情 -->
      <div class="detail-pane">
        <div v-if="selectedCommit" class="commit-detail">
          <div class="detail-header">
            <div class="detail-title">
              <mdui-icon name="commit" style="font-size: 20px;"></mdui-icon>
              <span>提交详情</span>
            </div>
          </div>
          <div class="detail-content">
            <div class="detail-section">
              <div class="detail-label">提交信息</div>
              <div class="detail-value commit-message-detail">{{ selectedCommit.message }}</div>
            </div>
            <div class="detail-section">
              <div class="detail-label">Hash</div>
              <div class="detail-value hash-value">
                {{ selectedCommit.hash }}
                <mdui-button-icon icon="content_copy" @click="copyHash" size="small" title="复制"></mdui-button-icon>
              </div>
            </div>
            <div class="detail-row">
              <div class="detail-section">
                <div class="detail-label">作者</div>
                <div class="detail-value">
                  {{ selectedCommit.author_name }}
                  <span class="email">&lt;{{ selectedCommit.author_email }}&gt;</span>
                </div>
              </div>
              <div class="detail-section">
                <div class="detail-label">日期</div>
                <div class="detail-value">{{ formatFullDate(selectedCommit.date) }}</div>
              </div>
            </div>
            <div class="detail-section">
              <div class="detail-label">文件更改</div>
              <div class="files-placeholder">
                <mdui-icon name="folder" style="font-size: 36px; color: rgb(var(--mdui-color-outline));"></mdui-icon>
                <p>文件更改列表</p>
                <p style="font-size: 12px; color: rgb(var(--mdui-color-on-surface-variant));">功能开发中...</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="detail-empty">
          <mdui-icon name="info_outline" style="font-size: 48px; color: rgb(var(--mdui-color-outline));"></mdui-icon>
          <p>选择提交查看详情</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { snackbar } from 'mdui'

const loading = ref(false)
const commits = ref([])
const selectedCommit = ref(null)
const searchQuery = ref('')
const activeFilters = ref([])

// Computed property for filtered commits
const filteredCommits = computed(() => {
  if (!searchQuery.value.trim()) {
    return commits.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return commits.value.filter(commit => {
    return (
      commit.message.toLowerCase().includes(query) ||
      commit.author_name.toLowerCase().includes(query) ||
      commit.author_email.toLowerCase().includes(query) ||
      commit.hash.toLowerCase().includes(query)
    )
  })
})

const handleSearch = () => {
  // Optionally add search analytics or debouncing here
}

const removeFilter = (filter) => {
  activeFilters.value = activeFilters.value.filter(f => f !== filter)
}

const getFilterLabel = (filter) => {
  // This can be expanded for advanced filtering
  return filter
}

const loadHistory = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) {
    return
  }

  loading.value = true
  try {
    const result = await window.gitAPI.log(repoPath, { maxCount: 50 })
    if (result.success) {
      commits.value = result.data.all
      // 自动选择第一个提交
      if (commits.value.length > 0) {
        selectedCommit.value = commits.value[0]
      }
    } else {
      snackbar({ message: `加载失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  } finally {
    loading.value = false
  }
}

const selectCommit = (commit) => {
  selectedCommit.value = commit
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return date.toLocaleDateString('zh-CN')
  } else if (days > 0) {
    return `${days} 天前`
  } else if (hours > 0) {
    return `${hours} 小时前`
  } else if (minutes > 0) {
    return `${minutes} 分钟前`
  } else {
    return '刚刚'
  }
}

const formatFullDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const copyHash = () => {
  if (selectedCommit.value) {
    navigator.clipboard.writeText(selectedCommit.value.hash)
    snackbar({ message: '已复制 Hash' })
  }
}

onMounted(() => {
  loadHistory()
  window.addEventListener('repo-selected', loadHistory)
  window.addEventListener('refresh-content', loadHistory)
  window.addEventListener('branches-updated', loadHistory)
})
</script>

<style scoped>
.commit-history-sourcetree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--mdui-color-surface-container-lowest));
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 分栏布局 */
.split-pane-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.commit-list-pane {
  flex: 0 0 50%;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid rgb(var(--mdui-color-outline-variant));
  overflow: hidden;
}

/* 搜索栏 */
.search-bar {
  padding: 12px 16px;
  border-bottom: 1px solid rgb(var(--mdui-color-outline-variant));
  background-color: rgb(var(--mdui-color-surface-container-low));
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

/* 提交列表 */
.commit-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.commit-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.15s;
  border-left: 3px solid transparent;
}

.commit-item:hover {
  background-color: rgb(var(--mdui-color-surface-container));
}

.commit-item.selected {
  background-color: rgb(var(--mdui-color-primary-container));
  border-left-color: rgb(var(--mdui-color-primary));
}

.commit-graph {
  position: relative;
  width: 16px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.commit-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgb(var(--mdui-color-primary));
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px rgb(var(--mdui-color-primary));
  margin-top: 4px;
  z-index: 1;
}

.commit-line {
  flex: 1;
  width: 2px;
  background-color: #e0e0e0;
  margin-top: -2px;
}

.commit-item:last-child .commit-line {
  display: none;
}

.commit-info {
  flex: 1;
  min-width: 0;
}

.commit-message {
  font-size: 14px;
  font-weight: 500;
  color: rgb(var(--mdui-color-on-surface));
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commit-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgb(var(--mdui-color-on-surface-variant));
}

.separator {
  color: rgb(var(--mdui-color-outline));
}

.commit-hash {
  font-family: monospace;
  background-color: rgb(var(--mdui-color-surface-container));
  padding: 2px 6px;
  border-radius: 4px;
  color: rgb(var(--mdui-color-on-surface));
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgb(var(--mdui-color-on-surface-variant));
}

/* 详情面板 */
.commit-detail,
.detail-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  padding: 12px 16px;
  background-color: rgb(var(--mdui-color-surface-container-low));
  border-bottom: 1px solid rgb(var(--mdui-color-outline-variant));
  flex-shrink: 0;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.detail-label {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--mdui-color-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.detail-value {
  font-size: 14px;
  color: rgb(var(--mdui-color-on-surface));
  word-break: break-all;
}

.commit-message-detail {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
}

.hash-value {
  font-family: monospace;
  font-size: 12px;
  background-color: rgb(var(--mdui-color-surface-container));
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.email {
  color: rgb(var(--mdui-color-on-surface-variant));
  font-size: 12px;
  margin-left: 4px;
}

.files-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background-color: rgb(var(--mdui-color-surface-container-low));
  border-radius: 8px;
  color: rgb(var(--mdui-color-on-surface-variant));
}

.detail-empty {
  align-items: center;
  justify-content: center;
  color: rgb(var(--mdui-color-outline));
}

/* 滚动条 */
.commit-list::-webkit-scrollbar,
.detail-content::-webkit-scrollbar {
  width: 8px;
}

.commit-list::-webkit-scrollbar-thumb,
.detail-content::-webkit-scrollbar-thumb {
  background-color: rgb(var(--mdui-color-outline));
  border-radius: 4px;
}

.commit-list::-webkit-scrollbar-thumb:hover,
.detail-content::-webkit-scrollbar-thumb:hover {
  background-color: rgb(var(--mdui-color-outline-variant));
}
</style>