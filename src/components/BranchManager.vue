<template>
  <div class="branch-manager">
    <mdui-card variant="outlined">
      <div style="padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3>分支管理</h3>
          <mdui-button-icon icon="refresh" @click="loadBranches"></mdui-button-icon>
        </div>

        <div v-if="loading" style="text-align: center; padding: 32px;">
          <mdui-circular-progress></mdui-circular-progress>
        </div>

        <div v-else-if="branches">
          <div style="margin-top: 16px;">
            <strong>当前分支:</strong> {{ branches.current }}
          </div>

          <h4 style="margin-top: 24px;">所有分支</h4>
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
                :style="{ color: branch === branches.current ? '#4caf50' : '' }"
              ></mdui-icon>
              {{ branch }}
            </mdui-list-item>
          </mdui-list>

          <!-- 远程操作 -->
          <div style="margin-top: 24px;">
            <h4>远程操作</h4>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
              <mdui-button variant="outlined" @click="pullChanges">
                <mdui-icon slot="icon" name="download"></mdui-icon>
                Pull
              </mdui-button>
              <mdui-button variant="outlined" @click="pushChanges">
                <mdui-icon slot="icon" name="upload"></mdui-icon>
                Push
              </mdui-button>
            </div>
          </div>
        </div>

        <div v-else style="text-align: center; padding: 32px; color: #999;">
          <p>请先选择一个 Git 仓库</p>
        </div>
      </div>
    </mdui-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { snackbar } from 'mdui'

const loading = ref(false)
const branches = ref(null)

const loadBranches = async () => {
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

const switchBranch = async (branch) => {
  if (branch === branches.value.current) {
    return
  }

  const repoPath = localStorage.getItem('repoPath')
  const result = await window.gitAPI.checkout(repoPath, branch)

  if (result.success) {
    snackbar({ message: `已切换到分支: ${branch}`, closeable: true })
    loadBranches()
  } else {
    snackbar({ message: `切换失败: ${result.error}`, closeable: true })
  }
}

const pullChanges = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!branches.value) return

  const result = await window.gitAPI.pull(repoPath, 'origin', branches.value.current)

  if (result.success) {
    snackbar({ message: 'Pull 成功！', closeable: true })
  } else {
    snackbar({ message: `Pull 失败: ${result.error}`, closeable: true })
  }
}

const pushChanges = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!branches.value) return

  const result = await window.gitAPI.push(repoPath, 'origin', branches.value.current)

  if (result.success) {
    snackbar({ message: 'Push 成功！', closeable: true })
  } else {
    snackbar({ message: `Push 失败: ${result.error}`, closeable: true })
  }
}

onMounted(() => {
  loadBranches()
})
</script>

<style scoped>
.branch-manager {
  max-width: 800px;
  margin: 0 auto;
}
</style>
