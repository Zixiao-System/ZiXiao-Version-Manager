# ZiXiao Version Manager

<div align="center">
  <img src="icons/Icon-iOS-Default-1024x1024@1x.png" width="128" height="128" alt="ZiXiao Version Manager Logo">

  <p>一个现代化、功能强大的 Git GUI 客户端</p>
  <p>基于 Vue 3 + Electron + mdui 构建</p>
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/Zixiao-System/ZiXiao-Version-Manager/actions/workflows/ci.yml/badge.svg)](https://github.com/Zixiao-System/ZiXiao-Version-Manager/actions/workflows/ci.yml)
[![Release](https://github.com/Zixiao-System/ZiXiao-Version-Manager/actions/workflows/release.yml/badge.svg)](https://github.com/Zixiao-System/ZiXiao-Version-Manager/actions/workflows/release.yml)

## ✨ 功能特性

### 核心功能
- 🎯 **仓库管理**
  - 打开现有仓库（支持文件夹选择器）
  - 初始化新仓库
  - 克隆远程仓库
  - 最近打开的仓库记录

- 📊 **状态管理**
  - 实时查看工作区状态
  - 区分已修改、已暂存和未跟踪文件
  - 一键暂存/取消暂存
  - 丢弃更改（带确认对话框）
  - 快速提交更改

- 📝 **提交操作**
  - 智能文件暂存
  - 多行提交信息编辑
  - 提交历史浏览
  - 提交详情查看

- 🌿 **分支管理**
  - 查看所有本地分支
  - 一键切换分支
  - 创建新分支
  - 删除分支
  - 显示当前分支状态（ahead/behind）

- 🔄 **远程操作**
  - Pull 最新更改
  - Push 到远程仓库
  - 查看远程仓库信息

- 💾 **Stash 管理**
  - 保存当前更改到 Stash
  - 查看 Stash 列表
  - 应用 Stash

### UI/UX 特性
- 💎 Modern Material Design 风格（mdui 2.x）
- 🎨 直观的图标和颜色标识
- ⌨️ 完整的键盘快捷键支持
- 🔔 友好的错误提示和确认对话框
- 📱 响应式布局
- 🌙 专业的应用菜单栏

## 🛠 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4+ | 前端框架 |
| Electron | 28+ | 桌面应用框架 |
| mdui | 2.x | Material Design UI 组件库 |
| Vite | 5+ | 构建工具 |
| simple-git | 3.22+ | Git 操作库 |

## 📦 安装依赖

```bash
npm install
```

## 🚀 运行开发环境

**方式一：使用启动脚本（最稳定）**

```bash
./start.sh
```

此脚本会：
1. 自动清理旧进程
2. 启动 Vite 开发服务器
3. 等待 Vite 就绪
4. 启动 Electron 应用
5. 关闭时自动清理所有进程

**方式二：使用 npm 脚本**

```bash
npm run electron:dev
```

此命令会同时启动 Vite 开发服务器和 Electron 应用。

> ⚠️ 如果方式二卡住不动，请使用方式一的启动脚本。

**方式三：手动启动（调试用）**

终端 1 - 启动 Vite 开发服务器：
```bash
npm run dev
```

终端 2 - 启动 Electron 应用：
```bash
NODE_ENV=development npx electron .
```

## 🏗 构建生产版本

```bash
npm run electron:build
```

构建完成后，可执行文件将在 `dist-electron` 目录中生成。

### 支持的平台
- **macOS**: DMG 和 ZIP 安装包 (x64 和 arm64)
- **Windows**: NSIS 安装程序和便携版 (x64)
- **Linux**: AppImage 和 DEB 包

## 📁 项目结构

```
ZiXiao-Version-Manager/
├── build/                # 构建资源
│   └── icons/           # 应用图标（多尺寸）
├── electron/            # Electron 主进程文件
│   ├── main.js         # 主进程入口（窗口管理、菜单、IPC）
│   └── preload.js      # 预加载脚本（安全的API暴露）
├── icons/              # 原始图标文件
├── src/                # Vue 源代码
│   ├── components/     # Vue 组件
│   │   ├── RepositorySelector.vue    # 仓库选择器
│   │   ├── StatusView.vue            # 状态视图和提交
│   │   ├── CommitHistory.vue         # 提交历史浏览
│   │   └── BranchManager.vue         # 分支管理
│   ├── App.vue        # 根组件（布局和导航）
│   ├── main.js        # Vue 入口
│   └── style.css      # 全局样式
├── index.html         # HTML 模板
├── vite.config.js     # Vite 配置
├── package.json       # 项目配置和依赖
└── README.md         # 项目文档
```

## 💡 使用指南

### 1. 选择仓库

首次启动应用时，您可以：

- **打开现有仓库**: 点击"浏览"按钮选择包含 `.git` 文件夹的目录
- **初始化新仓库**: 在空文件夹中初始化一个新的 Git 仓库
- **克隆远程仓库**: 输入 Git URL 和本地路径进行克隆

最近打开的仓库会自动保存，下次可以快速访问。

### 2. 管理更改

在"状态"页面：

1. **查看文件状态**:
   - 🟡 已修改文件
   - 🟢 已暂存文件
   - 🔵 未跟踪文件

2. **暂存文件**:
   - 单个文件：点击文件旁的 ➕ 按钮
   - 所有文件：点击"暂存所有"按钮

3. **提交更改**:
   - 编写提交信息
   - 点击"提交"按钮

4. **其他操作**:
   - 取消暂存：点击已暂存文件旁的 ➖ 按钮
   - 丢弃更改：点击 ↩️ 按钮（会有确认提示）
   - 使用 Stash：点击工具栏的"Stash"按钮

### 3. 查看历史

在"提交历史"页面：

- 浏览所有提交记录
- 点击提交查看详细信息（作者、时间、Hash 等）
- 自动加载最近 50 条提交

### 4. 管理分支

在"分支管理"页面：

- 查看所有本地分支（当前分支标记为绿色 ✓）
- 点击分支名称进行切换
- 使用 Pull/Push 按钮同步远程仓库

### 5. 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + O` | 选择仓库 |
| `Cmd/Ctrl + R` | 刷新 |
| `Cmd/Ctrl + Q` | 退出应用 |
| `Cmd/Ctrl + Z` | 撤销 |
| `Cmd/Ctrl + C` | 复制 |
| `Cmd/Ctrl + V` | 粘贴 |
| `Cmd/Ctrl + +/-` | 放大/缩小 |

## 🔒 安全性

- **上下文隔离**: Electron 使用上下文隔离确保安全性
- **预加载脚本**: 通过安全的 IPC 通道暴露必要的 API
- **无 Node 集成**: 渲染进程禁用 Node.js 集成
- **确认对话框**: 危险操作（如丢弃更改）需要确认

## 🐛 调试

开发模式下会自动打开 DevTools，您也可以：

- 通过菜单：视图 → 开发者工具
- 快捷键：`Alt + Cmd/Ctrl + I` (仅开发模式)

## 📝 开发说明

### 添加新的 Git 操作

1. 在 `electron/main.js` 中添加 IPC 处理函数
2. 在 `electron/preload.js` 中暴露 API
3. 在对应的 Vue 组件中调用 API

### 修改 UI 样式

项目使用 mdui 组件库，参考 [mdui 文档](https://www.mdui.org/) 了解可用组件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Electron](https://www.electronjs.org/) - 使用 Web 技术构建跨平台桌面应用
- [mdui](https://www.mdui.org/) - Material Design UI 组件库
- [simple-git](https://github.com/steveukx/git-js) - Git 命令的 Node.js 接口

---

<div align="center">
  Made with ❤️ by ZiXiao Team
</div>
