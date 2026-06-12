# Sitemap Feed Specification

## Purpose

Define the sitemap.xml capability that exposes a site map of public navigation routes and published blog posts to search engines (Google, Bing, etc.), including the API endpoint contract, URL set composition, lastmod/changefreq/priority rules, XML escaping behavior, caching, and site URL resolution.

## Requirements

### Requirement: Sitemap endpoint

The system SHALL expose `GET /sitemap.xml` outside the `/api/v1` global prefix. The endpoint MUST respond with HTTP 200 and `Content-Type: application/xml; charset=utf-8` on every successful request. The response body MUST be a well-formed XML 1.0 document whose root element is `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`.

#### Scenario: Default request returns urlset

- **WHEN** an unauthenticated client sends `GET /sitemap.xml`
- **THEN** the response status is `200`
- **AND** the response header `Content-Type` equals `application/xml; charset=utf-8`
- **AND** the response body's first non-whitespace bytes are `<?xml version="1.0" encoding="UTF-8"?>`
- **AND** the body contains a single `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` root

#### Scenario: Endpoint is not under the API prefix

- **WHEN** the application boots
- **THEN** the route `/sitemap.xml` is reachable at the server root (e.g., `http://localhost:7777/sitemap.xml`)
- **AND** the route `/api/v1/sitemap.xml` returns `404`

#### Scenario: Endpoint does not require authentication

- **WHEN** the request omits all authentication headers
- **THEN** the response status is `200`

### Requirement: Static URL set

The `<urlset>` MUST contain `<url>` entries for every public navigation route currently mounted by the web application. The list MUST include at minimum: site root `/`, post list `/posts`, `/about`, `/apps`, `/favorites`, and `/search`. Each `<url>` MUST contain `<loc>`, `<lastmod>`, `<changefreq>`, and `<priority>`.

#### Scenario: Site root entry

- **WHEN** the sitemap is generated
- **THEN** there is exactly one `<url>` whose `<loc>` resolves to the site root URL (no trailing slash variation)
- **AND** that `<url>` has `<changefreq>daily</changefreq>` and `<priority>1.0</priority>`

#### Scenario: Post list entry

- **WHEN** the sitemap is generated
- **THEN** there is exactly one `<url>` whose `<loc>` ends with `/posts`
- **AND** that `<url>` has `<changefreq>daily</changefreq>` and `<priority>0.9</priority>`

#### Scenario: Static navigation entries are included

- **WHEN** the sitemap is generated
- **THEN** the body contains `<url>` entries whose `<loc>` ends with `/about`, `/apps`, `/favorites`, and `/search` respectively
- **AND** none of those entries have `<priority>` greater than `0.6`

### Requirement: Post URL entries

The sitemap MUST contain one `<url>` entry per published post (`published=true`). The entry's `<loc>` MUST be `${siteUrl}/posts/${post.slug}` using the post's `slug` field (which is `@unique` in the Prisma schema). The entry's `<lastmod>` MUST be the post's `updatedAt` formatted as W3C Datetime / ISO 8601. Posts with `published=false` MUST NOT appear.

#### Scenario: Only published posts appear

- **GIVEN** the database contains 5 posts with `published=true` and 3 posts with `published=false`
- **WHEN** the sitemap is generated
- **THEN** the body contains exactly 5 post `<url>` entries
- **AND** none of the unpublished posts' slugs appear in any `<loc>`

#### Scenario: Post loc uses slug

- **GIVEN** a published post with `slug="hello-world"` and the resolved site URL `https://131462.wang`
- **WHEN** the sitemap is generated
- **THEN** the body contains `<loc>https://131462.wang/posts/hello-world</loc>`

#### Scenario: Post lastmod is ISO 8601

- **GIVEN** a published post with `updatedAt=2026-06-01T03:14:00.000Z`
- **WHEN** the sitemap is generated
- **THEN** that post's `<lastmod>` text equals `2026-06-01T03:14:00.000Z`

#### Scenario: Post entry priority and changefreq

- **WHEN** any post `<url>` entry is generated
- **THEN** the entry has `<changefreq>weekly</changefreq>`
- **AND** the entry has `<priority>0.8</priority>`

### Requirement: XML escaping rules

The system SHALL escape XML reserved characters in any text node. The escape sequence MUST be applied exactly once. The `&` character MUST be replaced before any other character to avoid double-escaping.

#### Scenario: All five entities are produced

- **GIVEN** an input string `& < > " '`
- **WHEN** the escape function is applied
- **THEN** the output is `&amp; &lt; &gt; &quot; &apos;`

#### Scenario: URL with special characters is escaped

- **GIVEN** a slug containing `&` such as `tom-&-jerry`
- **WHEN** the sitemap is generated
- **THEN** the corresponding `<loc>` text contains `&amp;` rather than a literal `&`

### Requirement: Caching headers

The response MUST include `Cache-Control: public, max-age=3600`. The endpoint MUST NOT set ETag or Last-Modified in the first version.

#### Scenario: Cache-Control header is set

- **WHEN** the endpoint responds
- **THEN** the response header `Cache-Control` equals `public, max-age=3600`

### Requirement: Site URL resolution

The base site URL used in every `<loc>` MUST come from the environment variable `VITE_WEB_URL` accessed via `ConfigService`. When the variable is missing or empty, the system MUST fall back to `https://131462.wang`. The resolved value MUST have any trailing slash removed before concatenation.

#### Scenario: VITE_WEB_URL is honored

- **GIVEN** `VITE_WEB_URL=https://example.com/` is set in the process environment
- **WHEN** the sitemap is generated
- **THEN** every `<loc>` starts with `https://example.com` (no trailing slash before the path)

#### Scenario: Fallback when env is missing

- **GIVEN** `VITE_WEB_URL` is unset
- **WHEN** the sitemap is generated
- **THEN** every `<loc>` starts with `https://131462.wang`
