## Context

Workaddict is a static SPA on GitHub Pages; all data lives as JSON files in a private GitHub repository and is accessed only through `StorageAdapter` (`RepoAdapter` on top of a `FileStore`). Today every write is one Contents-API `PUT` = one commit, and `RepoAdapter` refuses to write entries of anyone but the logged-in user (`notOwner`).

Teams migrating from Clockify typically have 4–8 users and about one year of history (~1,000–1,500 entries per user, up to ~10,000 total). Most are on the Clockify Free plan, which since April 2026 allows only PDF exports, report ranges of 31 days, and **30 API requests per hour per workspace**.

A browser spike (2026-09-21) established:
- `api.clockify.me` accepts cross-origin requests with a custom `X-Api-Key` header (preflight passes; response body readable from a foreign origin).
- `GET /v1/workspaces/{ws}/user/{userId}/time-entries?page-size=5000` returns more than 50 items (92 of 92); the true maximum page size is unknown.
- Entries carry `timeInterval.start`/`end` as UTC ISO strings, plus `projectId`, `tagIds`, `userId`, `taskId`, `billable`.

The production CSP currently allows `connect-src https://api.github.com` only.

## Goals / Non-Goals

**Goals:**
- One-time, in-app import of a Clockify workspace (projects, tags, completed entries of all selected users) into an empty data repository.
- Stay within the Clockify Free rate limit for a typical team (target: ≤ 25 requests for 8 users × 1 year).
- Write the whole import as one commit.
- Handle a Clockify rate-limit hit without losing already fetched data.
- Keep the Clockify API key out of any persistent storage.

**Non-Goals:**
- Ongoing sync, re-import, or de-duplication against existing data.
- Merging into a workspace that already has projects, tags, or entries.
- Clients, tasks, billable flags, rates, custom fields, running timers, approvals.
- CSV/PDF import, and import from other tools (Toggl, Harvest).
- Server-side or GitHub-Action-based import.

## Decisions

### 1. Browser-side Clockify REST client
The wizard calls the Clockify API directly with `fetch` and header `X-Api-Key`. The base URL defaults to `https://api.clockify.me/api/v1`; a small "Clockify region" select offers the documented regional prefixes (e.g. EU) for workspaces hosted there.
- *Alternatives:* CSV upload (unavailable on Free plan, locale-dependent dates, no ids); a CORS proxy (would leak the API key to a third party); a GitHub Action with a repo secret (works, but setup is much heavier for users). Browser access was verified to work, so it wins.

### 2. Request plan and pagination
```
GET /user                                   → own user id, active workspace
GET /workspaces                             → pick workspace (skipped if only one)
GET /workspaces/{ws}/users                  → members (incl. inactive)
GET /workspaces/{ws}/projects               → name, color, archived, clientName
GET /workspaces/{ws}/tags                   → name, archived
GET /workspaces/{ws}/user/{uid}/time-entries?page-size=N&page=P   per selected user
```
All list calls use a large page size (`N = 1000`, adjustable in one constant) and fetch the next page only when a page comes back full. For 8 users × 1,200 entries this is ~5 metadata + ~16 entry requests. The wizard shows a running request counter.
- *Why not the Reports API?* On Free it is limited to 31-day ranges, which would cost ≥ 12 requests per year of history.

### 3. Rate-limit handling: pause, keep, continue
The fetch phase is a sequential queue of pending requests. On HTTP 429 (or an equivalent Clockify limit error) the queue stops, keeps every result fetched so far in memory, and the wizard shows "Clockify limit reached – continue in about N minutes" with a *Continue* button. No automatic background retries (they would burn the budget). Fetched data is lost only if the tab is closed; that is acceptable for a one-time step and avoids persisting third-party data locally.

### 4. Conversion to the Workaddict model (pure function)
`convertClockify(raw, userMapping) → { workspace, entries, report }` is a pure, unit-tested function:
- **Projects** → `Project { id: newId(), name, color: nearest(PROJECT_COLORS, clockifyColor), archived }`. Clockify allows the same project name under different clients; because names must be unique, duplicates get the client name appended (`"Website (Acme)"`), then a numeric suffix if still taken.
- **Tags** → `Tag { id: newId(), name, archived }`.
- **Entries** → `TimeEntry` with `start`/`end` from `timeInterval`, `description`, mapped `projectId`/`tagIds`, `login` from the user mapping, `createdAt = updatedAt = import time`, fresh `newId()`.
- **Skipped** (counted in `report`): entries without `end` (running timers), entries with `end ≤ start`, entries of skipped users. References to unknown projects/tags become "No project" / are dropped.
- Clients, tasks, billable, rates are dropped; the report states how many entries had a task or were billable so the user knows what is not carried over.
- *Alternative:* keep Clockify ids as Workaddict ids (`clockify:<id>`). Not needed since re-import is a non-goal; fresh UUIDs keep the id format uniform.

### 5. User mapping and former members
For each Clockify user the wizard offers: *a GitHub login* (dropdown from `listMembers()`, pre-selected when the Clockify name or email local part matches a login case-insensitively), *keep as former member*, or *skip*. Former members get the pseudo-login `clockify.<slug-of-name>`; the dot makes it impossible to collide with a GitHub login (GitHub logins contain only alphanumerics and hyphens). Two Clockify users cannot be mapped to the same login.
- Former members appear in stats and exports like any login without avatar. They can never log in, so their entries are effectively read-only — the existing `notOwner` rule already guarantees that.

### 6. Import only into an empty repository
`importData` refuses (`StorageError('notEmpty')`) if any `entries/**` file exists or `workspace.json` has projects or tags. Running timers are ignored for this check. This removes merging, name conflicts with existing data, and the question of overwriting.
- *Alternative:* merge by project/tag name. Deferred; the wizard is an onboarding step.

### 7. Atomic multi-file write: `FileStore.writeMany`
New method `writeMany(files: Map<path, unknown>, message: string): Promise<void>`.
- **GitHub**: Git Data API — `GET git/ref/heads/{branch}` → `GET git/commits/{sha}` (tree sha) → `POST git/trees` with `base_tree` and every file as an inline `content` entry → `POST git/commits` → `PATCH git/refs/heads/{branch}` with `force: false`. That is 5 requests for the whole import regardless of entry count. A non-fast-forward rejection (422) means someone else committed meanwhile: re-check emptiness and retry up to `MAX_WRITE_RETRIES`. After success the tree cache is invalidated and new blob texts are put into the blob cache on the next read.
- **Memory**: sets all files at once.
- Payload size: ~10,000 entries × ~300 bytes ≈ 3 MB JSON in one tree request, well within GitHub's limits. Entry files keep the normal pretty-printed format so later single-entry writes produce small diffs.
- *Alternative:* existing per-file `write()` for ~100 month files (≈ 200+ requests, ~100 commits, non-atomic partial imports on failure). Rejected.

### 8. `StorageAdapter.importData(data, summary)`
`importData({ workspace, entries }, summary)` validates emptiness, groups entries into `entries/<login>/<YYYY-MM>.json` by UTC start month (same rule as `saveEntry`), writes `workspace.json` plus all entry files via `writeMany`, commit message e.g. `import: Clockify workspace "Acme" – 7,850 entries, 6 members (alice)`. This is the only path allowed to write entries of other logins; the exemption is justified because it runs once, into an empty repository, initiated by a member with push access.

### 9. Key handling and CSP
The API key lives in React state of the wizard only: not in `localStorage`, session storage, URL, logs, or error messages (errors are mapped to kinds before display). Closing the wizard clears it. The final step recommends deleting the key in Clockify's profile settings. CSP `connect-src` becomes `https://api.github.com https://*.clockify.me` (covers `api.clockify.me` and regional hosts).

### 10. UI placement
A new "Import from Clockify" row in Settings ▸ Data opens a full-screen modal wizard (`src/features/import/`), lazy-loaded like the export libraries. The row is shown only while the repository is empty; otherwise it shows a short hint why import is unavailable.

```
Key ─▶ Workspace ─▶ Fetch meta ─▶ Map users ─▶ Fetch entries ─▶ Preview ─▶ Write ─▶ Done
         (1-2 req)    (3 req)                  (~2 req/user)    totals     1 commit   "delete key"
                                                 ▲   │ 429
                                                 └───┘ pause + Continue
```

## Risks / Trade-offs

- [Clockify changes CORS or API shape] → All Clockify access in one module with typed parsing; failures surface as a clear "Clockify could not be reached" error. Fallback path (GitHub Action) documented as future option.
- [Maximum page size lower than assumed] → Pagination loop handles any cap; only the request count grows. Counter makes this visible; pause/continue covers the Free limit.
- [30 req/hour shared with other tools in the same workspace] → Pause/continue; request counter; advise disconnecting other integrations during import.
- [Only admins can read other users' entries] → Detect 403 per user; show "your key cannot read entries of X – ask a Clockify admin to run the import" and allow continuing without that user.
- [Large single tree request fails] → Surface the error, nothing is written (atomic); retry button. If this proves real, split into several commits by user.
- [Time zone expectations] → UTC is stored as always; entries display in the viewer's local zone, which may differ from Clockify's user-profile zone setting. Mentioned in the preview.
- [Former-member pseudo-logins appear in member lists] → They carry no avatar and cannot log in; acceptable, keeps totals correct.
- [API key exposure via browser extensions or screen] → Password-type input, never persisted; recommend deleting the key afterwards.

## Migration Plan

Purely additive. Existing repositories are unaffected; the import is available only for empty repositories. Rollback: revert the release; any imported data remains ordinary Workaddict data (or can be removed by reverting the single import commit in the data repository).

## Open Questions

- Does `GET /workspaces/{ws}/users` return deactivated users by default, or does it need a status filter? *Docs (2026-09-21):* the endpoint accepts `status=PENDING|ACTIVE|DECLINED|INACTIVE|ALL`, no documented default. Implementation sends `status=ALL`. Still to confirm against a real workspace with a deactivated user.
- Exact regional API hostnames to offer in the region select. *Docs:* prefixes `euc1` (EU/Germany), `use2` (USA), `euw2` (UK), `apse2` (AU), i.e. `https://<prefix>.clockify.me/api/v1`; global default `https://api.clockify.me/api/v1`. All covered by the CSP wildcard.
- Does Clockify signal rate limiting with 429 plus a `Retry-After` header, or only with a message? *Docs* only mention the message "Too many requests" (no status code or header). Implementation treats HTTP 429 **or** a body matching "too many requests / rate limit / limit reached" as a rate limit, and reads `Retry-After` (seconds or HTTP date) when present; without it the wizard says "continue in about an hour". Free-plan behaviour (30/h) still to confirm on a real Free workspace.
