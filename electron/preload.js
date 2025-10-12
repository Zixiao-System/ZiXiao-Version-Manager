const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  onMenuSelectRepo: (callback) => ipcRenderer.on('menu:select-repo', callback)
})

contextBridge.exposeInMainWorld('gitAPI', {
  isRepo: (repoPath) => ipcRenderer.invoke('git:isRepo', repoPath),
  status: (repoPath) => ipcRenderer.invoke('git:status', repoPath),
  log: (repoPath, options) => ipcRenderer.invoke('git:log', repoPath, options),
  add: (repoPath, files) => ipcRenderer.invoke('git:add', repoPath, files),
  commit: (repoPath, message) => ipcRenderer.invoke('git:commit', repoPath, message),
  push: (repoPath, remote, branch) => ipcRenderer.invoke('git:push', repoPath, remote, branch),
  pull: (repoPath, remote, branch) => ipcRenderer.invoke('git:pull', repoPath, remote, branch),
  branches: (repoPath) => ipcRenderer.invoke('git:branches', repoPath),
  checkout: (repoPath, branch) => ipcRenderer.invoke('git:checkout', repoPath, branch),
  diff: (repoPath, options) => ipcRenderer.invoke('git:diff', repoPath, options),
  init: (repoPath) => ipcRenderer.invoke('git:init', repoPath),
  clone: (url, localPath) => ipcRenderer.invoke('git:clone', url, localPath),
  createBranch: (repoPath, branchName) => ipcRenderer.invoke('git:createBranch', repoPath, branchName),
  deleteBranch: (repoPath, branchName) => ipcRenderer.invoke('git:deleteBranch', repoPath, branchName),
  stash: (repoPath) => ipcRenderer.invoke('git:stash', repoPath),
  stashPop: (repoPath) => ipcRenderer.invoke('git:stashPop', repoPath),
  stashList: (repoPath) => ipcRenderer.invoke('git:stashList', repoPath),
  remotes: (repoPath) => ipcRenderer.invoke('git:remotes', repoPath),
  unstage: (repoPath, files) => ipcRenderer.invoke('git:unstage', repoPath, files),
  discard: (repoPath, files) => ipcRenderer.invoke('git:discard', repoPath, files),
  // Tag management
  getTags: (repoPath) => ipcRenderer.invoke('git:tags', repoPath),
  addTag: (repoPath, tagName, message) => ipcRenderer.invoke('git:addTag', repoPath, tagName, message),
  deleteTag: (repoPath, tagName) => ipcRenderer.invoke('git:deleteTag', repoPath, tagName),
  pushTags: (repoPath, remote, tagName) => ipcRenderer.invoke('git:pushTags', repoPath, remote, tagName),
  deleteRemoteTag: (repoPath, remote, tagName) => ipcRenderer.invoke('git:deleteRemoteTag', repoPath, remote, tagName)
})
