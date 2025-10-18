<template>
  <mdui-dialog :open="isOpen" @close="$emit('close')" class="shortcuts-dialog">
    <div slot="headline">
      <div style="display: flex; align-items: center; gap: 8px;">
        <mdui-icon name="keyboard"></mdui-icon>
        <span>键盘快捷键</span>
      </div>
    </div>
    <div slot="description">
      <div class="shortcuts-content">
        <div v-for="(category, key) in groupedShortcuts" :key="key" class="shortcuts-category">
          <h4 class="category-title">{{ category.title }}</h4>
          <div class="shortcuts-list">
            <div
              v-for="shortcut in category.shortcuts"
              :key="shortcut.key"
              class="shortcut-item"
            >
              <div class="shortcut-keys">
                <kbd class="key">{{ shortcut.displayKey }}</kbd>
              </div>
              <div class="shortcut-description">{{ shortcut.description }}</div>
            </div>
          </div>
        </div>

        <div class="shortcuts-footer">
          <p style="font-size: 12px; color: rgb(var(--mdui-color-on-surface-variant)); margin-top: 16px;">
            提示: 按 <kbd class="key small">{{ isMac ? '⌘' : 'Ctrl' }}+K</kbd> 可随时打开此帮助面板
          </p>
        </div>
      </div>
    </div>
    <mdui-button slot="action" variant="text" @click="$emit('close')">关闭</mdui-button>
  </mdui-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { groupShortcutsByCategory } from '../composables/useKeyboardShortcuts'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

const groupedShortcuts = computed(() => {
  return groupShortcutsByCategory()
})
</script>

<style scoped>
.shortcuts-dialog {
  --mdui-comp-dialog-container-max-width: 600px;
}

.shortcuts-content {
  padding: 16px 0;
  max-height: 60vh;
  overflow-y: auto;
}

.shortcuts-category {
  margin-bottom: 24px;
}

.shortcuts-category:last-child {
  margin-bottom: 0;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--mdui-color-primary));
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: rgb(var(--mdui-color-surface-container-low));
  border-radius: 8px;
  transition: background-color 0.2s;
}

.shortcut-item:hover {
  background-color: rgb(var(--mdui-color-surface-container));
}

.shortcut-keys {
  display: flex;
  gap: 4px;
  align-items: center;
}

.key {
  display: inline-block;
  padding: 4px 8px;
  background-color: rgb(var(--mdui-color-surface-container-high));
  border: 1px solid rgb(var(--mdui-color-outline-variant));
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--mdui-color-on-surface));
  box-shadow: 0 2px 0 rgb(var(--mdui-color-outline-variant));
  min-width: 24px;
  text-align: center;
}

.key.small {
  padding: 2px 6px;
  font-size: 11px;
  min-width: 20px;
}

.shortcut-description {
  font-size: 14px;
  color: rgb(var(--mdui-color-on-surface));
  text-align: right;
  flex: 1;
  margin-left: 16px;
}

.shortcuts-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgb(var(--mdui-color-outline-variant));
}

/* Scrollbar styling */
.shortcuts-content::-webkit-scrollbar {
  width: 8px;
}

.shortcuts-content::-webkit-scrollbar-thumb {
  background-color: rgb(var(--mdui-color-outline));
  border-radius: 4px;
}

.shortcuts-content::-webkit-scrollbar-thumb:hover {
  background-color: rgb(var(--mdui-color-outline-variant));
}
</style>
