# ZiXiao Version Manager - 版本历史

## v1.1.4 (2025-10-18)

### 🎉 全局键盘快捷键系统

#### 新增功能

- ✅ **键盘快捷键系统 (Keyboard Shortcuts System)**
  - 全局键盘快捷键支持
  - 导航快捷键（Cmd/Ctrl+1-4 快速切换视图）
  - 操作快捷键：
    - Cmd/Ctrl+R - 刷新当前视图
    - Cmd/Ctrl+S - 暂存所有更改
    - Cmd/Ctrl+Shift+S - 取消暂存所有
    - Cmd/Ctrl+Enter - 提交更改
    - Cmd/Ctrl+P - 推送到远程
    - Cmd/Ctrl+Shift+P - 拉取远程更改
  - 仓库快捷键：
    - Cmd/Ctrl+O - 打开仓库
    - Cmd/Ctrl+Shift+O - 返回仓库选择器
  - 视图控制快捷键：
    - Cmd/Ctrl+K - 显示快捷键帮助面板
    - Escape - 关闭对话框/取消操作
  - 键盘快捷键帮助面板，分类显示所有可用快捷键
  - 平台特定键位显示（Mac 显示 ⌘⇧⌥ 符号，Windows/Linux 显示 Ctrl/Shift/Alt）

#### UI/UX 改进

- 🎨 精美的快捷键帮助面板，采用 Material Design 风格
- ⌨️ 快捷键按键以 kbd 样式显示，易于识别
- 📊 按类别组织快捷键（导航、操作、仓库、视图）
- 🎯 工具栏新增键盘图标按钮，快速访问帮助
- 🔍 智能输入框检测，避免在输入时触发快捷键

#### 技术改进

- 🏗️ 新增 `src/composables/useKeyboardShortcuts.js` 可组合函数
- 🎨 新增 `KeyboardShortcutsPanel.vue` 组件
- 📡 集成到 App.vue 的全局快捷键系统
- 🔐 快捷键冲突检测和平台适配
- 💾 支持自定义快捷键配置（为未来扩展做准备）

### 下一步计划

- 撤销/重做操作系统
- 合并冲突解决 UI
- 增量加载和缓存机制

---

## v1.1.3 (2025-10-18)

### 🎉 虚拟滚动性能优化

#### 新增功能

- ✅ **虚拟滚动 (Virtual Scrolling)**
  - 提交历史列表虚拟化渲染
  - 仅渲染可见区域的提交项（视口 + 缓冲区）
  - 提交加载数量从 50 增加到 500
  - 大幅减少 DOM 节点数量
  - 流畅的滚动性能，即使在大型仓库中

#### 性能改进

- ⚡ 优化大型仓库（>100 commits）的渲染性能
- 📊 配置化的项目高度和缓冲区大小
- 🎯 智能计算可见范围，动态渲染
- 🔄 自动重置滚动位置（搜索或筛选时）

#### 技术改进

- 🏗️ 实现轻量级虚拟滚动算法
- 📐 使用 transform translateY 优化渲染性能
- 🎨 保持原有 UI 样式和交互体验
- 💡 Vue 3 Composition API 实现响应式滚动

#### Bug 修复

- 🐛 优化搜索后的列表重置逻辑
- 🐛 修复滚动位置计算精度

### 下一步计划

- 键盘快捷键系统
- 文件列表虚拟化（StatusView）
- 增量加载提交历史

---

## v1.1.2 (2025-10-12)

### 🎉 自动更新功能

#### 新增功能

- ✅ **自动检查更新 (Auto-Update Checker)**
  - 自动检查 GitHub Releases 获取最新版本
  - 每 24 小时自动检查一次
  - 版本比较算法（语义化版本）
  - 精美的更新通知对话框
  - 显示版本更新日志和发布时间
  - 支持跳过特定版本
  - 支持稍后提醒
  - 智能平台检测，自动选择合适的安装包
  - 一键下载最新版本

#### UI/UX 改进

- 🎨 更新对话框采用 Material Design 风格
- 📱 自适应更新内容显示（带滚动）
- 🔔 非侵入式的更新提醒
- ⚡ 支持手动检查更新（未来可在设置中添加）

#### 技术改进

- 🏗️ 新增 `src/utils/updater.js` 工具模块
- 📡 GitHub API 集成
- 🔐 IPC 通信增强：
  - `app:getVersion` - 获取应用版本
  - `app:openExternal` - 打开外部链接
- 💾 localStorage 持久化更新检查状态
- 🌐 跨平台下载资源智能匹配

### 下一步计划

- 文件历史查看器
- 合并冲突解决 UI
- 设置面板中的手动检查更新选项

---

## v1.1.1 (2025-10-12)

### 🎉 Git 功能增强

#### 新增功能

- ✅ **标签管理 (Tag Management)**
  - 创建轻量级标签和注释标签
  - 查看所有标签列表
  - 删除本地标签
  - 推送单个或所有标签到远程
  - 删除远程标签
  - 标签搜索功能
  - 创建标签时可选自动推送
  - 完整的 TagManager.vue 组件

- ✅ **远程分支管理 (Remote Branch Management)**
  - 查看远程分支列表
  - Fetch 操作（支持 --prune）
  - 检出远程分支为本地追踪分支
  - 删除远程分支
  - 创建新本地分支
  - 删除本地分支
  - 分支跟踪配置
  - 增强的 BranchManager.vue 组件

#### UI/UX 改进

- 🎨 全新的标签管理界面
- 🌿 改进的分支管理界面，分离本地和远程分支
- 🔍 标签搜索功能
- ⚡ 更流畅的分支和标签操作体验
- 📦 批量操作支持（推送所有标签）

#### 技术改进

- 🏗️ 新增 IPC 处理器：
  - `git:tags` - 获取标签列表
  - `git:addTag` - 创建标签
  - `git:deleteTag` - 删除本地标签
  - `git:pushTags` - 推送标签
  - `git:deleteRemoteTag` - 删除远程标签
  - `git:remoteBranches` - 获取远程分支
  - `git:fetch` - Fetch 操作
  - `git:deleteRemoteBranch` - 删除远程分支
  - `git:trackRemoteBranch` - 设置分支跟踪
  - `git:checkoutRemoteBranch` - 检出远程分支
- 📡 改进的 preload API 暴露
- 🔐 所有操作都有确认对话框保护

#### Bug 修复

- 🐛 修复分支管理中的一些边界情况
- 🐛 优化错误处理和用户反馈

### 下一步计划

参见 v1.2.0 路线图：
- 合并冲突解决
- 文件历史查看
- Cherry-pick 支持
- Rebase 支持

---

## v1.1.0 (2025-10-07)

### 🎉 核心体验优化

#### 新增功能

- ✅ **差异查看器 (Diff Viewer)**
  - 全新的文件差异对比组件
  - 支持并排（side-by-side）和统一（unified）两种视图模式
  - 完整的语法高亮支持（使用 diff2html + highlight.js）
  - 行号显示和导航
  - 与 StatusView 深度集成，点击文件即可查看差异
  - Material Design UI 风格

- ✅ **暗黑模式 (Dark Mode)**
  - 完整的主题管理系统
  - 三种主题模式：
    - 浅色模式（Light）
    - 深色模式（Dark）
    - 自动模式（跟随系统偏好）
  - 平滑的主题切换动画
  - 主题偏好持久化到 localStorage
  - 系统主题变化自动响应
  - 设置对话框支持主题选择

- ✅ **搜索功能 (Search)**
  - 提交历史搜索
    - 按提交消息搜索
    - 按作者名称搜索
    - 按作者邮箱搜索
    - 按 commit hash 搜索
  - 文件名搜索（在状态视图中）
  - 实时过滤，使用 Vue computed properties
  - 搜索框与 UI 无缝集成

#### UI/UX 改进

- 🎨 新增主题管理工具类（`src/utils/theme.js`）
- 🔧 设置对话框，支持主题配置
- 🎯 差异视图工具栏，便捷切换视图模式
- 📊 搜索栏优化，提升搜索体验

#### 技术改进

- 📦 新增依赖：
  - `diff2html` ^3.4.52 - 强大的 diff 渲染库
  - `highlight.js` ^11.11.1 - 代码语法高亮
- 🏗️ 新增工具模块：`src/utils/theme.js`
- 🎨 Material Design 主题变量集成
- ⚡ 优化组件渲染性能

#### Bug 修复

- 🐛 修复 Release workflow 中的 artifact 上传错误
- 🐛 解决重复文件上传导致的 404 错误
- 🐛 修复文件名包含空格时的处理问题
- 🐛 优化 macOS 构建流程（合并 x64 和 arm64 为 universal）

#### CI/CD 改进

- ✅ 优化 GitHub Actions Release workflow
- ✅ 改进 artifact 组织和上传逻辑
- ✅ 添加文件名空格处理
- ✅ 减少并行构建任务（macOS 统一构建）

#### 文档更新

- 📝 更新 ROADMAP.md，标记 v1.1.0 为已完成
- 📝 更新 TODO.md，标记已完成功能
- 📝 更新 README.md（如需要）

### 已知问题

- ⚠️ 大型仓库（>10k commits）性能待优化
- ⚠️ Windows 路径处理存在部分边界情况
- ⚠️ 中文文件名显示待改进

### 下一步计划

参见 v1.2.0 路线图：
- 标签管理（Tags）
- 远程分支管理
- 合并冲突解决
- 文件历史查看

---

## v1.0.0 (2025-10-05)

### 🎉 首次发布

#### 核心功能
- ✅ 完整的 Git 仓库管理
  - 打开现有仓库（原生文件夹选择器）
  - 初始化新仓库
  - 克隆远程仓库
  - 最近打开记录（保存最近5个）

- ✅ 高级状态管理
  - 实时显示文件状态（已修改、已暂存、未跟踪）
  - 单个/批量文件暂存和取消暂存
  - 安全的丢弃更改（带确认对话框）
  - 分支状态显示（ahead/behind 标识）

- ✅ 提交操作
  - 多行提交信息编辑
  - 智能文件列表管理
  - 提交历史浏览（最近50条）
  - 详细的提交信息查看

- ✅ 分支管理
  - 本地分支列表和切换
  - 创建和删除分支
  - 当前分支高亮显示

- ✅ 远程操作
  - Pull 和 Push 支持
  - 远程仓库信息查看

- ✅ Stash 管理
  - 保存和应用 Stash
  - Stash 列表查看

#### UI/UX 改进
- 🎨 采用 Material Design 风格（mdui 2.x）
- 🎯 直观的图标和颜色区分
- 📱 响应式布局设计
- 🔔 友好的错误提示和 Snackbar 通知
- ⚠️ 危险操作的确认对话框
- 🎪 加载状态指示器

#### 应用特性
- ⌨️ 完整的菜单栏和键盘快捷键
  - Cmd/Ctrl + O: 选择仓库
  - Cmd/Ctrl + R: 刷新
  - Cmd/Ctrl + Q: 退出
  - 标准编辑快捷键（复制、粘贴等）

- 🖼️ 自定义应用图标
  - macOS/Windows/Linux 平台图标支持
  - 多尺寸图标生成

- 🔒 安全性
  - Electron 上下文隔离
  - 安全的 IPC 通道
  - 禁用 Node.js 集成

#### 技术实现
- Vue 3 Composition API
- Electron 28
- mdui 2.x Material Design 组件
- Vite 5 构建工具
- simple-git 库

#### 支持的平台
- macOS (x64 和 Apple Silicon)
- Windows (x64)
- Linux (AppImage 和 DEB)

### 已知问题
- 无

### 计划改进
- [ ] 添加 Diff 视图
- [ ] 支持 Merge 操作
- [ ] 支持 Rebase 操作
- [ ] 添加冲突解决工具
- [ ] 支持 Git Tag 管理
- [ ] 添加图形化提交历史
- [ ] 支持多仓库管理
- [ ] 添加偏好设置
- [ ] 支持主题切换
- [ ] 添加多语言支持
