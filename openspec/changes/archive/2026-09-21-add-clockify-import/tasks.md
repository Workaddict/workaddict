## 1. Storage: atomic multi-file write

- [x] 1.1 Add `writeMany(files: Map<string, unknown>, message: string): Promise<void>` to `FileStore` in `src/storage/types.ts`
- [x] 1.2 Implement `writeMany` in `MemoryFileStore` (all files set at once)
- [x] 1.3 Implement `writeMany` in `GitHubFileStore` via Git Data API (get ref → get commit → create tree with `base_tree` and inline contents → create commit → update ref without force), pretty-printed JSON like `write()`, invalidate tree afterwards
- [x] 1.4 Handle non-fast-forward (422) on ref update: retry up to `MAX_WRITE_RETRIES` with a caller-supplied re-validation callback, then throw `conflict`
- [x] 1.5 Extend `fakeGitHub.ts` with refs/commits/trees endpoints and add tests: one commit for many files, concurrent-commit retry, nothing written on failure

## 2. Storage: bulk import operation

- [x] 2.1 Add `StorageError` kind `notEmpty` and its i18n error text (en/de)
- [x] 2.2 Add `isEmpty()` and `importData({ workspace, entries }, summary)` to `StorageAdapter`
- [x] 2.3 Implement in `RepoAdapter`: assert writable, check emptiness (no `entries/**` files, no projects/tags), group entries by login and UTC start month via `PATHS.entries`, write `workspace.json` + entry files with `writeMany`, re-check emptiness on each retry; commit message `import: <summary> (<login>)`
- [x] 2.4 Tests: import into empty repo produces expected files and one commit; refuses when not empty; refuses when read-only; imported entries of other logins are returned by `listAllEntries` and cannot be edited (`notOwner`)

## 3. Clockify API client

- [x] 3.1 Create `src/features/import/clockify/client.ts`: `fetch` wrapper with `X-Api-Key`, configurable base URL (default `https://api.clockify.me/api/v1`, regional options), request counter, error mapping to `invalidKey | forbidden | rateLimit (resetAt) | network | unknown` without ever including the key
- [x] 3.2 Typed endpoints: `getUser`, `listWorkspaces`, `listUsers` (incl. deactivated), `listProjects`, `listTags`, `listTimeEntries(userId, page)` with a shared paginator (page size constant 1000, next page only when full)
- [x] 3.3 Verify against the real API: whether deactivated users need a status filter, regional hostnames, and how rate limiting is signalled (429 / `Retry-After`); record findings in design.md Open Questions
- [x] 3.4 Unit tests with a mocked `fetch`: pagination stops on short page, 401/403/429 mapping, key absent from error messages

## 4. Resumable fetch queue

- [x] 4.1 Implement a sequential fetch queue (meta → per-user entries) that stores results in memory, stops on `rateLimit` keeping progress, and resumes with the next pending request
- [x] 4.2 Per-user `forbidden` marks that user as "no access" and continues with the others
- [x] 4.3 Tests: resume after limit does not re-fetch completed users; forbidden user is reported and skipped

## 5. Conversion

- [x] 5.1 Create pure `convertClockify(raw, mapping, now)` in `src/features/import/convert.ts` returning `{ workspace, entries, report }`
- [x] 5.2 Projects: nearest `PROJECT_COLORS` color, archived flag, duplicate names disambiguated with client name then numeric suffix (`isNameTaken`)
- [x] 5.3 Tags: name + archived; entries: UTC start/end, description, mapped project/tag ids, login from mapping, fresh ids, `createdAt = updatedAt = now`
- [x] 5.4 Skips and report: running timers, `end ≤ start`, skipped/no-access users, unknown project/tag references; counts of entries with task or billable info
- [x] 5.5 Former-member login helper `clockify.<slug>` (lowercase, ASCII, hyphens) with de-duplication for equal names
- [x] 5.6 Unit tests covering every scenario of the "Data conversion" requirement

## 6. Wizard UI

- [x] 6.1 Create lazy-loaded `ImportWizard` modal in `src/features/import/` with steps: key → workspace → map users → fetch → preview → write → done; key kept only in component state and cleared on close
- [x] 6.2 Key step: password input, region select, validation via `getUser` + `listWorkspaces`, invalid-key message
- [x] 6.3 Workspace step: auto-select when only one workspace
- [x] 6.4 Mapping step: one row per Clockify user with login dropdown (from `listMembers()`), "former member", "skip"; auto-suggest by name/email local part; block duplicate logins
- [x] 6.5 Fetch step: per-user progress, request counter, rate-limit pause with reset time and Continue button, no-access notice with continue option
- [x] 6.6 Preview step: counts of projects/tags, entries and hours per login, hours per project, skipped/dropped counts, time-zone note; Cancel writes nothing
- [x] 6.7 Write step: call `importData`, show errors (incl. `notEmpty`) with retry while keeping fetched data; on success refresh app data
- [x] 6.8 Done step: summary and advice to delete the Clockify API key
- [x] 6.9 Add all wizard texts to `src/i18n/en.ts` and `src/i18n/de.ts`

## 7. Settings and CSP

- [x] 7.1 Add "Import from Clockify" row to Settings ▸ Data, enabled only when `isEmpty()`, otherwise showing the "only into an empty workspace" hint
- [x] 7.2 Extend CSP `connect-src` in `vite.config.ts` with `https://*.clockify.me`
- [x] 7.3 Mention the Clockify import in `README.md` (Free plan limits, admin key needed for team import, delete key afterwards)

## 8. Verification

- [x] 8.1 `npm test`, lint, and build pass
- [x] 8.2 Manual end-to-end run (done on the production app with an existing data repo instead of demo mode) against a real Clockify workspace: preview totals match Clockify's summary report, tracker and stats show imported data
- [x] 8.3 Manual check on the production build that CSP allows Clockify requests and the key is not present in local/session storage after closing the wizard

## 9. Replace existing data (revised after first test)

- [x] 9.1 `writeMany` accepts paths to delete (from the per-attempt `prepare` callback); GitHub deletes via tree entries with `sha: null`
- [x] 9.2 `importData(..., { overwrite })` deletes all `entries/**` files and replaces `workspace.json` in one commit, keeping timers; tests for memory and GitHub
- [x] 9.3 Settings row always enabled (except read-only) with "replaces existing data" hint
- [x] 9.4 Preview shows counts of existing entries/projects/tags, danger warning, confirmation checkbox; `notEmpty` during write refreshes the warning
