## 1. Language switch and theme toggle

- [x] 1.1 Add `useResolvedTheme()` to `src/theme.ts` (preference + `prefers-color-scheme` media query subscription) and a `toggleTheme()` helper that sets the explicit opposite of the rendered theme
- [x] 1.2 Create `src/components/ThemeToggle.tsx` (sun/moon icon button, `aria-label` naming the target theme); add missing icons to `Icon.tsx`
- [x] 1.3 Create `src/components/LanguageSwitch.tsx` using `LANGUAGES` / `setLanguage`
- [x] 1.4 Place both in the top-right of the login card in `LoginPage.tsx`; place `ThemeToggle` in the header before the user menu in `Layout.tsx`; check the 360 px layout
- [x] 1.5 Add i18n keys (en/de) for toggle labels
- [x] 1.6 Tests: toggle from `system` with dark OS → `light`; language switch on login page changes texts and persists

## 2. Permission domain

- [x] 2.1 Add `Role`, `RolesFile`, `Access` types to `src/domain/types.ts`
- [x] 2.2 Create `src/domain/permissions.ts` with `parseRoles` (unknown values → worker), `effectiveRole(login, roles, owners)`, and `can(access, action)`
- [x] 2.3 Table-driven unit tests for the full permission matrix, owner override, and unknown role values

## 3. Storage: owner detection and roles

- [x] 3.1 Extend `Identity`: `listCollaborators()` returns `admin` per member; add `isAdmin(): Promise<boolean>`; implement in `GitHubIdentity` and the memory identity (configurable admin logins; demo user is admin)
- [x] 3.2 Verify against the real GitHub API with a fine-grained token (Contents + Metadata) whether `permissions.admin` is returned for the repo and for collaborators; record the result in design.md Open Questions and apply the fallback if needed
- [x] 3.3 Add `PATHS.roles = 'roles.json'`; add `getAccess()`, `listRoles()`, `setRole(login, role)` to `StorageAdapter` and implement in `RepoAdapter` (conflict-safe write, commit `role: set <login> to <role> (<actor>)`)
- [x] 3.4 Add `StorageError` kind `forbiddenRole` with en/de texts
- [x] 3.5 Replace `assertWritable(ownerLogin)` with `assertCan(action, targetLogin?)`; gate `updateWorkspace` (manageWorkspace), `importData` (import), `setRole` (owner, non-owner target, valid role); keep timers own-only (`notOwner`)
- [x] 3.6 Let `saveEntry` / `deleteEntry` write other members' entries for `editOthersEntries`, using `entry.login` for both old and new month paths and never changing `entry.login`; commit messages name target member and actor
- [x] 3.7 `listMembers()` fallback also includes logins from `roles.json`
- [x] 3.8 Extend `src/storage/contract.ts` and adapter tests: worker blocked from workspace/import/others' entries/roles (`forbiddenRole`, nothing written); editor saves bob's entry into bob's file; owner sets roles; owner cannot be demoted; missing `roles.json` → admins leader, others worker; commit message contents

## 4. Access in the UI

- [x] 4.1 Add `useAccess()` React Query hook (refreshed with other data) exposing `role`, `owner`, `can()`; invalidate after `setRole`
- [x] 4.2 `EntryList`: show edit/delete for own entries or with `editOthersEntries`
- [x] 4.3 `WorkGroupsPage`: hide all mutating controls without `manageWorkspace`
- [x] 4.4 `ProjectPicker` / `TagPicker` callers: pass `onCreate` only with `manageWorkspace`
- [x] 4.5 `SettingsPage`: role badge next to login; Clockify import row only with `import`
- [x] 4.6 Header user menu: show role under the login
- [x] 4.7 i18n (en/de): role names, owner badge, `forbiddenRole` error

## 5. Team & roles section

- [x] 5.1 Add "Team & roles" section to Settings listing members (avatar, login, role); owners get a role `<select>` per non-owner member, owners shown with "Owner" badge, everyone else read-only
- [x] 5.2 Enforcement notice text (en/de): roles are enforced by the app, not GitHub; changes visible in git history
- [x] 5.3 Dismissible owner banner while `roles.json` does not exist, linking to the section (dismissal remembered per device)
- [x] 5.4 Component tests: owner changes a role and the mutation is called; non-owner sees no selects

## 6. Inline entry editing

- [x] 6.1 Create `src/features/tracker/InlineFields.tsx`: `InlineText`, `InlineTime`, `InlineDuration`; display as focusable button when editable, plain text otherwise; Enter/blur save, Escape cancel, unchanged value is a no-op
- [x] 6.2 Pure helper for inline time changes in `src/domain/time.ts` (start changed / end changed with overnight rule / duration changed) reusing manual-entry validation; unit tests incl. 25:00 rejection and 09:00–10:00 → 08:30 start
- [x] 6.3 Inline project and tag editing via popover with existing pickers
- [x] 6.4 Wire into `EntryRow`: lift "currently editing field" state into `EntryList` (one field at a time), disable while a save is pending, re-open edit mode with typed value on save error
- [x] 6.5 Styles in `global.css`: hover/focus affordance, error outline, ≥ 32 px touch targets, no layout shift between display and edit mode
- [x] 6.6 Component tests: description edit + Enter saves; Escape cancels; invalid duration keeps edit mode; worker sees other members' fields as plain text

## 7. Docs and verification

- [x] 7.1 README: roles section (matrix, owner = repo admin, how to assign, enforcement limitation, BREAKING note for existing teams), mention login language switch and theme toggle
- [x] 7.2 `npm test`, lint, and build pass
- [ ] 7.3 Manual check in demo mode and against a real data repo: language/theme on login, header toggle, inline edits, worker/editor/leader/owner behavior with two accounts
