## Why

Workaddict now runs on its own domain, `https://workaddict.me`, but search engines barely see it. A search for "workaddict.me time tracking" returns only the GitHub repository, not the site. The served HTML is almost empty: the title is just "Workaddict", the `#root` element has no content until JavaScript runs, and there is no `robots.txt`, `sitemap.xml`, canonical URL, or social preview. Our main audience is teams searching for a "Clockify alternative", and right now the site gives Google nothing to match that search against.

## What Changes

- Add `public/robots.txt` (allow all, point to the sitemap) and `public/sitemap.xml` (one URL: `https://workaddict.me/`).
- Rework the `index.html` head: a descriptive title with the main search terms ("free, open-source Clockify alternative for small teams"), a refined meta description, `<link rel="canonical" href="https://workaddict.me/">`, Open Graph and Twitter card tags, and a social preview image served from the site itself (`public/og-image.png`, copied from `assets/social-preview.png`).
- Put static, crawlable fallback content inside `#root` in `index.html`: the English intro headline, the one-sentence description, the three facts, the six benefit highlights, the three "How it works" steps, and links to the source code. React replaces it on mount, so the visible app does not change. The same text is what visitors without JavaScript see.
- Point the README "Live demo" badge and setup text to `https://workaddict.me` instead of the old `workaddict.github.io/workaddict/` URL.
- Add a "Launch checklist" section to `tasks.md` for manual steps outside the code: enforce HTTPS in the GitHub Pages settings, add the domain as a Google Search Console domain property and submit the sitemap, and set the repository's "Website" field.
- Not in this change (later changes): extra static pages for specific searches (`/clockify-alternative/`, German pages, a Clockify-migration guide) and submissions to directories such as alternativeto.net.

## Capabilities

### New Capabilities
- `search-visibility`: what search engines and link previews see: the document title and meta description, canonical URL, Open Graph/Twitter tags with a same-origin preview image, `robots.txt` and `sitemap.xml`, and the static crawlable fallback content in the served HTML.

### Modified Capabilities
(none: the landing page's visible behavior and the Content Security Policy stay unchanged)

## Impact

- `index.html`: head tags and static fallback markup inside `#root`.
- `public/robots.txt`, `public/sitemap.xml`, `public/og-image.png`: new static files, copied to the site root by Vite.
- `src/styles/global.css`: a few rules so the fallback content is readable before the bundle runs and when JavaScript is disabled.
- `README.md`: live demo badge and URLs.
- Tests: a check that the built `index.html` contains the title, canonical URL, OG tags, and fallback headline, and that `robots.txt`/`sitemap.xml` exist in the build.
- No new dependencies, no change to routing, storage, the app bundle, or the CSP (static HTML and same-origin images are already allowed).
