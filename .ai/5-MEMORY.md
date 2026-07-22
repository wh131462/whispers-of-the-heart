# 会话记忆存储

> 记录最近 5 次重要会话、当前上下文和可复用结论；避免保存临时调试信息。

## 📝 会话日志

### 2026-07-22 - BlockNote AI 长内容续写滚动修复

**问题**：长文章选区触发 AI 编辑后，AI 扩写会持续把锚点移动到最后变更块；项目根节点的全局平滑滚动与 BlockNote AI 的自动定位互相干扰。同时 AI 菜单按文档块定位且编辑器容器允许溢出，长内容下菜单会离开可视区并参与页面高度计算，表现为滚动条异常变长、无法找到“接受/拒绝”。

**实施**：AI 会话开启期间临时将根节点滚动行为切换为 `auto`，关闭后恢复；将 AI 菜单固定到视口底部并限制最大高度，使输入、生成、审阅阶段的操作始终可见且不再撑高文档。正文的捕获阶段粘贴处理器仅处理 `.bn-editor` 内事件，并放行原生输入框，避免 AI 提示词被 Markdown 粘贴逻辑截获后插入正文。

**修改文件**：`packages/ui/src/components/editor/BlockNoteEditor.tsx`

**验证**：UI 类型检查、目标 ESLint、UI 包构建和 Web 生产构建通过；本地 80 段长文浏览器验证中，菜单滚动前后均固定于视口底部，页面高度保持稳定，关闭后平滑滚动恢复。AI 输入框粘贴回归确认文本只进入提示词输入框，正文内容保持不变。实际模型请求被当前本地模型配置以 `Thinking mode does not support this tool_choice` 拒绝，未覆盖成功生成后的“接受/拒绝”端到端点击，该错误与本次布局修复独立。

### 2026-07-22 - Codex 项目初始化适配

新增仓库级 `AGENTS.md`，将现有 Claude 协作约束适配为 Codex 可直接执行的会话初始化流程。Claude 与 Codex 共同复用 `.ai/`、`openspec/` 和 `.claude/skills/`，不复制项目技能，避免双份配置漂移；补充 Codex 工具能力映射、真实网络行为约束、文档维护和规则优先级。同步更新 `.ai/README.md` 的助手入口说明。

### 2026-07-21 - 首页 FallingPattern 偶发显示异常修复

**问题**：首页背景由 12 个超视口动画层和全屏 `backdrop-filter` 组成，高 DPI、集显或图层恢复时可能出现闪烁、锐化、断层；暂停恢复还会触发 React 整体重渲染。原设计要求的 `will-change` 未落实，`dark:brightness-[600]` 还是潜在异常值。

**实施**：

- 将全屏 `backdrop-filter` 改为各静态图案层的 `filter: blur()`，模糊纹理只需缓存后随 transform 合成。
- 每层高度从“视口 + 2 个 tile”收缩为“视口 + 1 个 tile”，仍保持一个 tile 位移的无缝循环。
- 增加 `will-change: transform`、`backface-visibility: hidden`、根容器 `contain: layout paint`。
- 用根元素 CSS 变量控制播放状态，`IntersectionObserver` 与 `visibilitychange` 直接更新变量，避免 React 重渲染。
- 蒙版改为软边 radial-gradient，移除无效且危险的 `dark:brightness-[600]`；背景设为装饰元素并禁用指针事件。

**修改文件**：`packages/ui/src/components/background/FallingPattern.tsx`

**验证**：UI/Web 类型检查、目标 ESLint、UI 包构建、Web 生产构建通过；浏览器验证浅色/深色视觉、动画持续运行、离屏暂停/恢复，控制台 0 警告。Web 构建仍有历史大 chunk 与 Browserslist 数据过期提示。

### 2026-07-21 - 全仓代码逻辑审查与集中整改

审查约 487 个 TS/TSX 文件并修复公开草稿泄露、媒体越权、跨文章回复、密码轮换与会话撤销、验证码安全、AI 配额原子预留、异常详情丢失及文章组合事务问题。新增 `tokenVersion` 与 `ai_usage_windows` 迁移。完整报告：`reports/CODE_LOGIC_AUDIT_2026-07-21.md`。Lint、类型检查、测试和构建通过；部署前需执行 Prisma migration。

### 2026-06-12 - AI 对话界面与博客知识库

新增 `/chat`、OpenAI/Anthropic 前端适配器、SSE 流式解析、服务器默认 Provider、登录配额和博客知识检索。关键位置：`apps/web/src/pages/chat/`、`apps/web/src/stores/useAiChatStore.ts`、`apps/api/src/ai-chat/`、`packages/utils/src/ai-chat/`。默认配置不持久化，知识片段使用隔离标签注入。待完成端到端手测与 OpenSpec 归档。

## 🎯 当前上下文（最近 3 次）

1. **BlockNote AI 长文滚动修复**：AI 菜单固定于视口底部，会话期间禁用根节点平滑滚动；静态与本地浏览器回归完成。
2. **Codex 初始化适配**：新增 `AGENTS.md`，Codex 与 Claude 共享 `.ai/`、OpenSpec 和项目技能源。
3. **FallingPattern 异常修复**：代码与浏览器回归完成，待用户跨设备观察实际效果。

## 💡 重要发现

### 架构决策

| 领域 | 选择                          | 说明               |
| ---- | ----------------------------- | ------------------ |
| 前端 | Vite + React 19               | SPA，无 SSR        |
| 状态 | Zustand                       | 轻量并支持持久化   |
| 后端 | NestJS + Prisma               | 模块化与类型安全   |
| 文件 | MinIO                         | S3 兼容、自托管    |
| 评论 | `rootId + replyToId` 扁平结构 | 便于分页与批量查询 |

### 常见问题及解决方案

| 问题                                 | 解决方案                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| Zustand rehydration 竞态             | `_hasHydrated` + `queueMicrotask`                                                          |
| 可选认证不解析 token                 | 使用 `OptionalJwtAuthGuard`                                                                |
| 评论点赞 N+1                         | 汇总评论 ID 后单次 `{ in: ids }` 查询                                                      |
| BlockNote 自定义工具栏丢失默认按钮   | 显式列出全部按钮                                                                           |
| BlockNote AI 长内容菜单离屏/撑高页面 | AI 会话期间关闭根节点平滑滚动，并将 AI 菜单固定于视口底部                                  |
| BlockNote AI 输入框粘贴进入正文      | 将正文粘贴捕获限制在 `.bn-editor`，并放行 `input` / `textarea`                             |
| 动态背景偶发闪烁                     | 避免全屏 `backdrop-filter` 依赖运动图层；静态滤镜纹理 + transform 合成 + paint containment |
| 装饰动画离屏仍耗资源                 | `IntersectionObserver` 与 Page Visibility 共同控制 CSS 播放变量                            |

## 🔗 关键代码位置

| 功能          | 路径                                                        |
| ------------- | ----------------------------------------------------------- |
| 首页动态背景  | `packages/ui/src/components/background/FallingPattern.tsx`  |
| 首页调用方    | `apps/web/src/pages/HomePage.tsx`                           |
| 认证与会话    | `apps/api/src/auth/`、`apps/web/src/stores/useAuthStore.ts` |
| 博客          | `apps/api/src/blog/`                                        |
| 评论          | `apps/api/src/comment/`                                     |
| AI 对话       | `apps/api/src/ai-chat/`、`apps/web/src/pages/chat/`         |
| 富文本编辑器  | `packages/ui/src/components/editor/BlockNoteEditor.tsx`     |
| AI 协作入口   | `CLAUDE.md`、`AGENTS.md`、`.ai/`                            |
| Prisma Schema | `apps/api/prisma/schema.prisma`                             |
| UI 组件库     | `packages/ui/src/components/`                               |

---

**最后更新**：2026-07-22
