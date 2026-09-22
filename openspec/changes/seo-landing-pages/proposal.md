## Why

Our main audience searches Google for "Clockify alternative", but workaddict.me has one URL (`/`), and the head term "clockify alternatives" is held by competitor blogs and directories that a new domain cannot beat soon. Long-tail pages with a clear angle can rank sooner: "open-source Clockify alternative with no server", the German "Clockify Alternative" (less competition), and "import from Clockify" (people ready to switch). Every open-source competitor has to be self-hosted, and the SaaS tools keep the data themselves. Workaddict needs no server and keeps the data in the team's own private GitHub repo. No page on the site says that to a searcher yet.

## What Changes

- Add four static, crawlable pages, built as extra Vite HTML entries so the build-time CSP and the shared design tokens apply:
  - `/clockify-alternative/`: "Free, open-source Clockify alternative, no server needed". Covers why teams switch, an honest feature table (it also shows where Clockify is ahead), how the data lives in the team's own private GitHub repo, and a pointer to the import.
  - `/de/clockify-alternative/`: a native German version (not a word-for-word translation).
  - `/import-from-clockify/`: a step-by-step migration guide that matches the existing import (Settings → Data → Import from Clockify, Clockify API key, region, workspace, user mapping, preview, one commit), with real screenshots.
  - `/de/import-from-clockify/`: the German guide.
- Each page has its own title, meta description, canonical URL, Open Graph and Twitter tags, `hreflang` links to its language pair (`en`, `de`, `x-default` → EN), a plain link to the other language, a header link to the app, and the site footer. No JavaScript runs on these pages. Dark mode follows `prefers-color-scheme`.
- Add `SoftwareApplication` structured data (JSON-LD, free offer) to the start page and the two Clockify alternative pages, as inline `application/ld+json` data blocks. These are data and not executable script, so the CSP stays unchanged.
- List all five URLs in `sitemap.xml`.
- Internal links from the app: the start page footer links to the Clockify alternative page and the import guide. The "Switch from Clockify" highlight links to the import guide. The German versions are used when the UI language is German.
- Content rules: no claim that Clockify is expensive, and no GDPR or EU hosting claims. Comparisons state facts only, with the date they were checked.
- Tests keep the pages consistent: required head tags, hreflang pairs, sitemap coverage, identical header and footer structure, no inline styles or scripts except JSON-LD, and the CSP present in the built HTML.

## Capabilities

### New Capabilities
- `seo-pages`: the static Clockify alternative pages and Clockify import guides in English and German: URLs, content, language pairing, head tags, layout and quality rules, and how they stay consistent without React.

### Modified Capabilities
- `search-visibility`: the sitemap lists every public page. A new structured-data requirement is added. The security-policy requirement now allows JSON-LD data blocks as the only inline script type.
- `landing-page`: the "Switch from Clockify" highlight links to the import guide, and the start page footer links to the Clockify alternative page and the import guide in the current UI language. The no-comparison rule stays limited to the start page intro.

## Impact

- New HTML entries: `clockify-alternative/index.html`, `import-from-clockify/index.html`, `de/clockify-alternative/index.html`, `de/import-from-clockify/index.html`.
- `vite.config.ts`: `build.rollupOptions.input` lists all entries. The CSP plugin already runs on every HTML entry.
- `src/styles/`: design tokens move into a shared file used by the app and by a new, small `pages.css`.
- `index.html`: JSON-LD block.
- `public/sitemap.xml`, and new screenshots under `public/img/` or `assets/` (in both languages).
- `src/features/auth/Landing.tsx`, `src/components/SiteFooter.tsx`, `src/i18n/en.ts` and `de.ts`: new links and labels.
- `src/app/seo.test.ts`, extended or split into a new `seo-pages.test.ts`.
- No new dependencies, no change to routing, the app bundle or the CSP.
