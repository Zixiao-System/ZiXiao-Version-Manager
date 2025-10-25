/**
 * Operation History Manager
 *
 * Manages undo/redo operations for Git actions.
 * Supports undoing stage, unstage, and stash operations.
 */

class OperationHistory {
  constructor() {
    this.undoStack = []
    this.redoStack = []
    this.maxStackSize = 50 // Maximum number of operations to keep
  }

  /**
   * Record a new operation
   * @param {Object} operation - The operation to record
   * @param {string} operation.type - Type of operation (stage, unstage, stash, etc.)
   * @param {string} operation.repoPath - Repository path
   * @param {any} operation.data - Operation-specific data
   * @param {Function} operation.undo - Function to undo the operation
   * @param {string} operation.description - Human-readable description
   */
  push(operation) {
    this.undoStack.push({
      ...operation,
      timestamp: Date.now()
    })

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift()
    }

    // Clear redo stack when new operation is recorded
    this.redoStack = []
  }

  /**
   * Undo the last operation
   * @returns {Promise<Object|null>} Result of undo operation or null if nothing to undo
   */
  async undo() {
    if (this.undoStack.length === 0) {
      return null
    }

    const operation = this.undoStack.pop()

    try {
      // Execute undo
      const result = await operation.undo()

      // If successful, move to redo stack
      if (result.success) {
        this.redoStack.push(operation)

        // Limit redo stack size
        if (this.redoStack.length > this.maxStackSize) {
          this.redoStack.shift()
        }
      } else {
        // If failed, put it back on undo stack
        this.undoStack.push(operation)
      }

      return result
    } catch (error) {
      // On error, put it back on undo stack
      this.undoStack.push(operation)
      throw error
    }
  }

  /**
   * Redo the last undone operation
   * @returns {Promise<Object|null>} Result of redo operation or null if nothing to redo
   */
  async redo() {
    if (this.redoStack.length === 0) {
      return null
    }

    const operation = this.redoStack.pop()

    try {
      // Re-execute the original operation
      const result = await operation.redo()

      // If successful, move back to undo stack
      if (result.success) {
        this.undoStack.push(operation)
      } else {
        // If failed, put it back on redo stack
        this.redoStack.push(operation)
      }

      return result
    } catch (error) {
      // On error, put it back on redo stack
      this.redoStack.push(operation)
      throw error
    }
  }

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.redoStack.length > 0
  }

  /**
   * Get the description of the next undo operation
   * @returns {string|null}
   */
  getUndoDescription() {
    if (this.undoStack.length === 0) return null
    return this.undoStack[this.undoStack.length - 1].description
  }

  /**
   * Get the description of the next redo operation
   * @returns {string|null}
   */
  getRedoDescription() {
    if (this.redoStack.length === 0) return null
    return this.redoStack[this.redoStack.length - 1].description
  }

  /**
   * Get all operations in the undo stack (for display purposes)
   * @returns {Array<Object>}
   */
  getUndoHistory() {
    return this.undoStack.map(op => ({
      type: op.type,
      description: op.description,
      timestamp: op.timestamp
    }))
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * Clear history for a specific repository
   * @param {string} repoPath - Repository path to clear
   */
  clearForRepo(repoPath) {
    this.undoStack = this.undoStack.filter(op => op.repoPath !== repoPath)
    this.redoStack = this.redoStack.filter(op => op.repoPath !== repoPath)
  }
}

// Create singleton instance
const operationHistory = new OperationHistory()

export default operationHistory

/**
 * Helper factory functions to create operation objects
 */

/**
 * Create a stage operation
 */
export function createStageOperation(repoPath, filePath) {
  return {
    type: 'stage',
    repoPath,
    data: { filePath },
    description: `暂存文件: ${filePath}`,
    undo: async () => {
      return await window.gitAPI.unstage(repoPath, filePath)
    },
    redo: async () => {
      return await window.gitAPI.add(repoPath, filePath)
    }
  }
}

/**
 * Create an unstage operation
 */
export function createUnstageOperation(repoPath, filePath) {
  return {
    type: 'unstage',
    repoPath,
    data: { filePath },
    description: `取消暂存: ${filePath}`,
    undo: async () => {
      return await window.gitAPI.add(repoPath, filePath)
    },
    redo: async () => {
      return await window.gitAPI.unstage(repoPath, filePath)
    }
  }
}

/**
 * Create a stage all operation
 */
export function createStageAllOperation(repoPath, files) {
  return {
    type: 'stageAll',
    repoPath,
    data: { files },
    description: `暂存所有更改 (${files.length} 个文件)`,
    undo: async () => {
      // Unstage all files
      const results = []
      for (const file of files) {
        const result = await window.gitAPI.unstage(repoPath, file)
        results.push(result)
      }
      const allSuccess = results.every(r => r.success)
      return {
        success: allSuccess,
        error: allSuccess ? null : '部分文件取消暂存失败'
      }
    },
    redo: async () => {
      return await window.gitAPI.add(repoPath, '.')
    }
  }
}

/**
 * Create an unstage all operation
 */
export function createUnstageAllOperation(repoPath, files) {
  return {
    type: 'unstageAll',
    repoPath,
    data: { files },
    description: `取消暂存所有更改 (${files.length} 个文件)`,
    undo: async () => {
      // Re-stage all files
      const results = []
      for (const file of files) {
        const result = await window.gitAPI.add(repoPath, file)
        results.push(result)
      }
      const allSuccess = results.every(r => r.success)
      return {
        success: allSuccess,
        error: allSuccess ? null : '部分文件暂存失败'
      }
    },
    redo: async () => {
      return await window.gitAPI.reset(repoPath)
    }
  }
}

/**
 * Create a stash operation
 */
export function createStashOperation(repoPath, message, stashRef) {
  return {
    type: 'stash',
    repoPath,
    data: { message, stashRef },
    description: `保存工作区: ${message || '未命名'}`,
    undo: async () => {
      // Apply and drop the stash
      const applyResult = await window.gitAPI.stashApply(repoPath, stashRef)
      if (applyResult.success) {
        await window.gitAPI.stashDrop(repoPath, stashRef)
      }
      return applyResult
    },
    redo: async () => {
      return await window.gitAPI.stash(repoPath, message)
    }
  }
}

/**
 * Create a stash apply operation
 */
export function createStashApplyOperation(repoPath, stashRef) {
  return {
    type: 'stashApply',
    repoPath,
    data: { stashRef },
    description: `应用暂存: ${stashRef}`,
    undo: async () => {
      // This is complex - we'd need to save the diff before applying
      // For now, we'll just return a message that it can't be undone
      return {
        success: false,
        error: 'Stash apply 操作暂不支持撤销'
      }
    },
    redo: async () => {
      return await window.gitAPI.stashApply(repoPath, stashRef)
    }
  }
}