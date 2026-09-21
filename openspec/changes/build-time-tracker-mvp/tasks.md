## 1. Project Setup

- [x] 1.1 Scaffold Vite + React + TypeScript app at repo root (strict TS, ESLint, Prettier)
- [x] 1.2 Add dependencies: react-router-dom, @tanstack/react-query, date-fns, i18next, react-i18next, recharts, idb-keyval; dev: vitest, @testing-library/react, jsdom
- [x] 1.3 Configure Vite `base` for GitHub Pages and Vitest (jsdom environment)
- [x] 1.4 Add Content Security Policy meta tag to `index.html` (self scripts, connect to api.github.com, GitHub avatars)
- [x] 1.5 Create folder structure: `src/domain`, `src/storage`, `src/features/*`, `src/components`, `src/i18n`, `src/styles`
- [x] 1.6 Update `.gitignore` for node_modules, dist, coverage

## 2. Domain Model

- [x] 2.1 Define types: TimeEntry, RunningTimer, Project, Tag, Workspace, Member, BackupFile, TrackerMeta
- [x] 2.2 Implement duration/time helpers (duration from start/end, end from start+duration, overnight handling, 0 < duration ≤ 24 h validation) with unit tests
- [x] 2.3 Implement month-key helper (UTC `YYYY-MM` of entry start) and range→month-keys helper with unit tests
- [x] 2.4 Implement uuid generation and name-uniqueness (case-insensitive) validation helpers

## 3. Storage Layer

- [x] 3.1 Define `StorageAdapter` interface and typed storage errors (auth, not-found, forbidden, rate-limit with reset time, offline, conflict, schema-too-new)
- [x] 3.2 Implement `MemoryAdapter` fulfilling the full interface
- [x] 3.3 Write adapter contract test suite and run it against `MemoryAdapter`
- [x] 3.4 Implement GitHub API client: authenticated fetch, error mapping (401/403/404/409/422/rate limit/offline), base64 UTF-8 encode/decode
- [x] 3.5 Implement tree listing (recursive git tree) and blob fetch with IndexedDB cache keyed by blob SHA
- [x] 3.6 Implement conflict-safe `updateFile(path, fn, message)` with SHA, refetch-and-reapply retry (max 3, jitter)
- [x] 3.7 Implement `GitHubAdapter`: repo init (`tracker.json`, `workspace.json`), schema-version check, entries per user/month, workspace, timers, descriptive commit messages
- [x] 3.8 Implement idempotent `stopTimer` (write entry with timer id, then clear timer; skip entry if id exists)
- [x] 3.9 Implement members listing via collaborators with fallback to logins from the tree
- [x] 3.10 Run contract test suite against `GitHubAdapter` with a mocked fetch layer

## 4. Auth and Session

- [x] 4.1 Implement credential store (localStorage when "Remember me", else sessionStorage) and logout clearing storage and caches
- [x] 4.2 Implement login validation: `GET /user`, `GET /repos/{o}/{r}`, push-permission check, mapped error messages
- [x] 4.3 Build login page with token + repo fields, "Remember me", and expandable token setup guide (fine-grained permissions, classic fallback warning, link to GitHub)
- [x] 4.4 Create auth/adapter context provider; auto-login from stored credentials; "session expired" handling on 401
- [x] 4.5 Handle read-only mode when data schema version is newer than supported

## 5. App Shell, i18n, Theming

- [x] 5.1 Set up HashRouter with routes: login, tracker, stats, projects & tags, settings; route guard for unauthenticated users
- [x] 5.2 Set up i18next with `en` and `de` resources, browser language detection, persisted override, date-fns locale mapping
- [x] 5.3 Create CSS design tokens, light/dark themes (system default + manual override), base component styles
- [x] 5.4 Build responsive layout: header with nav, user avatar menu, and global running-timer widget; mobile navigation
- [x] 5.5 Build shared components: button, input, select, project picker, tag multi-picker (with inline create), modal, confirm dialog, toast/error banner, empty state, spinner
- [x] 5.6 Build settings page: repo + user info, language and theme selection, backup download, logout

## 6. Work Groups

- [x] 6.1 Implement workspace queries/mutations (TanStack Query) for projects and tags
- [x] 6.2 Build Projects & Tags page: lists with color and total hours, create, rename, recolor (palette), archive/unarchive, show-archived toggle
- [x] 6.3 Implement delete with confirmation showing usage count; render entries with deleted project/tag as "No project"/without tag
- [x] 6.4 Ensure archived projects/tags are hidden from pickers but shown on existing entries and in stats

## 7. Time Tracking

- [x] 7.1 Implement timer queries with 30 s polling while visible and refetch on focus; local 1 s ticking display
- [x] 7.2 Build timer bar: description, project, tags, start/stop, discard; edits to running timer persisted
- [x] 7.3 Implement start-while-running behavior (stop current, save entry, start new) and graceful "already stopped" handling
- [x] 7.4 Build manual entry form: date, start, end or duration, overnight handling with duration preview, validation errors
- [x] 7.5 Build entry list grouped by day (Today/Yesterday/date), day totals, member filter (me / everyone), load previous month on scroll
- [x] 7.6 Implement edit (including moving between month files) and delete with confirmation for own entries only; hide controls on others' entries
- [x] 7.7 Implement "Continue" to start a timer pre-filled from an entry
- [x] 7.8 Implement optimistic updates with rollback and keep form input on save errors

## 8. Statistics

- [x] 8.1 Implement pure stats functions (filtering, totals, entry count, average per tracked day, breakdowns by project/member/tag with percentages, daily/weekly buckets stacked by project) with unit tests
- [x] 8.2 Build filter bar: range presets (Monday week start), custom range, multi-select members/projects (incl. "No project")/tags
- [x] 8.3 Build summary cards and breakdown tables (with multi-tag note)
- [x] 8.4 Build bar chart (daily, weekly when range > 62 days, stacked by project) and project donut chart with Recharts
- [x] 8.5 Build sortable detailed entry table and empty state

## 9. Export

- [x] 9.1 Add export dependencies (jspdf, jspdf-autotable, exceljs) loaded via dynamic `import()`
- [x] 9.2 Implement PDF report: title, range, filters, totals, breakdown tables, charts as images, entry list, localized, named `time-report_<from>_<to>.pdf`
- [x] 9.3 Implement Excel export with Summary, Entries, By project, By member sheets using real date cells and numeric hours
- [x] 9.4 Implement JSON backup export (all members, workspace, schema version, timestamp) from settings
- [x] 9.5 Add export buttons with loading state and error handling on the stats page

## 10. Deployment and Docs

- [x] 10.1 Add GitHub Actions workflow: npm ci → test → build → upload-pages-artifact → deploy-pages on push to main
- [x] 10.2 Write README: what it is, data-repo setup (organization recommended), token creation for both token types, Pages setup, security notes (no real access control, token in browser)
- [x] 10.3 Manual end-to-end check against a real test data repo: login, timer across two browsers, manual entries, projects/tags, stats, all three exports, language and theme switch, mobile width
