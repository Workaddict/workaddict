## Why

Workaddict holds a GitHub token with push access to a private repository, in a browser, on a static host that cannot set HTTP headers. The basics are in place: a strict CSP in the production build, `no-referrer`, the Clockify key is kept in memory only, and logout clears the cache. A review found gaps that remain:

- Data from the repository is trusted blindly (`JSON.parse(...) as T`). Any collaborator with push access can write a malformed or huge file and break the app for the whole team.
- Private time data stays on disk in IndexedDB after a non-remembered session ends, which matters on shared computers.
- The app can be framed by any site (a meta CSP cannot set `frame-ancestors`), which opens the door to clickjacking.
- The deploy pipeline pulls GitHub Actions by mutable tags, runs dependency install scripts, and has no dependency update or audit gate. A compromised dependency would ship straight to every user's token.
- Users get no warning about broad classic tokens or about a remembered token on a shared device, and there is no documented way to report a vulnerability.

## What Changes

- **Untrusted repository data**: every file read from the data repo is validated against its expected shape. Invalid records are skipped (and kept unchanged on write), invalid colors and logins are replaced or ignored, oversized files are not loaded, and the user sees a notice instead of a crash.
- **Local cache lifetime**: repository content is persisted in IndexedDB only for remembered sessions. Non-remembered sessions cache in memory only, and any leftover persisted cache is wiped when the app starts without a remembered session.
- **Frame protection**: the app refuses to render inside a frame and offers a link to open it in its own tab.
- **CSP tightening**: add Trusted Types (`require-trusted-types-for 'script'`) and drop `'unsafe-inline'` from `style-src` if the app works without it.
- **Token hygiene**: the login page and settings warn when a classic token is used, and show which scopes it grants (GitHub reports them in `X-OAuth-Scopes`). The "Remember me" option states that the token is saved on this device and should only be used on personal devices.
- **Supply chain**: pin GitHub Actions to commit SHAs, check out without persisted credentials, install with `--ignore-scripts` if the build allows it, fail the build on high-severity advisories in production dependencies, and add Dependabot for npm and GitHub Actions.
- **Disclosure**: add `SECURITY.md` (private vulnerability reporting, supported versions, threat model summary) and a short security section in the README.

Out of scope: detecting role bypasses by scanning commit history (roles stay app-enforced as already disclosed; this would be its own change and conflicts with the request budget of `scale-with-history`), encrypting the stored token (no key to protect it with), a token-expiry warning (GitHub does not expose the expiry header to browsers via CORS), and CSV formula injection (covered by `multi-format-export`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-storage`: adds "Untrusted repository data" (validation, pass-through of invalid records on write), "Repository file size limit", "Data problem notice", and "Local cache lifetime" (persistence only for remembered sessions).
- `auth-and-workspace`: "Token setup guidance" gains the classic-token warning; "Session persistence" gains the shared-device notice.
- `app-shell`: "Content Security Policy" gains Trusted Types and a stricter style policy; "GitHub Pages deployment" gains pinned actions and the audit gate; adds "Frame protection", "Dependency updates", and "Security policy".

## Impact

- New `src/storage/validate.ts` (hand-written codecs, no new dependency) used by `src/storage/repoAdapter.ts` for both stores; `src/storage/github/githubStore.ts` adds the size cap and reports invalid JSON as `corruptData`.
- `src/storage/github/blobCache.ts` and `src/features/auth/AuthContext.tsx`: persistent or memory-only cache depending on "Remember me"; wipe on startup without a remembered session.
- `src/main.tsx`: frame check before rendering.
- `vite.config.ts`: CSP changes.
- `src/storage/github/githubAdapter.ts` / `client.ts`: expose token type and scopes from response headers; `src/features/auth/LoginPage.tsx`, `src/features/settings/SettingsPage.tsx`: warnings.
- `.github/workflows/deploy.yml`, new `.github/dependabot.yml`, new `SECURITY.md`, `README.md`.
- `src/i18n/en.ts`, `src/i18n/de.ts`: new strings.
- No change to the data repo layout and no migration. Returning users with a non-remembered session lose their persisted cache once (a slower first load).
