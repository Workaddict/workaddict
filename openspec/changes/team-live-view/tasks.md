## 1. Domain

- [x] 1.1 Add `viewLiveActivity` and `stopOthersTimer` to `Action` in `src/domain/permissions.ts` with minimum role editor; extend permission unit tests
- [x] 1.2 Add optional `stoppedBy?: string` to `TimeEntry` in `src/domain/types.ts`
- [x] 1.3 Add a pure `isRunningTooLong(start, now)` helper (>10h or started before local midnight) and a `suggestedStopEnd(start, now)` helper (start + 8h capped at now when too long, else now), with unit tests
- [x] 1.4 Add a pure helper that builds the "Team now" rows (running first by elapsed desc, then idle by login; today total; last active) from members, timers, today's entries, current login and now, with unit tests

## 2. Storage

- [x] 2.1 Extend `StorageAdapter.stopTimer` and `discardTimer` in `src/storage/types.ts` with an optional target `{ login, timerId }`; own-timer calls stay unchanged
- [x] 2.2 Implement in `repoAdapter.ts`: for another login call `assertCan('stopOthersTimer')`, read `timers/<login>.json`, return `null` without writing when the timer is missing or its id differs from `timerId`, write the entry under the owner's login with `stoppedBy` = actor, clear only the matching timer
- [x] 2.3 Commit messages for other-member actions: `timer: stop <h:mm> "<desc>" (<login>, by <actor>)`, `timer: clear (<login>, by <actor>)`, `timer: discard (<login>, by <actor>)`
- [x] 2.4 Contract tests in `src/storage/contract.ts`: editor stops/discards another timer, worker gets `forbiddenRole` and nothing is written, timer-id mismatch leaves the new timer running, concurrent self + other stop yields exactly one entry, self stop has no `stoppedBy`, editing keeps `stoppedBy`
- [x] 2.5 Verify both the memory and the GitHub adapter pass the contract suite

## 3. Data hooks

- [x] 3.1 Add `useStopOthersTimer` and `useDiscardOthersTimer` mutations in `src/features/data/hooks.ts` with optimistic removal from the timers cache, insert of the created entry, rollback on error, and invalidation of timers and entries on settle
- [x] 3.2 Add a `useTodayEntries()` query (or reuse `useEntries` with a today range) for the block

## 4. UI

- [x] 4.1 Create `src/features/tracker/TeamNow.tsx`: rows with avatar, login, description, project, tags, ticking elapsed time (`useNow`), today total, last active / "no entries today", too-long flag; wraps to two lines on mobile; footnote about app-only enforcement
- [x] 4.2 Add row actions "Stop at…" and "Discard" (icon buttons, like the timer bar), shown only with `stopOthersTimer`
- [x] 4.3 Create the stop dialog: end time input defaulting to `suggestedStopEnd`, too-long warning with elapsed time, validation (end > start, end ≤ now), and a "timer has changed" notice when the stop returns `null`
- [x] 4.4 Discard confirmation dialog
- [x] 4.5 Render `TeamNow` below `TimerBar` in `TrackerPage.tsx` only when `can(access, 'viewLiveActivity')`
- [x] 4.6 Stopped-by toast: detect own timer id disappearing between polls, find the entry with that id after refetch, show "Your timer was stopped by <login>" when `stoppedBy` is set and not me; remember shown ids in `sessionStorage` (try/catch)
- [x] 4.7 Add all new strings to `src/i18n/en.ts` and `src/i18n/de.ts`

## 5. Demo & docs

- [x] 5.1 Seed running timers for two demo members in `src/features/auth/demoData.ts`, one started yesterday
- [x] 5.2 Update the README: features list, permission matrix rows, note that the live view is enforced by the app only

## 6. Verification

- [x] 6.1 Component tests: block hidden for workers, shown for editors, row order, stop dialog defaults and validation
- [x] 6.2 Run lint, typecheck, and the full test suite
- [x] 6.3 Manually check in the demo: live rows tick, stop at a chosen time creates the entry, discard clears, too-long flag on the seeded timer, light/dark and mobile width (desktop checked in demo; phone width not checked, the browser window could not be resized)
