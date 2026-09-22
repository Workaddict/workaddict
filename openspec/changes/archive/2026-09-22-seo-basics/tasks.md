## 1. Static files

- [x] 1.1 Add `public/robots.txt` (allow all, `Sitemap: https://workaddict.me/sitemap.xml`)
- [x] 1.2 Add `public/sitemap.xml` listing `https://workaddict.me/`
- [x] 1.3 Copy `assets/social-preview.png` to `public/og-image.png` (optionally compress it losslessly)

## 2. Document head

- [x] 2.1 Set the `<title>` in `index.html` to "Workaddict – Free, open-source Clockify alternative for small teams"
- [x] 2.2 Rewrite the meta description (≤ 160 characters: free, open source, no server, own GitHub repository, Clockify alternative)
- [x] 2.3 Add `<link rel="canonical" href="https://workaddict.me/">`
- [x] 2.4 Add Open Graph tags (type, site_name, title, description, url, image + width/height/alt, locale + alternate de_DE) and Twitter card tags (`summary_large_image`, title, description, image)

## 3. Crawlable fallback content

- [x] 3.1 Add semantic static markup inside `<div id="root">` in `index.html`: brand header, `<h1>` = `en.landing.headline`, subline, three facts, six highlights (`<h2>` + list), three steps (`<h2>` + ordered list), footer with source code, issues, license and author links; English text copied from `src/i18n/en.ts`; no `style` attributes and no inline scripts
- [x] 3.2 Add `.static-fallback` rules to `src/styles/global.css` (readable width, spacing, list reset, theme tokens); do not hide the content
- [x] 3.3 Confirm React replaces the fallback on mount (no leftover nodes in `#root` after the start page renders, and the existing LoginPage/landing tests still pass)
- [x] 3.4 Add a comment in `index.html` and next to the `landing` strings in `en.ts` saying the static fallback must be kept in sync

## 4. Tests

- [x] 4.1 Add `src/app/seo.test.ts`: reads `index.html` and checks the title contains "Clockify alternative", the canonical URL, `og:image` = `https://workaddict.me/og-image.png`, `twitter:card`, exactly one `<h1>` matching `en.landing.headline`, no `style=` attribute and no inline `<script>` without `src`
- [x] 4.2 In the same test, check that `public/robots.txt` references the sitemap URL, `public/sitemap.xml` lists `https://workaddict.me/`, and `public/og-image.png` exists
- [x] 4.3 Run `npm test`, `npm run lint`, `npm run build`; open `npm run preview`, check there are no CSP violations in the console, and check the page with JavaScript disabled

## 5. README

- [x] 5.1 Point the "Live demo" badge and links to `https://workaddict.me`
- [x] 5.2 In the setup section, note that forks deploying elsewhere should change the canonical/OG URLs in `index.html`, `robots.txt` and `sitemap.xml`

## 6. Launch checklist (manual, after deploy)

- [x] 6.1 GitHub → repo Settings → Pages: enable "Enforce HTTPS" (currently off; `http://workaddict.me/` serves the site without redirecting)
- [x] 6.2 GitHub repo "About": set Website to `https://workaddict.me` and add topics (`clockify-alternative`, `time-tracker`, `time-tracking`, `timesheet`, `open-source`)
- [x] 6.3 Google Search Console: submit `https://workaddict.me/sitemap.xml` and request indexing of `/` again (Domain property already verified; first indexing of the pre-SEO page requested on 2026-09-22)
- [x] 6.4 Check link previews with the LinkedIn Post Inspector or opengraph.xyz, and run the Google Rich Results / URL Inspection test on the live page
