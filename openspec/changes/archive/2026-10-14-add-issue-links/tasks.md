## 1. Domain

- [x] 1.1 Add `issueRef?: string` to `TimeEntry` and `RunningTimer`, and `repos?: string[]` to `Project` in `src/domain/types.ts`
- [x] 1.2 New `src/domain/issueRef.ts`: `ISSUE_REF` regex, `parseIssueInput(text, project)` → `{ ok, ref } | { ok: false, reason: 'format' | 'ambiguousRepo' }`, `issueUrl(ref)`, `parseRepoInput(text)` for `owner/repo` and repository URLs
- [x] 1.3 Tests: every input form from the spec, URLs with a query or fragment, short form with 0/1/2 linked repositories, leading zeros, bad characters, `javascript:`

## 2. Storage

- [x] 2.1 `validate.ts`: entries and timers with a malformed `issueRef` stay valid. On decode the field is removed from the value and the original is kept in `rest` (or left as is and ignored when shown, whichever fits the codec better; document the choice)
- [x] 2.2 `workspaceCodec`: check `repos`, drop invalid entries and duplicates (case-insensitive), at most 20
- [x] 2.3 Contract test: `saveEntry` keeps `issueRef`. An edit with a spread patch keeps unknown fields. `saveEntries` (bulk) keeps `issueRef`
- [x] 2.4 Check every save path (timer stop, quick restart, inline edit, edit dialog, bulk, reassign, shift) to make sure no field-by-field copy loses `issueRef`

## 3. Projects page

- [x] 3.1 `WorkGroupsPage.tsx`: list of linked repositories per project with add (text field, accepts URL) and remove, only for editors and team leaders. Workers see it read-only
- [x] 3.2 Errors "Repository already linked" and "Not a repository"
- [x] 3.3 Add `setProjectRepos` (or similar) to `useWorkspaceActions`

## 4. Tracker

- [x] 4.1 Shared component `IssueInput` (normalize on blur, chip with link, inline error, empty = remove)
- [x] 4.2 Add it to the timer bar, manual form (including bulk), `InlineFields`, `EntryEditModal`. Keep it in the draft across entry modes
- [x] 4.3 Timer: save `issueRef` in `timers/<login>.json` and pass it on stop. Quick restart copies it
- [x] 4.4 `EntryList`: show the link next to the description (`target="_blank" rel="noopener noreferrer"`)
- [x] 4.5 Tests: start and stop the timer with an issue, a short form resolved through the project, the "Repository unclear" error, clearing the link

## 5. Export

- [x] 5.1 `report.ts`: add an `issue` field to each entry row
- [x] 5.2 xlsx and ods: "Issue" column after the description, as a hyperlink. csv and pdf: as text
- [x] 5.3 Extend the export tests, including the backup round trip

## 6. i18n & docs

- [x] 6.1 Add strings in `en.ts` and `de.ts` (Issue, Repository unclear, Not an issue reference, Linked repositories, Repository already linked, …)
- [x] 6.2 README / help: explain issue links and that the app token needs no extra permissions for them
