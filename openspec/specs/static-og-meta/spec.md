# Static OpenGraph & Twitter Card Meta Specification

## Purpose

Define the static, site-level OpenGraph and Twitter Card metadata contract in the web application's HTML entry document, plus the required `<meta name="description">` and `<link rel="canonical">` tags. These exist so non-JS crawlers (facebookexternalhit, Twitterbot, Slackbot, Telegram, WeChat) can render rich share previews. Per-article dynamic OG metadata is explicitly NOT part of this capability.

## Requirements

### Requirement: HTML description and canonical link

The web application's [apps/web/index.html](apps/web/index.html) MUST contain exactly one `<meta name="description">` element and exactly one `<link rel="canonical">` element inside `<head>`. The description content MUST be a human-readable site-level summary. The canonical href MUST be the absolute production site URL.

#### Scenario: Description meta is present

- **WHEN** a client fetches `index.html`
- **THEN** the response body contains exactly one `<meta name="description" content="..." />` element
- **AND** the content attribute is non-empty

#### Scenario: Canonical link is present

- **WHEN** a client fetches `index.html`
- **THEN** the response body contains exactly one `<link rel="canonical" href="..." />` element
- **AND** the href attribute is an absolute URL using the `https://` scheme

### Requirement: OpenGraph meta tags

The HTML `<head>` MUST contain the following OpenGraph property meta tags, each with a non-empty `content` attribute: `og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale`. The `og:type` MUST be `website`. The `og:url` MUST be the absolute production site URL. The `og:image` MUST be an absolute HTTPS URL pointing to a default cover image.

#### Scenario: All required OG tags exist

- **WHEN** a client fetches `index.html`
- **THEN** the response body contains exactly one `<meta property="og:type" ... />` whose content is `website`
- **AND** the response body contains exactly one of each: `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale`
- **AND** every listed tag has a non-empty `content` attribute

#### Scenario: og:url is absolute

- **WHEN** the OG meta is rendered
- **THEN** the `og:url` content starts with `https://`

#### Scenario: og:image is absolute

- **WHEN** the OG meta is rendered
- **THEN** the `og:image` content starts with `https://`
- **AND** the URL points to a real, fetchable image asset on the site

### Requirement: Twitter Card meta tags

The HTML `<head>` MUST contain the Twitter Card meta tags `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image`. The `twitter:card` MUST be `summary_large_image`.

#### Scenario: Twitter Card tags exist

- **WHEN** a client fetches `index.html`
- **THEN** the response body contains exactly one `<meta name="twitter:card" content="summary_large_image" />` element
- **AND** the response body contains exactly one each of `twitter:title`, `twitter:description`, `twitter:image`
- **AND** every listed tag has a non-empty `content` attribute

### Requirement: Static-only site-level scope

The OG and Twitter Card meta tags described in this capability MUST be static, site-level values written directly in [apps/web/index.html](apps/web/index.html). They MUST NOT be dynamically rewritten per route by client-side JavaScript. Per-article OG metadata is explicitly out of scope and is the responsibility of a future capability.

#### Scenario: Meta tags do not change after navigation

- **GIVEN** a user lands on `/` then navigates to `/posts/hello-world`
- **WHEN** the headless crawler reads the HTML response for either URL
- **THEN** the OG / Twitter Card meta values are identical for both
- **AND** they reflect site-level defaults, not the article's title or description

#### Scenario: Crawler sees meta without executing JS

- **WHEN** a non-JS crawler (e.g., facebookexternalhit, Twitterbot) requests `index.html`
- **THEN** all OG and Twitter Card meta tags are present in the raw HTML response

### Requirement: Default OG cover asset

A default OG cover image MUST be available at the URL referenced by `og:image` and `twitter:image`. The asset SHOULD be 1200x630 pixels (OpenGraph recommended dimensions) and SHOULD be hosted on the same origin as the site. The exact file name and visual design are project-determined.

#### Scenario: og:image is fetchable

- **WHEN** a client fetches the URL given in `og:image`
- **THEN** the response status is `200`
- **AND** the response Content-Type is an image MIME type (e.g., `image/png`, `image/jpeg`)
