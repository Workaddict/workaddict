# Continuation: SEO & growth for "Clockify alternative" searches

Paste this file (or reference it with `@continuations/2026-09-22-seo-growth.md`) into a new session to pick up the work, usually by starting a new OpenSpec proposal.

## Goal

Get **Workaddict** (live at **https://workaddict.me**) found by people who search Google for **"clockify alternative(s)"**. They are the main target group. Two parallel tracks:

- **A. Get listed on pages that already rank** (directories and listicles). This is fast (weeks) and also feeds AI answers such as ChatGPT and Google AI Overviews.
- **B. Own long-tail pages on workaddict.me.** This is slow (months), but the effect adds up over time.

The user writes in English or German (lately mostly German) and wants short, clear answers. Ask when something is unclear, and ask before any push to `main`, because a push deploys straight to production.

## Already done (2026-09-22), do not redo

- **Change `seo-basics`** was implemented, deployed (`59d1d0a`) and archived (`08179ed`, `openspec/changes/archive/2026-09-22-seo-basics/`). The main spec is `openspec/specs/search-visibility/spec.md`. It added:
  - an `index.html` title ("Workaddict – Free, open-source Clockify alternative for small teams"), a meta description, the canonical link `https://workaddict.me/`, and Open Graph and Twitter tags
  - `public/robots.txt`, `public/sitemap.xml` (one URL: `/`), and `public/og-image.png` (1280×640)
  - a **static English copy of the start page inside `#root`** that React replaces on mount; the styles are `.static-fallback` in `src/styles/global.css`
  - `src/app/seo.test.ts`, which checks the head tags, that the fallback `<h1>` equals `en.landing.headline`, that there are no inline styles or scripts, and the crawl files
  - README links pointing to workaddict.me, plus a note for forks
- **GitHub:** Pages has "Enforce HTTPS" turned on, so http and the old `workaddict.github.io/workaddict/` both redirect with a 301 to `https://workaddict.me/`. The repo Website field is `https://workaddict.me`, and the repo has the topics `clockify-alternative, time-tracker, time-tracking, timesheet, open-source, timer, team, github-pages`.
- **Google Search Console:** `workaddict.me` is a verified **Domain property**. The sitemap is submitted and reads correctly, and indexing of `/` was requested after the deploy. First data should appear under "Leistung" (Performance) about 1–2 weeks after 2026-09-22.

## Research findings (SERP, 2026-09)

- **"clockify alternatives"** (the head term) is taken by competitor blog posts (myhours.com, toggl.com, jibble.io, timesheet.io, timecamp.com) and by directories (alternativeto.net, european-alternatives.eu). A new domain will not reach page 1 for it in the short term.
- **"open source free clockify alternative"**: alternativeto (`?license=opensource`), openalternative.co, kimai.org/…/clockify, pickyourtech.com, saasworthy.com, timetracker.drytrix.com.
- **Positioning gap:** every open-source competitor (Kimai, solidtime, Cattr, TimeTracker) has to be **self-hosted**, and the SaaS tools keep the data themselves. Workaddict needs **no server, and the data stays in the user's own private GitHub repo**. Working claim: *"The open-source Clockify alternative you don't have to host."*
- **Don't** claim GDPR or EU hosting. The data lives on GitHub, a US company, so european-alternatives.eu will probably not list us.

## Constraints (from the code and specs)

- The app is a Vite + React SPA with **hash routing** and `base: './'`, deployed by GitHub Actions to Pages on every push to `main` (tests must pass). New URL paths such as `/clockify-alternative/` therefore have to be **separate static HTML files**, for example Vite multi-page `build.rollupOptions.input` or plain files in `public/<path>/index.html`. React routes don't produce crawlable URLs.
- **CSP** (`vite.config.ts`, `cspPlugin`, injected only in the build): `script-src 'self'`, `style-src 'self'` (no inline `<style>` and no `style=""` in HTML), `img-src 'self' data: blob: https://avatars.githubusercontent.com`, Trusted Types `'none'`. No analytics, no external fonts or images. JSON-LD would need an inline `<script type="application/ld+json">`. That is a data block, not script execution, but check it against the policy before relying on it.
- The `landing-page` spec says the **visible intro contains no comparison claims against other products**. Clockify may appear in the title, meta tags and on dedicated pages. The "Switch from Clockify" highlight is a factual feature. A dedicated comparison page would need an explicit decision about that rule (or a spec change).
- Every new page must be bilingual (EN/DE), work in light and dark mode and at 360 px, and add no new dependencies unless clearly justified.
- Every new URL must be added to `public/sitemap.xml`.
- The static fallback in `index.html` has to stay in sync with `landing.*` in `src/i18n/en.ts`.

## Next steps (pick one and start with `/opsx:explore` or `/opsx:propose`)

1. ~~**Long-tail landing pages**~~ — **done (2026-09-22/23).** The change `seo-landing-pages` was implemented and archived (`20c48fe`, `openspec/changes/archive/2026-09-22-seo-landing-pages/`). Live: `/clockify-alternative/`, `/de/clockify-alternative/`, `/import-from-clockify/`, `/de/import-from-clockify/`, all four in `public/sitemap.xml`, with `pages.css`, `tokens.css`, `src/app/seoPages.ts`, JSON-LD and the tests in `src/app/seoPages.test.ts`. Still open as an option: `/vs/kimai/`, `/vs/solidtime/` (honest comparisons; the `landing-page` no-comparison rule above still applies and would need an explicit decision).
2. **Directory listings (manual; the user submits):** **texts drafted 2026-09-23 in `marketing/directory-listings.md`** — reusable blocks (tagline, 3 description lengths, features, honest limitations, links, tags) plus per-site drafts for alternativeto.net, openalternative.co, pickyourtech.com and saasworthy.com, and a "Facts and rules" section. **Screenshots are done** (2026-09-23): five shots from the demo in `marketing/screenshots/` (running timer + "Team now", statistics, export menu, "Everyone" entry list, dark mode), listed in a table in `marketing/directory-listings.md`. They are deliberately **not** in `public/`, so they are not published with the site. Nothing is blocked any more — the submissions themselves are manual.
3. **Launch posts for backlinks:** **drafted 2026-09-23 in `marketing/launch-posts.md`** — a Show HN title, URL and first comment plus prepared answers for the likely questions; a dev.to article outline (the git-as-database design, with GitHub's org token approval trap as the section that earns the post); Reddit guidance per subreddit with an r/opensource draft and a comment template. Suggested order: dev.to post first, then Show HN linking it, then Reddit.
4. **Measure:** Search Console → Leistung (Performance) after 1–2 weeks, to see which queries already bring impressions, and plan content from there. First data due around **2026-10-06** (the four new URLs were submitted for indexing after their deploy, task 7.1 of `seo-landing-pages`).

## Useful files

```
marketing/directory-listings.md    EN listing copy + facts and rules (2026-09-23)
marketing/launch-posts.md          Show HN, dev.to outline, Reddit (2026-09-23)
marketing/screenshots/             5 demo screenshots for submissions (not published)
clockify-alternative/, de/, import-from-clockify/   the four static SEO pages
src/app/seoPages.ts, seoPages.test.ts              page list + SEO page tests
src/styles/pages.css, tokens.css   styles for the static pages
index.html                         head tags + static fallback (#root)
public/robots.txt, sitemap.xml     crawl files (add new URLs here)
public/og-image.png                social preview (source: assets/social-preview.png/.svg)
src/app/seo.test.ts                SEO checks
src/features/auth/LoginPage.tsx    start page (landing), Landing.tsx (highlights, steps)
src/components/SiteFooter.tsx      footer, links from src/app/about.ts
src/i18n/en.ts, de.ts              landing.*, footer.* strings
src/styles/global.css              tokens, .landing*, .static-fallback
vite.config.ts                     CSP plugin, base './', __APP_VERSION__
openspec/specs/landing-page/spec.md, search-visibility/spec.md, app-shell/spec.md
```

## Suggested opening prompt for the next session

> Read `@continuations/2026-09-22-seo-growth.md`. The landing pages are live, and the listing texts, launch posts and screenshots are ready in `marketing/`. Go through `marketing/directory-listings.md` with me site by site: re-verify the Clockify facts first, then help me fill in each submission form.
