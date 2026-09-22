## ADDED Requirements

### Requirement: Descriptive document head
The served `index.html` SHALL contain a `<title>` that names Workaddict and describes it as a free, open-source Clockify alternative for small teams, a meta description of at most 160 characters that mentions it is free, open source, needs no server, and keeps data in the user's own GitHub repository, and a canonical link to `https://workaddict.me/`.

#### Scenario: Title and description in served HTML
- **WHEN** a crawler requests `https://workaddict.me/` without running JavaScript
- **THEN** the response contains a `<title>` including "Workaddict" and "Clockify alternative", and a meta description including "open source" and "GitHub repository"

#### Scenario: Canonical URL
- **WHEN** the page is requested over `http://workaddict.me/` or `https://workaddict.me/`
- **THEN** the HTML declares `<link rel="canonical" href="https://workaddict.me/">`

### Requirement: Link previews
The served `index.html` SHALL contain Open Graph tags (`og:type`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image` with width, height and alt text) and Twitter card tags (`twitter:card` set to `summary_large_image`, title, description, image). The preview image SHALL be served from the site's own origin at `https://workaddict.me/og-image.png`.

#### Scenario: Shared link shows a preview
- **WHEN** someone pastes `https://workaddict.me/` into a chat or social network that reads Open Graph tags
- **THEN** the preview shows the Workaddict title, description and the social preview image

#### Scenario: Image available
- **WHEN** `https://workaddict.me/og-image.png` is requested
- **THEN** the server responds with a PNG image

### Requirement: Crawl directives
The site SHALL serve a `robots.txt` at its root that allows all crawlers and references the sitemap, and a `sitemap.xml` at its root that lists `https://workaddict.me/`.

#### Scenario: robots.txt
- **WHEN** `https://workaddict.me/robots.txt` is requested
- **THEN** the response allows all user agents and contains `Sitemap: https://workaddict.me/sitemap.xml`

#### Scenario: sitemap.xml
- **WHEN** `https://workaddict.me/sitemap.xml` is requested
- **THEN** the response is a valid XML sitemap listing `https://workaddict.me/`

### Requirement: Crawlable static content
The served `index.html` SHALL contain, inside the app's root element, static English content matching the start page: the intro headline as the only `<h1>`, the one-sentence description, the three facts, the six benefit highlights, the three "How it works" steps, and links to the source code on GitHub and to the author. The app SHALL replace this content when it starts, so users with JavaScript see the normal start page. The static content SHALL be readable without JavaScript and SHALL NOT be hidden by CSS.

#### Scenario: Content without JavaScript
- **WHEN** the page is loaded with JavaScript disabled
- **THEN** the headline "Free and open-source time tracking", the highlights including "Switch from Clockify", the setup steps, and a link to the source code are visible

#### Scenario: App replaces fallback
- **WHEN** the page is loaded with JavaScript enabled
- **THEN** the start page renders as before, and no static fallback content remains in the DOM

#### Scenario: Headline stays in sync
- **WHEN** the English `landing.headline` text differs from the static `<h1>` in `index.html`
- **THEN** the test suite fails

### Requirement: Search setup keeps the security policy
The head tags, static content and new files SHALL NOT require any change to the Content Security Policy: no inline `<script>` code, no inline `<style>` element or `style` attribute, and no resources from other origins loaded by the page.

#### Scenario: No CSP violations
- **WHEN** the production build is opened in a browser and the start page renders
- **THEN** the console shows no CSP or Trusted Types violations and the page makes no requests to other origins
