<template>
  <mdui-dialog :open="isOpen" @close="handleClose">
    <div slot="headline">Cherry-pick 提交</div>
    <div slot="description">
      <div style="padding: 16px 0;">
        <p style="margin-bottom: 16px; color: rgb(var(--mdui-color-on-surface-variant));">
          将选中的提交应用到当前分支
        </p>

        <div v-if="commit" class="commit-preview">
          <div class="preview-label">提交信息</div>
          <div class="commit-message">{{ commit.message }}</div>
          <div class="commit-meta">
            <mdui-icon name="tag" style="font-size: 14px;"></mdui-icon>
            <span class="commit-hash">{{ commit.hash.substring(0, 7) }}</span>
            <span class="separator">·</span>
            <mdui-icon name="person" style="font-size: 14px;"></mdui-icon>
            <span>{{ commit.author_name }}</span>
            <span class="separator">·</span>
            <mdui-icon name="schedule" style="font-size: 14px;"></mdui-icon>
            <span>{{ formatDate(commit.date) }}</span>
          </div>
        </div>

        <div v-if="selectedCommits.length > 1" style="margin-top: 12px;">
          <div class="preview-label">已选择 {{ selectedCommits.length }} 个提交</div>
          <div class="commits-list">
            <div v-for="c in selectedCommits" :key="c.hash" class="commit-item">
              <mdui-icon name="commit" style="font-size: 16px; color: rgb(var(--mdui-color-tertiary));"></mdui-icon>
              <span class="commit-hash">{{ c.hash.substring(0, 7) }}</span>
              <span class="commit-msg">{{ c.message }}</span>
            </div>
          </div>
        </div>

        <div v-if="error" style="margin-top: 12px;">
          <mdui-chip style="background-color: rgb(var(--mdui-color-error)); color: rgb(var(--mdui-color-on-error));">
            {{ error }}
          </mdui-chip>
        </div>

        <div v-if="inProgress" style="margin-top: 16px; text-align: center;">
          <mdui-circular-progress style="width: 32px; height: 32px;"></mdui-circular-progress>
          <p style="margin-top: 8px; color: rgb(var(--mdui-color-on-surface-variant));">正在应用提交...</p>
        </div>
      </div>
    </div>
    <mdui-button slot="action" variant="text" @click="handleClose" :disabled="inProgress">取消</mdui-button>
    <mdui-button slot="action" variant="tonal" @click="handleCherryPick" :disabled="inProgress">Cherry-pick</mdui-button>
  </mdui-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { snackbar } from 'mdui'
import { cacheHelpers } from '../utils/gitCache.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  commit: {
    type: Object,
    default: null
  },
  selectedCommits: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'success'])

const inProgress = ref(false)
const error = ref('')

const handleClose = () => {
  if (!inProgress.value) {
    error.value = ''
    emit('close')
  }
}

const handleCherryPick = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) {
    error.value = '未选择仓库'
    return
  }

  const commits = props.selectedCommits.length > 0 ? props.selectedCommits : [props.commit]
  if (!commits.length) {
    error.value = '没有选择提交'
    return
  }

  inProgress.value = true
  error.value = ''

  try {
    for (const commit of commits) {
      const result = await window.gitAPI.cherryPick(repoPath, commit.hash)
      if (!result.success) {
        error.value = `Cherry-pick 失败: ${result.error}`
        snackbar({ message: `Cherry-pick 失败: ${result.error}`, closeable: true })
        inProgress.value = false
        return
      }
    }

    // Invalidate cache
    cacheHelpers.invalidateAfterWrite(repoPath, 'cherryPick')

    snackbar({ message: `成功 cherry-pick ${commits.length} 个提交` })
    emit('success')
    handleClose()
  } catch (error) {
    error.value = `错误: ${error.message}`
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  } finally {
    inProgress.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.commit-preview {
  background-color: rgb(var(--mdui-color-surface-container));
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid rgb(var(--mdui-color-primary));
}

.preview-label {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--mdui-color-on-surface-variant));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.commit-message {
  font-size: 15px;
  font-weight: 500;
  color: rgb(var(--mdui-color-on-surface));
  margin-bottom: 8px;
}

.commit-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgb(var(--mdui-color-on-surface-variant));
}

.commit-hash {
  font-family: monospace;
  background-color: rgb(var(--mdui-color-surface-container-high));
  padding: 2px 6px;
  border-radius: 4px;
  color: rgb(var(--mdui-color-on-surface));
}

.separator {
  color: rgb(var(--mdui-color-outline));
}

.commits-list {
  max-height: 200px;
  overflow-y: auto;
  background-color: rgb(var(--mdui-color-surface-container));
  border-radius: 8px;
  padding: 8px;
}

.commit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  font-size: 13px;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.commit-item:hover {
  background-color: rgb(var(--mdui-color-surface-container-high));
}

.commit-msg {
  flex: 1;
  color: rgb(var(--mdui-color-on-surface));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
