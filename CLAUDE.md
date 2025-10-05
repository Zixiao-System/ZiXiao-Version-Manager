# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZiXiao Version Manager is a production-ready Git GUI client built with Vue 3, Electron, and mdui (Material Design UI library). The application provides a modern interface for Git operations with complete repository management, file staging, commit history, branch management, and remote operations.

**Tech Stack**: Vue 3.4+ (Composition API) + Electron 28+ + mdui 2.x + Vite 5 + simple-git

## Development Commands

### Running the Application

**Recommended (Most Stable)**:
```bash
./start.sh
```
This script automatically cleans old processes, starts Vite dev server, waits for readiness, and launches Electron.

**Alternative Methods**:
```bash
# Method 2: npm script (may hang, use start.sh if issues occur)
npm run electron:dev

# Method 3: Manual (for debugging)
# Terminal 1:
npm run dev
# Terminal 2:
NODE_ENV=development npx electron .
```

### Building

```bash
# Build web assets
npm run build

# Build production app (macOS/Windows/Linux)
npm run electron:build
```

Output: `dist-electron/` directory contains platform-specific installers (.dmg, .exe, .AppImage, .deb)

## Architecture

### Process Architecture (Electron)

**Main Process** (`electron/main.js`):
- Window management and menu creation
- IPC handlers for ALL Git operations via simple-git
- **Critical**: Returns only serializable data (no methods/functions) to avoid "object could not be cloned" errors
- Native dialogs (folder selector)

**Renderer Process** (Vue app):
- Runs in isolated context (no Node.js access)
- Communicates via `window.electronAPI` and `window.gitAPI`

**Preload Script** (`electron/preload.js`):
- Exposes safe APIs via `contextBridge`
- Two namespaces: `electronAPI` (dialogs, events) and `gitAPI` (all Git operations)

### Data Flow

```
Vue Component → window.gitAPI.* → IPC → Main Process → simple-git → Git Repository
                                     ↓
                          Serialized Response (plain objects only)
                                     ↓
Vue Component ← IPC Response ← Main Process
```

**Important**: All Git operation results MUST be serialized to plain objects before returning through IPC. Check `electron/main.js` for examples (e.g., `git:status`, `git:log` handlers).

### Vue Application Structure

**App.vue**:
- Root layout with mdui components (top-app-bar, navigation-drawer, layout-main)
- Dynamic component rendering based on `activeMenu`
- Global navigation state and custom events (`repo-selected`, `go-to-repo-selector`)

**Four Main Views**:
1. `RepositorySelector.vue` - Open/init/clone repos, recent history (localStorage)
2. `StatusView.vue` - File status, staging, commits, stash management
3. `CommitHistory.vue` - Browse last 50 commits with details
4. `BranchManager.vue` - List, switch, create, delete branches; pull/push

**State Management**:
- No Vuex/Pinia - uses localStorage for persistence
- Custom events via `window.dispatchEvent()` for cross-component communication
- Each component manages its own state with Vue Composition API

### IPC Communication Pattern

When adding new Git operations:

1. **Main Process** (`electron/main.js`):
```javascript
ipcMain.handle('git:operation', async (event, repoPath, ...args) => {
  try {
    const git = simpleGit(repoPath)
    const result = await git.operation(...args)

    // CRITICAL: Return only serializable data
    return {
      success: true,
      data: {
        // Extract only plain values, no methods
        field1: result.field1,
        field2: result.field2
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

2. **Preload** (`electron/preload.js`):
```javascript
contextBridge.exposeInMainWorld('gitAPI', {
  operation: (repoPath, ...args) => ipcRenderer.invoke('git:operation', repoPath, ...args)
})
```

3. **Vue Component**:
```javascript
const result = await window.gitAPI.operation(repoPath, ...args)
if (result.success) {
  // Handle result.data
} else {
  // Handle result.error
}
```

## Key Patterns and Conventions

### UI Feedback

- **Loading states**: Use mdui `<mdui-circular-progress>` in centered containers
- **Notifications**: Import `{ snackbar }` from 'mdui' for toast messages
- **Confirmations**: Import `{ confirm }` from 'mdui' for dangerous operations (e.g., discard changes)
- **Color coding**: 🟢 Green (staged/success), 🟡 Yellow/Orange (modified), 🔵 Blue (untracked), 🔴 Red (errors)

### Error Handling

All async operations follow this pattern:
```javascript
try {
  const result = await window.gitAPI.someOperation(...)
  if (result.success) {
    snackbar({ message: 'Success!' })
  } else {
    snackbar({ message: `Error: ${result.error}`, closeable: true })
  }
} catch (error) {
  snackbar({ message: `Error: ${error.message}`, closeable: true })
}
```

### Icons (Material Icons)

All icons use mdui's Material Icons via `<mdui-icon name="icon_name">`. Common icons:
- `folder_open`, `folder` - Repository
- `edit`, `check_circle`, `note_add` - File states
- `add`, `remove`, `undo`, `refresh` - Actions
- `history`, `account_tree`, `difference` - Navigation

## Important Constraints

1. **IPC Serialization**: Never return objects with methods through IPC. Always map to plain objects.

2. **Security**:
   - Main process has full Node.js access
   - Renderer is sandboxed (contextIsolation: true, nodeIntegration: false)
   - Only expose necessary APIs via preload script

3. **Startup Issues**: `concurrently` may hang on some systems. The `start.sh` script is the most reliable startup method.

4. **mdui Components**: This project uses mdui 2.x (NOT mdui 1.x). Components are web components with Vue bindings. Check https://www.mdui.org/ for documentation.

5. **LocalStorage Keys**:
   - `repoPath` - Current repository path
   - `recentRepos` - JSON array of recent repository paths (max 5)

## Adding New Features

### Adding a New Git Operation

1. Add IPC handler in `electron/main.js`
2. Expose in `electron/preload.js`
3. Call from Vue component via `window.gitAPI.*`
4. Add UI in appropriate component (likely `StatusView.vue` or `BranchManager.vue`)

### Adding a New View

1. Create component in `src/components/`
2. Import in `App.vue`
3. Add to `menus` array with icon and value
4. Add to `components` object
5. Implement loading/error states with mdui components

## Common Gotchas

- **Vite dev server must run on port 5173** - hardcoded in `electron/main.js` for development
- **Menu events** use `mainWindow.webContents.send()` from main process, listened via `window.electronAPI.onMenuSelectRepo()` in renderer
- **Custom events** like `repo-selected` are dispatched on `window`, not Vue's event system
- **mdui dialogs** need `:open` binding and `@close` handler, not `v-model`
- **Git operations** always receive `repoPath` as first argument from localStorage

## Troubleshooting Reference

See `TROUBLESHOOTING.md` for 14 common issues and solutions, including:
- Startup hangs
- Port conflicts
- IPC serialization errors
- Repository loading failures
