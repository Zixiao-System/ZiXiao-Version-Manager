<template>
  <div class="status-view">
    <mdui-card variant="outlined">
      <div style="padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3>仓库状态</h3>
            <p v-if="repoPath" style="color: #666; font-size: 14px; margin-top: 4px;">{{ repoPath }}</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <mdui-button variant="outlined" icon="stacks" @click="showStashDialog">
              Stash
            </mdui-button>
            <mdui-button-icon icon="refresh" @click="loadStatus"></mdui-button-icon>
          </div>
        </div>

        <div v-if="loading" style="text-align: center; padding: 32px;">
          <mdui-circular-progress></mdui-circular-progress>
        </div>

        <div v-else-if="status">
          <!-- 当前分支信息 -->
          <mdui-card variant="filled" style="padding: 12px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 16px;">{{ status.current }}</strong>
                <span v-if="status.ahead" style="margin-left: 12px; color: #4caf50;">
                  ↑ {{ status.ahead }}
                </span>
                <span v-if="status.behind" style="margin-left: 8px; color: #ff9800;">
                  ↓ {{ status.behind }}
                </span>
              </div>
              <mdui-chip v-if="isClean" style="background-color: #4caf50; color: white;">
                <mdui-icon slot="icon" name="check_circle"></mdui-icon>
                工作目录干净
              </mdui-chip>
            </div>
          </mdui-card>

          <!-- 快速操作 -->
          <div v-if="!isClean" style="display: flex; gap: 8px; margin-bottom: 16px;">
            <mdui-button
              variant="tonal"
              icon="add"
              @click="stageAll"
              :disabled="!hasUnstagedChanges"
            >
              暂存所有
            </mdui-button>
            <mdui-button
              variant="text"
              icon="undo"
              @click="discardAll"
              :disabled="!hasUnstagedChanges"
            >
              丢弃所有更改
            </mdui-button>
          </div>

          <!-- 已暂存文件 -->
          <div v-if="status.staged && status.staged.length > 0" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4 style="margin: 0;">已暂存文件 ({{ status.staged.length }})</h4>
              <mdui-button
                variant="text"
                icon="remove"
                @click="unstageAll"
              >
                取消全部暂存
              </mdui-button>
            </div>
            <mdui-list>
              <mdui-list-item v-for="file in status.staged" :key="file">
                <mdui-icon slot="icon" name="check_circle" style="color: #4caf50;"></mdui-icon>
                <div style="flex: 1;">{{ file }}</div>
                <mdui-button-icon
                  slot="end-icon"
                  icon="remove"
                  @click="unstageFile(file)"
                  title="取消暂存"
                ></mdui-button-icon>
              </mdui-list-item>
            </mdui-list>
          </div>

          <!-- 已修改文件 -->
          <div v-if="status.modified && status.modified.length > 0" style="margin-bottom: 24px;">
            <h4 style="margin-bottom: 8px;">已修改文件 ({{ status.modified.length }})</h4>
            <mdui-list>
              <mdui-list-item v-for="file in status.modified" :key="file">
                <mdui-icon slot="icon" name="edit" style="color: #ff9800;"></mdui-icon>
                <div style="flex: 1;">{{ file }}</div>
                <div slot="end-icon" style="display: flex; gap: 4px;">
                  <mdui-button-icon
                    icon="add"
                    @click="stageFile(file)"
                    title="暂存"
                  ></mdui-button-icon>
                  <mdui-button-icon
                    icon="undo"
                    @click="discardFile(file)"
                    title="丢弃更改"
                  ></mdui-button-icon>
                </div>
              </mdui-list-item>
            </mdui-list>
          </div>

          <!-- 未跟踪文件 -->
          <div v-if="status.not_added && status.not_added.length > 0" style="margin-bottom: 24px;">
            <h4 style="margin-bottom: 8px;">未跟踪文件 ({{ status.not_added.length }})</h4>
            <mdui-list>
              <mdui-list-item v-for="file in status.not_added" :key="file">
                <mdui-icon slot="icon" name="note_add" style="color: #2196f3;"></mdui-icon>
                <div style="flex: 1;">{{ file }}</div>
                <mdui-button-icon
                  slot="end-icon"
                  icon="add"
                  @click="stageFile(file)"
                  title="暂存"
                ></mdui-button-icon>
              </mdui-list-item>
            </mdui-list>
          </div>

          <!-- 提交区域 -->
          <div v-if="status.staged && status.staged.length > 0" style="margin-top: 24px;">
            <mdui-card variant="elevated" style="padding: 16px;">
              <h4 style="margin-top: 0;">提交更改</h4>
              <mdui-text-field
                label="提交信息"
                placeholder="描述你的更改..."
                v-model="commitMessage"
                style="width: 100%; margin-bottom: 12px;"
                rows="3"
              ></mdui-text-field>
              <mdui-button
                variant="filled"
                icon="check"
                @click="commitChanges"
                :disabled="!commitMessage.trim()"
                :loading="committing"
                style="width: 100%;"
              >
                提交 ({{ status.staged.length }} 个文件)
              </mdui-button>
            </mdui-card>
          </div>

          <!-- 无更改提示 -->
          <div v-if="isClean" style="text-align: center; padding: 48px; color: #666;">
            <mdui-icon name="check_circle" style="font-size: 64px; color: #4caf50;"></mdui-icon>
            <p style="margin-top: 16px; font-size: 16px;">工作目录干净</p>
            <p style="margin-top: 8px; font-size: 14px;">没有需要提交的更改</p>
          </div>
        </div>

        <div v-else style="text-align: center; padding: 32px; color: #999;">
          <mdui-icon name="info" style="font-size: 48px;"></mdui-icon>
          <p style="margin-top: 16px;">请先选择一个 Git 仓库</p>
          <mdui-button variant="outlined" @click="goToRepoSelector" style="margin-top: 16px;">
            选择仓库
          </mdui-button>
        </div>
      </div>
    </mdui-card>

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
                <div style="font-size: 12px; color: #666;">{{ stash.hash }}</div>
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
        <div v-else style="text-align: center; padding: 16px; color: #999;">
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

const loading = ref(false)
const status = ref(null)
const commitMessage = ref('')
const committing = ref(false)
const stashDialogOpen = ref(false)
const stashList = ref([])
const repoPath = ref('')

const isClean = computed(() => {
  if (!status.value) return false
  return (status.value.modified?.length || 0) === 0 &&
         (status.value.staged?.length || 0) === 0 &&
         (status.value.not_added?.length || 0) === 0
})

const hasUnstagedChanges = computed(() => {
  if (!status.value) return false
  return (status.value.modified?.length || 0) > 0 || (status.value.not_added?.length || 0) > 0
})

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
    loadStatus()
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

  // 监听仓库选择事件
  window.addEventListener('repo-selected', () => {
    loadStatus()
  })
})
</script>

<style scoped>
.status-view {
  max-width: 900px;
  margin: 0 auto;
}

h3 {
  margin: 0;
  font-size: 20px;
}

h4 {
  margin: 8px 0;
  font-size: 16px;
  font-weight: 500;
}
</style>
