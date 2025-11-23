// Theme management utility
export const THEME_STORAGE_KEY = 'app-theme'
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
}

export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT
}

export function getSavedTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || THEMES.AUTO
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function applyTheme(theme) {
  let actualTheme = theme

  if (theme === THEMES.AUTO) {
    actualTheme = getSystemTheme()
  }

  if (actualTheme === THEMES.DARK) {
    document.documentElement.classList.add('mdui-theme-dark')
    document.documentElement.classList.remove('mdui-theme-light')
  } else {
    document.documentElement.classList.add('mdui-theme-light')
    document.documentElement.classList.remove('mdui-theme-dark')
  }
}

export function initTheme() {
  const savedTheme = getSavedTheme()
  applyTheme(savedTheme)

  // Listen to system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    const currentTheme = getSavedTheme()
    if (currentTheme === THEMES.AUTO) {
      applyTheme(THEMES.AUTO)
    }
  })

  return savedTheme
}

export function toggleTheme(currentTheme) {
  let newTheme

  switch (currentTheme) {
    case THEMES.LIGHT:
      newTheme = THEMES.DARK
      break
    case THEMES.DARK:
      newTheme = THEMES.AUTO
      break
    case THEMES.AUTO:
      newTheme = THEMES.LIGHT
      break
    default:
      newTheme = THEMES.AUTO
  }

  saveTheme(newTheme)
  applyTheme(newTheme)
  return newTheme
}

export function getThemeIcon(theme) {
  switch (theme) {
    case THEMES.LIGHT:
      return 'light_mode'
    case THEMES.DARK:
      return 'dark_mode'
    case THEMES.AUTO:
      return 'brightness_auto'
    default:
      return 'brightness_auto'
  }
}

export function getThemeLabel(theme) {
  switch (theme) {
    case THEMES.LIGHT:
      return '浅色模式'
    case THEMES.DARK:
      return '深色模式'
    case THEMES.AUTO:
      return '跟随系统'
    default:
      return '跟随系统'
  }
}
