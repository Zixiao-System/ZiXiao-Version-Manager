/**
 * Global Keyboard Shortcuts Composable
 *
 * Provides a centralized system for managing keyboard shortcuts across the application.
 * Supports customizable shortcuts, conflict detection, and a help panel.
 */

import { onMounted, onUnmounted } from 'vue'

// Default keyboard shortcuts configuration
const defaultShortcuts = {
  // Navigation
  'mod+1': { action: 'navigate:status', description: '打开状态视图' },
  'mod+2': { action: 'navigate:history', description: '打开提交历史' },
  'mod+3': { action: 'navigate:branches', description: '打开分支管理' },
  'mod+4': { action: 'navigate:tags', description: '打开标签管理' },

  // Common Actions
  'mod+r': { action: 'refresh', description: '刷新当前视图' },
  'mod+s': { action: 'stage:all', description: '暂存所有更改' },
  'mod+shift+s': { action: 'unstage:all', description: '取消暂存所有' },
  'mod+enter': { action: 'commit', description: '提交更改' },
  'mod+p': { action: 'push', description: '推送到远程' },
  'mod+shift+p': { action: 'pull', description: '拉取远程更改' },

  // Repository
  'mod+o': { action: 'repo:open', description: '打开仓库' },
  'mod+shift+o': { action: 'repo:selector', description: '返回仓库选择' },

  // View Controls
  'mod+f': { action: 'search:focus', description: '聚焦搜索框' },
  'mod+k': { action: 'shortcuts:show', description: '显示快捷键帮助' },
  'escape': { action: 'dialog:close', description: '关闭对话框/取消操作' },

  // Diff Viewer
  'mod+d': { action: 'diff:toggle', description: '切换差异视图模式' },

  // List Navigation
  'up': { action: 'list:previous', description: '选择上一项', global: false },
  'down': { action: 'list:next', description: '选择下一项', global: false },
  'enter': { action: 'list:select', description: '选择当前项', global: false },
}

// Parse keyboard shortcut string (e.g., "mod+shift+s")
function parseShortcut(shortcut) {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const modifiers = {
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('mod')
  }
  return { key, modifiers }
}

// Check if keyboard event matches shortcut
function matchesShortcut(event, shortcut) {
  const parsed = parseShortcut(shortcut)

  // Normalize 'mod' to platform-specific modifier
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modKey = isMac ? 'meta' : 'ctrl'

  const eventKey = event.key.toLowerCase()
  const matches = eventKey === parsed.key &&
    event.ctrlKey === (parsed.modifiers.ctrl || (!isMac && parsed.modifiers.meta)) &&
    event.altKey === parsed.modifiers.alt &&
    event.shiftKey === parsed.modifiers.shift &&
    event.metaKey === (parsed.modifiers.meta || (isMac && parsed.modifiers.meta))

  return matches
}

// Global shortcuts state
let shortcutsConfig = { ...defaultShortcuts }
let handlers = new Map()
let isListeningGlobally = false

// Global keyboard event handler
function handleGlobalKeydown(event) {
  // Don't trigger shortcuts when typing in input fields
  const target = event.target
  if (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable) {
    // Only allow certain global shortcuts in input fields
    const allowedInInputs = ['escape', 'mod+k']
    const matched = Object.keys(shortcutsConfig).find(key =>
      allowedInInputs.includes(key) && matchesShortcut(event, key)
    )
    if (!matched) return
  }

  // Find matching shortcut
  for (const [key, config] of Object.entries(shortcutsConfig)) {
    if (matchesShortcut(event, key)) {
      const handler = handlers.get(config.action)
      if (handler) {
        event.preventDefault()
        event.stopPropagation()
        handler()
        return
      }
    }
  }
}

// Start global keyboard listener
function startGlobalListener() {
  if (!isListeningGlobally) {
    document.addEventListener('keydown', handleGlobalKeydown)
    isListeningGlobally = true
  }
}

// Stop global keyboard listener
function stopGlobalListener() {
  if (isListeningGlobally) {
    document.removeEventListener('keydown', handleGlobalKeydown)
    isListeningGlobally = false
  }
}

/**
 * Main composable for using keyboard shortcuts
 * @param {Object} shortcuts - Map of action names to handler functions
 * @param {Object} options - Configuration options
 */
export function useKeyboardShortcuts(shortcuts = {}, options = {}) {
  const { global = true } = options

  // Register shortcuts
  onMounted(() => {
    Object.entries(shortcuts).forEach(([action, handler]) => {
      handlers.set(action, handler)
    })

    if (global && !isListeningGlobally) {
      startGlobalListener()
    }
  })

  // Cleanup
  onUnmounted(() => {
    Object.keys(shortcuts).forEach(action => {
      handlers.delete(action)
    })

    // Stop global listener if no more handlers
    if (handlers.size === 0) {
      stopGlobalListener()
    }
  })

  return {
    shortcuts: shortcutsConfig,
    registerShortcut: (key, action, description) => {
      shortcutsConfig[key] = { action, description }
    },
    unregisterShortcut: (key) => {
      delete shortcutsConfig[key]
    }
  }
}

/**
 * Get all registered keyboard shortcuts
 */
export function getKeyboardShortcuts() {
  return shortcutsConfig
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return shortcut
    .replace(/mod/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/shift/gi, isMac ? '⇧' : 'Shift')
    .replace(/alt/gi, isMac ? '⌥' : 'Alt')
    .replace(/\+/g, isMac ? '' : '+')
    .toUpperCase()
}

/**
 * Group shortcuts by category
 */
export function groupShortcutsByCategory() {
  const categories = {
    navigation: { title: '导航', shortcuts: [] },
    actions: { title: '操作', shortcuts: [] },
    repository: { title: '仓库', shortcuts: [] },
    view: { title: '视图', shortcuts: [] },
    other: { title: '其他', shortcuts: [] }
  }

  Object.entries(shortcutsConfig).forEach(([key, config]) => {
    const [category] = config.action.split(':')
    const categoryName =
      category === 'navigate' ? 'navigation' :
      category === 'stage' || category === 'unstage' || category === 'commit' || category === 'push' || category === 'pull' ? 'actions' :
      category === 'repo' ? 'repository' :
      category === 'search' || category === 'shortcuts' || category === 'dialog' || category === 'diff' ? 'view' :
      'other'

    categories[categoryName].shortcuts.push({
      key,
      description: config.description,
      displayKey: formatShortcut(key)
    })
  })

  return categories
}
