## 1. Storage

- [ ] 1.1 Add `saveEntries(entries: TimeEntry[]): Promise<TimeEntry[]>` to `StorageAdapter` in `src/storage/types.ts` (new entries only)
- [ ] 1.2 Implement it in `RepoAdapter`: validate every entry and check permissions for every owner before writing, set `addedBy`, group by entry file, write with `store.writeMany` in one commit (read and merge current content in `prepare`), commit message "entry: add … for N members (actor)"
- [ ] 1.3 Contract tests in `src/storage/contract.ts`: editor writes 3 entries in 1 commit; `addedBy` set for others and not for self; a worker including another member writes nothing and throws `forbiddenRole`; an invalid entry (end ≤ start) writes nothing; entries in two different months land in the right files

## 2. Data hook

- [ ] 2.1 Add `useSaveEntries` in `src/features/data/hooks.ts` with optimistic insert for all entries, rollback on error, invalidate on settle

## 3. Form

- [ ] 3.1 Replace `MemberPicker` with a multi-select popover (reuse the `.picker` pattern): "Select all", "Me (login)", the other members sorted; button label "Me" / login / "N members" / "All members"
- [ ] 3.2 Change `forLogin` to `forLogins: string[]` in the tracker state; the timer path only applies when the selection is exactly `[user.login]`; leaving manual mode resets to `[user.login]`
- [ ] 3.3 Submit: one member → existing `saveEntry` path; several → build one entry per login with a new id and call `saveEntries`; on success clear the fields, keep the selection, show "Added for N members"; on error keep the input
- [ ] 3.4 Save button: "Add entry" / "Add entry for simon" / "Add for N members"; disabled when nothing is selected
- [ ] 3.5 Add i18n strings in `en.ts` and `de.ts`

## 4. Tests and verification

- [ ] 4.1 Update `TimerBar.test.tsx` "For" tests for the new picker; add: select all → 3 entries and one success message; own running timer untouched with several members selected; button disabled with an empty selection
- [ ] 4.2 Check by hand in the demo: bulk add for the whole team, entries show "added by", each entry can be edited on its own
- [ ] 4.3 `npm run lint`, `npm test`, `npm run build`
