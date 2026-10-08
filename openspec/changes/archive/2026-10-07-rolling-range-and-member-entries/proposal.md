## Why

Two requests from team use. First, "Last 2 weeks" on the stats page currently means two calendar weeks (Monday of last week through Sunday of this week), so on a Monday it shows six future days and only eight past ones. Users expect the 14 days up to today. Second, when a member forgets to track time, an editor can fix their existing entries but cannot add a missing one for them, so the member has to do it themselves.

## What Changes

- The stats preset "Last 2 weeks" becomes a rolling range: the start of the day 13 days ago through the end of today (14 days). It is relabeled "Last 14 days" / "Letzte 14 Tage". The other presets, including "Last week", stay calendar-based. The remembered preset keeps working because it is stored by name and re-evaluated against the current date.
- Editors and team leaders get a "For" member picker in the manual entry form. It defaults to themselves and lists the current members. Workers do not see it.
- An entry added for another member is saved in that member's entry file with that member as owner, like an editor's edit today. The commit message names both the member and the editor.
- New optional entry field `addedBy`: the login of the member who created the entry for someone else. The storage layer sets it, and the entry list shows it as "added by <login>".
- With another member selected, the form always shows "Add entry for <login>", even while the editor's own timer is running. The editor's timer is not touched.
- After saving, the success message names the member, and the picker stays on that member until the page is reloaded, so several missing days can be filled in quickly.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `statistics`: "Last 2 weeks" becomes "Last 14 days", a rolling 14-day range ending today.
- `time-tracking`: the manual entry form can create entries for other members (editors and team leaders), and entries show who added them for someone else.
- `roles-and-permissions`: the permission matrix row for other members' entries now also covers creating them.

## Impact

- `src/features/stats/stats.ts`: `lastTwoWeeks` range calculation. The preset key stays the same, so remembered filters stay valid.
- `src/i18n/en.ts`, `src/i18n/de.ts`: new preset label, plus picker, toast and "added by" strings.
- `src/features/tracker/TimerBar.tsx`: member picker in `ManualEntryView`, save target login, button label when a timer is running.
- `src/features/tracker/EntryList.tsx` / `InlineFields.tsx`: "added by" marker.
- `src/domain/types.ts`, `src/storage/validate.ts`, `src/storage/repoAdapter.ts`: `addedBy` field, validation, set on create for another member and kept on later edits.
- `src/storage/contract.ts`: contract tests for creating another member's entry (editor allowed, worker refused, `addedBy` set).
- Shares `TimerBar.tsx` with the in-progress change `keep-draft-across-entry-modes`. That change should be finished and archived first.
- Shares the `statistics` "Date range filter" requirement with `stats-range-and-persistence` (complete, not archived). That change must be archived first so this delta builds on its version.
