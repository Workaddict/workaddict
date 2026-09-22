## Context

workaddict.me is a Vite + React SPA with hash routing and `base: './'`. It is deployed to GitHub Pages on every push to `main`. The `seo-basics` change added head tags, crawl files and a static fallback to `index.html`. The site still has a single URL.

Constraints that shape this design:

- **CSP** is injected at build time by `cspPlugin` (`vite.config.ts`) through `transformIndexHtml`. It replaces the exact string `<meta charset="UTF-8" />`. The hook runs for every HTML entry Vite processes, but not for files copied from `public/`.
- The policy is `script-src 'self'` and `style-src 'self'`, with Trusted Types `'none'`. No inline `<style>`, no `style=""`, no inline executable script.
- Design tokens (`:root`, `[data-theme='dark']`, `prefers-color-scheme` block) live at the top of `src/styles/global.css`. The rest of that file is app CSS (about 1,600 lines).
- Hash routes produce no crawlable URLs, so each new URL has to be a real `…/index.html`.
- The `landing-page` spec forbids comparison claims only in the start page intro.

## Goals / Non-Goals

**Goals:**
- Four crawlable pages (EN/DE × Clockify alternative / import guide) that load fast without JavaScript and look like the app in light and dark mode and at 360 px.
- The same CSP on these pages as on the app, without hand-writing it.
- One source of truth for colors and base typography.
- Tests catch drift: missing head tags, broken hreflang pairs, pages missing from the sitemap, inline styles.
- Internal links from the app to the pages.

**Non-Goals:**
- `/vs/kimai/`, `/vs/solidtime/` and other comparison pages (later change).
- A page generator or templating step.
- A theme toggle or language detection on the static pages.
- Opening the app in the page's language. The app keeps its own language detection and stored choice.
- Directory submissions, launch posts and analytics.

## Decisions

### 1. Vite multi-page entries with hand-written HTML

Pages live at `clockify-alternative/index.html`, `import-from-clockify/index.html`, `de/clockify-alternative/index.html` and `de/import-from-clockify/index.html` in the repo root. `vite.config.ts` lists them in `build.rollupOptions.input` next to `index.html`.

- *Why:* Vite runs `transformIndexHtml` on each entry, so the CSP arrives for free. It also processes `<link rel="stylesheet" href="/src/styles/pages.css">` into a hashed, relative asset.
- *Alternative, `public/<path>/index.html`:* rejected. No CSP injection (it would be a hand-copied duplicate that drifts), and no processed CSS, so the tokens would have to be copied too.
- *Alternative, a build-time generator from content files:* rejected for now. Four pages don't justify the machinery. Tests enforce consistency instead. Revisit when `/vs/*` pages bring the count above about 8.
- The `dev` server serves these pages at the same paths, so preview works with `npm run dev`.

### 2. Shared tokens, a small page stylesheet, and no JavaScript

- Move the token blocks (light, `[data-theme='dark']`, `prefers-color-scheme`) from `global.css` into `src/styles/tokens.css`. `global.css` imports it first, so app rendering stays unchanged.
- The new `src/styles/pages.css` imports `tokens.css` and adds only what the pages need: base typography, a header with brand, a language link and an "Open app" button, the article layout (max width about 760 px), a feature table that scrolls horizontally inside its own container at 360 px, step lists, figures with captions, and the footer.
- Pages run no scripts. Without a `data-theme` attribute, the `prefers-color-scheme` block decides light or dark. There is no toggle (the stored app theme is not read).
- *Alternative, reusing `global.css`:* rejected. It would ship about 40 KB of app CSS to a text page.

### 3. Page anatomy (identical on all four)

```
<head>  charset (exact string for the CSP plugin) · viewport · referrer no-referrer
        title · description (≤160) · canonical (self, trailing slash)
        hreflang en / de / x-default (→ EN) · og:* · twitter:* · og:locale
        favicon · pages.css · [JSON-LD only on the Clockify alternative pages]
<body>
  header   brand → app ("../" or "../../") · language link to pair · "Open app"
  main     h1 · lead · sections …
  footer   links to the other SEO page (same language), app, source code, issues,
           security, author credit, license
```

- Links between pages and to the app are **relative** (`../`, `../../import-from-clockify/`), so forks on `*.github.io/<repo>/` keep working. Canonical, `og:url`, hreflang and sitemap URLs are **absolute** `https://workaddict.me/…`, as in `index.html`.
- `<html lang="en">` / `<html lang="de">` per page.
- The OG image is the shared `https://workaddict.me/og-image.png` (no new image per page).

### 4. Content

`/clockify-alternative/` (EN) and `/de/clockify-alternative/` (DE, written natively):
1. H1 plus a lead: free, open source, no server, data in your private GitHub repo.
2. "Why teams switch": owning the data (plain files, full git history, export any time), open source (AGPL-3.0), nothing to host (unlike self-hosted open-source tools), and no vendor account beyond GitHub.
3. A feature table: Workaddict vs Clockify Free. It includes rows where Clockify is ahead (for example, native mobile and desktop apps, integrations and invoicing on paid plans), checked against Clockify's public pages and labeled "as of <month year>".
4. Limits, stated honestly: needs a GitHub account and token, it's a small project, it's built for small teams.
5. "Switch in minutes" → the import guide, plus "Try the demo" → the app.

`/import-from-clockify/` and the DE version follow the real wizard (`ImportWizard.tsx` steps: key → workspace → meta → map → fetch → preview → write):
1. Prerequisites: a Workaddict workspace where you are a **team leader**, and a Clockify API key (Profile settings → API → Generate; a workspace admin's key for a full-team import).
2. Steps: Settings → Data → Import from Clockify → paste key, choose region → choose workspace → map Clockify users to members or former members → load entries (the Free plan allows 30 requests/hour; the import pauses and resumes) → preview → import as one commit.
3. Notes: an import replaces existing entries, projects and tags after confirmation. The key is never saved and is sent only to Clockify. Mapping can be fixed later (Settings → Data → Reassign entries).
4. Screenshots: 3–4 real screenshots per language, taken with demo or test data only (no real names), light theme, about 1200 px wide, optimized PNG or WebP, stored under `public/img/import/<lang>/`, with `width`/`height` and meaningful `alt` text.

The UI labels quoted in the guides must match `src/i18n/en.ts` / `de.ts` word for word. A test checks the key labels ("Import from Clockify", "Clockify API key").

Content rules: no "Clockify is expensive", no GDPR or EU hosting claims, no invented numbers.

### 5. Structured data

The start page and both Clockify alternative pages include:

```html
<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication",
 "name":"Workaddict","applicationCategory":"BusinessApplication","operatingSystem":"Web",
 "offers":{"@type":"Offer","price":"0","priceCurrency":"EUR"},"url":"https://workaddict.me/", …}</script>
```

- Browsers never run non-JavaScript script types, and CSP `script-src` does not apply to data blocks. Trusted Types covers DOM sinks, not parser-inserted markup. So the policy stays unchanged.
- The test for "no inline script" changes to "no inline script except `type="application/ld+json"`, which has to parse as JSON".
- The import guides get no JSON-LD. A `HowTo` block no longer earns rich results in Google, so it isn't worth maintaining.

### 6. Links from the app

- `SiteFooter` gets two links: "Clockify alternative" and "Import from Clockify". `Landing.tsx`'s import highlight gets a "Read the guide" link.
- The target depends on the UI language: `./clockify-alternative/` or `./de/clockify-alternative/`, via a small helper in `src/app/seoPages.ts` (`seoPageUrl(page, lang)`; not `about.ts`, which uses `__APP_VERSION__` and cannot be loaded by the Vite config). They are same-origin links opening in the same tab. They are not external links, so no `target="_blank"`.
- `SiteFooter` also appears in Settings → About. The links are harmless there, and the footer stays one component.

### 7. Tests

Extend `src/app/seo.test.ts` (or add `src/app/seo-pages.test.ts`), reading pages with `?raw` imports:
- Each page has `<meta charset="UTF-8" />` verbatim (the CSP plugin's hook point), a title, a description ≤160, a self-canonical, og:url equal to the canonical, and one `<h1>`.
- Hreflang: each page links to itself and its pair, plus `x-default` → EN. The pair links back.
- Sitemap `<loc>` set == canonical URLs of `index.html` + all pages. `rollupOptions.input` covers every page (export the page list from one module used by both the config and the test).
- No `[style]`, no `<style>`, no inline `<script>` except valid JSON-LD.
- Header and footer contain the same set of link targets on every page (normalized per language).
- The guides contain the exact i18n labels from point 4.
- Every `<img>` has `alt`, `width` and `height`, and its file exists under `public/`.

## Risks / Trade-offs

- [Relative asset URLs from nested entries under `base: './'`] → Vite computes relative paths per HTML file. Verify in `dist/de/clockify-alternative/index.html` during implementation (the CSS href must resolve to `../../assets/…`).
- [Header and footer are copied four times] → tests compare link sets. A generator becomes worth it only with more pages.
- [Feature table facts go stale or are wrong about Clockify] → only verifiable facts, a visible "as of" date, and rows where Clockify wins. Recheck when the pages are edited.
- [Duplicate-content signals between EN and DE] → hreflang pairs and native German text, not machine translation.
- [Screenshots drift from the UI] → quoted labels are tested. Screenshots are retaken when the import wizard changes (note in tasks and README).
- [Thin pages don't rank] → each page gets real substance (about 600–1,000 words), and Search Console queries guide later edits.
- [Moving tokens changes app CSS order] → `tokens.css` is imported at the very top of `global.css`, the same position as before. A visual check covers light and dark.

## Migration Plan

Additive. Deploy with the normal push to `main` (ask first). After the deploy: request indexing of the four URLs in Search Console and resubmit the sitemap. Rollback is a revert commit. Nothing else depends on these pages.

## Open Questions

- The exact Clockify feature facts for the table have to be checked on clockify.me at implementation time.
- Final wording of the German H1: "Kostenlose Clockify-Alternative – Open Source, ohne Server" is the working title.
