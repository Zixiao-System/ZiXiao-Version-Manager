# 🚀 开始使用 ZiXiao Version Manager

欢迎使用 ZiXiao Version Manager！这是一个现代化的 Git GUI 客户端。

## ⚡ 快速启动（3步）

### 1️⃣ 安装依赖
```bash
npm install
```

### 2️⃣ 启动应用
```bash
./start.sh
```

### 3️⃣ 选择仓库
- 应用启动后，在"选择仓库"页面点击"浏览"
- 选择一个包含 `.git` 文件夹的目录
- 点击"确认"

就是这么简单！🎉

---

## 📖 详细文档

| 文档 | 内容 |
|------|------|
| [README.md](./README.md) | 完整功能说明、技术文档、使用指南 |
| [QUICK_START.md](./QUICK_START.md) | 5分钟快速入门教程 |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 常见问题和解决方案 |
| [CHANGELOG.md](./CHANGELOG.md) | 版本历史和更新记录 |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | 项目技术总结 |

---

## ⚙️ 启动方式对比

| 方式 | 命令 | 优点 | 缺点 |
|------|------|------|------|
| **启动脚本** ⭐ | `./start.sh` | 最稳定，自动清理 | 需要 bash |
| npm 脚本 | `npm run electron:dev` | 简单 | 可能卡住 |
| 手动启动 | 两个终端 | 便于调试 | 麻烦 |

**推荐使用 `./start.sh`** ✅

---

## 🎯 主要功能

### ✅ 仓库管理
- 打开现有仓库
- 初始化新仓库
- 克隆远程仓库
- 最近打开记录

### ✅ 文件操作
- 查看文件状态（已修改、已暂存、未跟踪）
- 暂存/取消暂存文件
- 丢弃更改
- 提交更改

### ✅ 分支管理
- 查看所有分支
- 切换分支
- 创建/删除分支

### ✅ 远程操作
- Pull 更改
- Push 到远程
- Stash 管理

---

## 🆘 遇到问题？

### 应用启动卡住
```bash
# 使用启动脚本
./start.sh
```

### 端口被占用
```bash
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
```

### 更多问题
查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 🎨 界面预览

应用采用 Material Design 风格：
- 🎨 直观的颜色编码
  - 🟢 绿色 = 已暂存/成功
  - 🟡 黄色 = 已修改
  - 🔵 蓝色 = 未跟踪
  - 🔴 红色 = 错误/危险

- ⌨️ 完整的键盘快捷键
  - `Cmd/Ctrl + O`: 选择仓库
  - `Cmd/Ctrl + R`: 刷新
  - `Cmd/Ctrl + Q`: 退出

---

## 💡 使用技巧

1. **最近打开**: 应用会记住最近5个仓库，可快速切换
2. **Stash 功能**: 临时保存工作进度，不提交
3. **批量操作**: 可一键暂存或丢弃所有更改
4. **确认对话框**: 危险操作（如丢弃更改）会要求确认

---

## 🏗️ 构建生产版本

```bash
npm run electron:build
```

生成的安装包在 `dist-electron/` 目录：
- macOS: `.dmg` 和 `.zip`
- Windows: `.exe` 安装程序
- Linux: `.AppImage` 和 `.deb`

---

## 📞 获取帮助

- 📖 [完整文档](./README.md)
- 🐛 [故障排除](./TROUBLESHOOTING.md)
- 💬 提交 Issue（如果有 GitHub 仓库）

---

**开始享受高效的 Git 工作流吧！** 🚀

---

*版本: v1.0.0 | 最后更新: 2025-10-05*
