## 1. Storage

- [x] 1.1 Add permission action `reassignEntries` (team leaders) to `src/domain/permissions.ts` and the permission matrix test
- [x] 1.2 Add `reassignEntries(from, to, { before? })` to `StorageAdapter` and implement in `RepoAdapter` with `writeMany`, emptied-file deletion, conflict abort, and descriptive commit message
- [x] 1.3 Contract tests (former member merge, cutoff, ids kept, 0 matches, permissions, equal logins) and GitHub tests (one commit, message, file deletion, concurrent change)

## 2. UI

- [x] 2.1 `ReassignEntriesModal`: source (logins with entries, counts), target (members and entry logins), optional cutoff date, preview of entries and hours, confirm
- [x] 2.2 "Reassign entries" row in Settings → Data for team leaders; hint in the import's final step
- [x] 2.3 en/de texts with plural forms
- [x] 2.4 Component test: former member entries before the cutoff move to a real member

## 3. Docs and verification

- [x] 3.1 README: changing the mapping after the import
- [x] 3.2 `npm test`, lint, and build pass
- [ ] 3.3 Manual check against the real data repo: reassign a former member to a real login and verify the commit and statistics
