## 1. Test support

- [x] 1.1 Extend `fakeGitHub.ts`: serve `git/trees/<commitSha>?recursive=1`, return 409 on `git/ref/heads/main` for an empty repo, count requests per route, and track the peak number of blob requests in flight (a configurable delay on blob responses)

## 2. Bounded content reads

- [x] 2.1 Add a small semaphore to `GitHubFileStore` limiting blob GETs in `readText` to `maxConcurrentReads` (option, default 8); cache hits bypass it
- [x] 2.2 Test: reading all entries of a repo with 40 entry files on a cold cache fetches each blob once with at most 8 in flight, including when timers and entries are read at the same time

## 3. Head check before tree

- [x] 3.1 In `listFiles()`, fetch `git/ref/heads/<branch>` first; reuse the last snapshot when the commit SHA is unchanged, otherwise fetch the tree by that commit SHA; keep the 2 s TTL on top
- [x] 3.2 Map 409/404 on the ref request to an empty file list
- [x] 3.3 Make `invalidate()` forget the remembered head SHA so the next refresh refetches the tree; add a comment on `write()`'s in-place snapshot update
- [x] 3.4 Tests: unchanged refresh = 1 ref request and 0 tree/blob requests; one changed file = 1 ref + 1 tree + 1 blob; after a write the tree is refetched; empty repo still initializes
- [x] 3.5 Run the shared storage contract suite (`contract.ts`) against both adapters and confirm it passes unchanged

## 4. Work Groups totals on demand

- [x] 4.1 Add an `enabled` option to `useAllEntries()` (default true, so Reassign entries and other callers are unchanged)
- [x] 4.2 In `WorkGroupsPage`, enable the query only after "Show total hours" is selected, or right away when all entries are already in the query cache
- [x] 4.3 Show a loading placeholder instead of `0:00` in hour cells while totals load; hide hour cells before they are requested
- [x] 4.4 On delete, `fetchQuery` all entries before opening the confirmation, with a loading state on the button; on failure, show the "count could not be determined" text and still allow deleting
- [x] 4.5 Add en/de strings: "Show total hours", loading placeholder label, and the unknown-count confirmation
- [x] 4.6 Component tests: opening the page reads no entry files; the button loads and shows totals; cached entries show totals immediately; delete before loading states the real count; a failed load shows the fallback text

## 5. Verify

- [x] 5.1 `npm test`, `npm run lint`, `npm run build` pass
- [ ] 5.2 Manual check against a real data repo: in the Network tab, an idle 30 s poll shows only ref requests; opening Work Groups on a cold cache sends no blob requests until "Show total hours"
- [ ] 5.3 Demo mode (in-memory adapter) still works on Work Groups
