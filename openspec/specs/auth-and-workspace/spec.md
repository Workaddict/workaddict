# auth-and-workspace Specification

## Purpose
TBD - created by archiving change build-time-tracker-mvp. Update Purpose after archive.
## Requirements
### Requirement: Token login
The system SHALL let a user log in by entering a GitHub Personal Access Token and a data repository identifier in the form `owner/name`, and SHALL validate both before granting access. When the repository cannot be accessed, the system SHALL look up the repository owner with the same token to tell apart a nonexistent owner, an organization-owned repository, the user's own repository, and another user's personal repository. Every sign-in error, on the start page, in the setup wizard, in the join flow, on the "Add workspace" page and when replacing a workspace's token, SHALL redirect to the sign-in fix page (`#/fix`) defined in the `sign-in-recovery` capability instead of showing the diagnosis inside the sign-in form.

#### Scenario: Valid token and repository
- **WHEN** the user submits a token that authenticates against the GitHub API and a repository on which that token has push permission
- **THEN** the system logs the user in and shows the time tracker page

#### Scenario: Sign-in fails on the start page
- **WHEN** the user submits the start-page sign-in form and the check fails with any error
- **THEN** the app navigates to `#/fix` for that error and repository, and the start page shows no inline sign-in diagnosis

#### Scenario: Sign-in fails in the setup wizard or join flow
- **WHEN** the sign-in step of the setup wizard or the join flow fails
- **THEN** the app navigates to `#/fix`, and "Change token or repository" there leads back to that wizard or join step with the repository prefilled

#### Scenario: Adding a project fails
- **WHEN** the check on the "Add workspace" page fails while the user is signed in to another workspace
- **THEN** the app navigates to `#/fix` with `from=add`, and the user's current workspace stays signed in

#### Scenario: Owner lookup distinguishes the cause
- **WHEN** the token is valid and the repository is not accessible
- **THEN** the error passed to the fix page is one of `ownerNotFound`, `orgRepoNotAccessible`, `ownRepoNotAccessible`, `personalRepoNotAccessible`, or `repoNotFound` when the owner lookup itself fails

#### Scenario: Read-only access
- **WHEN** the token can read the repository but lacks push permission
- **THEN** the system refuses login and redirects to the fix page with the error `noPushAccess`

#### Scenario: Session notices stay on the start page
- **WHEN** the start page opens after the session expired or while GitHub cannot be reached
- **THEN** the corresponding notice is shown in the sign-in card as before, without a redirect

### Requirement: Token setup guidance
The login page SHALL link to a separate token help page (`#/token-help`, available while logged out) that opens in a new tab and explains how to create a suitable token, including choosing the organization that owns the data repository as the resource owner, selecting only the data repository, the recommended fine-grained token permissions (Contents: read and write, Metadata: read), that the invitation must be accepted and repository access must exist before the token is created, that organization owners may have to approve the token, and the classic-token fallback for repositories owned by another personal account. The help page SHALL link to a prefilled token creation page and SHALL offer a "Back to sign-in" button that closes its tab, or opens the start page when the browser does not allow closing it. The system SHALL warn, without blocking login, when the entered token is a classic token, and SHALL show on the settings page for the whole session that a classic token is in use, including a statement that the token can access all of the user's private repositories when GitHub reports the `repo` scope.

#### Scenario: User opens token help
- **WHEN** the user clicks "How do I get a token?" on the login page
- **THEN** the token help page opens in a new tab and shows step-by-step instructions covering order, resource owner, repository selection, permissions and approval, with a link to GitHub's prefilled token creation page and a warning about the broader scope of classic tokens

#### Scenario: Back to sign-in
- **WHEN** the user clicks "Back to sign-in" on the token help page
- **THEN** the help tab closes and the user is back at the sign-in form, or the start page opens in the same tab if the browser does not allow closing it

#### Scenario: Classic token entered
- **WHEN** the user types a token starting with `ghp_` into the login form
- **THEN** a warning next to the field recommends a fine-grained token and links to the setup steps, and the login button stays enabled

### Requirement: Session persistence
The sign-in form SHALL offer "Save as a workspace on this device" (checked by default) in place of "Remember me". When it is checked, the system SHALL save the token and repository in the encrypted workspace vault defined in the `profile-vault` capability. When it is unchecked, the system SHALL store them in `sessionStorage` for this tab only. The system SHALL NOT write tokens to `localStorage` in plaintext. The option SHALL state that the token is then saved on this device, encrypted with the user's passphrase, and that the option is meant for personal devices.

#### Scenario: Saved workspace
- **WHEN** a user who signed in with "Save as a workspace on this device" reopens the app in a new browser session
- **THEN** the system opens the workspace without asking for the token, after the passphrase when the unlock mode is "Ask on every visit"

#### Scenario: Tab-only session
- **WHEN** a user who signed in without "Save as a workspace on this device" closes the tab and reopens the app
- **THEN** the system shows the sign-in page, or the unlock screen when a vault exists

#### Scenario: Stored token revoked
- **WHEN** the app opens a saved workspace whose token GitHub now rejects, or GitHub rejects it during use
- **THEN** the system keeps the vault, marks the token "Token rejected" on every workspace using it, and shows the workspace picker

#### Scenario: Tab-only token revoked
- **WHEN** GitHub rejects the token of a tab-only session
- **THEN** the system clears the tab's credentials and shows the sign-in page with a "session expired" message

#### Scenario: Shared-device notice
- **WHEN** the user views the sign-in form
- **THEN** the "Save as a workspace on this device" option shows a note that the token will be saved on this device, encrypted, and should only be used on personal devices

### Requirement: Logout
The system SHALL replace the single logout action with: "Lock" (defined in `profile-vault`) for workspace sessions, "Sign out" for tab-only sessions, which removes the tab's token and clears cached data belonging to the session, "Remove this workspace", and "Forget all workspaces on this device" in Settings. "Forget all workspaces on this device" SHALL, after confirmation, remove the vault, the stored key, any plaintext session, the tab session and all cached repository data, and SHALL show the sign-in page in every open tab.

#### Scenario: Tab-only sign out
- **WHEN** a user in a tab-only session clicks "Sign out"
- **THEN** the system removes the tab's credentials and cached data and shows the sign-in page

#### Scenario: Forget all
- **WHEN** the user confirms "Forget all workspaces on this device"
- **THEN** no token remains in `localStorage`, `sessionStorage` or IndexedDB, the blob cache is empty, and every open tab shows the sign-in page

### Requirement: Data repository initialization
The system SHALL initialize an empty data repository by creating `tracker.json` (with `schemaVersion`) and an empty `workspace.json` when they are absent. The new `workspace.json` SHALL contain `timeZone` set to the zone the browser reports, unless the browser reports UTC, in which case `timeZone` SHALL be omitted.

#### Scenario: First login to an empty repository
- **WHEN** a user logs in to a repository without `tracker.json`
- **THEN** the system creates `tracker.json` and `workspace.json` and proceeds normally

#### Scenario: Newer schema version
- **WHEN** `tracker.json` declares a schema version newer than the app supports
- **THEN** the system opens in read-only mode and shows a message to reload or update the app

#### Scenario: Initial team time zone
- **WHEN** a user whose browser reports `Europe/Vienna` logs in to a repository without `tracker.json`
- **THEN** the created `workspace.json` contains `"timeZone": "Europe/Vienna"`

#### Scenario: Browser reports UTC on initialization
- **WHEN** a user whose browser reports `UTC` logs in to a repository without `tracker.json`
- **THEN** the created `workspace.json` has no `timeZone`

### Requirement: Team members
The system SHALL list team members as the collaborators of the data repository, showing each member's GitHub login, avatar, and role, marking repository admins as owners, and SHALL fall back to logins found in the repository's data files and `roles.json` when the collaborator list is unavailable.

#### Scenario: Collaborators available
- **WHEN** the collaborator list can be read with the user's token
- **THEN** the system shows all collaborators as members, with admins marked as owner and team leader

#### Scenario: Collaborators unavailable
- **WHEN** the collaborator request is denied
- **THEN** the system derives members from the logins under `entries/` and `timers/` and in `roles.json`, includes the current user, and determines only the current user's owner status (from the repository permission)

