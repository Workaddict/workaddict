## Why

The Clockify import maps each Clockify user to a GitHub login, a former member (`clockify.<name>`), or skip, and that choice was final. A user mapped to the wrong login, or kept as a former member who later joins the team, stayed that way unless the whole import was repeated, which replaces all data.

## What Changes

- New **"Reassign entries"** action in Settings → Data for team leaders: move all time entries of one member (a real login or a `clockify.*` former member) to another member in one commit.
- Optional cutoff: only entries that started before a chosen date move, so a wrongly mapped real member keeps the entries they tracked in Workaddict after the import.
- Preview of the number of entries and hours before confirming; the import's final step points to this action.
- Storage adapter operation `reassignEntries(from, to, { before? })`, restricted to team leaders, writing all changed entry files in one commit and aborting instead of overwriting when the affected files change meanwhile.
- Fixes the stale "former member entries cannot be edited by anyone" scenario (editors and team leaders can edit them since roles were introduced).

## Capabilities

### New Capabilities

### Modified Capabilities
- `clockify-import`: changing the user mapping after the import; former member entries are editable by editors and team leaders.
- `data-storage`: new single-commit entry reassignment operation.

## Impact

- **Code**: `src/storage/types.ts`, `src/storage/repoAdapter.ts`, `src/domain/permissions.ts` (new action `reassignEntries`, team leaders), `src/features/settings/ReassignEntries.tsx` (new), `src/features/settings/SettingsPage.tsx`, `src/features/import/ImportWizard.tsx`, `src/i18n/en.ts`, `src/i18n/de.ts`, `README.md`, tests.
- **Data**: no format change; entries keep their ids and change only `login` and `updatedAt`.
