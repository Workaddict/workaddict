## Why

Team leaders often need to add the same time for several people, for example a team meeting, a training day, or a shift everyone worked. The manual form's "For" picker allows only one member, so the same entry has to be typed N times, and that makes N commits.

## What Changes

- The "For" picker in the manual entry form becomes a multi-select. It has a "Select all" option, and each member, including the user ("Me"), can be checked individually. A single selection behaves exactly like today.
- Saving with several members selected creates one independent entry per member, all with the same date, times or duration, description, project, and tags. Each entry is owned by its member, stored in that member's entry file, and records the acting user as its adder, unless the member is the user.
- All entries are written in **one commit**: either all are saved or none.
- When more than one member is selected, the form is a plain back-fill. The user's own running timer is never stopped or changed, even when "Me" is among the selected members.
- The success message and save button name how many members are affected ("Add for 3 members", "Added for 3 members").
- After saving, the selection is kept until reload or until the tracker leaves manual mode, as today.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `time-tracking`: "Manual entries for other members" changes from a single picker to multi-select with atomic creation of several entries.
- `roles-and-permissions`: "Creating other members' entries enforced in the storage layer" also covers batch creation (all or nothing).

## Impact

- `src/features/tracker/TimerBar.tsx` (`MemberPicker`, `ManualEntryView`, submit path)
- `src/storage/types.ts` and `src/storage/repoAdapter.ts`: new `saveEntries(entries)` using `store.writeMany` (one commit)
- `src/storage/contract.ts`: contract tests for the new method
- `src/features/data/hooks.ts`: mutation with optimistic cache update for several entries
- `src/i18n/en.ts`, `src/i18n/de.ts`: new strings
- Interacts with `fix-mobile-manual-form`: the picker row's mobile layout is designed here
