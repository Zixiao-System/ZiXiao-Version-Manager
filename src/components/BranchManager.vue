<template>
  <div class="branch-manager">
    <mdui-card variant="outlined">
      <div style="padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3>分支管理</h3>
          <mdui-button-icon icon="refresh" @click="loadAllBranches"></mdui-button-icon>
        </div>

        <div v-if="loading" style="text-align: center; padding: 32px;">
          <mdui-circular-progress></mdui-circular-progress>
        </div>

        <div v-else-if="branches">
          <div style="margin-top: 16px;">
            <strong>当前分支:</strong> {{ branches.current }}
          </div>

          <!-- 本地分支 -->
          <h4 style="margin-top: 24px;">本地分支</h4>
          <mdui-list style="margin-top: 8px;">
            <mdui-list-item
              v-for="branch in branches.all"
              :key="branch"
              @click="switchBranch(branch)"
              :style="{ cursor: branch === branches.current ? 'default' : 'pointer' }"
            >
              <mdui-icon
                slot="icon"
                :name="branch === branches.current ? 'check_circle' : 'radio_button_unchecked'"
                :style="{ color: branch === branches.current ? 'rgb(var(--mdui-color-primary))' : '' }"
              ></mdui-icon>
              {{ branch }}
              <div slot="end" v-if="branch !== branches.current">
                <mdui-button-icon
                  icon="delete"
                  @click.stop="confirmDeleteBranch(branch)"
                  title="删除本地分支"
                ></mdui-button-icon>
              </div>
            </mdui-list-item>
          </mdui-list>

          <!-- 远程分支 -->
          <div style="margin-top: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4 style="margin: 0;">远程分支</h4>
              <mdui-button variant="outlined" size="small" @click="fetchRemote">
                <mdui-icon slot="icon" name="cloud_download"></mdui-icon>
                Fetch
              </mdui-button>
            </div>
            <mdui-list>
              <mdui-list-item
                v-for="branch in remoteBranches"
                :key="branch"
                @click="checkoutRemoteBranch(branch)"
                style="cursor: pointer;"
              >
                <mdui-icon
                  slot="icon"
                  name="cloud"
                  style="color: rgb(var(--mdui-color-tertiary));"
                ></mdui-icon>
                {{ branch }}
                <div slot="end">
                  <mdui-button-icon
                    icon="delete"
                    @click.stop="confirmDeleteRemoteBranch(branch)"
                    title="删除远程分支"
                  ></mdui-button-icon>
                </div>
              </mdui-list-item>
            </mdui-list>
          </div>

          <!-- 远程操作 -->
          <div style="margin-top: 24px;">
            <h4>远程操作</h4>
            <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
              <mdui-button variant="outlined" @click="pullChanges">
                <mdui-icon slot="icon" name="download"></mdui-icon>
                Pull
              </mdui-button>
              <mdui-button variant="outlined" @click="pushChanges">
                <mdui-icon slot="icon" name="upload"></mdui-icon>
                Push
              </mdui-button>
              <mdui-button variant="outlined" @click="openCreateBranchDialog">
                <mdui-icon slot="icon" name="add"></mdui-icon>
                新建分支
              </mdui-button>
            </div>
          </div>
        </div>

        <div v-else style="text-align: center; padding: 32px; color: rgb(var(--mdui-color-on-surface-variant));">
          <p>请先选择一个 Git 仓库</p>
        </div>
      </div>
    </mdui-card>

    <!-- 创建分支对话框 -->
    <mdui-dialog :open="createBranchDialogOpen" @close="createBranchDialogOpen = false">
      <div slot="headline">创建新分支</div>
      <div slot="description">
        <div style="padding: 16px 0;">
          <mdui-text-field
            label="分支名称 *"
            placeholder="feature/new-feature"
            v-model="newBranchName"
            style="width: 100%;"
            required
          ></mdui-text-field>
        </div>
      </div>
      <mdui-button slot="action" variant="text" @click="createBranchDialogOpen = false">取消</mdui-button>
      <mdui-button slot="action" variant="text" @click="createBranch" :disabled="!newBranchName">创建</mdui-button>
    </mdui-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { snackbar, confirm } from 'mdui'

const loading = ref(false)
const branches = ref(null)
const remoteBranches = ref([])
const createBranchDialogOpen = ref(false)
const newBranchName = ref('')

const loadAllBranches = async () => {
  await Promise.all([loadLocalBranches(), loadRemoteBranches()])
}

const loadLocalBranches = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) {
    snackbar({ message: '请先选择仓库', closeable: true })
    return
  }

  loading.value = true
  try {
    const result = await window.gitAPI.branches(repoPath)
    if (result.success) {
      branches.value = result.data
    } else {
      snackbar({ message: `加载失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  } finally {
    loading.value = false
  }
}

const loadRemoteBranches = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) return

  try {
    const result = await window.gitAPI.getRemoteBranches(repoPath)
    if (result.success) {
      remoteBranches.value = result.data.all
    }
  } catch (error) {
    console.error('Failed to load remote branches:', error)
  }
}

const switchBranch = async (branch) => {
  if (branch === branches.value.current) {
    return
  }

  const repoPath = localStorage.getItem('repoPath')
  const result = await window.gitAPI.checkout(repoPath, branch)

  if (result.success) {
    snackbar({ message: `已切换到分支: ${branch}` })
    loadLocalBranches()
    window.dispatchEvent(new CustomEvent('branches-updated'))
  } else {
    snackbar({ message: `切换失败: ${result.error}`, closeable: true })
  }
}

const fetchRemote = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) return

  try {
    const result = await window.gitAPI.fetch(repoPath, 'origin', { prune: true })
    if (result.success) {
      snackbar({ message: 'Fetch 成功！' })
      await loadRemoteBranches()
    } else {
      snackbar({ message: `Fetch 失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  }
}

const checkoutRemoteBranch = async (remoteBranch) => {
  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) return

  // 从远程分支名获取本地分支名 (e.g., origin/feature -> feature)
  const localBranchName = remoteBranch.split('/').slice(1).join('/')

  const confirmed = await confirm({
    headline: '检出远程分支',
    description: `创建本地分支 "${localBranchName}" 并跟踪 "${remoteBranch}"？`,
    confirmText: '创建',
    cancelText: '取消'
  })

  if (!confirmed) return

  try {
    const result = await window.gitAPI.checkoutRemoteBranch(repoPath, remoteBranch, localBranchName)
    if (result.success) {
      snackbar({ message: `已创建并切换到分支: ${localBranchName}` })
      await loadLocalBranches()
      window.dispatchEvent(new CustomEvent('branches-updated'))
    } else {
      snackbar({ message: `检出失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  }
}

const confirmDeleteBranch = async (branchName) => {
  const confirmed = await confirm({
    headline: '删除本地分支',
    description: `确定要删除本地分支 "${branchName}" 吗？`,
    confirmText: '删除',
    cancelText: '取消'
  })

  if (!confirmed) return

  const repoPath = localStorage.getItem('repoPath')
  try {
    const result = await window.gitAPI.deleteBranch(repoPath, branchName)
    if (result.success) {
      snackbar({ message: `分支 ${branchName} 已删除` })
      await loadLocalBranches()
      window.dispatchEvent(new CustomEvent('branches-updated'))
    } else {
      snackbar({ message: `删除失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  }
}

const confirmDeleteRemoteBranch = async (remoteBranch) => {
  const confirmed = await confirm({
    headline: '删除远程分支',
    description: `确定要删除远程分支 "${remoteBranch}" 吗？此操作将影响远程仓库！`,
    confirmText: '删除',
    cancelText: '取消'
  })

  if (!confirmed) return

  const repoPath = localStorage.getItem('repoPath')
  // 从远程分支名获取分支名 (e.g., origin/feature -> feature)
  const parts = remoteBranch.split('/')
  const remote = parts[0]
  const branchName = parts.slice(1).join('/')

  try {
    const result = await window.gitAPI.deleteRemoteBranch(repoPath, remote, branchName)
    if (result.success) {
      snackbar({ message: `远程分支 ${remoteBranch} 已删除` })
      await loadRemoteBranches()
    } else {
      snackbar({ message: `删除失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  }
}

const openCreateBranchDialog = () => {
  newBranchName.value = ''
  createBranchDialogOpen.value = true
}

const createBranch = async () => {
  if (!newBranchName.value) {
    snackbar({ message: '请输入分支名称', closeable: true })
    return
  }

  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) return

  try {
    const result = await window.gitAPI.createBranch(repoPath, newBranchName.value)
    if (result.success) {
      snackbar({ message: `分支 ${newBranchName.value} 创建成功！` })
      createBranchDialogOpen.value = false
      await loadLocalBranches()
      window.dispatchEvent(new CustomEvent('branches-updated'))
    } else {
      snackbar({ message: `创建失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  }
}

const pullChanges = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!branches.value) return

  const result = await window.gitAPI.pull(repoPath, 'origin', branches.value.current)

  if (result.success) {
    snackbar({ message: 'Pull 成功！' })
  } else {
    snackbar({ message: `Pull 失败: ${result.error}`, closeable: true })
  }
}

const pushChanges = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!branches.value) return

  const result = await window.gitAPI.push(repoPath, 'origin', branches.value.current)

  if (result.success) {
    snackbar({ message: 'Push 成功！' })
  } else {
    snackbar({ message: `Push 失败: ${result.error}`, closeable: true })
  }
}

onMounted(() => {
  loadAllBranches()

  // 监听刷新事件
  window.addEventListener('refresh-content', loadAllBranches)
})
</script>

<style scoped>
.branch-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
</style>
