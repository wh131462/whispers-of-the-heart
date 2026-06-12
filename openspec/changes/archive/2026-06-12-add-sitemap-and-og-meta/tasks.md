## 1. 后端:SitemapModule 骨架

- [x] 1.1 创建目录 `apps/api/src/sitemap/` 并新建 `sitemap.module.ts`,imports `BlogModule`、`ConfigModule`
- [x] 1.2 创建 `apps/api/src/sitemap/sitemap.service.ts`,构造函数注入 `BlogService`、`ConfigService`
- [x] 1.3 创建 `apps/api/src/sitemap/sitemap.controller.ts`,提供 `@Get('sitemap.xml')` 端点,方法上加 `@Header('Content-Type', 'application/xml; charset=utf-8')` 与 `@Header('Cache-Control', 'public, max-age=3600')`,返回 `string`
- [x] 1.4 在 `apps/api/src/app.module.ts` imports 中追加 `SitemapModule`

## 2. 后端:路由前缀排除

- [x] 2.1 在 `apps/api/src/main.ts` 把 `setGlobalPrefix` 的 `exclude` 列表补一项 `{ path: 'sitemap.xml', method: RequestMethod.GET }`(`RequestMethod` 已在上轮 RSS 工作中导入,沿用即可)
- [x] 2.2 启动后(用户已运行的 dev 进程)`curl -i http://localhost:7777/sitemap.xml` 应返回 200;`curl -i http://localhost:7777/api/v1/sitemap.xml` 应返回 404 _(用户已手动验证)_

## 3. 后端:XML 生成核心逻辑

- [x] 3.1 在 `sitemap.service.ts` 内实现 `escapeXml(text: unknown): string`,与 `RssService` 同语义(`& → < → > → " → '`,null/undefined 返回空串)
- [x] 3.2 实现 `toW3cDatetime(date: Date | string | null, fallback: Date): string`,通过 `Date.prototype.toISOString()` 输出 ISO 8601 字符串
- [x] 3.3 实现 `buildSiteUrl(): string`,从 `ConfigService.get<string>('VITE_WEB_URL')` 读,回退 `https://131462.wang`,去除尾部 `/`(与 RSS 实现一致,可考虑直接复制 4 行)
- [x] 3.4 在服务内定义静态导航路径常量数组,形如 `[{ path: '/', changefreq: 'daily', priority: '1.0' }, { path: '/posts', changefreq: 'daily', priority: '0.9' }, { path: '/about', changefreq: 'monthly', priority: '0.5' }, { path: '/apps', changefreq: 'monthly', priority: '0.6' }, { path: '/favorites', changefreq: 'monthly', priority: '0.3' }, { path: '/search', changefreq: 'monthly', priority: '0.3' }]`
- [x] 3.5 实现 `buildUrlEntry(loc, lastmod, changefreq, priority): string`,拼接单个 `<url>` 元素,所有文本节点过 `escapeXml`

## 4. 后端:sitemap 输出

- [x] 4.1 实现 `SitemapService.generateSitemap(): Promise<string>`:调用 `blogService.findAllPosts(1, 5000, undefined, true)` 获取已发布文章
- [x] 4.2 拼接静态导航条目;`/` 与 `/posts` 的 `<lastmod>` 取已发布文章中最新 `updatedAt`(如无文章则取当前时间);其它静态条目 `<lastmod>` 直接取当前时间
- [x] 4.3 遍历文章条目:`<loc>${siteUrl}/posts/${post.slug}</loc>`(`slug` 走 `escapeXml`)、`<lastmod>${post.updatedAt → ISO}</lastmod>`、`<changefreq>weekly</changefreq>`、`<priority>0.8</priority>`
- [x] 4.4 拼接 XML 头与 `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` 根节点
- [x] 4.5 在 `SitemapController` 中调用 `sitemapService.generateSitemap()` 并返回字符串
- [x] 4.6 用 `curl http://localhost:7777/sitemap.xml | xmllint --noout -` 验证 XML 合法;用 `xmllint --xpath "count(//*[local-name()='url'])"` 验证 url 数量等于 `静态条目数 + 已发布文章数` _(用户已手动验证)_

## 5. 前端:OG / Twitter Card meta

- [x] 5.1 修改 `apps/web/index.html`,在 `<head>` 中(RSS link 之后)加入 `<meta name="description">` 与 `<link rel="canonical">`
- [x] 5.2 在 `<head>` 加入 OpenGraph meta:`og:type=website`、`og:site_name`、`og:title`、`og:description`、`og:url`、`og:image`(初版用 `https://131462.wang/logo.png` 复用现有资产)、`og:locale=zh_CN`
- [x] 5.3 在 `<head>` 加入 Twitter Card meta:`twitter:card=summary_large_image`、`twitter:title`、`twitter:description`、`twitter:image`(同 og:image URL)
- [x] 5.4 文案与 RSS 实现保持一致:`siteName="Whispers of the Heart"`、`description="不知名独立开发的个人博客"`

## 6. 前端:默认封面占位

- [x] 6.1 复用现有 `apps/web/public/logo.png` 作为初版 og:image / twitter:image(spec 用 SHOULD 限定 1200x630,非 MUST);后续若需要专门的 OG 封面再单独提供
- [x] 6.2 用 `curl -I http://localhost:8888/logo.png` 确认返回 200 + `image/png` _(用户已手动验证)_

## 7. 验证

- [x] 7.1 后端:`pnpm --filter api type-check` 与 `pnpm --filter api lint` 通过(新增模块 0 错误;type-check 报错均在已有 `app.controller.spec.ts`,与本次无关)
- [x] 7.2 前端:`pnpm --filter web type-check` 与 `pnpm --filter web lint` 通过(改动 0 错误;lint 报错均在已有 admin 页面与 `blogApi.ts`,与本次无关)
- [x] 7.3 在 https://www.xml-sitemaps.com/validate-xml-sitemap.html 验证生成的 sitemap _(用户已手动验证)_
- [x] 7.4 在 https://developers.facebook.com/tools/debug/ 输入站点 URL,验证 OG 数据被正确解析 _(用户已手动验证)_
- [x] 7.5 在 https://cards-dev.twitter.com/validator 验证 Twitter Card _(用户已手动验证)_

## 8. 文档同步

- [x] 8.1 在 `.ai/0-INDEX.md` 的"已沉淀的 Specs 索引"中追加 `sitemap-feed` 与 `static-og-meta` 条目(归档时一并完成)
- [x] 8.2 在 `.ai/1-PROJECT-CONTEXT.md` 的"核心功能模块"表中追加 Sitemap 模块行,文件指向 `apps/api/src/sitemap/`
- [x] 8.3 在 `.ai/5-MEMORY.md` 追加本次会话日志(决策、文件变更、验证方式)
