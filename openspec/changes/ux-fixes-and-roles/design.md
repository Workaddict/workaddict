## Context

Workaddict is a static React app on GitHub Pages; all data lives as JSON files in a private GitHub "data repo" and is written through the `StorageAdapter` (`RepoAdapter` over a `FileStore`, with GitHub and in-memory implementations). Today:

- Language (`src/i18n/index.ts`, `setLanguage`) and theme (`src/theme.ts`, `setTheme` with `system | light | dark`) are only switchable in Settings; the login page has neither.
- Entries are edited only through `EntryEditModal`, opened by the pencil button in `EntryList`.
- Every member may change the workspace and run the import; `RepoAdapter.assertWritable(ownerLogin)` only blocks writes to other members' entries (`notOwner`).
- Members come from `GET /repos/{o}/{r}/collaborators` (which returns a `permissions` object per user, including `admin`), with a fallback to logins found in file paths. `checkLogin` already reads `GET /repos/{o}/{r}` including `permissions.admin` for the current user.

Constraint: every member holds a token with write access to the whole data repo, so GitHub itself cannot enforce app-level roles.

## Goals / Non-Goals

**Goals:**
- Language switch and theme toggle reachable without opening Settings (including before login).
- Clockify-style click-to-edit fields in the entry list.
- Three roles with a fixed permission matrix, owner = repo admins, role assignment by owners only, checked both in the UI and in the storage adapter.

**Non-Goals:**
- Server-side or GitHub-enforced permissions (impossible without a backend; see Risks).
- Custom roles or per-project permissions.
- Restricting what workers can see (all members keep seeing all entries and stats).
- Editing other members' running timers.
- Inline editing of the date (stays in the dialog).

## Decisions

### 1. Language and theme controls are shared components
Extract `LanguageSwitch` (compact `<select>` or EN/DE segmented button) and `ThemeToggle` (icon button) into `src/components/`. Both call the existing `setLanguage` / `setTheme`, so storage keys and behavior stay identical to Settings. Login page places them in the card's top-right corner; the header puts `ThemeToggle` before the user menu (hidden on the smallest breakpoint if space is short, still available in the user menu).

`ThemeToggle` resolves the rendered theme via `matchMedia('(prefers-color-scheme: dark)')` when the preference is `system`, and sets the explicit opposite. Add a `useResolvedTheme()` hook to `theme.ts` that subscribes to both the preference and the media query so the icon updates live.

*Alternative:* cycle system → light → dark. Rejected: the user asked for a light/dark switch, and a three-state cycle makes one click sometimes do nothing visible.

### 2. Inline editing with per-field editors, reusing entry validation
New `src/features/tracker/InlineFields.tsx` with small components: `InlineText` (description), `InlineTime` (start / end, `HH:mm`), `InlineDuration` (`h:mm`), and inline use of the existing `ProjectPicker` / `TagPicker` in a popover. Each renders the display value as a button-styled element (keyboard focusable, `aria-label` "Edit description" etc.) when the user may edit, and plain text otherwise.

Saving builds the new entry and calls the existing `useSaveEntry` with `previousStart`. Time math reuses `src/domain/time.ts`:
- start changed → keep end, recompute; if the result is ≤ 0 or > 24 h, reject.
- end changed → keep start's date; an end before start means the next day (same rule as manual entries).
- duration changed → keep start, set end = start + duration.

Validation errors show inline (red outline + message) and keep edit mode. On mutation error, the field re-enters edit mode with the typed value (optimistic display is avoided to keep "never silently lose input").

Escape cancels; Enter and blur save; a value equal to the original is a no-op. Only one field is in edit mode at a time per list (state lifted to `EntryList`), which avoids two concurrent saves of the same entry.

The pencil button stays and opens `EntryEditModal` (needed for the date and as a fallback on touch devices).

*Alternative:* turn the whole row into a form on click. Rejected: heavier, and Clockify edits per field.

### 3. Roles data model
```ts
type Role = 'leader' | 'editor' | 'worker'
interface RolesFile { roles: Record<string, Role> }   // roles.json
interface Access { login: string; role: Role; owner: boolean }
```
`roles.json` is a separate file (not inside `workspace.json`) so role changes have their own commit history and editors' workspace writes never touch it. Missing file = `{ roles: {} }`; unknown values are treated as `worker`. No `SCHEMA_VERSION` bump: the file is additive, and old app versions simply ignore it.

Pure helpers in `src/domain/permissions.ts`:
```ts
effectiveRole(login, roles, owners): Role
can(access, action: 'editOthersEntries' | 'manageWorkspace' | 'import' | 'assignRoles'): boolean
```
`assignRoles` is `access.owner`, not a role check. Unit-tested as a table of the permission matrix.

### 4. Owner detection
- Current user: `permissions.admin` from `GET /repos/{o}/{r}`. It is fetched in `checkLogin` already; the adapter fetches it again on `init()` and on refresh (via the `Identity` interface: new `isAdmin(): Promise<boolean>`, cached for 60 s), so demotion/promotion in GitHub takes effect without re-login.
- Other members: `Identity.listCollaborators()` is extended to return `admin` per member from the collaborator `permissions` object. If the collaborator list is unavailable, only the current user's owner status is known; other members are shown with their `roles.json` role.
- Memory adapter (demo, tests): the identity is configured with a set of admin logins; the demo user is an admin.

### 5. Permission checks inside `RepoAdapter`
Add `getAccess(): Promise<Access>` and `listRoles(): Promise<{ login, role, owner }[]>` to `StorageAdapter`, and `setRole(login, role)` for owners. Replace `assertWritable(ownerLogin)` with `assertCan(action, targetLogin?)`:

| Adapter method | Requirement |
| --- | --- |
| `saveEntry`, `deleteEntry` of own entry | any role |
| `saveEntry`, `deleteEntry` of other login | `editOthersEntries` |
| timer methods | own timer only (unchanged) |
| `updateWorkspace` | `manageWorkspace` |
| `importData` | `import` |
| `setRole` | owner; target must not be an owner; value must be a valid role |

New `StorageError` kind `forbiddenRole` (i18n: "Your role does not allow this."). `notOwner` stays for timers.

`saveEntry` for another member writes to `PATHS.entries(entry.login, …)` and never changes `entry.login`. Commit messages: `entry: update 1:00 "Standup" for bob (carol)`.

Access is cached per refresh (one `roles.json` read — already part of the tree snapshot, so a blob-cache hit when unchanged — plus one repo request). The UI reads it through a `useAccess()` React Query hook refreshed with the rest of the data.

The existing `saveEntry` path that moves an entry between month files must use the entry owner's login for both old and new paths.

### 6. UI gating
`useAccess()` exposes `can(...)`. Gates:
- `EntryList`: edit/delete buttons and inline editors when `own || can('editOthersEntries')`.
- `WorkGroupsPage`: all mutating controls when `can('manageWorkspace')`.
- `ProjectPicker` / `TagPicker`: omit `onCreate` when not allowed.
- `SettingsPage`: Clockify import row only when `can('import')`; role badge next to the login; new "Team & roles" section listing members (avatar, login, role). Owners get a `<select>` per non-owner member; owners are shown with an "Owner" badge; others see read-only badges. The section includes the enforcement notice.
- Header user menu shows the role under the login.

## Risks / Trade-offs

- [Roles are client-side only; any member with a write token can edit `roles.json`, other members' entries, or the workspace directly on GitHub or with a modified app] → Documented in Settings and README; all writes stay visible in git history with the acting login in the commit message. The owner can revert. This matches the existing trust model ("the UI only lets you edit your own").
- [Owner status depends on GitHub admin permission, which fine-grained tokens report for the user, not the token] → Verify during implementation that `permissions.admin` on `GET /repos` reflects the user's role with a fine-grained token that has only Contents + Metadata; if not, fall back to comparing the login with the repo owner for personal repos and record in Open Questions.
- [Existing teams lose rights after the update: everyone except admins becomes a worker] → Mark as BREAKING in the proposal; README and a one-time banner for owners ("Assign roles in Settings → Team & roles") while `roles.json` does not exist.
- [Inline edit on touch devices: tap targets are small and blur fires unexpectedly] → Fields are at least 32 px tall; the pencil/modal stays as fallback.
- [Two quick inline saves on the same entry race (second overwrites first)] → Only one field editable at a time; the next edit waits until the save mutation settles (field disabled while pending).
- [Editors rewrite other members' entry files concurrently with the owner's own writes] → Covered by existing conflict-safe `write` with pure update functions; the update function finds the entry by id.

## Migration Plan

1. Deploy normally (push to `main`). No data migration: without `roles.json`, admins are team leaders and everyone else is a worker.
2. Owner opens Settings → Team & roles and assigns editors/team leaders; the first assignment creates `roles.json`.
3. Rollback: redeploy the previous version; it ignores `roles.json`. The file can stay.

## Open Questions

- Does `GET /repos/{o}/{r}` return `permissions.admin: true` for an org repo admin using a fine-grained token scoped to Contents + Metadata? (Check during task 3.)
- Does the collaborator list include `permissions` for fine-grained tokens without the Administration permission? If not, show only the current user's owner status and rely on `roles.json` for others.

**Findings (task 3.2):** GitHub's REST docs confirm that each collaborator in the list response has a `permissions` object (`pull`, `triage`, `push`, `maintain`, `admin`) and a `role_name` that already includes grants from teams and the organization. The docs name no fine-grained token permission for this endpoint. The app already handles a refused request by falling back. Implemented fallbacks: a user counts as admin when `permissions.admin` is true, **or** `role_name` is `admin`, **or** their login equals the repository owner (the account that owns a personal repo is always its admin). The admin status is cached for 60 s per session. Still unverified: a live check with a real fine-grained token against an organization repository. This is part of the manual check in task 7.3.
