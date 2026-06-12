## Context

后端现有 [BlogService.findAllPosts(page, limit, search, published)](apps/api/src/blog/blog.service.ts) 已支持按 `published=true` 拉取已发布文章并返回带 `slug`、`updatedAt`、`publishedAt` 的结构,文章 `slug` 字段在 Prisma `Post` schema 上 `@unique`(见 [prisma/schema.prisma](apps/api/prisma/schema.prisma) 第 105-138 行)。前端公开路由(见 [App.tsx](apps/web/src/App.tsx) 第 191-201 行)实际只有:`/`、`/posts`、`/posts/:slug`、`/favorites`、`/search`、`/about`、`/apps`、`/apps/:appId`,**没有**独立的 `/tags/:slug` 或 `/categories/:slug` 路由,且 schema 也没有 `Category` 模型。这决定了 sitemap 的 URL 只能取这些真实存在的路径。

[main.ts](apps/api/src/main.ts) 在上一轮 RSS 工作中已经把 `setGlobalPrefix('api/v1', { exclude: [{ path: 'rss.xml', method: RequestMethod.GET }] })` 接好,本次只需在 `exclude` 列表里再加 `sitemap.xml`。

前端 [index.html](apps/web/index.html) `<head>` 当前只有 `<title>`、favicon、RSS 自动发现 link,缺少 OG / Twitter Card / `<meta name="description">` / `<link rel="canonical">`。SPA 架构决定了这些 meta 只能填站点级静态值;facebookexternalhit、Twitterbot、Slackbot、Telegram、微信内置浏览器爬虫等都不跑 JS,因此即使将来引入 react-helmet 也无法解决"分享单篇文章时显示该文章 OG"的问题 —— 那是另一个 change 的范畴。

## Goals / Non-Goals

**Goals:**

- 提供一个稳定的 `GET /sitemap.xml`,输出符合 sitemap protocol 0.9 的 XML,能被 Google Search Console、Bing Webmaster Tools 验证通过
- 输出的每条 `<url>` 必须对应前端真实可访问路由,不出现 404
- sitemap 与 RSS 共享 `VITE_WEB_URL` 站点根口径,保证两处一致
- 让站点 HTML 在被社交平台抓取时呈现站点名、描述、默认封面(站点级,非按文章)
- 不引入任何新的 npm 依赖

**Non-Goals:**

- 不做按文章/标签的动态 OG meta(需要 SSR/预渲染或服务端 UA 嗅探返回最小 HTML,独立提案)
- 不做 IndexNow / GSC / Bing 主动推送
- 不做 sitemap 索引文件、不拆子 sitemap、不接入 `image:` / `video:` / `news:` 扩展命名空间
- 不在 SiteConfig 表中新增 `siteUrl` / `defaultOgImage` 字段(首版用 env + 静态资源,DB schema 改动超出本 change 范围)

## Decisions

### 决策 1:URL 选取范围 —— 仅纳入真实存在的前端路由

- **选择**:首页 `/`、文章列表 `/posts`、所有已发布文章 `/posts/:slug`、`/about`、`/apps`、`/favorites`、`/search`
- **替代方案**:
  - **加入 `/tags/<name>`、`/categories/<name>`** —— 否决,前端无对应路由,会让爬虫拿到 404,反而拉低 SEO 评分
  - **只放首页 + 文章** —— 过窄,About / Apps 是用户实际入口,值得让搜索引擎索引
- **代价**:`/favorites` / `/search` 是无内容的工具页,放进去意义不大;经评估保留(占位极少,且未来这些页面可能演化出可索引内容)

### 决策 2:模块结构 —— 沿用 RSS 风格,新建 `apps/api/src/sitemap/`

- **选择**:`SitemapModule` / `SitemapController` / `SitemapService` 三件套,`SitemapModule` `imports: [BlogModule, ConfigModule]`(不需要 `SiteConfigModule`,sitemap 不读站点元数据)
- **替代**:把 sitemap 做进 `RssModule` —— 否决,职责混淆,后续若要拆分(比如 sitemap 加 IndexNow 推送)也不便

### 决策 3:路由路径 `/sitemap.xml`,从全局前缀中排除

- **选择**:`app.setGlobalPrefix('api/v1', { exclude: [{ path: 'rss.xml', method: RequestMethod.GET }, { path: 'sitemap.xml', method: RequestMethod.GET }] })`
- **替代**:`/api/v1/sitemap.xml` —— 否决,搜索引擎与 `robots.txt` 约定都是站点根路径,生产域名分离时(站点 `131462.wang` / API `api.131462.wang`)可在 `robots.txt` 里写 `Sitemap: https://api.131462.wang/sitemap.xml`,沿用 RSS 决策保持一致

### 决策 4:Content-Type 与字符编码

- **选择**:`@Header('Content-Type', 'application/xml; charset=utf-8')`,返回 `string`
- **理由**:sitemap 协议官方 MIME 是 `application/xml`(不是 `text/xml`);[main.ts](apps/api/src/main.ts) 强制 JSON 的中间件只匹配 `/api/v1` 前缀,`/sitemap.xml` 天然绕过
- **额外**:XML 第一行 `<?xml version="1.0" encoding="UTF-8"?>`,与 HTTP header 一致

### 决策 5:XML 拼接策略 —— 复用 RSS 的转义工具风格

- **选择**:在 `SitemapService` 内部实现 `escapeXml(text)`,与 [RssService](apps/api/src/rss/rss.service.ts) 完全相同的实现(5 实体替换,`&` 第一个);URL 全部走 `escapeXml`
- **不复用 CDATA**:sitemap 字段都是 URL 和日期,不存在富文本,不需要 CDATA
- **替代**:抽取 `escapeXml` 到 `packages/utils` 共享 —— 推迟,首版"两份小函数 < 50 行"优先于"过早抽象";若后续第三处使用再提取

### 决策 6:`<lastmod>` / `<changefreq>` / `<priority>` 取值

| URL                     | `<lastmod>`                                 | `<changefreq>` | `<priority>` |
| ----------------------- | ------------------------------------------- | -------------- | ------------ |
| `/`                     | 当前服务时间(因首页内容随最新文章变化)      | `daily`        | `1.0`        |
| `/posts`                | 最新文章 `updatedAt`                        | `daily`        | `0.9`        |
| `/posts/:slug`          | `post.updatedAt`                            | `weekly`       | `0.8`        |
| `/about`                | 站点上线日(写死或读 `SiteConfig.createdAt`) | `monthly`      | `0.5`        |
| `/apps`、`/apps/:appId` | 首版写死站点上线日                          | `monthly`      | `0.6`        |
| `/favorites`、`/search` | 当前服务时间                                | `monthly`      | `0.3`        |

- **`<lastmod>` 格式**:W3C Datetime,即 ISO 8601 完整格式 `YYYY-MM-DDTHH:mm:ss+00:00`,通过 `Date.toISOString()` 输出
- **`/apps/:appId` 列表来源**:首版从前端 [src/apps/](apps/web/src/apps/) 已知 app 列表硬编码到 `SitemapService` 内一个数组,或暴露一个简单的"应用清单"常量;**避免**为 sitemap 单独建表
  - 折中:首版只输出 `/apps`(列表页),不展开每个 app 的详情 URL;若后续 app 数量稳定再补

### 决策 7:站点 URL 来源

- **选择**:与 [RssService.buildSiteUrl()](apps/api/src/rss/rss.service.ts) 完全一致 —— `ConfigService.get<string>('VITE_WEB_URL')`,回退 `https://131462.wang`,统一去除尾部 `/`
- **不抽公共方法到 BaseService**:首版重复一份 4 行函数,避免跨模块依赖;若第三个模块要用,再抽到 `packages/utils`

### 决策 8:缓存策略

- **选择**:`@Header('Cache-Control', 'public, max-age=3600')`(1 小时)
- **理由**:搜索引擎抓取 sitemap 频次远低于 RSS 阅读器(Google 一般日级到周级),给更长缓存窗口可以挡掉边缘节点重复请求;新文章发布后最长 1 小时进入 sitemap,完全可接受
- **不做**:ETag / Last-Modified 协商缓存(同 RSS 决策,后续优化再加)

### 决策 9:OG / Twitter Card meta 静态化

- **选择**:在 [index.html](apps/web/index.html) `<head>` 注入以下 meta(全部站点级静态值):
  ```html
  <meta
    name="description"
    content="不知名独立开发的个人博客 - Whispers of the Heart"
  />
  <link rel="canonical" href="https://131462.wang/" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Whispers of the Heart" />
  <meta property="og:title" content="Whispers of the Heart" />
  <meta property="og:description" content="不知名独立开发的个人博客" />
  <meta property="og:url" content="https://131462.wang/" />
  <meta property="og:image" content="https://131462.wang/og-cover.png" />
  <meta property="og:locale" content="zh_CN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Whispers of the Heart" />
  <meta name="twitter:description" content="不知名独立开发的个人博客" />
  <meta name="twitter:image" content="https://131462.wang/og-cover.png" />
  ```
- **写死站点 URL** 而非用 Vite env 替换:[index.html](apps/web/index.html) 是 Vite 的 entry HTML,虽然 Vite 支持 `%VITE_WEB_URL%` 替换,但 SPA 部署后这些 meta 不会再被改写,SPA 客户端单页跳转也不影响这些 meta(本来就是给爬虫看的);写死成生产 URL 是对爬虫更稳的选择
- **`og:image` 默认封面**:需要在 [apps/web/public/](apps/web/public/) 放一张 1200x630 的 `og-cover.png`(开放图片协议建议尺寸);**封面文件不在本提案产出范围**,实施时若文件未就绪,先用占位 URL,实际图片由用户提供

### 决策 10:`robots.txt` 处理

- **选择**:本 change **不修改** `robots.txt`(项目当前是否有此文件需在 apply 阶段确认)
- **理由**:即使没有 robots.txt,搜索引擎也会扫到 `/sitemap.xml`(通过提交 GSC 或 `<link>` 发现);robots.txt 的修改可以独立提案
- **后续**:若 [apps/web/public/robots.txt](apps/web/public/robots.txt) 不存在,可在 apply 阶段顺手新建并加 `Sitemap: https://api.131462.wang/sitemap.xml` 一行,但不在 specs 中规定

## Risks / Trade-offs

- **风险:文章 `slug` 字段为空或包含未转义字符** → Prisma schema `slug @unique` 但建表时是否强制非空?查 schema 113 行 `slug String @unique`(非可空),OK;`slug` 内若含空格/特殊字符 → 走 `escapeXml` + `encodeURIComponent` 双重处理(首版只做 `escapeXml`,因为 `slug` 通常已是 URL 安全字符,极端情况靠管理后台校验)

- **风险:文章数量增长到 5 万+** → 单文件 sitemap 协议上限 5 万条;首版加注释说明"超过 5 万再切换到 sitemap_index";现实风险极低

- **风险:Content-Type 被中间件覆盖** → 经 [main.ts](apps/api/src/main.ts) 代码确认,中间件只对 `req.url.startsWith('/api/v1')` 生效,`/sitemap.xml` 不受影响;apply 时仍要 `curl -i` 验证 `Content-Type` 实际下发值

- **风险:OG meta 写死生产 URL,本地开发分享时显示错误** → 可接受,本地开发场景无人分享;若后续要做"按环境切换 og:url",再走单独 change

- **风险:`og-cover.png` 缺失** → 第三方解析(facebookexternalhit、wxbot)会回退展示无图卡片,不影响主要功能;实施前把占位图先放上(用户后续替换)

- **权衡:单端点输出全部文章 vs 分页 sitemap** → 当前文章量(预估 < 200 篇)单端点完全够用;分页是过度设计

## Migration Plan

- 无数据迁移、无破坏性变更
- 部署后:访问 `https://api.131462.wang/sitemap.xml` 应返回 200 + XML;在 Google Search Console 提交此 URL,等待"已成功获取"
- 部署后:用 `curl -A "facebookexternalhit/1.1" https://131462.wang/` 看响应 HTML 中是否含 `og:title` 等 meta(一定会有,因为是 entry HTML 静态返回)
- 回滚:把 `SitemapModule` 从 `AppModule.imports` 移除即可;[index.html](apps/web/index.html) 的 meta 标签即使保留也无副作用

## Open Questions

- 是否在 [apps/web/public/](apps/web/public/) 加 `robots.txt`?**首版结论:不强制**,见决策 10;apply 阶段视项目当前文件状态决定
- `og-cover.png` 由谁产出?**首版结论:实施时先放 1200x630 占位图(可用站点 logo 居中 + 站名 + 副标题),后续由用户替换为终版**
- 是否输出 `/apps/:appId` 详情页 URL?**首版结论:否**(决策 6),只输出 `/apps` 列表页
- 后续提案:动态 OG meta(SSR / 预渲染 / UA 嗅探返回最小 HTML);IndexNow 推送
