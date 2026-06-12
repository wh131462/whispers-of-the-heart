## Context

后端现有 [BlogService.findAllPosts(page, limit, search, published)](apps/api/src/blog/blog.service.ts#L71) 已支持按 `published=true` 拉取最新文章并返回带 `author`、`postTags`、`excerpt`、`publishedAt` 的结构；[SiteConfigService.findOne()](apps/api/src/site-config/site-config.service.ts) 已暴露 `siteName`、`siteDescription`、`siteLogo`、`ownerName` 等站点元数据。两者都已在各自模块 `exports` 中（见 [blog.module.ts](apps/api/src/blog/blog.module.ts)、[site-config.module.ts](apps/api/src/site-config/site-config.module.ts)），新 RssModule 直接 `imports` 即可消费。

[main.ts](apps/api/src/main.ts) 当前在 `setGlobalPrefix('api/v1')` 之外，还有一段中间件强制 `req.url.startsWith('/api/v1')` 时把 `Content-Type` 设为 `application/json; charset=utf-8`。这意味着新增的 `/rss.xml` 只要不落在 `/api/v1` 下，就不会被强制改写为 JSON header。

前端 [index.html](apps/web/index.html) 与 Header / Footer 组件需要加入入口，路径需要指向后端域名（生产为 `https://api.131462.wang/rss.xml`），不能用前端 origin。

## Goals / Non-Goals

**Goals:**

- 提供一个稳定的 `GET /rss.xml`，输出符合 RSS 2.0 规范、能被主流阅读器（Feedly、Reeder、Inoreader、NetNewsWire）正确解析的 feed
- 站点元信息、文章元信息全部来自数据库现有数据，不引入并行的"feed 专用配置"
- 前端通过 `<link rel="alternate">` 让阅读器自动发现订阅源
- 不引入任何新的 npm 依赖

**Non-Goals:**

- 不实现 Atom / JSON Feed / WebSub
- 不做按标签/作者/分类的多 feed 拆分
- 不输出文章全文（避免 BlockNote JSON ↔ HTML 渲染分歧）
- 不做 ETag / Last-Modified 协商缓存（首版只做最朴素的 `Cache-Control: public, max-age=600`）

## Decisions

### 决策 1：feed 格式选 RSS 2.0，而非 Atom 或 JSON Feed

- **选择**：RSS 2.0
- **理由**：主流阅读器对 RSS 2.0 兼容性最广；Atom 更严谨但收益在博客场景不显著；JSON Feed 阅读器支持率低
- **代价**：RSS 2.0 字符集 / `<content:encoded>` 等扩展点需要手动声明命名空间（如 `xmlns:content`、`xmlns:atom`），首版用 `<description>` + `<atom:link rel="self">` 即可，不引入 `content:encoded`

### 决策 2：路由路径 `/rss.xml`，从全局前缀中排除

- **选择**：`app.setGlobalPrefix('api/v1', { exclude: [{ path: 'rss.xml', method: RequestMethod.GET }] })`
- **替代方案**：
  - **路径放在 `/api/v1/rss.xml`** — 工程上最省事，但 RSS 阅读器和浏览器 `<link rel="alternate">` 约定是站点根路径或常见路径（`/rss.xml`、`/feed.xml`、`/atom.xml`），生产域名分离时（站点 `131462.wang` / API `api.131462.wang`）依然走 `https://api.131462.wang/rss.xml`，可读性比 `/api/v1/rss.xml` 强
  - **前端代理一层** — 增加 nginx / web 应用复杂度，无收益
- **代价**：`exclude` 必须用对象形态（带 `method`），字符串形态在某些 NestJS 版本上对静态路径匹配不稳，需要显式指定方法

### 决策 3：Content-Type 与字符编码

- **选择**：Controller 方法上使用 `@Header('Content-Type', 'application/rss+xml; charset=utf-8')`，返回 `string`
- **理由**：[main.ts](apps/api/src/main.ts) 那段强制 JSON 的中间件只匹配 `/api/v1` 前缀，`/rss.xml` 天然绕过；不需要改中间件逻辑
- **额外**：XML 文档第一行必须是 `<?xml version="1.0" encoding="UTF-8"?>`，编码声明与 HTTP header 保持一致

### 决策 4：XML 拼接策略——手写模板 + CDATA + 转义工具

- **选择**：在 `RssService` 内置 `escapeXml(text)` 与 `wrapCdata(text)`；标题、作者名、tag 名用 `escapeXml`；`<description>`（包含摘要）用 `<![CDATA[...]]>` 包裹
- **理由**：
  - 项目规则禁止引入新依赖（`feed` / `rss` 都不算极小）
  - feed 的结构非常稳定，模板字符串拼接 50 行内可完成
  - CDATA 包裹摘要可避免摘要中 `<`、`&` 等字符导致 XML 解析失败
- **转义规则**：`& → &amp;`（必须最先替换） / `< → &lt;` / `> → &gt;` / `" → &quot;` / `' → &apos;`
- **替代方案**：引入 `xmlbuilder2` 等库 — 否决，违反"不引入新依赖"

### 决策 5：文章选取范围

- **选择**：`BlogService.findAllPosts(1, 20, undefined, true)`，按 `publishedAt desc`（service 内部当前按 `createdAt desc`，需要让 service 对 `published=true` 场景按 `publishedAt desc` 排，或在 RSS service 里读到列表后再排序一次）
- **细节**：RSS service 拿到列表后再做一次 `sort((a, b) => +new Date(b.publishedAt!) - +new Date(a.publishedAt!))`，避免改动 BlogService 的现有行为，符合"不改业务逻辑"约束
- **替代**：扩展 `findAllPosts` 支持 `orderBy` 参数 — 范围超出本 change，推迟

### 决策 6：每篇 item 的字段映射

| RSS 字段                    | 来源                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `<title>`                   | `post.title`                                                                                                      |
| `<link>`                    | `${VITE_WEB_URL}/blog/${post.slug ?? post.id}`                                                                    |
| `<guid isPermaLink="true">` | 同 `<link>`                                                                                                       |
| `<pubDate>`                 | `post.publishedAt` → RFC 822                                                                                      |
| `<description>`             | `post.excerpt`（CDATA 包裹）；若 excerpt 为空，截取 `post.content` 前 200 字符并 strip 掉 BlockNote/Markdown 标记 |
| `<author>`                  | 留空或仅 `<dc:creator>`（RSS `<author>` 要 email，多数博客没暴露）                                                |
| `<category>`                | 遍历 `post.postTags[].tag.name` 输出多个                                                                          |

- **决定不输出 `<author>`**，避免暴露邮箱；如需作者名，引入 `xmlns:dc` 并用 `<dc:creator>post.author.username</dc:creator>`

### 决策 7：站点 URL 来源

- **选择**：从环境变量 `VITE_WEB_URL` 读（后端可直接 `process.env.VITE_WEB_URL`，或更规范地用 `ConfigService.get('VITE_WEB_URL')`）
- **理由**：[configs/env.development](configs/env.development) 和 [configs/env.production](configs/env.production) 已经定义 `VITE_WEB_URL`；SiteConfig 表里没有 `siteUrl` 字段，新增字段是 DB schema 改动，超出本 change 范围
- **后备**：若 env 缺失，回退到 `https://131462.wang`（与 [main.ts](apps/api/src/main.ts) 现有 CORS 兜底一致）

### 决策 8：缓存策略

- **选择**：响应头加 `Cache-Control: public, max-age=600`（10 分钟）
- **理由**：阅读器一般 15-60 分钟轮询一次，10 分钟缓存能挡掉大部分重复请求，且不会让新文章可见性延迟超过 1 个轮询周期
- **不做**：ETag / Last-Modified 协商缓存——首版不必，后续优化时再加

### 决策 9：前端入口位置

- **选择**：在 [index.html](apps/web/index.html) `<head>` 加 `<link rel="alternate">`，且在 Header 或 Footer 加可点击的 `Rss` 图标
- **图标点击行为**：直接 `<a href="https://api.131462.wang/rss.xml" target="_blank" rel="noopener">`，让阅读器接管（用户已装阅读器时浏览器会触发协议跳转）
- **环境感知**：图标 href 用前端 env 变量 `VITE_API_URL` 拼接 `${VITE_API_URL.replace('/api/v1', '')}/rss.xml`，避免硬编码

## Risks / Trade-offs

- **风险：XML 转义不全导致 feed 在阅读器里报解析错误** → 缓解：`escapeXml` 必须 `&` 第一个替换（否则会重复转义）；摘要全部走 CDATA；提交前用 `curl http://localhost:7777/rss.xml | xmllint --noout -` 在本地校验

- **风险：`exclude` 规则在某些 NestJS 版本上字符串形态匹配不稳** → 缓解：用对象形态 `{ path: 'rss.xml', method: RequestMethod.GET }`，并写一条 e2e 兼容性注释

- **风险：摘要可能包含 BlockNote 内部 JSON 残留（如 `[BlockNote JSON]` 占位）** → 缓解：service 内做 `stripBlockNoteJson(text)`，若 excerpt 以 `[` 或 `{` 开头则尝试 `JSON.parse` 失败后回退到截断 `content`

- **风险：文章数据库无 `slug` 字段** → 缓解：先用 `id` 拼链接，后续若新增 `slug` 再升级；不在本 change 加 schema

- **权衡：不做 ETag → 每次都生成 XML** → 文章量 20 条的字符串拼接成本可忽略；10 分钟 Cache-Control 兜底；后续访问量大再加 ETag

- **权衡：不输出全文** → 部分订阅者偏好全文 → 在 `<description>` 末尾追加"[阅读全文]({{link}})"引导回站

## Migration Plan

- 无数据迁移、无破坏性变更
- 部署后：访问 `https://api.131462.wang/rss.xml` 应返回 200 + XML；用 Feedly 的 "Add Content → URL" 输入站点首页或 feed URL 应能识别
- 回滚：仅需把 RssModule 从 `AppModule` imports 中移除即可；`main.ts` 的 `exclude` 配置即使保留也无副作用

## Open Questions

- 是否需要在 SiteConfig 中新增 `siteUrl`、`feedTitle`、`feedDescription` 等"feed 专用"字段，让站长在管理后台自定义？**首版结论：否**，先用 env + siteName/siteDescription，待真实诉求出现再加
- 是否需要单独输出 `/feed.xml`、`/atom.xml` 作为别名？**首版结论：否**，主流阅读器都能从 `<link rel="alternate">` 发现
