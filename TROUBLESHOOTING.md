# 故障排除指南

## 常见问题和解决方案

### 1. 应用无法启动 / 启动卡住

**症状**: 运行 `npm run electron:dev` 后，Vite 启动了但 Electron 窗口没有出现。

**解决方案**:

**方法 A: 使用启动脚本（推荐）**
```bash
./start.sh
```

**方法 B: 手动分步启动**
```bash
# 终端 1
npm run dev

# 终端 2（等待 Vite 启动完成后）
NODE_ENV=development npx electron .
```

**方法 C: 清理并重启**
```bash
# 杀掉所有相关进程
pkill -f "vite|electron"

# 清理端口
lsof -ti:5173 | xargs kill -9  # macOS/Linux

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新启动
./start.sh
```

---

### 2. 端口被占用

**症状**: 错误信息显示 `EADDRINUSE: address already in use :::5173`

**解决方案**:

```bash
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# 或者修改端口（vite.config.js）
server: {
  port: 5174  // 改为其他端口
}
```

---

### 3. Git 操作错误 "An object could not be cloned"

**症状**: 控制台显示 IPC 错误，Git 操作失败。

**原因**: simple-git 返回的对象包含不可序列化的方法。

**解决方案**: 已在 v1.0.0 中修复。如果仍有问题，请：

```bash
# 更新到最新代码
git pull

# 清理并重新安装
rm -rf node_modules
npm install

# 重启应用
./start.sh
```

---

### 4. 仓库无法加载

**症状**: 选择仓库后提示"不是有效的 Git 仓库"。

**可能原因**:
1. 选择的文件夹不包含 `.git` 目录
2. `.git` 目录损坏
3. 没有读取权限

**解决方案**:

```bash
# 验证是否为 Git 仓库
cd /path/to/your/repo
ls -la .git  # 应该能看到 .git 目录

# 如果是新项目，先初始化
git init

# 检查权限
ls -ld .git
# 应该显示 drwxr-xr-x 或类似
```

---

### 5. 克隆仓库失败

**症状**: 克隆远程仓库时提示错误。

**可能原因**:
1. URL 不正确
2. 网络问题
3. 需要认证（SSH 密钥或 HTTPS 凭据）
4. 目标文件夹已存在

**解决方案**:

```bash
# 1. 验证 URL 格式
# HTTPS: https://github.com/user/repo.git
# SSH: git@github.com:user/repo.git

# 2. 测试网络连接
git clone https://github.com/user/repo.git /tmp/test

# 3. 设置 SSH 密钥（如果使用 SSH）
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 将公钥添加到 GitHub/GitLab

# 4. 确保目标文件夹为空
ls /path/to/destination
# 如果不为空，选择其他位置或清空文件夹
```

---

### 6. Electron 窗口空白

**症状**: Electron 窗口打开了，但显示空白页面。

**解决方案**:

1. **打开开发者工具**（自动在开发模式打开）
2. **查看控制台错误**
3. **检查 Vite 服务器**
   ```bash
   curl http://localhost:5173
   # 应该返回 HTML 内容
   ```
4. **重启应用**
   ```bash
   ./start.sh
   ```

---

### 7. 依赖安装失败

**症状**: `npm install` 失败或报错。

**解决方案**:

```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和锁文件
rm -rf node_modules package-lock.json

# 使用 npm 重新安装
npm install

# 如果还是失败，尝试更新 npm
npm install -g npm@latest

# 或使用 yarn
npm install -g yarn
yarn install
```

---

### 8. 图标不显示

**症状**: 应用图标或 UI 图标不显示。

**解决方案**:

```bash
# 1. 确认图标文件存在
ls build/icons/
ls icons/

# 2. 重新生成图标
cd build
rm -rf icons
mkdir icons
cd ..

# 使用 ImageMagick 重新生成
convert icons/Icon-iOS-Default-1024x1024@1x.png -resize 512x512 build/icons/icon.png
convert icons/Icon-iOS-Default-1024x1024@1x.png -resize 256x256 build/icons/icon-256.png
# ... 其他尺寸

# 3. 重新构建
npm run build
```

---

### 9. 构建失败

**症状**: `npm run electron:build` 失败。

**解决方案**:

```bash
# 1. 确保先执行 Vite 构建
npm run build

# 2. 检查 dist 目录
ls dist/

# 3. 检查 electron-builder 配置
cat package.json | grep -A 20 "build"

# 4. 查看详细错误
npm run electron:build -- --verbose

# 5. 清理并重试
rm -rf dist dist-electron
npm run build
npm run electron:build
```

---

### 10. macOS 无法打开应用（安全警告）

**症状**: macOS 提示"应用来自未知开发者"。

**解决方案**:

```bash
# 方法 A: 右键点击应用 -> 打开

# 方法 B: 系统偏好设置
# 系统偏好设置 -> 安全性与隐私 -> 通用 -> 仍要打开

# 方法 C: 命令行移除隔离属性
xattr -cr /path/to/ZiXiao\ Version\ Manager.app
```

---

### 11. 性能问题 / 应用卡顿

**可能原因**:
1. 仓库太大（文件太多）
2. Git 历史太长
3. 内存不足

**解决方案**:

```bash
# 1. 限制加载的提交数量（已在代码中设置为 50）

# 2. 使用 shallow clone
git clone --depth 1 <url>

# 3. 清理 Git 仓库
cd /path/to/repo
git gc --aggressive --prune=now

# 4. 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm run electron:dev
```

---

### 12. 开发者工具不显示

**症状**: 开发模式下开发者工具没有自动打开。

**解决方案**:

1. **使用快捷键**: `Alt + Cmd/Ctrl + I`（仅开发模式）
2. **通过菜单**: 视图 -> 开发者工具
3. **修改代码** (`electron/main.js`):
   ```javascript
   if (process.env.NODE_ENV === 'development') {
     mainWindow.loadURL('http://localhost:5173')
     mainWindow.webContents.openDevTools()  // 确保这行存在
   }
   ```

---

### 13. 日志文件位置

如果需要查看详细日志：

```bash
# Vite 日志
cat /tmp/vite-zixiao.log

# Electron 日志
cat /tmp/electron-zixiao.log

# 系统日志（macOS）
log show --predicate 'process == "Electron"' --last 5m

# Chrome DevTools Console（Electron 开发者工具）
```

---

### 14. 获取帮助

如果以上方法都无法解决问题：

1. **查看完整日志**
   ```bash
   # 启动时保存日志
   ./start.sh 2>&1 | tee app.log
   ```

2. **检查系统要求**
   - Node.js 16+
   - npm 8+
   - macOS 10.13+ / Windows 10+ / Linux (Ubuntu 18.04+)
   - 至少 4GB RAM

3. **提交 Issue**
   - 包含错误日志
   - 操作系统版本
   - Node.js 版本 (`node --version`)
   - npm 版本 (`npm --version`)
   - 复现步骤

---

## 调试技巧

### 启用详细日志

```bash
# Electron 详细日志
export ELECTRON_ENABLE_LOGGING=1
NODE_ENV=development npx electron .

# Vite 调试模式
DEBUG=vite:* npm run dev
```

### 检查进程

```bash
# macOS/Linux
ps aux | grep -E "electron|vite|node"

# Windows
tasklist | findstr "electron"
tasklist | findstr "node"
```

### 网络调试

```bash
# 检查 Vite 服务器
curl -v http://localhost:5173

# 查看端口占用
netstat -an | grep 5173  # macOS/Linux
netstat -ano | findstr 5173  # Windows
```

---

**最后更新**: 2025-10-05  
**版本**: v1.0.0
