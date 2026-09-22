## Context

The site is a Vite + React single-page app with hash routing and `base: './'`, deployed by GitHub Actions to GitHub Pages under the custom domain `workaddict.me`. The old URL `workaddict.github.io/workaddict/` redirects there with a 301. Today, `https://workaddict.me/` serves:

- `<title>Workaddict</title>` and a meta description that already mentions "Clockify alternative"
- an empty `<div id="root"></div>`, so all text comes from the JS bundle
- no `robots.txt` or `sitemap.xml` (both 404), no canonical link, no Open Graph/Twitter tags

The build injects a strict CSP meta tag (`vite.config.ts`, `cspPlugin`): `script-src 'self'`, `style-src 'self'`, `img-src 'self' data: blob: https://avatars.githubusercontent.com`, Trusted Types `'none'`. Static HTML markup is not affected by this; inline `<style>`/`<script>` and `style=""` attributes in the HTML would be.

The `landing-page` spec says the visible intro contains no comparison claims against other products. Mentioning Clockify in the document title, meta description and preview tags does not change the visible page, so it stays within that rule. The "Switch from Clockify" highlight is a factual feature and is already visible.

## Goals / Non-Goals

**Goals:**
- Google can index `https://workaddict.me/` as one canonical URL with a title and description that match searches like "clockify alternative", "free open source time tracker", and "time tracking for small teams".
- The first HTML response already contains the main landing text, without depending on Google's delayed JavaScript rendering.
- Links shared on Slack, LinkedIn, X, Reddit, etc. show a proper title, description and image.
- No visible change for users with JavaScript, and no change to the CSP, routing or app bundle.

**Non-Goals:**
- Extra pages aimed at specific searches (`/clockify-alternative/`, `/de/`, migration guide), `hreflang`, or pre-rendering React to HTML (SSR/SSG tooling).
- Structured data (JSON-LD). It would need an inline `<script type="application/ld+json">`. `script-src 'self'` does not block data blocks, but it is left for a later change to keep this one small.
- Analytics or tracking of any kind.
- Directory submissions and outreach.

## Decisions

### 1. Static fallback inside `#root`, replaced by React
`index.html` gets semantic markup inside `<div id="root">`: `<header>` with brand, `<main>` with `<h1>` (the English intro headline "Free and open-source time tracking"), the description paragraph, the three facts, `<h2>` sections for the six highlights and three steps, and a `<footer>` with links to the source code and author. `createRoot(...).render()` replaces the container's children on the first render, so no app code changes. The text copies the English `landing.*` strings, with `en.ts` as the source of truth.

Alternatives considered:
- *Pre-render the React landing at build time* (e.g. a Vite SSG plugin or a `renderToString` build step): would give exact parity, but adds a dependency or build complexity, plus hydration concerns with i18n and theme. Too much for a first step.
- *Rely on Google's JS rendering*: it works eventually, but slower and less reliably, and other crawlers and link-preview bots do not run JS at all.
- *`<noscript>` only*: Google treats `<noscript>` content as a weak signal. A normal DOM fallback is better.

### 2. Fallback styling through the existing stylesheet
The Vite-built CSS is a `<link>` in `<head>`, so it applies before the module script runs. A few rules under a `.static-fallback` class in `src/styles/global.css` keep the fallback readable (max width, spacing, list reset) and reuse the theme tokens. No inline styles, which the CSP would block. The fallback is visible only for the moment before the bundle runs, or permanently without JavaScript, so it only needs to be clean, not pixel-identical.

Alternative: hide the fallback visually (`display:none`, off-screen). Rejected: hidden text is a cloaking signal for Google and helps nobody without JS.

### 3. Head tags
- `<title>`: `Workaddict – Free, open-source Clockify alternative for small teams` (about 65 characters; the brand comes first for recognition).
- `<meta name="description">`: about 155 characters, including "Clockify alternative", "free", "open source", "no server", "your own GitHub repository", "timer, reports, exports, Clockify import".
- `<link rel="canonical" href="https://workaddict.me/">`: an absolute URL, which the relative `base: './'` does not affect.
- Open Graph: `og:type=website`, `og:site_name`, `og:title`, `og:description`, `og:url`, `og:image=https://workaddict.me/og-image.png` plus width/height/alt, `og:locale=en_US` with `og:locale:alternate=de_DE`.
- Twitter: `twitter:card=summary_large_image`, plus title, description and image.
- `lang="en"` stays, because the fallback is English.

Canonical and OG URLs are hardcoded to `https://workaddict.me/`. A fork deploying elsewhere would have to change them. That is acceptable: forks are not our search target, and the README will say so.

### 4. Preview image
Copy `assets/social-preview.png` (1280×640, about 290 KB) to `public/og-image.png`. It is served from the same origin, so it needs no CSP change (it is never loaded by the page itself anyway). 1280×640 (2:1) works for `summary_large_image` and is acceptable for Facebook/LinkedIn (1.91:1). Optionally compress it losslessly.

### 5. robots.txt and sitemap.xml
`public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://workaddict.me/sitemap.xml
```
`public/sitemap.xml`: one `<url>` entry, `https://workaddict.me/`, updated by hand when pages are added. Hash routes (`#/tracker` etc.) are not separate URLs and are not listed.

### 6. Build-output test
A Vitest test (`src/app/seo.test.ts`) reads the source `index.html` and `public/` files. CI runs the tests before the build, and the build copies those files unchanged apart from the CSP meta tag and asset links. It checks the title, canonical, `og:image`, the fallback `<h1>`, and that no `style=` attribute or inline `<script>` without `src` is present. It also checks that `public/robots.txt` and `public/sitemap.xml` exist and reference `https://workaddict.me`. A second test checks that the fallback headline equals `en.landing.headline`, so the texts cannot drift apart silently.

## Risks / Trade-offs

- [Fallback text drifts from the real landing text] → A test compares the headline to `en.landing.headline`; the tasks note that changing `landing.*` strings means updating `index.html`.
- [Short flash of the unstyled or differently styled fallback before React mounts] → Styled by the same stylesheet, which loads first; the bundle is small, and returning users see it for only a few milliseconds.
- [Fallback flashes briefly inside a hostile iframe before `FrameGuard` runs] → It only contains public marketing text and links, no inputs, so there is nothing to click-jack.
- [Mentioning a competitor's name in title/meta] → Factual ("alternative to"), common practice, and not a visible comparison claim, so the `landing-page` spec still holds.
- [HTTP and HTTPS both served until "Enforce HTTPS" is enabled] → The canonical tag points to https; enforcing HTTPS is the first item on the launch checklist.
- [Google takes weeks to index] → Search Console sitemap submission and "Request indexing" are on the launch checklist; results are measured there.

## Migration Plan

Deploy as usual through the `main` push workflow. Rollback means reverting the commit; nothing is stored or migrated. After deploying, work through the manual launch checklist in `tasks.md`.

## Open Questions

None.
