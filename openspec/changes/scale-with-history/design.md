## Context

`GitHubFileStore` (`src/storage/github/githubStore.ts`) serves every read of the GitHub adapter. `listFiles()` fetches `git/trees/<branch>?recursive=1` (reused for 2 s to dedupe the reads of one refresh) and `readText(sha)` fetches a blob unless the content-addressed cache (IndexedDB, cleared on logout) has it. `RepoAdapter` reads many files with `Promise.all`, so a cold cache sends one blob request per file at the same moment.

Polling: `useTimers()` and `useEntries()` refetch every 30 s while visible and on focus. Each refetch costs one tree request whose body lists every file of the repository, about 150 B per file.

`WorkGroupsPage` calls `useAllEntries()` on mount to compute hours and entry counts per project and tag (`usageBy`). The delete confirmation reads `usage?.count ?? 0`, so it states 0 when entries are still loading.

## Goals / Non-Goals

**Goals:**
- Cap concurrent content requests on every read path.
- Make an unchanged refresh cost one small request.
- Stop loading the full history just by opening Work Groups, while keeping delete counts correct.

**Non-Goals:**
- Changing the repository file layout or storing aggregates (see Decision 4).
- Changing the 30 s poll interval.
- Keeping the blob cache across logout (clearing it is a privacy choice for shared computers).
- Bundle size work.

## Decisions

**1. Limit concurrency inside `GitHubFileStore.readText`, not in `RepoAdapter`.** A small semaphore in the store wraps the blob GET (cache hits skip it). Every read path (entries, all entries, timers, `isEmpty`, backup export, import preparation) is covered with no change to callers, and `MemoryFileStore` stays untouched. The limit is 8 and can be set through `GitHubFileStoreOptions` for tests. *Alternative:* a `mapLimit` helper in `readEntryFiles`/`listTimers`. Rejected: every caller has to remember it, and parallel callers (timers and entries polling together) would still add up.

**2. Check the branch head before the tree.** `listFiles()` first GETs `git/ref/heads/<branch>` (a response of about 300 B). If the commit SHA equals the SHA of the last fetched snapshot, it returns that snapshot. Otherwise it fetches `git/trees/<commitSha>?recursive=1`. Fetching the tree by commit SHA instead of by branch name makes the snapshot match the head that was checked, even if another commit lands in between. The 2 s TTL stays on top, so the burst of reads in one refresh still makes one head request. `invalidate()` drops the remembered SHA, so after a conflict or own write the next refresh always refetches the tree. This also avoids trusting a ref read that briefly lags behind the write we just made. An empty repository (409) or a missing branch (404) on the ref request yields an empty file list, as the tree request does today. *Alternative:* a conditional request (`If-None-Match`) on the tree. Rejected: needs manual ETag bookkeeping because the client sets `cache: 'no-store'` on purpose, and the head check is easier to read and test.

**3. Snapshot maps stay private to the store.** `write()` currently records the new SHA in the shared snapshot map (`files.set(path, res.content.sha)`). With snapshots now reused across polls, that stays correct, because a successful PUT creates a new commit and the next head check refetches. It is still documented in a comment so later changes do not rely on in-place mutation.

**4. Work Groups: totals on demand.** On open, the page shows projects and tags from `workspace.json` only. A "Show total hours" button enables the `useAllEntries()` query (`enabled` flag). If that query already has data in the React Query cache (for example after visiting Reassign entries), totals show immediately without the button. While totals load, the hour cells show a placeholder instead of `0:00`. *Alternatives:* a 12-month window (rejected: silently wrong totals for old projects) and a stored usage file (rejected: an extra write per entry change, conflicts, and totals that can drift from the entry files).

**5. Delete confirmation loads usage first.** Clicking delete calls `queryClient.fetchQuery` for all entries (served from cache when present), then opens the confirmation with the real count. A loading state on the delete button covers the wait. If the load fails, the confirmation says the number of affected entries could not be determined and still lets an editor delete. That matches today's result, since deletion never rewrites entry files.

## Risks / Trade-offs

- [Cold loads of the full history take longer with a limit of 8] → Total time is bound by bandwidth more than by request count. Pages that need all entries (Work Groups totals, reassign, export) show their existing loading states. 8 is well below GitHub's concurrency guidance.
- [One extra request when the head did change] → Head + tree instead of tree alone. Changes happen far less often than polls, so the net number of requests stays about the same while transferred bytes drop sharply.
- [Users may miss totals that used to be visible] → The button sits where the totals were. After the first click in a session, totals stay visible.
- [A stale ref read right after another member's commit] → It is only seen as "unchanged" until the next poll, 30 s later, the same staleness the current design already accepts.

## Migration Plan

No data migration. The change ships with a normal deploy. Rollback is a revert of the app commit. The data repo is not touched.

## Open Questions

None.
