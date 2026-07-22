# 会话记忆存储

> 记录最近 5 次重要会话、当前上下文和可复用结论；避免保存临时调试信息。

## 📝 会话日志

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

### 2026-06-12 - sitemap.xml 与静态 OG meta

新增根路径 `/sitemap.xml`，只输出真实公开路由与已发布文章 slug；加入 1 小时缓存、W3C Datetime 和 XML 转义。前端补充站点级 canonical、OpenGraph、Twitter Card。关键位置：`apps/api/src/sitemap/`、`apps/web/index.html`。待归档。

## 🎯 当前上下文（最近 3 次）

1. **Codex 初始化适配**：新增 `AGENTS.md`，Codex 与 Claude 共享 `.ai/`、OpenSpec 和项目技能源。
2. **FallingPattern 异常修复**：代码与浏览器回归完成，待用户跨设备观察实际效果。
3. **全仓逻辑整改**：高风险逻辑已集中修复，部署前执行数据库迁移。

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

| 问题                               | 解决方案                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Zustand rehydration 竞态           | `_hasHydrated` + `queueMicrotask`                                                          |
| 可选认证不解析 token               | 使用 `OptionalJwtAuthGuard`                                                                |
| 评论点赞 N+1                       | 汇总评论 ID 后单次 `{ in: ids }` 查询                                                      |
| BlockNote 自定义工具栏丢失默认按钮 | 显式列出全部按钮                                                                           |
| 动态背景偶发闪烁                   | 避免全屏 `backdrop-filter` 依赖运动图层；静态滤镜纹理 + transform 合成 + paint containment |
| 装饰动画离屏仍耗资源               | `IntersectionObserver` 与 Page Visibility 共同控制 CSS 播放变量                            |

## 🔗 关键代码位置

| 功能          | 路径                                                        |
| ------------- | ----------------------------------------------------------- |
| 首页动态背景  | `packages/ui/src/components/background/FallingPattern.tsx`  |
| 首页调用方    | `apps/web/src/pages/HomePage.tsx`                           |
| 认证与会话    | `apps/api/src/auth/`、`apps/web/src/stores/useAuthStore.ts` |
| 博客          | `apps/api/src/blog/`                                        |
| 评论          | `apps/api/src/comment/`                                     |
| AI 对话       | `apps/api/src/ai-chat/`、`apps/web/src/pages/chat/`         |
| AI 协作入口   | `CLAUDE.md`、`AGENTS.md`、`.ai/`                            |
| Prisma Schema | `apps/api/prisma/schema.prisma`                             |
| UI 组件库     | `packages/ui/src/components/`                               |

---

**最后更新**：2026-07-22
