<template>
  <div class="tag-manager">
    <mdui-card variant="outlined">
      <div style="padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3>标签管理</h3>
          <div style="display: flex; gap: 8px;">
            <mdui-button icon="add" @click="openCreateTagDialog">创建标签</mdui-button>
            <mdui-button-icon icon="refresh" @click="loadTags"></mdui-button-icon>
          </div>
        </div>

        <div v-if="loading" style="text-align: center; padding: 32px;">
          <mdui-circular-progress></mdui-circular-progress>
        </div>

        <div v-else-if="tags && tags.all && tags.all.length > 0">
          <div style="margin-bottom: 16px;">
            <mdui-text-field
              placeholder="搜索标签..."
              icon="search"
              clearable
              v-model="searchQuery"
              style="width: 100%;"
            ></mdui-text-field>
          </div>

          <mdui-list>
            <mdui-list-item
              v-for="tag in filteredTags"
              :key="tag"
            >
              <mdui-icon slot="icon" name="label" style="color: rgb(var(--mdui-color-primary));"></mdui-icon>
              <div>
                <div style="font-weight: 500;">{{ tag }}</div>
              </div>
              <div slot="end">
                <mdui-button-icon
                  icon="cloud_upload"
                  @click="pushTag(tag)"
                  title="推送标签到远程"
                ></mdui-button-icon>
                <mdui-button-icon
                  icon="delete"
                  @click="confirmDeleteTag(tag)"
                  title="删除标签"
                ></mdui-button-icon>
              </div>
            </mdui-list-item>
          </mdui-list>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgb(var(--mdui-color-outline-variant));">
            <h4 style="margin-bottom: 12px;">批量操作</h4>
            <div style="display: flex; gap: 8px;">
              <mdui-button variant="outlined" @click="pushAllTags">
                <mdui-icon slot="icon" name="cloud_upload"></mdui-icon>
                推送所有标签
              </mdui-button>
            </div>
          </div>
        </div>

        <div v-else-if="tags && tags.all && tags.all.length === 0" style="text-align: center; padding: 32px; color: rgb(var(--mdui-color-on-surface-variant));">
          <mdui-icon name="label" style="font-size: 48px; opacity: 0.5;"></mdui-icon>
          <p style="margin-top: 16px;">暂无标签</p>
          <mdui-button @click="openCreateTagDialog" style="margin-top: 16px;">创建第一个标签</mdui-button>
        </div>

        <div v-else style="text-align: center; padding: 32px; color: rgb(var(--mdui-color-on-surface-variant));">
          <p>请先选择一个 Git 仓库</p>
        </div>
      </div>
    </mdui-card>

    <!-- 创建标签对话框 -->
    <mdui-dialog :open="createTagDialogOpen" @close="createTagDialogOpen = false">
      <div slot="headline">创建标签</div>
      <div slot="description">
        <div style="padding: 16px 0;">
          <mdui-text-field
            label="标签名称 *"
            placeholder="v1.0.0"
            v-model="newTagName"
            style="width: 100%; margin-bottom: 16px;"
            required
          ></mdui-text-field>

          <mdui-text-field
            label="标签消息（可选）"
            placeholder="Release version 1.0.0"
            v-model="newTagMessage"
            style="width: 100%; margin-bottom: 16px;"
            helper="如果提供消息，将创建注释标签；否则创建轻量级标签"
          ></mdui-text-field>

          <div style="display: flex; align-items: center; gap: 8px;">
            <mdui-checkbox v-model="pushAfterCreate"></mdui-checkbox>
            <span style="font-size: 14px;">创建后自动推送到远程</span>
          </div>
        </div>
      </div>
      <mdui-button slot="action" variant="text" @click="createTagDialogOpen = false">取消</mdui-button>
      <mdui-button slot="action" variant="text" @click="createTag" :disabled="!newTagName">创建</mdui-button>
    </mdui-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { snackbar, confirm } from 'mdui'

const loading = ref(false)
const tags = ref(null)
const searchQuery = ref('')
const createTagDialogOpen = ref(false)
const newTagName = ref('')
const newTagMessage = ref('')
const pushAfterCreate = ref(false)

const filteredTags = computed(() => {
  if (!tags.value || !tags.value.all) return []
  if (!searchQuery.value) return tags.value.all

  const query = searchQuery.value.toLowerCase()
  return tags.value.all.filter(tag => tag.toLowerCase().includes(query))
})

const loadTags = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) {
    snackbar({ message: '请先选择仓库', closeable: true })
    return
  }

  loading.value = true
  try {
    const result = await window.gitAPI.getTags(repoPath)
    if (result.success) {
      tags.value = result.data
    } else {
      snackbar({ message: `加载失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  } finally {
    loading.value = false
  }
}

const openCreateTagDialog = () => {
  newTagName.value = ''
  newTagMessage.value = ''
  pushAfterCreate.value = false
  createTagDialogOpen.value = true
}

const createTag = async () => {
  if (!newTagName.value) {
    snackbar({ message: '请输入标签名称', closeable: true })
    return
  }

  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) {
    snackbar({ message: '请先选择仓库', closeable: true })
    return
  }

  try {
    const result = await window.gitAPI.addTag(
      repoPath,
      newTagName.value,
      newTagMessage.value || null
    )

    if (result.success) {
      snackbar({ message: `标签 ${newTagName.value} 创建成功！` })
      createTagDialogOpen.value = false

      // 如果选择了自动推送
      if (pushAfterCreate.value) {
        await pushTag(newTagName.value)
      }

      await loadTags()
    } else {
      snackbar({ message: `创建失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  }
}

const pushTag = async (tagName) => {
  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) return

  try {
    const result = await window.gitAPI.pushTags(repoPath, 'origin', tagName)

    if (result.success) {
      snackbar({ message: `标签 ${tagName} 推送成功！` })
    } else {
      snackbar({ message: `推送失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  }
}

const pushAllTags = async () => {
  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) return

  const confirmed = await confirm({
    headline: '推送所有标签',
    description: '确定要将所有标签推送到远程仓库吗？',
    confirmText: '推送',
    cancelText: '取消'
  })

  if (!confirmed) return

  try {
    const result = await window.gitAPI.pushTags(repoPath, 'origin', null)

    if (result.success) {
      snackbar({ message: '所有标签推送成功！' })
    } else {
      snackbar({ message: `推送失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  }
}

const confirmDeleteTag = async (tagName) => {
  const confirmed = await confirm({
    headline: '删除标签',
    description: `确定要删除标签 "${tagName}" 吗？此操作不可撤销。`,
    confirmText: '删除',
    cancelText: '取消'
  })

  if (!confirmed) return

  const repoPath = localStorage.getItem('repoPath')
  if (!repoPath) return

  try {
    const result = await window.gitAPI.deleteTag(repoPath, tagName)

    if (result.success) {
      snackbar({ message: `标签 ${tagName} 已删除` })
      await loadTags()
    } else {
      snackbar({ message: `删除失败: ${result.error}`, closeable: true })
    }
  } catch (error) {
    snackbar({ message: `错误: ${error.message}`, closeable: true })
  }
}

onMounted(() => {
  loadTags()

  // 监听刷新事件
  window.addEventListener('refresh-content', loadTags)
})
</script>

<style scoped>
.tag-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
</style>
