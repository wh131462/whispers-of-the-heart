## ADDED Requirements

### Requirement: RSS feed endpoint

The system SHALL expose `GET /rss.xml` outside the `/api/v1` global prefix. The endpoint MUST respond with HTTP 200 and `Content-Type: application/rss+xml; charset=utf-8` on every successful request. The response body MUST be a well-formed XML 1.0 document whose root element is `<rss version="2.0">` containing exactly one `<channel>` element.

#### Scenario: Default request returns RSS 2.0 channel

- **WHEN** an unauthenticated client sends `GET /rss.xml`
- **THEN** the response status is `200`
- **AND** the response header `Content-Type` equals `application/rss+xml; charset=utf-8`
- **AND** the response body's first non-whitespace bytes are `<?xml version="1.0" encoding="UTF-8"?>`
- **AND** the body contains a single `<rss version="2.0">` root with exactly one `<channel>` child

#### Scenario: Endpoint is not under the API prefix

- **WHEN** the application boots
- **THEN** the route `/rss.xml` is reachable at the server root (e.g., `http://localhost:7777/rss.xml`)
- **AND** the route `/api/v1/rss.xml` returns `404`

#### Scenario: Endpoint does not require authentication

- **WHEN** the request omits all authentication headers
- **THEN** the response status is `200`

### Requirement: Channel metadata

The `<channel>` element MUST contain `<title>`, `<link>`, `<description>`, `<language>`, `<atom:link rel="self">`, and `<lastBuildDate>`. The channel's `<title>` and `<description>` MUST come from `SiteConfigService.findOne()` (`siteName` and `siteDescription`). The `<link>` MUST be the site's public web URL (resolved from environment, defaulting to `https://131462.wang` when missing). The `<atom:link rel="self">` MUST point to the canonical feed URL. The channel MUST declare the namespace `xmlns:atom="http://www.w3.org/2005/Atom"`.

#### Scenario: Channel reflects site config

- **GIVEN** the site config returns `siteName="Whispers of the Heart"` and `siteDescription="不知名独立开发的个人博客"`
- **WHEN** the feed is generated
- **THEN** the channel contains `<title>Whispers of the Heart</title>`
- **AND** the channel contains `<description>` whose text resolves to `不知名独立开发的个人博客`

#### Scenario: Channel declares self link

- **WHEN** the feed is generated
- **THEN** the channel contains exactly one `<atom:link href="..." rel="self" type="application/rss+xml" />` element
- **AND** the `href` attribute matches the absolute URL where the feed is served

#### Scenario: Channel declares language

- **WHEN** the feed is generated
- **THEN** the channel contains `<language>zh-CN</language>`

#### Scenario: Channel records build time

- **WHEN** the feed is generated at instant `T`
- **THEN** the channel contains `<lastBuildDate>` formatted as RFC 822
- **AND** the value reflects `T` within 1 second tolerance

### Requirement: Channel image when site logo is configured

When `SiteConfigService.findOne()` returns a non-empty `siteLogo`, the channel MUST contain an `<image>` element with `<url>`, `<title>`, and `<link>` children that mirror the logo, site title, and site link. When `siteLogo` is empty or null, the `<image>` element MUST be omitted entirely.

#### Scenario: Logo present

- **GIVEN** site config has `siteLogo="https://cdn.example/logo.png"`
- **WHEN** the feed is generated
- **THEN** the channel contains `<image><url>https://cdn.example/logo.png</url>...</image>`

#### Scenario: Logo absent

- **GIVEN** site config has `siteLogo=null`
- **WHEN** the feed is generated
- **THEN** the channel does not contain any `<image>` element

### Requirement: Item selection and ordering

The feed MUST list at most 20 items. Each item MUST correspond to a published post (`published=true`). Items MUST be ordered by `publishedAt` descending. Posts with `published=false` MUST NOT appear in the feed under any circumstance.

#### Scenario: Only published posts appear

- **GIVEN** the database contains 5 posts with `published=true` and 3 posts with `published=false`
- **WHEN** the feed is generated
- **THEN** the channel contains exactly 5 `<item>` elements
- **AND** none of the unpublished posts' titles appear in the body

#### Scenario: Items sorted by publish time descending

- **GIVEN** three published posts with `publishedAt` values `2026-06-10`, `2026-06-12`, `2026-06-11`
- **WHEN** the feed is generated
- **THEN** the first `<item>` corresponds to the `2026-06-12` post
- **AND** the second corresponds to `2026-06-11`
- **AND** the third corresponds to `2026-06-10`

#### Scenario: Item count is capped at 20

- **GIVEN** the database contains 50 published posts
- **WHEN** the feed is generated
- **THEN** the channel contains exactly 20 `<item>` elements

### Requirement: Item fields

Each `<item>` MUST contain `<title>`, `<link>`, `<guid isPermaLink="true">`, `<pubDate>`, and `<description>`. Each item MAY contain zero or more `<category>` elements derived from `post.postTags[].tag.name`. Each item MAY contain a `<dc:creator>` element with `post.author.username` when the `xmlns:dc="http://purl.org/dc/elements/1.1/"` namespace is declared on the `<rss>` root.

- `<title>` MUST equal `post.title` after XML escaping.
- `<link>` and `<guid>` MUST equal `${siteUrl}/blog/${post.id}` (using `post.slug` when the schema later adds it).
- `<pubDate>` MUST be `post.publishedAt` formatted as RFC 822. If `publishedAt` is null, the system MUST fall back to `post.createdAt`.
- `<description>` MUST contain `post.excerpt` wrapped in `<![CDATA[...]]>`. When `excerpt` is empty or null, the system MUST derive a plain-text snippet of at most 200 characters from `post.content`, stripping any BlockNote JSON envelope first.

#### Scenario: Title is XML escaped

- **GIVEN** a post with title `Tom & Jerry <Final>`
- **WHEN** the feed is generated
- **THEN** the corresponding `<item>` contains `<title>Tom &amp; Jerry &lt;Final&gt;</title>`

#### Scenario: Description uses CDATA

- **GIVEN** a post with excerpt `A & B`
- **WHEN** the feed is generated
- **THEN** the item's `<description>` contains the substring `<![CDATA[A & B]]>`
- **AND** the raw `&` character is NOT replaced with `&amp;` inside the CDATA

#### Scenario: Categories from tags

- **GIVEN** a post associated with tags named `Linux` and `性能`
- **WHEN** the feed is generated
- **THEN** the item contains `<category>Linux</category>`
- **AND** the item contains `<category>性能</category>`

#### Scenario: Guid is a permalink

- **WHEN** the feed is generated
- **THEN** every `<item>` contains exactly one `<guid isPermaLink="true">` element
- **AND** the guid text equals the item's `<link>` text

#### Scenario: Missing publishedAt falls back to createdAt

- **GIVEN** a published post whose `publishedAt` is null but `createdAt` is `2026-06-01T00:00:00Z`
- **WHEN** the feed is generated
- **THEN** the item's `<pubDate>` is the RFC 822 representation of `2026-06-01T00:00:00Z`

#### Scenario: Description fallback when excerpt is empty

- **GIVEN** a post with empty `excerpt` and a 1000-character `content`
- **WHEN** the feed is generated
- **THEN** the item's `<description>` contains a CDATA block of at most 200 plain-text characters

### Requirement: XML escaping rules

The system SHALL escape XML reserved characters in any text node that is NOT wrapped in CDATA. The escape sequence MUST be applied exactly once. The `&` character MUST be replaced before any other character to avoid double-escaping.

#### Scenario: All five entities are produced

- **GIVEN** an input string `& < > " '`
- **WHEN** the escape function is applied
- **THEN** the output is `&amp; &lt; &gt; &quot; &apos;`

#### Scenario: Already-escaped input is not double-escaped

- **GIVEN** an input string `Tom &amp; Jerry`
- **WHEN** the escape function is applied
- **THEN** the output is `Tom &amp;amp; Jerry`
- **AND** this is acceptable because the input is treated as literal text, not pre-encoded XML

### Requirement: Caching headers

The response MUST include `Cache-Control: public, max-age=600`. The endpoint MUST NOT set ETag or Last-Modified in the first version.

#### Scenario: Cache-Control header is set

- **WHEN** the endpoint responds
- **THEN** the response header `Cache-Control` equals `public, max-age=600`

### Requirement: Feed auto-discovery from the web app

The web application's [apps/web/index.html](apps/web/index.html) MUST contain exactly one `<link>` element with `rel="alternate"`, `type="application/rss+xml"`, a human-readable `title` matching the site name, and an `href` resolving to the absolute URL of the RSS endpoint.

#### Scenario: HTML head exposes alternate link

- **WHEN** a client fetches the root HTML document
- **THEN** the response body contains exactly one `<link rel="alternate" type="application/rss+xml" ... />` element
- **AND** the `href` attribute is an absolute URL ending in `/rss.xml`

### Requirement: Visible subscription entry in the UI

The web application MUST expose at least one visible, clickable RSS entry point (recommended: in the site Header or Footer) using the `Rss` icon from `lucide-react`. The element MUST be a standard anchor (`<a>`) with `target="_blank"` and `rel="noopener"`, pointing to the absolute RSS endpoint URL.

#### Scenario: RSS icon links to the feed

- **WHEN** the user views any page that hosts the entry component
- **THEN** the page contains an `<a>` element with an `Rss` icon
- **AND** the anchor's `href` is the absolute URL of `/rss.xml`
- **AND** clicking the anchor opens a new tab

#### Scenario: Entry is keyboard accessible

- **WHEN** the user navigates to the entry via keyboard
- **THEN** the anchor receives focus
- **AND** has an accessible name conveying "RSS"
