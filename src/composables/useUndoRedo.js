/**
 * Composable for undo/redo functionality
 *
 * Provides reactive access to operation history state and undo/redo actions
 */

import { ref, computed, onUnmounted } from 'vue'
import { snackbar } from 'mdui'
import operationHistory from '../utils/operationHistory.js'

// Shared reactive state
const canUndoRef = ref(operationHistory.canUndo())
const canRedoRef = ref(operationHistory.canRedo())
const undoDescriptionRef = ref(operationHistory.getUndoDescription())
const redoDescriptionRef = ref(operationHistory.getRedoDescription())

// Update interval ID
let updateInterval = null

/**
 * Update reactive state from operation history
 */
function updateState() {
  canUndoRef.value = operationHistory.canUndo()
  canRedoRef.value = operationHistory.canRedo()
  undoDescriptionRef.value = operationHistory.getUndoDescription()
  redoDescriptionRef.value = operationHistory.getRedoDescription()
}

/**
 * Start polling for state updates
 */
function startPolling() {
  if (!updateInterval) {
    updateInterval = setInterval(updateState, 100) // Poll every 100ms
  }
}

/**
 * Stop polling for state updates
 */
function stopPolling() {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
}

/**
 * Undo/Redo composable
 */
export function useUndoRedo() {
  /**
   * Perform undo operation
   */
  const undo = async () => {
    try {
      const result = await operationHistory.undo()

      if (result === null) {
        snackbar({ message: '没有可撤销的操作' })
        return false
      }

      if (result.success) {
        const description = undoDescriptionRef.value || '操作'
        snackbar({ message: `已撤销: ${description}` })
        updateState()

        // Emit custom event to trigger UI refresh
        window.dispatchEvent(new CustomEvent('operation-undone'))

        return true
      } else {
        snackbar({ message: `撤销失败: ${result.error}`, closeable: true })
        return false
      }
    } catch (error) {
      snackbar({ message: `撤销错误: ${error.message}`, closeable: true })
      return false
    }
  }

  /**
   * Perform redo operation
   */
  const redo = async () => {
    try {
      const result = await operationHistory.redo()

      if (result === null) {
        snackbar({ message: '没有可重做的操作' })
        return false
      }

      if (result.success) {
        const description = redoDescriptionRef.value || '操作'
        snackbar({ message: `已重做: ${description}` })
        updateState()

        // Emit custom event to trigger UI refresh
        window.dispatchEvent(new CustomEvent('operation-redone'))

        return true
      } else {
        snackbar({ message: `重做失败: ${result.error}`, closeable: true })
        return false
      }
    } catch (error) {
      snackbar({ message: `重做错误: ${error.message}`, closeable: true })
      return false
    }
  }

  /**
   * Clear all history
   */
  const clearHistory = () => {
    operationHistory.clear()
    updateState()
  }

  /**
   * Clear history for a specific repository
   */
  const clearHistoryForRepo = (repoPath) => {
    operationHistory.clearForRepo(repoPath)
    updateState()
  }

  /**
   * Get operation history (for display)
   */
  const getHistory = computed(() => {
    return operationHistory.getUndoHistory()
  })

  // Start polling on composable creation
  startPolling()

  // Clean up on composable destruction
  onUnmounted(() => {
    // Don't stop polling here as multiple components might use this
    // Polling will be managed globally
  })

  return {
    // Actions
    undo,
    redo,
    clearHistory,
    clearHistoryForRepo,

    // State
    canUndo: canUndoRef,
    canRedo: canRedoRef,
    undoDescription: undoDescriptionRef,
    redoDescription: redoDescriptionRef,
    history: getHistory
  }
}

// Export state management functions
export { updateState, startPolling, stopPolling }
