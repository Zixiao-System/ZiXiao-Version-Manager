<template>
  <div class="commit-history">
    <mdui-card variant="outlined">
      <div style="padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3>提交历史</h3>
          <mdui-button-icon icon="refresh" @click="loadHistory"></mdui-button-icon>
        </div>

        <div v-if="loading" style="text-align: center; padding: 32px;">
          <mdui-circular-progress></mdui-circular-progress>
        </div>

        <div v-else-if="commits.length > 0">
          <mdui-list style="margin-top: 16px;">
            <mdui-list-item
              v-for="commit in commits"
              :key="commit.hash"
              @click="showCommitDetail(commit)"
              style="cursor: pointer;"
            >
              <div>
                <div style="font-weight: bold;">{{ commit.message }}</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                  {{ commit.author_name }} · {{ formatDate(commit.date) }}
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 4px;">
                  {{ commit.hash.substring(0, 7) }}
                </div>
              </div>
            </mdui-list-item>
          </mdui-list>
        </div>

        <div v-else style="text-align: center; padding: 32px; color: #999;">
          <p>暂无提交历史</p>
        </div>
      </div>
    </mdui-card>

    <!-- 提交详情对话框 -->
    <mdui-dialog :open="dialogOpen" @close="dialogOpen = false" v-if="selectedCommit">
      <div slot="headline">提交详情</div>
      <div slot="description">
        <div style="margin-bottom: 8px;">
          <strong>提交信息:</strong> {{ selectedCommit.message }}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>作者:</strong> {{ selectedCommit.author_name }} &lt;{{ selectedCommit.author_email }}&gt;
        </div>
        <div style="margin-bottom: 8px;">
          <strong>时间:</strong> {{ formatDate(selectedCommit.date) }}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Hash:</strong> {{ selectedCommit.hash }}
        </div>
      </div>
      <mdui-button slot="action" @click="dialogOpen = false">关闭</mdui-button>
    </mdui-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { snackbar } from 'mdui'

const loading = ref(false)
const commits = ref([])
const dialogOpen = ref(false)
const selectedCommit = ref(null)

const loadHistory = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) {
    snackbar({ message: '请先选择仓库', closeable: true })
    return
  }

  loading.value = true
  try {
    const result = await window.gitAPI.log(repoPath, { maxCount: 50 })
    if (result.success) {
      commits.value = result.data.all
    } else {
      snackbar({ message: `加载失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  } finally {
    loading.value = false
  }
}

const showCommitDetail = (commit) => {
  selectedCommit.value = commit
  dialogOpen.value = true
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.commit-history {
  max-width: 800px;
  margin: 0 auto;
}
</style>
