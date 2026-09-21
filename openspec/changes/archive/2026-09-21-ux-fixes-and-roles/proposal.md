## Why

Early feedback shows four gaps: new users cannot pick the language before signing in, switching between light and dark theme is buried in Settings, editing an entry always needs the edit button and a modal (Clockify lets you click a field and change it in place), and every member can change everything (projects, tags, the Clockify import), which does not fit teams with a lead and staff.

## What Changes

- **Language selection on the login page**: a language switch (English / German) on the login card, using the same remembered setting as Settings.
- **Quick light/dark toggle**: a sun/moon button in the header (and on the login page) that switches between light and dark theme in one click. Settings keeps the full choice including "System".
- **Inline entry editing**: clicking an own (or, for editors, any) entry's description, project, tags, start time, end time, or duration in the entry list turns that field into an input. Enter or blur saves, Escape cancels. The edit button and modal stay as a fallback for changing the date and on small screens.
- **Role system** with three roles: **team leader**, **editor**, **worker**.
  - Worker: track time and edit/delete own entries; sees all entries and statistics.
  - Editor: worker rights plus edit/delete other members' entries and manage projects and tags.
  - Team leader: editor rights plus the Clockify import.
  - The **owner** is every GitHub user with admin permission on the data repository (for a personal repository, the account owner). Owners are always team leaders and cannot be demoted, and **only owners assign roles**, including making other members team leaders.
  - Members without an assigned role are workers.
  - Roles are stored in a new `roles.json` file in the data repository. Roles are enforced by the app, not by GitHub: a member with write access can still change files directly on GitHub. This limitation is documented; the git history keeps it auditable.
- **BREAKING (behavior)**: after the update, members without a role lose the ability to manage projects/tags and to run the Clockify import until an owner grants them editor or team leader.

## Capabilities

### New Capabilities
- `roles-and-permissions`: roles, owner detection, the role store (`roles.json`), the permission matrix, and the role management UI.

### Modified Capabilities
- `app-shell`: language selection on the login page, the one-click theme toggle, and the settings page gaining a "Team & roles" section.
- `time-tracking`: "Edit and delete own entries" becomes permission-based (editors and team leaders may change others' entries) and entries can be edited inline in the list.
- `work-groups`: creating, renaming, recoloring, archiving, and deleting projects and tags requires the editor or team leader role.
- `clockify-import`: the import is offered only to team leaders.
- `data-storage`: the repository layout gains `roles.json`, and the adapter enforces permissions on writes (entries of other members, workspace, import, roles).
- `auth-and-workspace`: the team member list shows each member's role, and the owner is detected from the repository admin permission.

## Impact

- **Code**: `src/features/auth/LoginPage.tsx`, `src/app/Layout.tsx`, `src/theme.ts`, `src/features/tracker/EntryList.tsx` (+ new inline field components), `src/features/workgroups/WorkGroupsPage.tsx`, `src/components/Pickers.tsx` (hide "create" for workers), `src/features/settings/SettingsPage.tsx`, `src/features/import/ImportWizard.tsx`, `src/storage/repoAdapter.ts`, `src/storage/types.ts`, `src/storage/github/githubAdapter.ts`, `src/storage/memoryStore.ts`, `src/storage/contract.ts`, `src/storage/errors.ts`, `src/domain/types.ts`, `src/i18n/en.ts`, `src/i18n/de.ts`, `README.md`.
- **Data repository**: new optional file `roles.json`. No schema version bump; older app versions ignore it (and therefore do not enforce roles).
- **GitHub API**: reads admin permission from the existing repository and collaborator requests; no new scopes or endpoints.
- **Dependencies**: none.
