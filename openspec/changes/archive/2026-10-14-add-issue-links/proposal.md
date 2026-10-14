## Why

Teams plan their work as GitHub issues on a project board, but a time entry only has free text. You cannot see which issue the time went to, and a report cannot be matched to the board. Linking entries to issues fixes this. It is also the base for the AI integration (`add-mcp-server`), which reads the issue number from the git branch and fills the link in automatically.

## What Changes

- Time entries get an optional **issue link**, stored as `owner/repo#number` (e.g. `acme/web#42`). It is entered in the manual form, the timer bar, inline editing and the edit dialog. You can type `acme/web#42`, a GitHub issue or pull request URL, or a short `#42`.
- Projects get an optional list of **linked repositories** (`owner/repo`), managed by editors and team leaders on the Projects & Tags page.
- A short `#42` is resolved against the entry's project: if the project has exactly one linked repository, that repository is used. Otherwise the user has to give the full `owner/repo#42`.
- The entry list shows the issue as a link to `https://github.com/owner/repo/issues/42`. The app does **not** call the GitHub API for issue titles or state. The app token keeps its access to the data repository only.
- Exports (PDF, Excel, OpenDocument, CSV) get an "Issue" column. The JSON backup keeps the field.
- No schema version bump: both fields are optional, and older app versions keep unknown fields when they read and save entries and projects.

## Capabilities

### New Capabilities
- `issue-links`: format, parsing and resolving of issue references on entries, and how they are shown.

### Modified Capabilities
- `work-groups`: new requirement "Linked repositories" for projects.
- `time-tracking`: new requirement "Issue link on entries" for the timer, the manual form, inline editing, the edit dialog and the entry list.
- `data-export`: new requirement "Issue column" for the Excel, CSV, OpenDocument and PDF entry tables.

## Impact

- `src/domain/types.ts`: `TimeEntry.issueRef?`, `RunningTimer.issueRef?`, `Project.repos?`
- `src/storage/validate.ts`: validate the new optional fields (an invalid value is dropped, not the whole record)
- New `src/domain/issueRef.ts`: parse / format / resolve plus tests
- `src/features/tracker/*` (TimerBar, EntryFields, InlineFields, EntryEditModal, EntryList)
- `src/features/workgroups/WorkGroupsPage.tsx`: repository list per project
- `src/features/export/report.ts`, `xlsx.ts`, `csv.ts`, `ods.ts`, `pdf.ts`
- `src/i18n/en.ts`, `src/i18n/de.ts`
- The token help and permissions stay the same.
