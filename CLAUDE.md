# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZiXiao Version Manager is a production-ready Git GUI client built with Vue 3, Electron, and mdui (Material Design UI library). The application provides a modern interface for Git operations with complete repository management, file staging, commit history, branch management, and remote operations.

**Current Version**: v1.0.1
**License**: MIT
**Tech Stack**: Vue 3.4+ (Composition API) + Electron 28+ + mdui 2.x + Vite 5 + simple-git

**Project Goals**:
- Provide an intuitive, fast, and beautiful Git GUI for developers
- Support all major Git operations with a focus on daily workflows
- Maintain cross-platform compatibility (macOS, Windows, Linux)
- Keep the codebase clean, maintainable, and well-documented

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

### Commit Message Convention

**IMPORTANT**: All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

**Format**: `<type>(<scope>): <subject>`

**Rules**:
- **NO emoji symbols allowed** in commit messages
- Type must be lowercase
- Subject should be concise and descriptive
- Use present tense ("add" not "added")

**Common types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes (dependencies, tooling)

**Examples**:
```
feat(ui): add dark mode toggle to settings
fix(git): resolve branch deletion error on Windows
docs(readme): update installation instructions
ci(actions): add multi-platform build workflow
```

**When committing via Claude Code**:
Always append the following footer:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

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

## Project Documentation

- **TODO.md** - Feature roadmap and improvement tasks organized by priority
- **ROADMAP.md** - Development timeline from 2025-10-06 to 2026-07-15 with version milestones
- **README.md** - User-facing documentation with installation and usage instructions (Chinese)
- **TROUBLESHOOTING.md** - Comprehensive troubleshooting guide with 14 common issues
- **START_HERE.md** - Quick start guide for new developers
- **PROJECT_SUMMARY.md** - High-level project overview and architecture summary
- **CHANGELOG.md** - Version history and release notes

## Development Roadmap

See `ROADMAP.md` for the complete development plan. Key upcoming features:

### Short-term (Q4 2025)
- v1.1.0: Diff viewer, dark mode, search functionality
- v1.2.0: Tag management, remote branches, merge conflict resolution

### Mid-term (Q1-Q2 2026)
- v1.3.0: Commit graph visualization, statistics dashboard
- v1.4.0: Rebase, cherry-pick, undo/redo system
- v1.5.0: GitHub/GitLab integration, i18n support

### Long-term (Q3 2026)
- v2.0.0: TypeScript migration, Pinia state management, comprehensive testing

See `TODO.md` for detailed task lists organized by priority (high/medium/low).

## Code Quality Standards

### Testing
- Unit tests for all core functionality (target: 80% coverage)
- Integration tests for IPC communication
- E2E tests for critical user flows
- Test files should be co-located with source files

### Performance
- Keep bundle size minimal (use tree-shaking)
- Implement virtual scrolling for large lists (>100 items)
- Cache expensive Git operations
- Optimize re-renders with proper Vue reactivity patterns

### Accessibility
- Use semantic HTML where possible
- Ensure keyboard navigation works for all features
- Maintain proper ARIA labels for mdui components
- Test with screen readers

### Security
- Never expose sensitive APIs through preload script
- Validate all user inputs before Git operations
- Sanitize file paths to prevent directory traversal
- Use content security policy in production builds

## Contributing Guidelines

When contributing to this project:

1. **Branch naming**: `feat/feature-name`, `fix/bug-name`, `docs/doc-name`
2. **Commit messages**: Follow Conventional Commits (see above)
3. **Code style**:
   - Use 2 spaces for indentation
   - Use single quotes for strings
   - Add JSDoc comments for complex functions
   - Keep functions small and focused
4. **Pull requests**:
   - Reference related issues
   - Include screenshots for UI changes
   - Ensure all tests pass
   - Update documentation as needed

## Known Issues and Limitations

- **Windows path handling**: Some edge cases with UNC paths
- **Large repositories**: Performance degrades with >10k commits (optimization planned for v1.1.0)
- **Submodules**: Not yet supported (planned for v1.5.0)
- **Git LFS**: Limited support (improvements planned)
- **Network operations**: No timeout/retry mechanism (planned for v1.2.0)

## Future Considerations

### Planned Major Refactorings
- **TypeScript migration** (v2.0.0): Full type safety across the codebase
- **State management** (v2.0.0): Replace localStorage with Pinia for better reactivity
- **Component library**: Consider creating a shared component library for common UI patterns
- **Testing infrastructure**: Set up comprehensive testing with Vitest and Playwright

### Performance Optimizations
- Implement web workers for heavy Git operations
- Use IndexedDB for caching large datasets
- Lazy load components and routes
- Optimize electron bundle size

### Architecture Improvements
- Implement a plugin system for extensibility
- Add event sourcing for undo/redo
- Consider micro-frontend architecture for large features
- Improve error boundaries and fallback UI

## Environment Variables

```bash
# Development
NODE_ENV=development    # Enables dev tools, hot reload
ELECTRON_ENABLE_LOGGING=1  # Verbose Electron logs

# Production
NODE_ENV=production     # Optimized builds
```

## Useful Resources

- **Vue 3 Docs**: https://vuejs.org/
- **Electron Docs**: https://www.electronjs.org/docs
- **mdui Docs**: https://www.mdui.org/
- **simple-git**: https://github.com/steveukx/git-js
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Git Internals**: https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain

---

**Last Updated**: 2025-10-06
**Document Version**: 1.1
