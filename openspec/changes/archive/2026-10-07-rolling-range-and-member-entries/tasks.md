## 0. Prerequisites

- [x] 0.1 Finish and archive `keep-draft-across-entry-modes` (shares `TimerBar.tsx`) — not needed: its code is committed, only its manual check is left, and its spec deltas do not collide
- [x] 0.2 Archive `stats-range-and-persistence` so the `statistics` delta here builds on its "Date range filter"

## 1. Rolling 14-day range

- [x] 1.1 Change `presetRange('lastTwoWeeks')` in `src/features/stats/stats.ts` to `startOfDay(addDays(now, -13))` through `endOfDay(now)`, with a comment that the key stays for remembered filters
- [x] 1.2 Relabel the preset "Last 14 days" / "Letzte 14 Tage" in `en.ts` and `de.ts`
- [x] 1.3 Tests in `stats.test.ts`: on 2026-10-05 the range is 2026-09-22 to 2026-10-05; "Last week" is still 2026-09-28 to 2026-10-04; a range across a DST change still covers 14 calendar days

## 2. `addedBy` in data and storage

- [x] 2.1 Add optional `addedBy?: string` to `TimeEntry` in `src/domain/types.ts`, and accept it in `isTimeEntry` (`undefined` or a valid login)
- [x] 2.2 In `RepoAdapter.saveEntry`: on create, set `addedBy` to the current login when `entry.login` is someone else, otherwise strip it. On update, keep the stored entry's `addedBy`
- [x] 2.3 Contract tests in `src/storage/contract.ts`: editor creates an entry for `bob` (written to bob's file, `addedBy` set, commit names both); worker creating for `bob` throws `forbiddenRole` and writes nothing; a later edit by `bob` keeps `addedBy`; own create has no `addedBy`

## 3. Member picker in the manual form

- [x] 3.1 In `ManualEntryView` (`TimerBar.tsx`) add a "For" select, shown only when `can(access, 'editOthersEntries')`: the current user first ("me"), then the other members from `useMembers()`
- [x] 3.2 Save with `login: <chosen member>`. When the chosen member is not the current user, use the plain add path even if the user's own timer is running; the button reads "Add entry for <login>"
- [x] 3.3 Switching "For" from "me" to another member while the user's own timer is running clears the fields and resets the times to defaults; switching back to "me" restores the timer-finishing form
- [x] 3.4 After saving, keep the chosen member, clear the fields, and show the toast "Added for <login>" (own entries keep "Entry added")
- [x] 3.5 i18n (en, de): picker label, "me", "Add entry for {{login}}", "Added for {{login}}"
- [x] 3.6 Tests in `TimerBar.test.tsx`: worker sees no picker; editor adds an entry for another member (saved with that login, toast names them); editor with a running timer adds for another member and the timer keeps running; picker keeps the member after saving

## 4. "Added by" marker

- [x] 4.1 Show a muted "added by <login>" in `EntryList` when `addedBy` is set and differs from `login`
- [x] 4.2 i18n (en, de) for the marker
- [x] 4.3 Test in `EntryList.test.tsx`: the marker shows for an entry added by someone else and not for own entries

## 5. Docs and verification

- [x] 5.1 Update the README permission table if it lists the role permissions
- [x] 5.2 Run typecheck, lint and the test suite
- [ ] 5.3 Check in the running app: "Last 14 days" range on stats; editor adds an entry for another member (also while their own timer runs); worker sees no picker; the marker shows in the list
