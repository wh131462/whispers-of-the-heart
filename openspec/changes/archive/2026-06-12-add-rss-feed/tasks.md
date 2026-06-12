## 1. 后端：RssModule 骨架

- [x] 1.1 创建目录 `apps/api/src/rss/` 并新建 `rss.module.ts`，imports `BlogModule`、`SiteConfigModule`、`ConfigModule`
- [x] 1.2 创建 `apps/api/src/rss/rss.service.ts`，构造函数注入 `BlogService`、`SiteConfigService`、`ConfigService`
- [x] 1.3 创建 `apps/api/src/rss/rss.controller.ts`，提供 `@Get('rss.xml')` 端点，方法上加 `@Header('Content-Type', 'application/rss+xml; charset=utf-8')` 与 `@Header('Cache-Control', 'public, max-age=600')`，返回 `string`
- [x] 1.4 在 `apps/api/src/app.module.ts` imports 中追加 `RssModule`

## 2. 后端：路由前缀排除

- [x] 2.1 在 `apps/api/src/main.ts` 修改 `app.setGlobalPrefix('api/v1', ...)` 为 `app.setGlobalPrefix('api/v1', { exclude: [{ path: 'rss.xml', method: RequestMethod.GET }] })`，并补上 `RequestMethod` 的 import
- [ ] 2.2 启动 `pnpm dev:api`，确认 `curl -i http://localhost:7777/rss.xml` 返回 200；`curl -i http://localhost:7777/api/v1/rss.xml` 返回 404 _(留给用户手动验证 — 按 CLAUDE.md 不重启项目约束)_

## 3. 后端：XML 生成核心逻辑

- [x] 3.1 在 `rss.service.ts` 内实现 `escapeXml(text: string): string`，按 `& → < → > → " → '` 顺序替换为对应实体；为不可控的 null/undefined 输入返回空字符串
- [x] 3.2 实现 `wrapCdata(text: string): string`，将文本包入 `<![CDATA[...]]>`，并把内部的 `]]>` 拆分为 `]]]]><![CDATA[>` 防止提前结束
- [x] 3.3 实现 `toRfc822(date: Date | string | null, fallback: Date): string`，使用 `Date.prototype.toUTCString()` 输出 RFC 822 字符串
- [x] 3.4 实现 `extractExcerpt(post): string`：若 `post.excerpt` 非空直接返回；否则把 `post.content` 通过简易 strip 工具去掉 BlockNote JSON 标记和 Markdown 符号，截断到 200 个字符
- [x] 3.5 实现 `buildSiteUrl(): string`，优先读 `ConfigService.get<string>('VITE_WEB_URL')`，回退到 `https://131462.wang`
- [x] 3.6 实现 `buildFeedUrl(): string`，优先读 `ConfigService.get<string>('VITE_API_URL')`，回退到 `https://api.131462.wang`，最终拼接成 `${apiBase}/rss.xml`

## 4. 后端：feed 输出

- [x] 4.1 实现 `RssService.generateRss(): Promise<string>`：调用 `siteConfigService.findOne()` 与 `blogService.findAllPosts(1, 20, undefined, true)`，对 items 按 `publishedAt ?? createdAt` 倒序排序后取前 20 条
- [x] 4.2 拼接 `<?xml ... ?>` + `<rss version="2.0" xmlns:atom="..." xmlns:dc="...">` 根节点
- [x] 4.3 拼接 `<channel>`：`<title>`、`<link>`、`<description>`、`<language>zh-CN</language>`、`<atom:link rel="self" ...>`、`<lastBuildDate>`；当 `siteLogo` 非空时附加 `<image>`
- [x] 4.4 遍历文章生成 `<item>`：`<title>`（escape）、`<link>`、`<guid isPermaLink="true">`、`<pubDate>`、`<description>`（CDATA + excerpt + "[阅读全文]({{link}})"）、`<dc:creator>`、多个 `<category>`
- [x] 4.5 在 `RssController` 中调用 `rssService.generateRss()` 并返回字符串
- [ ] 4.6 用 `curl http://localhost:7777/rss.xml | xmllint --noout -` 验证 XML 合法；用 `xmllint --xpath "count(//item)"` 验证 item 数量 _(留给用户手动执行)_

## 5. 前端：自动发现与入口

- [x] 5.1 修改 `apps/web/index.html`，在 `<head>` 中加入 `<link rel="alternate" type="application/rss+xml" title="Whispers of the Heart" href="https://api.131462.wang/rss.xml" />`（生产 URL 即可，开发联调时本地阅读器场景可忽略）
- [x] 5.2 定位站点 Header 或 Footer 组件（搜索 `apps/web/src/components/` 与 `apps/web/src/layouts/`），在合适位置加入一个 `<a>` 元素：`href` 取 `import.meta.env.VITE_API_URL?.replace(/\/api\/v1$/, '') + '/rss.xml'`，回退到 `https://api.131462.wang/rss.xml`；内部渲染 `lucide-react` 的 `Rss` 图标，`target="_blank"`、`rel="noopener"`、`aria-label="RSS"`
- [x] 5.3 在视觉上保持与现有图标按钮一致（颜色、尺寸、hover 态）

## 6. 验证

- [x] 6.1 后端：`pnpm --filter api type-check` 与 `pnpm --filter api lint` 通过（新增模块 0 错误；包名实际为 `api` 而非 `@whispers/api`）
- [x] 6.2 前端：`pnpm --filter web type-check` 与 `pnpm --filter web lint` 通过（新增改动 0 错误；包名实际为 `web` 而非 `@whispers/web`）
- [ ] 6.3 用 https://validator.w3.org/feed/ 验证生成的 RSS（开发期可用 ngrok 等工具暴露，或贴 XML 文本到 W3C feed validator 的 "Validate by Direct Input") _(留给用户手动执行)_
- [ ] 6.4 在 Feedly 或 NetNewsWire 中订阅 `http://localhost:7777/rss.xml`，确认能拉取到最新文章列表与摘要 _(留给用户手动执行)_

## 7. 文档同步

- [ ] 7.1 在 `.ai/0-INDEX.md` 的"已沉淀的 Specs 索引"中追加 `rss-feed` 条目（归档时一并完成）
- [x] 7.2 在 `.ai/1-PROJECT-CONTEXT.md` 的"核心功能模块"表中追加 RSS 模块行，文件指向 `apps/api/src/rss/`
- [x] 7.3 在 `.ai/5-MEMORY.md` 追加本次会话日志（决策、文件变更、验证方式）
