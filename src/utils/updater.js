/**
 * Auto-update checker
 * Checks GitHub Releases for new versions
 */

const GITHUB_REPO = 'Zixiao-System/ZiXiao-Version-Manager'
const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
const LAST_CHECK_KEY = 'lastUpdateCheck'
const SKIP_VERSION_KEY = 'skipVersion'

/**
 * Get current app version from package.json
 */
export async function getCurrentVersion() {
  try {
    // Get version from Electron main process
    const version = await window.electronAPI?.getAppVersion?.()
    return version || '1.1.1'
  } catch (error) {
    console.error('Failed to get app version:', error)
    return '1.1.1'
  }
}

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1, v2) {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number)
  const parts2 = v2.replace(/^v/, '').split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0

    if (p1 > p2) return 1
    if (p1 < p2) return -1
  }

  return 0
}

/**
 * Check if we should check for updates
 */
export function shouldCheckForUpdates() {
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY)
  if (!lastCheck) return true

  const lastCheckTime = new Date(lastCheck).getTime()
  const now = Date.now()

  return (now - lastCheckTime) > CHECK_INTERVAL
}

/**
 * Mark that we've checked for updates
 */
export function markUpdateChecked() {
  localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString())
}

/**
 * Check if a version is skipped
 */
export function isVersionSkipped(version) {
  const skippedVersion = localStorage.getItem(SKIP_VERSION_KEY)
  return skippedVersion === version
}

/**
 * Skip a version
 */
export function skipVersion(version) {
  localStorage.setItem(SKIP_VERSION_KEY, version)
}

/**
 * Fetch latest release from GitHub
 */
export async function fetchLatestRelease() {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      version: data.tag_name,
      name: data.name,
      body: data.body,
      publishedAt: data.published_at,
      htmlUrl: data.html_url,
      assets: data.assets.map(asset => ({
        name: asset.name,
        size: asset.size,
        downloadUrl: asset.browser_download_url
      }))
    }
  } catch (error) {
    console.error('Failed to fetch latest release:', error)
    throw error
  }
}

/**
 * Check for updates
 * Returns null if no update available, or release info if update available
 */
export async function checkForUpdates() {
  try {
    const currentVersion = await getCurrentVersion()
    const latestRelease = await fetchLatestRelease()
    const latestVersion = latestRelease.version

    // Skip if this version is already skipped
    if (isVersionSkipped(latestVersion)) {
      return null
    }

    // Compare versions
    if (compareVersions(latestVersion, currentVersion) > 0) {
      return {
        ...latestRelease,
        currentVersion
      }
    }

    return null
  } catch (error) {
    console.error('Update check failed:', error)
    return null
  }
}

/**
 * Auto-check for updates (respects check interval)
 */
export async function autoCheckForUpdates() {
  if (!shouldCheckForUpdates()) {
    return null
  }

  markUpdateChecked()
  return await checkForUpdates()
}

/**
 * Get platform-specific download asset
 */
export function getPlatformAsset(assets) {
  const platform = window.navigator.platform.toLowerCase()
  const userAgent = window.navigator.userAgent.toLowerCase()

  // macOS
  if (platform.includes('mac')) {
    // Prefer universal/arm64 for Apple Silicon, otherwise x64
    const universal = assets.find(a => a.name.includes('universal') && a.name.endsWith('.dmg'))
    if (universal) return universal

    const arm64 = assets.find(a => a.name.includes('arm64') && a.name.endsWith('.dmg'))
    if (arm64 && userAgent.includes('mac os x')) return arm64

    const x64 = assets.find(a => a.name.includes('x64') && a.name.endsWith('.dmg'))
    if (x64) return x64

    return assets.find(a => a.name.endsWith('.dmg'))
  }

  // Windows
  if (platform.includes('win')) {
    const exe = assets.find(a => a.name.endsWith('.exe'))
    if (exe) return exe

    return assets.find(a => a.name.includes('win'))
  }

  // Linux
  if (platform.includes('linux')) {
    // Prefer AppImage
    const appImage = assets.find(a => a.name.endsWith('.AppImage'))
    if (appImage) return appImage

    const deb = assets.find(a => a.name.endsWith('.deb'))
    if (deb) return deb

    return assets.find(a => a.name.includes('linux'))
  }

  return null
}
