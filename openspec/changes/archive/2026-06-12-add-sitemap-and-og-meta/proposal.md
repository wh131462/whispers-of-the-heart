## Why

博客系统目前对搜索引擎和社交平台的可发现性接近为零：

1. 没有 `sitemap.xml`，搜索引擎只能通过站点首页爬到主导航页面，文章/标签/分类的索引依赖偶发性爬取，新发布文章往往要等数周才能收录
2. 前端是纯 SPA，[index.html](apps/web/index.html) 只有 `<title>` 和 favicon，没有 OpenGraph / Twitter Card 元信息，用户分享站点到微信/Twitter/Telegram/Slack 时显示为裸 URL，无标题、无描述、无封面
3. 上一轮已经补齐了 [RSS](openspec/changes/add-rss-feed/) 这种"订阅型读者"的发现路径，但"搜索型读者"和"社交分享型读者"还没有覆盖

这两件事是博客 SEO 的最小公倍数，缺失会让站点在搜索结果和社交分享场景里持续吃亏。

## What Changes

- 新增后端能力：暴露 `GET /sitemap.xml`,返回 sitemap protocol 0.9 XML,包含首页 `/`、文章列表 `/posts`、所有已发布文章 `/posts/:slug`,以及收藏/搜索/关于/应用中心等公开导航页
- 站点根路径与文章 URL 复用 RSS 模块的 `buildSiteUrl()` 思路(从 `VITE_WEB_URL` 读取),保证 RSS / sitemap 两处口径一致
- 文章数据通过 `BlogService.findAllPosts(1, 5000, undefined, true)` 一次性拉取(`published=true`),sitemap 单文件 5 万条上限,目前远不会触达;sitemap URL 必须用 `post.slug`(Prisma `Post` schema 上 `slug` 为 `@unique`,前端路由是 `/posts/:slug`),不用 id
- 端点路径与 RSS 一致走站点根（搜索引擎期望 `/sitemap.xml`），在 [main.ts](apps/api/src/main.ts) 的 `setGlobalPrefix` `exclude` 列表追加 sitemap 路径
- 前端 [index.html](apps/web/index.html) `<head>` 中加入站点级 OpenGraph / Twitter Card meta（站点名、描述、默认封面、`og:type=website`），覆盖未跑 JS 的爬虫场景（facebookexternalhit、Twitterbot、Slackbot、Telegram 等）
- 前端 [index.html](apps/web/index.html) 加入 `<link rel="canonical">` 和基础 SEO meta（`description`、`keywords` 暂留空或读静态值,`robots`）

## Capabilities

### New Capabilities

- `sitemap-feed`: 站点向搜索引擎暴露 sitemap.xml 订阅源,覆盖 URL 选取(首页 + 公开导航页 + 已发布文章)、`<lastmod>` / `<changefreq>` / `<priority>` 取值规则、XML 转义、Content-Type 与缓存语义、与全局前缀的关系
- `static-og-meta`: 站点 HTML 入口的静态 OpenGraph / Twitter Card 元信息契约（哪些 meta 必填、值的来源、不动态更新的边界）

### Modified Capabilities

（无 —— RSS 与新增能力共享 `setGlobalPrefix` 的 exclude 列表,但 RSS 的 spec 自身的 Requirements 不变）

## Non-goals

- 不实现按文章的动态 OG meta(SPA 限制下需要 SSR/预渲染或服务端代理 HTML,留作后续 change)
- 不输出 sitemap 中的标签/分类聚合页 URL —— 项目目前没有 `Category` 模型,前端也没有 `/tags/:slug` 等独立路由;待相关页面落地后再独立提案
- 不实现 sitemap 索引文件(`sitemap_index.xml`)和按类型拆分的子 sitemap,单文件够用
- 不实现 `news:`、`image:`、`video:` 等 sitemap 扩展命名空间
- 不实现 IndexNow / Google Search Console API 主动推送
- 不引入 react-helmet / @vueuse/head 等动态 head 管理库（需要时再单独提案）
- 不引入第三方 sitemap 生成库（`sitemap` npm 包等）,XML 手动拼接,沿用 RSS 模块风格

## Impact

- 新增代码：[apps/api/src/sitemap/](apps/api/src/sitemap/)（sitemap.module.ts / sitemap.controller.ts / sitemap.service.ts）
- 修改文件：
  - [apps/api/src/app.module.ts](apps/api/src/app.module.ts) — 注册 `SitemapModule`
  - [apps/api/src/main.ts](apps/api/src/main.ts) — `setGlobalPrefix` 的 `exclude` 列表追加 `sitemap.xml`
  - [apps/web/index.html](apps/web/index.html) — 注入 OG / Twitter Card meta、`description`、`canonical`
- 依赖：无新增（前后端均使用现有依赖）
- 现有 API 路径：零影响（新增的 `/sitemap.xml` 不与任何 `/api/v1/*` 冲突）
- 静态资源：需要在 [apps/web/public/](apps/web/public/) 放一张默认 OG 封面图（如 `og-cover.png`,1200x630）
- 归档后需同步：[.ai/0-INDEX.md](.ai/0-INDEX.md) 的 Specs 索引、[.ai/1-PROJECT-CONTEXT.md](.ai/1-PROJECT-CONTEXT.md) 的核心功能模块表
