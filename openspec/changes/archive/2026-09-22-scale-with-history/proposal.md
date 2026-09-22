## Why

Data grows with every member and month: one entry file per member per month, and a Clockify import can add years at once. Three read paths scale badly with that history. File contents are fetched with unbounded parallelism, so a cold cache (new device, or after logout, which clears the cache) fires hundreds of requests at once and risks GitHub's secondary rate limit. The Work Groups page loads every entry of every member on each visit just to show usage totals. Every 30 s poll downloads the full recursive file list even when nothing changed. Small teams do not notice yet; teams with imported history will.

## What Changes

- Content fetches of the GitHub adapter run with a fixed concurrency limit instead of all at once, for every read path (entries, all entries, timers, backup export).
- Each refresh first reads the branch head commit (a tiny request) and fetches the recursive file list only when the head changed; otherwise it reuses the last file list.
- The Work Groups page no longer loads the full history on open. It lists projects and tags with names and colors right away and shows total hours only after the user asks for them ("Show total hours"), or immediately if all entries are already loaded in this session.
- Deleting a project or tag loads the usage it needs before the confirmation states the number of affected entries, so the count is never shown as 0 while data is still loading.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-storage`: "Efficient reads with content cache" changes: an unchanged refresh costs one branch-head request instead of one tree request, and content requests are made with bounded concurrency.
- `work-groups`: "Work group management page" changes: total hours are shown on demand instead of on page open. "Deleting work groups" gains the guarantee that the stated entry count comes from loaded data.

## Impact

- `src/storage/github/githubStore.ts`: head check before tree fetch, snapshot keyed by commit SHA, concurrency limit for blob reads. All read paths in `src/storage/repoAdapter.ts` go through the store, so they need no change.
- `src/storage/github/fakeGitHub.ts` and adapter tests: support the ref endpoint, count requests, and assert maximum parallelism.
- `src/features/workgroups/WorkGroupsPage.tsx`: on-demand totals, delete confirmation that loads usage first.
- `src/i18n/en.ts`, `src/i18n/de.ts`: strings for "Show total hours" and loading usage.
- No change to the data repo layout, no new dependencies, no migration.
