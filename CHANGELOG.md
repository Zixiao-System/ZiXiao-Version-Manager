# ZiXiao Version Manager - 版本历史

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
