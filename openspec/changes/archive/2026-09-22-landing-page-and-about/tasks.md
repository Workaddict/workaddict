## 1. Shared about data

- [x] 1.1 Add `define: { __APP_VERSION__: JSON.stringify(<package.json version>) }` to `vite.config.ts` (read `package.json` at config time) and declare `__APP_VERSION__: string` in a new `src/env.d.ts`
- [x] 1.2 Create `src/app/about.ts` exporting `REPO_URL`, `REPO_NAME`, `ISSUES_URL`, `SECURITY_URL`, `AUTHOR_NAME = 'Benedikt Lehner'`, `AUTHOR_URL = 'https://github.com/BenediktLehner'`, `APP_VERSION`
- [x] 1.3 Add `bolt`, `lock`, `import`, `bug` and `shield` icon paths to `src/components/Icon.tsx` in the existing stroke style

## 2. Footer

- [x] 2.1 Create `src/components/SiteFooter.tsx`: brand + tagline, links "Source code" (github icon), "Report an issue", "Security", and "Made by {{name}}" with the name linking to `AUTHOR_URL`; external links `target="_blank" rel="noreferrer"`
- [x] 2.2 Footer styles in `global.css` (muted, wraps on phones, dark/light via tokens)

## 3. Start page

- [x] 3.1 Restructure `LoginPage.tsx`: header row (brand, language switch, theme toggle), intro (headline "Free and open-source time tracking", one sentence, three facts with check icons incl. "Read the code on GitHub" link, one "Try the demo" button), sign-in card (form logic and markup unchanged), `SiteFooter`
- [x] 3.2 CSS: two-column grid ≥ 900 px (vertically centered), single column below with intro above card; no horizontal scroll at 360 px; modest headline size
- [x] 3.3 Add `<meta name="description">` to `index.html`
- [x] 3.4 Below intro and form: `Highlights` (6 cards) and `HowItWorks` (3 steps, step 2 "Show me how" opens and scrolls to the token help) in `src/features/auth/Landing.tsx`, with responsive grid CSS

## 4. Settings

- [x] 4.1 Add "About" section as last section in `SettingsPage.tsx`: version, made by (name links to `AUTHOR_URL`), source code link (`Workaddict/workaddict` with github icon), report issue link, security policy link; visible for all roles and demo mode

## 5. Translations

- [x] 5.1 Add `landing.*`, `footer.*`, and `settings.about*` strings to `src/i18n/en.ts`
- [x] 5.2 Add German translations to `src/i18n/de.ts` (type check enforces same keys)

## 6. Tests and verification

- [x] 6.1 Start page render test: headline, free fact, open-source link, "Try the demo" starts demo, 6 highlights and 3 steps, "Show me how" opens token help, footer shows "Made by Benedikt Lehner" linking to the profile and source/issues/security links with `rel="noreferrer"`
- [x] 6.2 Settings test: "About" section shows version, author and links, for a worker in demo mode
- [x] 6.3 Existing `tokenWarnings.test.tsx` and `LanguageSwitch.test.tsx` still pass; `npm test`, `npm run lint`, `npm run build` green
- [x] 6.4 Check the production build (`npm run build && npm run preview`) on desktop in light/dark and en/de: no CSP violations or requests to other origins on the start page
- [x] 6.5 Check the phone layout at 360–375 px (browser DevTools device mode or a real phone): intro, demo button and form usable, no horizontal scroll (reviewed by the project owner on the dev server)
- [x] 6.6 README: "login page" → "start page" for the demo hint
