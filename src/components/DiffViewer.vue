<template>
  <div class="diff-viewer">
    <!-- Toolbar -->
    <div class="diff-toolbar">
      <div class="diff-file-info">
        <mdui-icon name="difference" style="font-size: 20px;"></mdui-icon>
        <span class="file-name">{{ fileName }}</span>
      </div>
      <div class="diff-controls">
        <mdui-segmented-button-group value="side-by-side" @change="handleViewModeChange">
          <mdui-segmented-button value="side-by-side" icon="view_column">并排视图</mdui-segmented-button>
          <mdui-segmented-button value="unified" icon="view_stream">统一视图</mdui-segmented-button>
        </mdui-segmented-button-group>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="diff-loading">
      <mdui-circular-progress></mdui-circular-progress>
      <p>加载差异中...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="diff-error">
      <mdui-icon name="error_outline" style="font-size: 48px; color: rgb(var(--mdui-color-error));"></mdui-icon>
      <p>{{ error }}</p>
    </div>

    <!-- Diff content -->
    <div v-else-if="diffHtml" class="diff-content" v-html="diffHtml"></div>

    <!-- Empty state -->
    <div v-else class="diff-empty">
      <mdui-icon name="check_circle" style="font-size: 48px; color: rgb(var(--mdui-color-outline));"></mdui-icon>
      <p>无差异</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-slim.js'
import 'diff2html/bundles/css/diff2html.min.css'

const props = defineProps({
  filePath: {
    type: String,
    required: true
  },
  isStaged: {
    type: Boolean,
    default: false
  },
  repoPath: {
    type: String,
    required: true
  }
})

const loading = ref(false)
const error = ref(null)
const diffHtml = ref('')
const viewMode = ref('side-by-side')
const fileName = ref('')

// Handle view mode change
const handleViewModeChange = (e) => {
  viewMode.value = e.target.value
  if (diffHtml.value) {
    loadDiff()
  }
}

// Load diff data
const loadDiff = async () => {
  loading.value = true
  error.value = null
  diffHtml.value = ''

  try {
    const options = {}

    if (props.isStaged) {
      // Show diff for staged changes (--cached)
      options['--cached'] = null
      options['--'] = props.filePath
    } else {
      // Show diff for unstaged changes
      options['--'] = props.filePath
    }

    const result = await window.gitAPI.diff(props.repoPath, options)

    if (!result.success) {
      throw new Error(result.error)
    }

    if (!result.data || result.data.trim() === '') {
      // No diff available
      loading.value = false
      return
    }

    // Parse and render diff
    const configuration = {
      drawFileList: false,
      fileListToggle: false,
      fileListStartVisible: false,
      fileContentToggle: false,
      matching: 'lines',
      outputFormat: viewMode.value,
      synchronisedScroll: true,
      highlight: true,
      renderNothingWhenEmpty: false,
    }

    const diff2htmlUi = new Diff2HtmlUI(
      document.querySelector('.diff-content'),
      result.data,
      configuration
    )

    diff2htmlUi.draw()
    diffHtml.value = document.querySelector('.diff-content')?.innerHTML || ''

  } catch (err) {
    error.value = err.message || '加载差异失败'
  } finally {
    loading.value = false
  }
}

// Extract file name from path
const updateFileName = () => {
  const parts = props.filePath.split(/[/\\]/)
  fileName.value = parts[parts.length - 1]
}

// Watch for prop changes
watch(() => [props.filePath, props.isStaged, props.repoPath], () => {
  updateFileName()
  loadDiff()
}, { immediate: true })

onMounted(() => {
  updateFileName()
})
</script>

<style scoped>
.diff-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: rgb(var(--mdui-color-surface));
}

.diff-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgb(var(--mdui-color-outline-variant));
  background-color: rgb(var(--mdui-color-surface-container));
}

.diff-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: rgb(var(--mdui-color-on-surface));
}

.file-name {
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.diff-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.diff-loading,
.diff-error,
.diff-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: rgb(var(--mdui-color-on-surface-variant));
}

.diff-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  font-family: 'Courier New', Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
}

/* Override diff2html styles for better integration */
:deep(.d2h-wrapper) {
  background: transparent;
  border: none;
}

:deep(.d2h-file-header) {
  background-color: rgb(var(--mdui-color-surface-container-high));
  border-color: rgb(var(--mdui-color-outline-variant));
  color: rgb(var(--mdui-color-on-surface));
}

:deep(.d2h-file-name) {
  color: rgb(var(--mdui-color-primary));
}

:deep(.d2h-code-line) {
  background-color: rgb(var(--mdui-color-surface));
}

:deep(.d2h-code-line-ctn) {
  color: rgb(var(--mdui-color-on-surface));
}

:deep(.d2h-ins) {
  background-color: rgba(76, 175, 80, 0.15);
}

:deep(.d2h-ins .d2h-code-line-ctn) {
  background-color: rgba(76, 175, 80, 0.25);
}

:deep(.d2h-del) {
  background-color: rgba(244, 67, 54, 0.15);
}

:deep(.d2h-del .d2h-code-line-ctn) {
  background-color: rgba(244, 67, 54, 0.25);
}

:deep(.d2h-info) {
  background-color: rgb(var(--mdui-color-surface-container));
  color: rgb(var(--mdui-color-on-surface-variant));
}

:deep(.d2h-code-line-prefix) {
  color: rgb(var(--mdui-color-on-surface-variant));
}

:deep(.d2h-line-num) {
  color: rgb(var(--mdui-color-outline));
  background-color: rgb(var(--mdui-color-surface-container-low));
  border-color: rgb(var(--mdui-color-outline-variant));
}

/* Syntax highlighting */
:deep(.hljs) {
  background: transparent;
}

:deep(.hljs-keyword) {
  color: rgb(var(--mdui-color-primary));
}

:deep(.hljs-string) {
  color: #4caf50;
}

:deep(.hljs-comment) {
  color: rgb(var(--mdui-color-outline));
  font-style: italic;
}

:deep(.hljs-number) {
  color: #ff9800;
}

:deep(.hljs-function) {
  color: #2196f3;
}
</style>