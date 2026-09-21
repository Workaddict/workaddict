## Context

Greenfield project: a Clockify-style time tracker for a small, trusted team. Hard constraints:

- **Hosting:** GitHub Pages only — static files, no server-side code, no rewrites.
- **Persistence:** a private GitHub repository ("data repo") accessed from the browser through the GitHub REST API.
- **Auth:** GitHub Personal Access Token pasted by each user. No OAuth (would need a server for the code→token exchange).
- **Cost:** free forever. No third-party services beyond GitHub.
- **Future:** the backend may later be swapped (e.g. Supabase), so storage must be isolated behind an interface.
- **Users:** small team (≈2–20 people), all trusted, all see all data.

## Goals / Non-Goals

**Goals:**
- Live timer synced across a user's devices; manual entries; description, project, tags per entry.
- Shared projects and tags; stats with charts; PDF / XLSX / JSON export.
- English and German UI; clean, responsive, mobile-friendly.
- Zero server operation; data stored as human-readable JSON with full git history.
- Storage behind a `StorageAdapter` interface so the backend is replaceable.

**Non-Goals:**
- Real per-user permissions (anyone with repo access can read/write all data; the UI restricts editing to own entries but this is not a security boundary).
- Billing, rates, invoicing, approvals, idle detection, calendar view.
- Offline-first editing (read cache yes, queued offline writes no).
- Open self-signup / multi-tenant hosting.

## Decisions

### D1. Frontend stack: React + Vite + TypeScript
- **React Router with `HashRouter`** — GitHub Pages cannot rewrite deep links to `index.html`; hash routes (`#/stats`) avoid 404s without the `404.html` redirect hack.
- **TanStack Query** for server state (caching, background refetch, polling, mutation invalidation). Avoids a hand-rolled cache. Alternative: Redux/Zustand — more boilerplate for what is essentially remote state.
- **Plain CSS with CSS custom properties** (design tokens, light/dark via `prefers-color-scheme` + manual toggle). Alternative: Tailwind — fine, but adds tooling; the UI surface is small.
- **date-fns** for date math/formatting (tree-shakable, has `de` locale).
- **Vitest + Testing Library** for tests.

### D2. Storage adapter boundary
All data access goes through one interface; UI code never calls the GitHub API directly.

```ts
interface StorageAdapter {
  getCurrentUser(): Promise<Member>
  listMembers(): Promise<Member[]>
  listEntries(range: { from: Date; to: Date }): Promise<TimeEntry[]>   // all members
  saveEntry(entry: TimeEntry): Promise<TimeEntry>                    // create or update (own)
  deleteEntry(entry: TimeEntry): Promise<void>
  getTimer(login: string): Promise<RunningTimer | null>
  listTimers(): Promise<RunningTimer[]>
  startTimer(t: RunningTimer): Promise<void>
  stopTimer(end: Date): Promise<TimeEntry>
  getWorkspace(): Promise<{ projects: Project[]; tags: Tag[] }>
  saveWorkspace(fn: (ws) => ws): Promise<Workspace>
  exportAll(): Promise<BackupFile>
}
```

Implementations: `GitHubAdapter` (production) and `MemoryAdapter` (tests + a local demo mode). A later `SupabaseAdapter` plugs in here, with the JSON backup format as the migration path.

### D3. Data repo file layout

```
tracker.json                       { "schemaVersion": 1, "createdAt": "..." }
workspace.json                     { "projects": [...], "tags": [...] }
entries/<login>/<YYYY-MM>.json     [ TimeEntry, ... ]      (month of entry start, UTC)
timers/<login>.json                RunningTimer | null
```

- **Per-user, per-month entry files:** a user only writes their own files, so concurrent writes between users never collide. Month sharding keeps files small (a heavy month ≈ 300 entries ≈ 60 KB) and bounds the data fetched for a date range.
- **Timestamps** are stored as ISO-8601 UTC strings; display converts to local time. An entry spanning midnight/month end is stored in the file of its start month.
- **Entities:**
  - `TimeEntry { id (uuid), login, start, end, description, projectId | null, tagIds[], createdAt, updatedAt }`
  - `RunningTimer { id (uuid), login, start, description, projectId | null, tagIds[] }`
  - `Project { id, name, color, archived }`
  - `Tag { id, name, archived }`
- **`schemaVersion`** in `tracker.json` enables future migrations; the app refuses to write if the version is newer than it understands.

Alternative considered: one file per entry — trivially conflict-free but thousands of files, one API call per entry read. Rejected.

### D4. Reading efficiently: Git Trees + blob-SHA cache
- One call to `GET /repos/{o}/{r}/git/trees/{branch}?recursive=1` returns every path with its blob SHA.
- File contents are fetched via `GET /repos/{o}/{r}/git/blobs/{sha}` and cached in IndexedDB keyed by SHA (content-addressed → never stale).
- A refresh therefore costs 1 tree call + N calls only for files whose SHA changed. This keeps well within the 5,000 req/h rate limit and makes the stats page fast after first load.

### D5. Writing safely: optimistic concurrency with retry
- Writes use `PUT /repos/{o}/{r}/contents/{path}` with the file's current `sha`.
- Every write is expressed as a pure function `(current) => next`. On `409 Conflict` / `422` SHA mismatch, the adapter refetches the file, re-applies the function, and retries (max 3, with jitter). This makes the shared `workspace.json` safe under concurrent edits.
- Commit messages are descriptive (`entry: add 2h "Fix login" (alice)`), so git history doubles as an audit log.

### D6. Synced timer
- Start → write `timers/<login>.json`. Stop → (1) append an entry whose `id` equals the timer `id` to the month file, then (2) write `null` to the timer file.
- Stop is idempotent: if step 2 failed earlier, a retry sees the entry id already present and only clears the timer. No duplicates, no lost time.
- Other devices discover a running/stopped timer by polling (TanStack Query `refetchInterval` 30 s while the tab is visible, plus refetch on window focus). The elapsed time is computed locally from `start`, so the display ticks every second without network calls.
- Starting a new timer while one runs stops the current one first.

### D7. Authentication and token handling
- User pastes a token and the data repo (`owner/name`). The app validates by calling `GET /user` and `GET /repos/{o}/{r}` and checking `permissions.push`.
- **Recommended token: fine-grained PAT**, scoped to only the data repo, permissions *Contents: read & write* and *Metadata: read*.
- **Constraint:** fine-grained PATs can only target repos owned by the user themselves or by an organization they belong to — not a repo owned by another personal account. Therefore the data repo SHOULD live in a (free) GitHub organization whose members are the team. For a personal-account-owned repo, collaborators must fall back to a classic PAT with `repo` scope (broader access; the setup screen warns about this).
- Token stored in `localStorage` when "Remember me" is checked, otherwise `sessionStorage`. Logout clears it.
- Mitigations for token-in-browser: strict CSP via `<meta http-equiv="Content-Security-Policy">` (`default-src 'self'; connect-src https://api.github.com; img-src 'self' https://avatars.githubusercontent.com data:`), no `dangerouslySetInnerHTML`, no third-party scripts at runtime, all deps bundled.

### D8. Members
- Members come from `GET /repos/{o}/{r}/collaborators` (login, avatar). If the token lacks permission for that endpoint, fall back to the logins found under `entries/` and `timers/` in the tree.

### D9. Statistics and charts
- Stats are computed client-side from entries in the selected range (pure functions, unit-tested): total hours, per project, per tag, per member, per day/week.
- **Recharts** for bar (hours over time) and donut (share by project) charts. Alternative: Chart.js — imperative API fits React less well.
- An entry with multiple tags counts fully toward each tag; the tag breakdown is labeled accordingly, so tag totals can exceed the overall total.

### D10. Export
- **PDF:** `jsPDF` + `jspdf-autotable` — summary table + per-project/per-member tables + detailed entry list; charts rendered to PNG from the SVG and embedded.
- **XLSX:** `exceljs` — sheets "Summary", "Entries", "By project", "By member", with typed date/duration cells. Chosen over the npm `xlsx` package, whose registry releases are outdated with known advisories.
- **JSON backup:** a single file `{ schemaVersion, exportedAt, workspace, entries, members }`, independent of the storage layout, usable for migration to another backend.
- Export libraries are lazy-loaded (`import()`) so they do not bloat the initial bundle.

### D11. i18n
- **i18next + react-i18next**, `en` and `de` resource files, language auto-detected from the browser, override stored in `localStorage`. Dates/durations formatted with the matching date-fns locale.

### D12. Deployment
- GitHub Actions workflow on push to `main`: `npm ci` → `npm test` → `npm run build` → `actions/upload-pages-artifact` → `actions/deploy-pages`.
- Vite `base` set to `/<app-repo-name>/`. The app repo is public (free Pages); it contains no data or secrets.

## Risks / Trade-offs

- **[No real access control]** Any member can edit anyone's data through the API → The UI only allows editing one's own entries; git history identifies every change and allows reverting it. Documented in the README.
- **[Token theft via XSS]** A stolen token grants write access to the data repo → Strict CSP, no HTML injection, fine-grained token limited to one repo, "Remember me" optional.
- **[Fine-grained PAT ownership restriction]** Collaborators on a personal repo cannot use fine-grained tokens → Recommend an organization-owned data repo; classic-PAT fallback with a warning.
- **[Write latency]** Each write is a commit (≈0.5–1.5 s) → Optimistic UI updates with rollback on failure; loading indicators.
- **[Timer poll delay]** A timer stopped on another device can appear running for up to 30 s → Refetch on focus; the stop action re-reads the timer before writing and handles "already stopped" gracefully.
- **[Rate limit]** 5,000 requests/h per user → Tree + SHA-cache reads; polling only while visible; single timer-file poll rather than full refresh.
- **[Repo growth]** Every change adds a commit → Negligible for text files at team scale (years of data ≪ 100 MB).
- **[GitHub API/ToS changes]** → Storage adapter isolation enables migration; JSON backup export.

## Migration Plan

Initial release, no existing data. Deployment steps:
1. Create the (organization-owned) private data repo; add members.
2. Push the app repo, enable Pages with the "GitHub Actions" source.
3. First user logs in and the app initializes `tracker.json` and `workspace.json` if absent.

Rollback: redeploy a previous commit of the app repo; revert data commits in the data repo if needed.

## Open Questions

- Does the team already have or want a GitHub organization for the data repo? (Affects which token type users need; the app supports both.)
- Default week start (Monday assumed, configurable later).
