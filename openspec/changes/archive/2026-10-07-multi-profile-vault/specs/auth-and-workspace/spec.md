## MODIFIED Requirements

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
