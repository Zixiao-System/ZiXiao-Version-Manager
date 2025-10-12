const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const simpleGit = require('simple-git')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, '../build/icons/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  })

  // 窗口准备好后再显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 开发模式加载 vite 服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createMenu()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// 创建菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '选择仓库...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu:select-repo')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制刷新', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'Ctrl+Command+F', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 ZiXiao Version Manager',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: 'ZiXiao Version Manager',
              detail: '版本: 1.0.0\n\n一个现代化的 Git GUI 客户端\n基于 Electron 和 Vue 构建',
              buttons: ['确定']
            })
          }
        }
      ]
    }
  ]

  if (process.env.NODE_ENV === 'development') {
    template[2].submenu.push(
      { type: 'separator' },
      { label: '开发者工具', accelerator: 'Alt+CmdOrCtrl+I', role: 'toggleDevTools' }
    )
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// 文件/文件夹选择器
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择 Git 仓库'
  })

  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] }
  }
  return { success: false }
})

// 检查路径是否是 Git 仓库
ipcMain.handle('git:isRepo', async (event, repoPath) => {
  try {
    const gitDir = path.join(repoPath, '.git')
    const exists = fs.existsSync(gitDir)
    return { success: true, isRepo: exists }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Git 操作 IPC 处理
ipcMain.handle('git:status', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath)
    const status = await git.status()
    // 只返回可序列化的数据
    return {
      success: true,
      data: {
        current: status.current,
        tracking: status.tracking,
        ahead: status.ahead,
        behind: status.behind,
        staged: status.staged,
        modified: status.modified,
        not_added: status.not_added,
        deleted: status.deleted,
        renamed: status.renamed,
        files: status.files
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:log', async (event, repoPath, options = {}) => {
  try {
    const git = simpleGit(repoPath)
    const log = await git.log(options)
    // 只返回可序列化的数据
    return {
      success: true,
      data: {
        all: log.all.map(commit => ({
          hash: commit.hash,
          date: commit.date,
          message: commit.message,
          author_name: commit.author_name,
          author_email: commit.author_email
        })),
        total: log.total,
        latest: log.latest
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:add', async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath)
    await git.add(files)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:commit', async (event, repoPath, message) => {
  try {
    const git = simpleGit(repoPath)
    const result = await git.commit(message)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:push', async (event, repoPath, remote, branch) => {
  try {
    const git = simpleGit(repoPath)
    await git.push(remote, branch)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:pull', async (event, repoPath, remote, branch) => {
  try {
    const git = simpleGit(repoPath)
    await git.pull(remote, branch)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:branches', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath)
    const branches = await git.branchLocal()
    // 只返回可序列化的数据
    return {
      success: true,
      data: {
        all: branches.all,
        current: branches.current,
        branches: branches.branches
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:checkout', async (event, repoPath, branch) => {
  try {
    const git = simpleGit(repoPath)
    await git.checkout(branch)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:diff', async (event, repoPath, options = {}) => {
  try {
    const git = simpleGit(repoPath)
    const diff = await git.diff(options)
    return { success: true, data: diff }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 初始化仓库
ipcMain.handle('git:init', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath)
    await git.init()
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 克隆仓库
ipcMain.handle('git:clone', async (event, url, localPath) => {
  try {
    await simpleGit().clone(url, localPath)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 创建分支
ipcMain.handle('git:createBranch', async (event, repoPath, branchName) => {
  try {
    const git = simpleGit(repoPath)
    await git.checkoutLocalBranch(branchName)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 删除分支
ipcMain.handle('git:deleteBranch', async (event, repoPath, branchName) => {
  try {
    const git = simpleGit(repoPath)
    await git.deleteLocalBranch(branchName)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Stash 操作
ipcMain.handle('git:stash', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath)
    await git.stash()
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:stashPop', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath)
    await git.stash(['pop'])
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('git:stashList', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath)
    const stashList = await git.stashList()
    // 只返回可序列化的数据
    return {
      success: true,
      data: {
        all: stashList.all.map(stash => ({
          hash: stash.hash,
          date: stash.date,
          message: stash.message,
          index: stash.index
        })),
        total: stashList.total,
        latest: stashList.latest
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 获取远程仓库
ipcMain.handle('git:remotes', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath)
    const remotes = await git.getRemotes(true)
    // 只返回可序列化的数据
    return {
      success: true,
      data: remotes.map(remote => ({
        name: remote.name,
        refs: remote.refs
      }))
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 取消暂存
ipcMain.handle('git:unstage', async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath)
    await git.reset(['HEAD', '--', files])
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 丢弃更改
ipcMain.handle('git:discard', async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath)
    await git.checkout(['--', files])
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 标签管理 (Tag Management)
// 获取所有标签
ipcMain.handle('git:tags', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath)
    const tags = await git.tags()
    // 返回可序列化的数据
    return {
      success: true,
      data: {
        all: tags.all,
        latest: tags.latest
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 创建标签
ipcMain.handle('git:addTag', async (event, repoPath, tagName, message = null) => {
  try {
    const git = simpleGit(repoPath)
    if (message) {
      // 创建注释标签
      await git.addAnnotatedTag(tagName, message)
    } else {
      // 创建轻量级标签
      await git.addTag(tagName)
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 删除标签
ipcMain.handle('git:deleteTag', async (event, repoPath, tagName) => {
  try {
    const git = simpleGit(repoPath)
    await git.tag(['-d', tagName])
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 推送标签到远程
ipcMain.handle('git:pushTags', async (event, repoPath, remote = 'origin', tagName = null) => {
  try {
    const git = simpleGit(repoPath)
    if (tagName) {
      // 推送单个标签
      await git.pushTags(remote, tagName)
    } else {
      // 推送所有标签
      await git.pushTags(remote)
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 删除远程标签
ipcMain.handle('git:deleteRemoteTag', async (event, repoPath, remote, tagName) => {
  try {
    const git = simpleGit(repoPath)
    await git.push(remote, `:refs/tags/${tagName}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 远程分支管理 (Remote Branch Management)
// 获取远程分支列表
ipcMain.handle('git:remoteBranches', async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath)
    const branches = await git.branch(['-r'])
    // 返回可序列化的数据
    return {
      success: true,
      data: {
        all: branches.all,
        branches: branches.branches
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Fetch 操作
ipcMain.handle('git:fetch', async (event, repoPath, remote = 'origin', options = {}) => {
  try {
    const git = simpleGit(repoPath)
    const args = []
    if (options.prune) args.push('--prune')
    if (options.all) args.push('--all')

    await git.fetch(remote, ...args)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 删除远程分支
ipcMain.handle('git:deleteRemoteBranch', async (event, repoPath, remote, branchName) => {
  try {
    const git = simpleGit(repoPath)
    await git.push(remote, `:${branchName}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 跟踪远程分支
ipcMain.handle('git:trackRemoteBranch', async (event, repoPath, localBranch, remoteBranch) => {
  try {
    const git = simpleGit(repoPath)
    await git.branch(['--set-upstream-to', remoteBranch, localBranch])
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Checkout 远程分支（创建本地追踪分支）
ipcMain.handle('git:checkoutRemoteBranch', async (event, repoPath, remoteBranch, localBranch) => {
  try {
    const git = simpleGit(repoPath)
    await git.checkoutBranch(localBranch, remoteBranch)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

