## Why

博客系统目前只能通过站点首页或第三方搜索发现新文章，缺少 RSS 这一被独立博客读者长期依赖的订阅渠道。给读者提供标准的 RSS 端点可以：

1. 让 Feedly、Reeder、NetNewsWire、Inoreader 等聚合阅读器自动追踪新文章
2. 支撑后续邮件订阅、跨站聚合等下游能力（都建立在 feed 之上）
3. 配合 `<link rel="alternate">` 让浏览器和阅读器实现"打开站点即可发现订阅源"

这是博客领域的事实标准能力，缺失会被订阅型读者直接放弃。

## What Changes

- 新增后端能力：暴露 `GET /rss.xml`，返回 RSS 2.0 XML，列出最新已发布文章
- feed 的站点元信息（标题、描述、回站链接、Logo）从 [SiteConfigService](apps/api/src/site-config/site-config.service.ts) 单一来源读取
- 文章数据复用现有 [BlogService.findAllPosts](apps/api/src/blog/blog.service.ts#L71)，只取 `published=true`，按 `publishedAt` 倒序，默认 20 条
- 端点路径不进入 `/api/v1` 全局前缀（RSS 阅读器期望站点根路径），需在 [main.ts](apps/api/src/main.ts#L90) 的 `setGlobalPrefix` 配置 `exclude`
- 前端 [index.html](apps/web/index.html) 头部加入 `<link rel="alternate" type="application/rss+xml">`，支持阅读器自动发现
- 前端在 Header/Footer 加入 RSS 图标入口（复用 `lucide-react` 的 `Rss` 图标，不引入新依赖）

## Capabilities

### New Capabilities

- `rss-feed`: 站点向外暴露 RSS 2.0 订阅源，覆盖 feed 的内容契约（必填字段、文章选取范围、排序、XML 转义、Content-Type、缓存语义）与发现契约（HTML `<link rel="alternate">`）

### Modified Capabilities

（无）

## Non-goals

- 不实现 Atom、JSON Feed、WebSub/PubSubHubbub 等其他订阅协议
- 不实现按标签/作者拆分的多 feed（如 `/rss/tag/xxx.xml`），保留为后续 change
- 不全文输出文章正文（只出 `excerpt`，避免 BlockNote/Markdown 渲染分歧）
- 不做 RSS 阅读分析、订阅者计数等运营统计
- 不引入第三方 RSS 库（`feed`、`rss` 等），XML 字符串手动拼接

## Impact

- 新增代码：[apps/api/src/rss/](apps/api/src/rss/)（rss.module.ts / rss.controller.ts / rss.service.ts）
- 修改文件：
  - [apps/api/src/app.module.ts](apps/api/src/app.module.ts) — 注册 `RssModule`
  - [apps/api/src/main.ts](apps/api/src/main.ts) — `setGlobalPrefix` 加 `exclude`
  - [apps/web/index.html](apps/web/index.html) — 加入 `<link rel="alternate">`
  - 前端 Header 或 Footer 组件 — 加入 RSS 图标链接
- 依赖：无新增（前后端均使用现有依赖）
- 现有 API 路径：零影响（新增的 `/rss.xml` 不与任何 `/api/v1/*` 冲突）
- 归档后需同步：[.ai/0-INDEX.md](.ai/0-INDEX.md) 的 Specs 索引、[.ai/1-PROJECT-CONTEXT.md](.ai/1-PROJECT-CONTEXT.md) 的核心功能模块表
