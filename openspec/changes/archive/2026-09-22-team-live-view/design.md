## Context

Running timers live in `timers/<login>.json`. `adapter.listTimers()` already reads every member's timer file, and `useTimers()` polls them every 30 s while the page is visible and refetches on focus. The only consumer today is `useMyTimer()`, which filters the list down to the current user. `stopTimer`/`discardTimer` are hard-wired to the current user's login. Permissions are expressed as `Action`s with a minimum role in `src/domain/permissions.ts` and are enforced in the storage layer via `assertCan`. Like the roles themselves, they are enforced only by the app: any collaborator can read or edit the repository files on GitHub.

## Goals / Non-Goals

**Goals:**
- Show editors and team leaders a live overview of all other members on the tracker page, using data the client already fetches.
- Let editors and team leaders stop (with a chosen end time) or discard another member's timer, safely under concurrency.
- Tell the affected member that someone else stopped their timer.

**Non-Goals:**
- Real presence or idle detection. "Working" means "a timer is running".
- Push notifications or reminders. The app has no server.
- Hiding timers from workers at the GitHub level, or letting members opt out of the view.
- Editing another member's running timer (description, project, tags). That can be added later.
- Making the poll interval shorter than 30 s.

## Decisions

**1. No new data fetching for the view.** "Team now" is derived from `useTimers()` (running timers), `useMembers()` (the member list), and the entries of today. The tracker page already loads the current range, so the block uses its own `useEntries(today)` query, and React Query de-duplicates identical keys. "Last active" = the latest `end` among the member's entries loaded for today. When there are none it shows "no entries today". *Alternative:* scan all history for the true last activity. Rejected: `listAllEntries` is expensive, and "today" answers the actual question.

**2. Two separate actions, `viewLiveActivity` and `stopOthersTimer`, both with minimum role editor.** Two actions instead of one keep viewing and acting tunable independently later, at the cost of one extra line in `MIN_ROLE`. *Alternative:* reuse `editOthersEntries`. Rejected: it hides intent, and the matrix in the spec should list the rows explicitly.

**3. `stopTimer(end?, login?)` and `discardTimer(login?)` instead of new methods.** When `login` is omitted or equals the current user, behaviour is unchanged (`assertWritable`). For another login the adapter calls `assertCan('stopOthersTimer')`. The existing idempotent algorithm is reused unchanged against `timers/<login>.json` and `entries/<login>/…`: the entry id equals the timer id, and the clear step only removes a timer whose id matches. A concurrent stop by the owner and by an editor therefore still yields exactly one entry. The one whose entry write lands first wins the end time; the other finds the existing entry and only clears the timer. `startTimer` still stops only the user's own timer.

**4. `stoppedBy` is set only when the actor differs from the timer's owner.** It is an optional `string` (a login) on `TimeEntry`. Self-stops stay exactly as today, so existing data and tests are unaffected. Editing the entry later keeps the field, because saves spread the existing entry. Commit messages: `timer: stop 8:00 "Support" (dave, by alice)` and `timer: discard (dave, by alice)`. The `(login)` part keeps its current meaning of "whose data".

**5. The end time is always chosen in a dialog.** The default is now. When the timer is "running too long", the default is `min(start + 8h, now)` and a warning shows the elapsed time. Validation: end > start and end ≤ now. The dialog re-checks, when submitting, that the timer id is unchanged. If the member has stopped the timer or started a new one in the meantime, the dialog closes with a notice instead of stopping the new timer. The adapter does the same: the caller passes the expected timer id, and the adapter returns `null` without writing on a mismatch.

**6. "Running too long" = elapsed > 10 h OR start is before local midnight of today.** It is a pure function in `src/domain` so it can be unit tested. The threshold is a constant, not a setting.

**7. Toast detection is client-side and needs no extra reads.** When `useTimers()` data changes and the previous poll contained my timer with id X but the new one does not, look for an entry with id X among loaded entries after they refetch. If it has `stoppedBy` ≠ me, show "Your timer was stopped by <login>" once. Shown ids are remembered in `sessionStorage` (wrapped in try/catch) so a reload does not repeat the toast within the session. A stop the user did on another device has no `stoppedBy` and shows nothing. *Alternative:* a notification file per user. Rejected: extra writes and files for a small hint.

**8. Placement.** `TeamNow` renders below `TimerBar` in `TrackerPage` only when `can(access, 'viewLiveActivity')`. Rows are sorted running first (longest elapsed first), then idle members alphabetically. The current user is excluded. Elapsed times tick with the existing `useNow` hook. On mobile each row wraps into two lines. The block has a one-line footnote saying that visibility is enforced by the app.

**9. Demo.** `demoData.ts` seeds running timers for two of the demo members, one of them started yesterday, so both the normal row and the "too long" flag show in the demo.

## Risks / Trade-offs

- [Up to ~30 s stale] → Elapsed time ticks locally from `start`, so rows look live. A stopped timer disappears at most one poll later. Acceptable for coordination and oversight.
- [Timer running ≠ working] → The "too long" flag plus the stop dialog cover the common case of a forgotten timer. The UI wording says "tracking", not "working".
- [Workers can bypass by reading `timers/*.json` on GitHub] → The limitation is disclosed in the block and in the README, consistent with the existing roles notice.
- [An older client edits a stopped entry and drops `stoppedBy`] → Only the attribution is lost; the commit history still has it. No schema bump, because the field is optional and purely informational.
- [Editor stops a timer the member restarted seconds ago] → Guarded by the expected-timer-id check (Decision 5).
- [Surveillance feel] → No opt-out by decision. The toast makes interventions visible to the affected member, and every stop or discard is attributed in the commit history.

## Migration Plan

No data migration. Deploy as a normal static release. Older clients keep working: they ignore `stoppedBy` and never see the view. Rollback = redeploy the previous build. Entries with `stoppedBy` stay valid.

## Open Questions

None. The owner/leader distinction does not matter here: owners are team leaders and get the feature through their role.
