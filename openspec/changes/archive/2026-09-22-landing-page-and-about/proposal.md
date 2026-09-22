## Why

Workaddict is now live on GitHub Pages, but the start page is only a bare sign-in card: a first-time visitor sees two form fields asking for a GitHub token and a repository, with no word about what the app is. The two things that matter most about the project, that it is free and open source, are not visible at all, and the app gives no credit to its author and no way back to the source code.

## What Changes

- Add a short intro next to the sign-in form on the start page (above it on phones): headline "Free and open-source time tracking", one sentence, three short facts (free with no paid plans; open source with a link to the code; entries stay in your own private GitHub repository), and one "Try the demo" button. Deliberately plain: no mockups, no competitor badge, no star requests.
- Below the intro and form: six short benefit highlights and a three-step "How it works" section whose token step opens the existing token help.
- Keep the existing sign-in form (repository, token, remember-me, token help, classic-token warning, session/offline banners, demo button) unchanged in behavior.
- Add a footer to the start page with links to the source code, issues, and the security policy, and a "Made by Benedikt Lehner" credit linking to the author's GitHub profile.
- Add an "About" section to the Settings page with the app version, the author credit, and links to the source code, issues, and the security policy.
- All new text in English and German; layout works from 360 px to desktop in light and dark themes; no external images, fonts, or scripts (the existing Content Security Policy stays unchanged).

## Capabilities

### New Capabilities
- `landing-page`: the logged-out start page: short free/open-source intro with the demo button, placement of the sign-in form, benefit highlights, "How it works" steps, and the start-page footer with project and author links.

### Modified Capabilities
- `app-shell`: the "Settings page" requirement gains an "About" section (version, author, source code, issues, security policy).

## Impact

- `src/features/auth/LoginPage.tsx`: intro added next to the form; form logic untouched.
- `src/features/auth/Landing.tsx`: highlights and how-it-works sections.
- `src/components/SiteFooter.tsx`: new footer component.
- `src/app/about.ts`: shared project/author links and app version.
- `src/features/settings/SettingsPage.tsx`: new "About" section.
- `src/i18n/en.ts`, `src/i18n/de.ts`: new `landing.*`, `footer.*`, `settings.about*` strings.
- `src/styles/global.css`: start page, facts list, and footer styles.
- `src/components/Icon.tsx`: `bolt`, `lock`, `import`, `bug`, `shield` icons.
- `vite.config.ts`, `src/env.d.ts`: app version from `package.json` at build time (`define`).
- `index.html`: meta description.
- Tests: start page render test, Settings "About" test.
- No new dependencies, no storage or API changes, no CSP change.
