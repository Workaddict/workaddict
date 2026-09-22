## 1. Build setup and styles

- [x] 1.1 Add a small module (`src/app/seoPages.ts`) that exports the list of static page paths. Use it in `vite.config.ts` for `build.rollupOptions.input` (together with `index.html`) and later in the tests
- [x] 1.2 Move the token blocks (light `:root`, `[data-theme='dark']`, `prefers-color-scheme`) from `src/styles/global.css` to `src/styles/tokens.css`, and `@import` it at the top of `global.css`. Check that the app looks unchanged in light and dark mode
- [x] 1.3 Create `src/styles/pages.css` (imports `tokens.css`): base typography, header (brand, language link, "Open app"), article width, feature table in a horizontal scroll container, step list, figures with captions, footer. It must work at 360 px and in both color schemes
- [x] 1.4 Spike: add one empty entry `clockify-alternative/index.html`, run `npm run build`, and confirm that `dist/clockify-alternative/index.html` has the CSP meta tag, a relative CSS href that resolves, and no JS bundle. Repeat for the `de/…` depth (`../../assets/…`)

## 2. Clockify alternative pages

- [x] 2.1 Check the current facts on Clockify's public pages (free plan limits, mobile and desktop apps, integrations, invoicing and paid-only features), write them down with the date, and pick 8–12 table rows, including rows where Clockify is ahead
- [x] 2.2 Write `clockify-alternative/index.html` (EN): head (title, description ≤160, canonical, hreflang en/de/x-default, OG/Twitter, favicon, `pages.css`, JSON-LD `SoftwareApplication`), header, H1 and lead, "Why teams switch", feature table with an "as of" date, limits, a call to action to the import guide and the demo, footer
- [x] 2.3 Write `de/clockify-alternative/index.html` in native German (working H1: "Kostenlose Clockify-Alternative – Open Source, ohne Server"), same structure, `lang="de"`, relative links `../../`
- [x] 2.4 Check the content rules on both pages: no "expensive" claim, no GDPR or EU claims, only numbers that can be verified

## 3. Import guides

- [x] 3.1 Take 3–4 screenshots per language of the import wizard (key and region, user mapping, preview, done) with demo or test data only, in the light theme at about 1200 px wide. Optimize them and store them under `public/img/import/en/` and `public/img/import/de/`
- [x] 3.2 Write `import-from-clockify/index.html` (EN): prerequisites (team leader, API key from Profile settings → API, admin key for the whole team), numbered steps in the wizard's order, the notes (rate limit and pause, replacement with confirmation, key never saved, Reassign entries), screenshots with alt, width and height, footer. No JSON-LD
- [x] 3.3 Write `de/import-from-clockify/index.html` in German, with UI labels copied exactly from `src/i18n/de.ts`

## 4. Start page and app links

- [x] 4.1 Add a `SoftwareApplication` JSON-LD block to the `<head>` of `index.html` (name, applicationCategory, operatingSystem "Web", url, offer price 0; no ratings)
- [x] 4.2 Add `seoPageUrl(page, lang)` (in `src/app/seoPages.ts`, because `about.ts` uses `__APP_VERSION__`, which Vite config cannot load). It returns relative URLs (`./clockify-alternative/`, `./de/import-from-clockify/`, …)
- [x] 4.3 `SiteFooter`: add the "Clockify alternative" and "Import from Clockify" links (same tab, current UI language), and add the EN/DE strings under `footer.*`
- [x] 4.4 `Landing.tsx`: add a guide link to the Clockify import highlight (same tab, current language), and add the EN/DE strings under `landing.highlights.*`
- [x] 4.5 Add the new links to the static fallback footer in `index.html` (EN URLs)

## 5. Sitemap and tests

- [x] 5.1 Add the four page URLs to `public/sitemap.xml`
- [x] 5.2 Extend `src/app/seo.test.ts` (or add `seo-pages.test.ts`): for each page, check the verbatim `<meta charset="UTF-8" />`, the title, the description (≤160), one `<h1>`, that the canonical equals `og:url`, `og:image`, and `lang`
- [x] 5.3 Tests: hreflang pairs are complete and reciprocal, `x-default` points to EN, and the visible language link points to the counterpart
- [x] 5.4 Tests: the sitemap `<loc>` set equals the canonicals of all pages plus `/`, and the page list module equals the HTML files found
- [x] 5.5 Tests: no `[style]` and no `<style>`, and every inline `<script>` has type `application/ld+json`, parses as JSON and has no `aggregateRating` or `review` (also for `index.html`, which replaces the old "no inline script" check)
- [x] 5.6 Tests: every page's header and footer link targets match the same set (normalized by language); the guides contain the exact i18n labels "Import from Clockify" and "Clockify API key" (and the DE equivalents); every `<img>` has alt, width and height, and its file exists in `public/`
- [x] 5.7 Component tests: the footer and highlight links point to the EN or DE URL depending on the UI language

## 6. Verification

- [x] 6.1 Run `npm test`, `npm run lint` and `npm run build`
- [x] 6.2 In `npm run preview`, open all four pages plus `/`: no CSP violations, no requests to other origins, no horizontal scroll at 360 px, light and dark mode both correct, all relative links work (including the language switch and "Open app")
- [x] 6.3 Validate the JSON-LD with Google's Rich Results Test or the schema.org validator (paste the HTML)
- [x] 6.4 README: in the note for forks, mention the new pages, their absolute URLs, and that screenshots need retaking when the import wizard changes

## 7. Launch checklist (manual, after the deploy; ask before pushing to `main`)

- [x] 7.1 Search Console: resubmit the sitemap and request indexing for the four new URLs
- [x] 7.2 Check the live pages with `curl -I` (200, and the paths without a trailing slash redirect) and a link preview for one page
