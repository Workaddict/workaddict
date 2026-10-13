## Context

The manual form (`TimerBar.tsx` → `ManualEntryView`) holds `forLogin: string`. `MemberPicker` is a native `<select>`. Saving calls `save.mutate({ entry })` → `adapter.saveEntry`, which writes one file (`entries/<login>/<YYYY-MM>.json`) per commit. When `forLogin === user.login` the form can show and finish the user's running timer.

The store already has `writeMany(files, message, prepare?)`, which writes several files in one commit. The import uses it, and it retries `prepare` after a concurrent commit. Entries are split into one file per member and month, so N members means N files.

## Goals / Non-Goals

**Goals:**
- Pick several members, or all of them, and create one entry each in a single atomic commit.
- A single selection behaves exactly as before, including the running-timer path.

**Non-Goals:**
- Linked or "group" entries that are edited or deleted together. The entries are independent.
- Selecting by work group (possible later; see Open Questions).
- Bulk editing or deleting existing entries.

## Decisions

1. **State becomes `forLogins: string[]`** (default `[user.login]`). Derived values:
   - `single = forLogins.length === 1`, `forOther = single && forLogins[0] !== user.login`.
   - The timer path (show and finish the own timer) only applies when `forLogins` is exactly `[user.login]`. Otherwise `timer = null`, which extends today's "for another member" rule.
2. **The picker is a popover checklist, not a native `<select multiple>`.** As implemented: `Popover` gained `initiallyOpen`. With the own timer running, the first change away from "only me" (or back) swaps the form (`key` changes from the timer id to `'none'`). The picker then reopens so the user can keep choosing, and the flag resets when it closes. Native multi-select is unusable on iOS and desktop alike. Reuse the existing `.picker` / `.picker-btn` popover pattern (used for Project and Tags) so it looks and behaves the same: the button shows "Me" / "simon" / "3 members" / "All members". Inside: "Select all" at the top, then "Me (login)", then the other members sorted.
3. **New adapter method `saveEntries(entries: TimeEntry[]): Promise<TimeEntry[]>`** for new entries only (no `previousStart`):
   - Validate every entry (duration > 0) and run `entryActor` for each owner **before** writing. If anything fails, throw before any write.
   - Set `addedBy` per entry as `saveEntry` does (current user if owner ≠ me).
   - Group by path `entries/<login>/<month>` and call `store.writeMany(files, msg, prepare)`.
   - As implemented: `GitHubStore.writeMany` serializes `files` before its retry loop, so `prepare` can't refresh the content. Instead, as in `reassignEntries`, the adapter computes the files from a snapshot, and `prepare` throws `conflict` if one of the touched files changed meanwhile. The adapter then recomputes from fresh content, up to 3 attempts. Entries written concurrently (e.g. a timer stopped elsewhere) are kept. A test covers this with the fake GitHub API.
   - Commit message: `entry: add <HH:MM> "<desc>" for N members (<actor>)`.
   - With a single entry, the UI keeps calling `saveEntry`, so commit messages and behavior for one member stay as they are.
   - Alternative considered: loop over `saveEntry` from the UI. That makes N commits and is not atomic (a partial failure leaves some members without the entry). Rejected.
4. **Mutation hook** `useSaveEntries` updates the cache optimistically for all entries (same snapshot/rollback helpers as `useSaveEntry`) and invalidates `keys.entries` once it's done.
5. **Copy:** add `manual.addForMany` ("Add for {n} members" / "Für {n} Personen eintragen"), `manual.addedForMany`, `manual.selectAll`, `manual.membersCount`. German wording follows the "Consistent German terminology" requirement.
6. **Layout:** on phones the picker button takes the full width above the submit button (see `fix-mobile-manual-form`). Whichever change ships second adjusts to the other.

## Risks / Trade-offs

- [Large teams make large commits] → Typical teams have fewer than 30 members, and `writeMany` already handles imports with many files. No limit is needed.
- [The user expects the entries to stay linked] → The success message says "Added for N members". The spec says they are independent. A link can be added later if users ask for it.
- [Selection kept after save could lead to an accidental second bulk add] → Same rule as today for a single member. The button always shows the count, which makes it visible.

## Open Questions

- Should the picker also offer "Select work group …" (the `work-groups` capability)? Left out for now. It can be added inside the same popover later.
