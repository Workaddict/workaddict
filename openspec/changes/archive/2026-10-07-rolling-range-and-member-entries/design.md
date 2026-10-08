## Context

**Stats range.** `presetRange('lastTwoWeeks')` in `src/features/stats/stats.ts` returns `startOfWeek(addWeeks(now, -1))` through `endOfWeek(now)` in the effective time zone. The stats page remembers the preset key (not the dates) per tab session, so changing the calculation needs no migration.

**Entries for others.** The storage layer already allows this. `RepoAdapter.saveEntry` calls `entryActor(entry.login)`, which requires `editOthersEntries` (editor+) when the owner is not the current user and adds ` for bob (alice)` to the commit message. It does not tell create and update apart for permissions. The only hardcoded part is the UI: `ManualEntryView` in `TimerBar.tsx` saves with `login: user.login`. `TimeEntry` already has one actor field, `stoppedBy`, which the adapter sets and which survives later edits.

## Goals / Non-Goals

**Goals:**
- "Last 2 weeks" covers the 14 days ending today, in the effective time zone.
- Editors and team leaders can add a complete entry (date, times, description, project, tags) for any current member from the manual form.
- Who added an entry for someone else shows in the data and in the UI, not only in git history.

**Non-Goals:**
- Starting or running a timer on another member's behalf.
- Changing an entry's owner (that is "Reassign entries", leader-only).
- Overlap checks against the member's other entries or their running timer. None exist for own entries either.
- Adding entries for former members who are no longer collaborators.
- Rolling versions of the other presets.

## Decisions

**D1: Keep the preset key `lastTwoWeeks`, change only the range and the label.**
Remembered sessionStorage values and tests keep the key. Renaming it to `last14Days` would make every remembered value invalid, which falls back to "This week", for no user benefit. Range: `{ from: startOfDay(addDays(now, -13)), to: endOfDay(now) }`, which is 14 calendar days including today. The zoned `addDays` handles DST. Alternative considered: `addDays(now, -14)`, which gives 15 days, and "14 days back" is ambiguous anyway. 14 days including today matches common tools and the label.

**D2: Chart granularity is unchanged.** 14 days is at most 62, so it stays daily bars, like before.

**D3: Member picker in the manual form only (option A).**
It reuses the date, duration, project and tag inputs and validation. Alternatives considered: an "Add entry for…" button in the Everyone list that opens `EntryEditModal` (a second creation path to maintain), and an owner field in the edit modal (that would be reassigning, leader-only). The picker renders only when `can(access, 'editOthersEntries')`. Options: the current user first, labeled "me", then the other members from `useMembers()` by login.

**D4: The picker is component state, not part of the draft or prefs.**
It stays on the chosen member across saves within the page view, so filling several days needs no reselecting. A reload resets it to "me". It is not part of the shared timer/manual draft from `keep-draft-across-entry-modes`, because timer mode has no member concept. Switching to timer mode and back resets it to "me". That's acceptable and avoids starting a timer "for" someone by accident.

**D5: Running timer plus another member selected means a plain add.**
`ManualEntryView` currently switches to "Stop & save" whenever the user's own timer is running and pre-fills from it. When "For" is not the current user, the form behaves like the no-timer case: the button reads "Add entry for <login>" and submits `save.mutate` with `login: <member>`, and the editor's timer stays untouched. Changing "For" back to "me" with a running timer goes back to the timer-finishing behavior. To keep this simple: when switching from "me" (with a running timer) to another member, the fields and times reset to empty or defaults, so the timer's data is not copied into someone else's entry by accident.

**D6: The storage adapter sets `addedBy`, not the UI.**
In `saveEntry`, when the call is a create (`previousStart === undefined`) and `entry.login !== me.login`, the adapter writes `addedBy: me.login`. On updates it keeps whatever `addedBy` the stored entry has (the UI passes the entry through), and it strips an `addedBy` that a client sends on a create for itself. This works like `stoppedBy`: the trusted path is the adapter, and validation accepts the optional login. Alternative considered: no field, commit history only. Rejected because members would see entries they don't recognize without any explanation in the app.

**D7: The list shows "added by <login>" as a small muted marker** next to the member/time area in `EntryList`, for every viewer, and only when `addedBy` is set and differs from the entry's login.

**D8: Saved feedback.** The toast reads "Added for <login>" when the entry belongs to someone else. The list filter is not switched to "Everyone", so the user's view does not jump around. The toast is enough confirmation.

## Risks / Trade-offs

- [Concurrent change touches `TimerBar.tsx`] → Finish and archive `keep-draft-across-entry-modes` first (only its manual check 3.2 is left).
- [Spec delta order] → `stats-range-and-persistence` must be archived before this change, or the MODIFIED "Date range filter" block won't match the base spec.
- [The label "Last 14 days" differs from the internal key `lastTwoWeeks`] → A comment at the preset says so. The key is never shown.
- [An editor adds an entry that overlaps the member's own] → Allowed, as for own entries. The "added by" marker and the commit make it traceable, and the member or an editor can delete it.
- [`addedBy` can be forged by editing files on GitHub] → The same limitation as roles, already disclosed. Commit history stays the source of truth.

## Migration Plan

No data migration. `addedBy` is optional, so existing entries stay valid. Rollback is safe: the current `isTimeEntry` in `validate.ts` ignores unknown fields, so older versions read entries that have `addedBy` and simply don't show the marker.
