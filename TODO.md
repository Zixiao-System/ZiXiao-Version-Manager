# TODO List

## 高优先级 (High Priority)

### 核心功能增强

- [ ] **差异查看器 (Diff Viewer)**
  - 实现文件内容对比视图
  - 支持 side-by-side 和 unified 两种模式
  - 语法高亮支持
  - 行号显示和跳转

- [ ] **暗黑模式 (Dark Mode)**
  - 实现完整的暗黑主题
  - 主题切换动画
  - 持久化主题偏好设置
  - 跟随系统主题选项

- [ ] **撤销/重做操作 (Undo/Redo)**
  - 实现操作历史栈
  - 支持撤销暂存、取消暂存等操作
  - 显示可撤销的操作列表

- [ ] **合并冲突解决 (Merge Conflict Resolution)**
  - 检测合并冲突
  - 可视化冲突标记
  - 提供冲突解决工具
  - 支持选择 ours/theirs/manual

### 性能优化

- [ ] **虚拟滚动 (Virtual Scrolling)**
  - 提交历史列表虚拟化
  - 文件列表虚拟化（大仓库）
  - 优化大型仓库加载性能

- [ ] **增量加载 (Lazy Loading)**
  - 提交历史分页加载
  - 按需加载提交详情
  - 文件差异按需计算

- [ ] **缓存机制 (Caching)**
  - 缓存提交历史
  - 缓存分支信息
  - 智能失效策略

### 用户体验

- [ ] **搜索功能 (Search)**
  - 提交历史搜索（按消息、作者、Hash）
  - 文件名搜索
  - 内容搜索（grep）
  - 高级过滤器

- [ ] **快捷键优化 (Keyboard Shortcuts)**
  - 自定义快捷键配置
  - 快捷键提示面板
  - 更多操作快捷键

- [ ] **拖放支持 (Drag & Drop)**
  - 拖放文件夹打开仓库
  - 拖放文件进行暂存
  - 拖放排序

## 中优先级 (Medium Priority)

### 远程操作增强

- [ ] **远程分支管理**
  - 查看远程分支列表
  - 删除远程分支
  - 跟踪远程分支
  - Fetch 操作

- [ ] **Pull Request 集成**
  - GitHub PR 查看
  - GitLab MR 支持
  - PR 创建和管理
  - Code Review 功能

- [ ] **多远程仓库支持**
  - 管理多个 remote
  - 添加/删除 remote
  - 推送到不同 remote

### Git 高级功能

- [ ] **Rebase 支持**
  - 交互式 rebase
  - Rebase 冲突处理
  - Abort/Continue/Skip 操作

- [ ] **Cherry-pick**
  - 选择单个提交应用
  - 批量 cherry-pick
  - 冲突处理

- [ ] **标签管理 (Tags)**
  - 创建轻量级/注释标签
  - 删除标签
  - 推送标签到远程
  - 查看标签历史

- [ ] **子模块支持 (Submodules)**
  - 显示子模块状态
  - 更新子模块
  - 添加/删除子模块

### 可视化改进

- [ ] **提交图谱 (Commit Graph)**
  - 分支树状可视化
  - 提交关系图
  - 交互式图谱导航

- [ ] **统计面板 (Statistics)**
  - 提交频率统计
  - 贡献者统计
  - 代码行数变化
  - 文件修改热力图

- [ ] **文件历史 (File History)**
  - 单个文件的提交历史
  - 文件内容演变追踪
  - Blame 视图

### 设置与配置

- [ ] **偏好设置面板**
  - Git 配置编辑（user.name, user.email）
  - UI 偏好设置
  - 行为配置
  - 导入/导出设置

- [ ] **多语言支持 (i18n)**
  - 英文界面
  - 简体中文界面
  - 繁体中文界面
  - 其他语言扩展

## 低优先级 (Low Priority)

### 扩展功能

- [ ] **Git Hooks 管理**
  - 查看现有 hooks
  - 编辑 hooks 脚本
  - 启用/禁用 hooks

- [ ] **工作流模板**
  - Git Flow 集成
  - GitHub Flow 支持
  - 自定义工作流

- [ ] **代码片段 (Snippets)**
  - .gitignore 模板
  - 提交消息模板
  - 常用命令快捷方式

- [ ] **插件系统**
  - 插件 API 设计
  - 插件市场
  - 社区插件支持

### 集成与互操作

- [ ] **IDE 集成**
  - VS Code 扩展
  - JetBrains IDE 插件
  - 协议处理器（git://）

- [ ] **CI/CD 状态**
  - GitHub Actions 状态
  - GitLab CI 状态
  - 构建状态徽章

- [ ] **Issue 追踪集成**
  - GitHub Issues
  - GitLab Issues
  - Jira 集成

### 测试与质量

- [ ] **单元测试**
  - Vue 组件测试
  - IPC 通信测试
  - Git 操作测试
  - 测试覆盖率 >80%

- [ ] **端到端测试**
  - Playwright/Cypress 集成
  - 关键流程自动化测试
  - 跨平台测试

- [ ] **错误追踪**
  - Sentry 集成
  - 错误日志收集
  - 崩溃报告

### 文档与社区

- [ ] **用户文档**
  - 详细使用教程
  - 视频演示
  - FAQ 扩充
  - 多语言文档

- [ ] **开发者文档**
  - 架构设计文档
  - API 参考
  - 贡献指南
  - 插件开发指南

- [ ] **社区建设**
  - Discord/Slack 社区
  - 定期发布计划
  - 用户反馈收集机制

## 技术债务 (Technical Debt)

- [ ] **代码重构**
  - 提取通用组件
  - 统一错误处理
  - 优化 IPC 通信层
  - TypeScript 迁移

- [ ] **状态管理**
  - 考虑引入 Pinia
  - 统一状态管理方案
  - 减少 localStorage 依赖

- [ ] **依赖更新**
  - 定期更新依赖包
  - 安全漏洞检查
  - 性能优化

- [ ] **构建优化**
  - 减小打包体积
  - Tree-shaking 优化
  - 启动速度优化

## Bug 修复 (Bug Fixes)

- [ ] Windows 路径兼容性问题
- [ ] 大仓库性能优化
- [ ] 中文文件名显示问题
- [ ] 某些 Git 操作的边界情况处理
- [ ] 网络超时处理

## 已完成 (Completed)

- [x] 基础仓库管理（打开、初始化、克隆）
- [x] 文件暂存和提交
- [x] 提交历史浏览
- [x] 分支管理（创建、切换、删除）
- [x] Push/Pull 操作
- [x] Stash 基础功能
- [x] Material Design UI
- [x] 跨平台支持（macOS/Windows/Linux）
- [x] IPC 序列化问题修复
- [x] 启动脚本优化

---

**更新日期**: 2025-10-06
**版本**: v1.0.1

**注**:
- 优先级可能根据用户反馈和实际需求动态调整
- 欢迎社区贡献，请参考 CONTRIBUTING.md（待创建）
- 具体实现时间请参考 ROADMAP.md
