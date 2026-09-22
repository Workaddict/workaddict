## Context

The logged-out route renders `LoginPage` (`src/features/auth/LoginPage.tsx`): a centered 440 px card with brand, subtitle, language switch, theme toggle, the repository/token form, token help (`<details>`), and a "Try the demo" button at the very bottom.

Constraints:
- Production CSP (`vite.config.ts`): `img-src 'self' data: blob: avatars.githubusercontent.com`, `style-src 'self'`, `font-src 'self' data:`, Trusted Types `'none'`. So: no external images, web fonts, embeds, or analytics.
- Hash routing, relative base `./`: static asset URLs must be relative (`./favicon.svg`).
- Bilingual (en/de) via `src/i18n`, dark/light via CSS tokens in `global.css`.
- Existing tests (`tokenWarnings.test.tsx`, `LanguageSwitch.test.tsx`) render `LoginPage` and query its form; they must keep passing.
- Project: `https://github.com/Workaddict/workaddict`. Author: Benedikt Lehner (`https://github.com/BenediktLehner`).

## Goals / Non-Goals

**Goals:**
- A visitor sees immediately that Workaddict is free and open source, and what it is (a simple time tracker whose data stays in the user's own GitHub repository).
- Starting the demo takes one click; returning users sign in as fast as today.
- Visible credit to the author and links to the source code on the start page and in Settings.

**Non-Goals:**
- No marketing-style top section: no product mockup or screenshots, no competitor positioning badge, no star requests or star counts, no second call to action. A first version with these was built and rejected by the project owner as too sales-like; the top of the page leads with "free and open source". The benefit highlights and "How it works" steps from that version were kept, below the fold.
- No routing change, no SEO pre-rendering (only a meta description).
- No change to login behavior, token validation, storage, or the CSP.

## Decisions

### 1. Two columns on wide screens, stacked on phones
`LoginPage` becomes: header row (brand, language switch, theme toggle) → main grid (intro left, sign-in card right, vertically centered) → footer.
- ≥ 900 px: grid `1fr / minmax(360px, 440px)`.
- < 900 px: one column, intro above the card, card full width.

Alternative considered: a separate `/welcome` route. Rejected: an extra click for returning users.

### 2. Intro content: plain facts, no pitch
- Headline: "Free and open-source time tracking" / "Kostenlose Open-Source-Zeiterfassung".
- One sentence: "A simple time tracker for you and your team. No subscription, no ads, no tracking."
- Three facts with a check icon: free, no paid plans or limits · open source, with "Read the code on GitHub" link · entries stay in your own private GitHub repository.
- One primary "Try the demo" button. No second "Sign in" button: the form sits right next to (or directly below) the intro.
- Modest headline size (max ~2.25rem), regular weight hierarchy, no badges or pills.

### 3. Below the fold: highlights and steps
`src/features/auth/Landing.tsx` holds `Highlights` (six cards: icon, title, one sentence — free/no server, your repository + history, team roles + "Team now", synced timer, reports + exports, Clockify import) and `HowItWorks` (three numbered steps; step 2 has "Show me how", which opens the token help `<details>` via controlled `open` state and scrolls it into view, respecting `prefers-reduced-motion`). Grid: 3 columns on desktop, 2 below 900 px, 1 below 560 px; steps stack below 900 px.

### 4. Shared `about.ts` and `SiteFooter`
`src/app/about.ts` exports `REPO_URL`, `REPO_NAME`, `ISSUES_URL`, `SECURITY_URL`, `AUTHOR_NAME`, `AUTHOR_URL`, `APP_VERSION`. `SiteFooter` renders brand + tagline ("Free and open-source time tracking."), links "Source code", "Report an issue", "Security", and "Made by Benedikt Lehner" with the name linked. Names and URLs are constants; only surrounding words are translated. External links use `target="_blank" rel="noreferrer"`.

### 5. Settings "About" section
Last section in `SettingsPage`, same `card settings-list` pattern: Version (`v0.1.0`), Made by (linked name), Source code (`Workaddict/workaddict` with github icon), "Found a bug or have an idea?" (Report an issue), Security (policy link). All roles and demo mode.

### 6. Version at build time
`vite.config.ts` imports `package.json` and sets `define: { __APP_VERSION__: JSON.stringify(pkg.version) }`; `src/env.d.ts` declares it. Only the version string reaches the bundle.

## Risks / Trade-offs

- [Intro pushes the form down on phones] → Intro is short (headline, one sentence, three lines, one button); the demo button is on the first screen, the form one short scroll below; "remember me" means most returning users skip the page.
- ["Open source" claim without a LICENSE file] → The repository currently has no license, so legally the code is only "source available". Recommend adding a license (e.g. MIT) to the repository; tracked outside this change.
- [CSP regressions] → No inline `<style>`, no external resources; verified with a production build (no foreign requests, no console violations).
