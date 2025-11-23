/**
 * Git Cache Management System
 * Caches Git operations to reduce redundant calls and improve performance
 */

// Cache TTL (Time To Live) in milliseconds
const TTL = {
  STATUS: 10 * 1000,      // 10 seconds - frequently changes
  BRANCHES: 60 * 1000,    // 1 minute
  TAGS: 5 * 60 * 1000,    // 5 minutes
  COMMITS: 5 * 60 * 1000, // 5 minutes
  REMOTES: 5 * 60 * 1000, // 5 minutes
  DIFF: 30 * 1000         // 30 seconds
}

class GitCache {
  constructor() {
    // Cache structure: Map<repoPath, Map<cacheKey, { data, timestamp }>>
    this.cache = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    }
  }

  /**
   * Generate cache key from operation and parameters
   */
  _generateKey(operation, ...params) {
    return `${operation}:${params.join(':')}`
  }

  /**
   * Get repository cache map (create if not exists)
   */
  _getRepoCache(repoPath) {
    if (!this.cache.has(repoPath)) {
      this.cache.set(repoPath, new Map())
    }
    return this.cache.get(repoPath)
  }

  /**
   * Check if cached data is still valid
   */
  _isValid(cacheEntry, ttl) {
    if (!cacheEntry) return false
    const age = Date.now() - cacheEntry.timestamp
    return age < ttl
  }

  /**
   * Get cached data
   * @param {string} repoPath - Repository path
   * @param {string} operation - Operation type (status, branches, etc.)
   * @param {Array} params - Additional parameters
   * @param {number} ttl - Time to live in milliseconds
   * @returns {any|null} Cached data or null if not found/expired
   */
  get(repoPath, operation, params = [], ttl = TTL.COMMITS) {
    const repoCache = this.cache.get(repoPath)
    if (!repoCache) {
      this.stats.misses++
      return null
    }

    const key = this._generateKey(operation, ...params)
    const cacheEntry = repoCache.get(key)

    if (this._isValid(cacheEntry, ttl)) {
      this.stats.hits++
      return cacheEntry.data
    }

    if (cacheEntry) {
      // Expired entry
      repoCache.delete(key)
      this.stats.evictions++
    }

    this.stats.misses++
    return null
  }

  /**
   * Set cached data
   * @param {string} repoPath - Repository path
   * @param {string} operation - Operation type
   * @param {any} data - Data to cache
   * @param {Array} params - Additional parameters
   */
  set(repoPath, operation, data, params = []) {
    const repoCache = this._getRepoCache(repoPath)
    const key = this._generateKey(operation, ...params)

    repoCache.set(key, {
      data: structuredClone(data), // Deep clone to prevent mutation
      timestamp: Date.now()
    })
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(repoPath, operation, params = []) {
    const repoCache = this.cache.get(repoPath)
    if (!repoCache) return

    const key = this._generateKey(operation, ...params)
    const deleted = repoCache.delete(key)
    if (deleted) {
      this.stats.evictions++
    }
  }

  /**
   * Invalidate all cache for a repository
   */
  invalidateRepo(repoPath) {
    const deleted = this.cache.delete(repoPath)
    if (deleted) {
      this.stats.evictions++
    }
  }

  /**
   * Invalidate all cache entries matching a pattern
   * Example: invalidatePattern('my-repo', 'branches') invalidates all branch-related caches
   */
  invalidatePattern(repoPath, operationPrefix) {
    const repoCache = this.cache.get(repoPath)
    if (!repoCache) return

    const keysToDelete = []
    for (const key of repoCache.keys()) {
      if (key.startsWith(operationPrefix)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      repoCache.delete(key)
      this.stats.evictions++
    })
  }

  /**
   * Invalidate multiple operations after a Git command
   * @param {string} repoPath - Repository path
   * @param {Array<string>} operations - Operations to invalidate
   */
  invalidateMultiple(repoPath, operations = []) {
    operations.forEach(op => this.invalidate(repoPath, op))
  }

  /**
   * Clear all caches
   */
  clear() {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, evictions: 0 }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) : 0

    return {
      ...this.stats,
      totalRequests,
      hitRate: `${hitRate}%`,
      cachedRepos: this.cache.size,
      totalEntries: Array.from(this.cache.values()).reduce((sum, repoCache) => sum + repoCache.size, 0)
    }
  }

  /**
   * Get cache size for a specific repository
   */
  getRepoSize(repoPath) {
    const repoCache = this.cache.get(repoPath)
    return repoCache ? repoCache.size : 0
  }

  /**
   * Cleanup expired entries across all repositories
   */
  cleanup() {
    let cleaned = 0

    for (const [repoPath, repoCache] of this.cache.entries()) {
      const keysToDelete = []

      for (const [key, entry] of repoCache.entries()) {
        // Extract TTL based on operation type
        const operation = key.split(':')[0]
        const ttl = TTL[operation.toUpperCase()] || TTL.COMMITS

        if (!this._isValid(entry, ttl)) {
          keysToDelete.push(key)
        }
      }

      keysToDelete.forEach(key => {
        repoCache.delete(key)
        cleaned++
      })

      // Remove empty repo caches
      if (repoCache.size === 0) {
        this.cache.delete(repoPath)
      }
    }

    this.stats.evictions += cleaned
    return cleaned
  }
}

// Singleton instance
const gitCache = new GitCache()

// Auto-cleanup every 5 minutes
setInterval(() => {
  const cleaned = gitCache.cleanup()
  if (cleaned > 0) {
    console.log(`[GitCache] Cleaned ${cleaned} expired entries`)
  }
}, 5 * 60 * 1000)

// Helper functions for common operations
export const cacheHelpers = {
  /**
   * Get or fetch data with caching
   */
  async getOrFetch(repoPath, operation, fetchFn, params = [], ttl = TTL.COMMITS) {
    // Try cache first
    const cached = gitCache.get(repoPath, operation, params, ttl)
    if (cached !== null) {
      return cached
    }

    // Fetch and cache
    const data = await fetchFn()
    gitCache.set(repoPath, operation, data, params)
    return data
  },

  /**
   * Invalidate cache after write operations
   */
  invalidateAfterWrite(repoPath, writeOperation) {
    const invalidationMap = {
      // File operations
      'add': ['status', 'diff'],
      'commit': ['status', 'log', 'commits', 'diff'],
      'unstage': ['status', 'diff'],
      'reset': ['status', 'diff'],
      'discard': ['status', 'diff'],

      // Branch operations
      'checkout': ['status', 'branches', 'log', 'commits'],
      'createBranch': ['branches'],
      'deleteBranch': ['branches'],
      'deleteRemoteBranch': ['branches'],

      // Remote operations
      'push': ['status', 'branches', 'remotes'],
      'pull': ['status', 'log', 'commits', 'diff', 'branches'],
      'fetch': ['branches', 'remotes'],

      // Stash operations
      'stash': ['status'],
      'stashPop': ['status', 'diff'],
      'stashApply': ['status', 'diff'],

      // Tag operations
      'addTag': ['tags'],
      'deleteTag': ['tags'],
      'pushTags': ['tags'],

      // Merge/Rebase operations
      'merge': ['status', 'log', 'commits', 'branches', 'diff'],
      'rebase': ['status', 'log', 'commits', 'diff'],
      'cherryPick': ['status', 'log', 'commits', 'diff']
    }

    const operationsToInvalidate = invalidationMap[writeOperation] || []
    operationsToInvalidate.forEach(op => {
      gitCache.invalidatePattern(repoPath, op)
    })
  }
}

export default gitCache
export { TTL }
