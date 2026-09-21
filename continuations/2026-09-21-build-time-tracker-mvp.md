# Continuation: build-time-tracker-mvp (cold restart)

Paste this file (or reference it with `@continuations/2026-09-21-build-time-tracker-mvp.md`) into a new session to resume work.

## Goal

Build **Workaddict**: a private, free, easy Clockify alternative. It is a static React app hosted on GitHub Pages, and all data lives as JSON files in a **private GitHub "data repo"** accessed through the GitHub REST API. The original brief is in `spec.md`. The full plan is the OpenSpec change `openspec/changes/build-time-tracker-mvp/` (`proposal.md`, `design.md`, `specs/*/spec.md`, `tasks.md`). **Read those files first.** They are the source of truth.

The user writes in English or German and wants questions asked when something is unclear. The user chose the GitHub-repo backend and may switch to Supabase later, which is why storage sits behind an adapter interface.

## Decisions already made (do not re-ask)

- **Backend:** a GitHub private data repo. **Login:** the user pastes a Personal Access Token (fine-grained recommended; classic `repo` token as a fallback). A Cloudflare Worker OAuth flow may come later.
- **Visibility:** all members see all entries. The UI only allows editing or deleting your *own* entries. This is not a security boundary.
- **Work groups:** each entry has one project (optional) and many tags. Any member can manage them.
- **Exports:** PDF, Excel (.xlsx) and a JSON backup. There is no CSV.
- **UI:** English and German, switchable. Hours only (no billing). The live timer is synced across devices. Stack: React + Vite + TypeScript.
- **Known limitation:** fine-grained PATs only work for repos owned by the user or by an org they belong to. The recommendation is a free GitHub org for the data repo. **Still open:** does the user have or want an org? This hasn't been answered yet.

## Current state

Tasks: **52 of 56 checked** in `openspec/changes/build-time-tracker-mvp/tasks.md`.

Unchecked:
- **7.8 Optimistic updates with rollback, keeping form input on save errors.** This is *implemented* (`src/features/data/hooks.ts` does onMutate snapshots and restores them on error, and the forms clear only in `onSuccess`) but hasn't been verified in the browser yet. Check it, then mark it done.
- **10.1** A GitHub Actions workflow that runs npm ci → test → build → upload-pages-artifact → deploy-pages on push to `main`.
- **10.2** README covering: what the app is, data-repo setup (org recommended), creating both token types, Pages setup, and security notes (no real access control; the token is stored in the browser).
- **10.3** A manual end-to-end check against a real test data repo. **This needs the user**: they have to supply a repo and a token. Never type tokens yourself.

Verification status:
- `npx tsc --noEmit` passes.
- `npx vitest run` passes 92 tests: domain, a storage contract suite run against both the memory store and a fake GitHub API, and stats.
- `npx eslint .` reports 0 errors and 7 react-refresh warnings, which are harmless.
- `npm run build` succeeds, and the CSP meta tag is injected only in the build.
- **Browser smoke test (dev server, Chrome), partly done:**
  - Login page OK: German auto-detected, dark theme.
  - "Demo" login OK: the tracker shows 42 demo entries in 14 day groups, with no app console errors. The console exceptions come from a browser extension.
  - The user interrupted the test here.
- **Not yet tested in the browser:**
  - timer start, stop and discard
  - manual entry and overnight entries
  - editing an entry, including moving it to another month
  - the Projects & Tags page
  - the Stats page: filters, charts, the sortable table
  - the PDF and Excel exports (in the **production build**, check that exceljs and jsPDF work under the CSP)
  - the JSON backup
  - the language and theme switch
  - mobile width (375 px)
- **Git:** repo initialized, **nothing committed yet**. Ask before committing, and use the commit attribution from the system reminder.
- **Dev server:** one may still be running from the old session on port 5173 (`npx vite --port 5173 --strictPort`). Restart it if it isn't.

## Code map

```
index.html, vite.config.ts        base './', build-only CSP plugin (connect-src api.github.com)
package.json                      overrides uuid ^11.1.1 (fixes exceljs audit issue)
src/main.tsx                      QueryClient (errors → auth-expiry handler), providers
src/app/App.tsx, Layout.tsx       HashRouter, lazy Stats/Groups/Settings, header timer, bottom nav on mobile
src/domain/                       types, time helpers (parseDuration, resolveManualTimes…), month keys, ids (+ tests)
src/storage/
  types.ts                        StorageAdapter (UI boundary), FileStore, Identity
  repoAdapter.ts                  data layout logic over any FileStore (entries/<login>/<YYYY-MM>.json,
                                  timers/<login>.json, workspace.json, tracker.json, idempotent stopTimer)
  memoryStore.ts                  in-memory FileStore + createMemoryAdapter (tests, demo)
  contract.ts                     shared adapter contract test suite
  github/client.ts                fetch wrapper, error mapping (auth/forbidden/notFound/conflict/rateLimit/offline)
  github/githubStore.ts           tree snapshot (2s TTL) + blob-SHA IndexedDB cache, conflict retry (max 3)
  github/githubAdapter.ts         GitHubIdentity, checkLogin, createGitHubAdapter
  github/fakeGitHub.ts            fake REST API for tests
src/features/auth/                session storage (local vs session), AuthContext, LoginPage, demoData
src/features/data/                TanStack Query hooks + optimistic mutations, workspace actions, error text
src/features/tracker/             TrackerPage, TimerBar (timer/manual modes), EntryList, EntryEditModal,
                                  EntryFields, useNow (shared ticker), useTimerActions
src/features/workgroups/          WorkGroupsPage
src/features/stats/               stats.ts (pure + tests), StatsPage, Charts (Recharts)
src/features/export/              report.ts (model + chart→PNG), pdf.ts (jsPDF+autotable), xlsx.ts (exceljs), backup.ts
src/features/settings/            SettingsPage (language, theme, backup, logout)
src/i18n/                         en.ts (typed source), de.ts (typed against en), index.ts
src/styles/global.css             design tokens, light/dark, responsive rules
src/theme.ts                      theme preference store
```

## Gotchas

- **Windows + PowerShell 5.1:** `Set-Content -Encoding utf8` writes a BOM. Update the tasks.md checkboxes with bash `sed -i -E 's/^- \[ \] (X\.Y )/- [x] \1/'`, not PowerShell.
- **Timestamps:** stored as UTC ISO. Entries are sharded by the UTC month of their start. Excel dates are shifted to "local wall clock as UTC" on purpose (`excelDate`).
- **Deleted items:** a deleted project or tag leaves dangling ids in entries. These show as "No project" or are hidden. This is intentional: deleting never rewrites other members' files.
- **Tag stats:** each tag is credited with the full duration of every entry it's on, so tag totals can exceed the overall total.
- **Browser automation:** batch actions. Never enter tokens or credentials; the user has to do that.

## Next steps

1. Restart the dev server and finish the browser smoke test in demo mode, covering the untested items listed above. Fix any bugs you find.
2. Test the exports in the production build: `npm run build && npx vite preview`. This checks them under the CSP. If exceljs needs `unsafe-eval`, fix it with a different approach rather than weakening the CSP silently, or ask the user.
3. Write the workflow file `.github/workflows/deploy.yml` (10.1) and `README.md` (10.2). Mark both done.
4. Ask the user about the GitHub org or data repo, then guide them through 10.3. They create the repo and token and log in themselves.
5. Offer to make the first commit, then, once everything is checked, run `/opsx:archive`.
