# ZiXiao Version Manager - 版本历史

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
