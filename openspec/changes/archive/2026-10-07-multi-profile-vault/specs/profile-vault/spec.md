## ADDED Requirements

### Requirement: Encrypted workspace vault
The system SHALL store saved tokens and workspaces only in an encrypted vault in this browser's `localStorage`. It SHALL encrypt the vault with AES-GCM under a key derived from a passphrase the user chooses, using PBKDF2-SHA256 with at least 600,000 iterations and a random salt, and SHALL use a fresh random IV on every write. The vault SHALL store its key derivation parameters in plaintext and SHALL keep tokens, repository names, labels and logins encrypted. The system SHALL NOT send the vault, the passphrase or the key to any server. The passphrase SHALL have at least 10 characters.

#### Scenario: Vault contents at rest
- **WHEN** a user has saved workspaces for `acme/time-data` and `globex/hours`
- **THEN** `localStorage` contains no token and no repository name in plaintext

#### Scenario: Short passphrase
- **WHEN** the user enters a 9-character passphrase while creating the vault
- **THEN** the system refuses it and states the minimum length

#### Scenario: Wrong passphrase
- **WHEN** the user enters a wrong passphrase to unlock
- **THEN** the system shows "Wrong passphrase" and the vault stays locked and unchanged

### Requirement: Creating the vault
When the user signs in with "Save as a workspace on this device" and no vault exists, the system SHALL ask for a new passphrase (entered twice) and the unlock mode before saving. It SHALL state that the passphrase cannot be recovered, and that forgetting it means entering the tokens again.

#### Scenario: First saved sign-in
- **WHEN** a user without a vault signs in to `acme/time-data` with "Save as a workspace on this device" checked
- **THEN** the system asks for a passphrase twice and the unlock mode, shows the no-recovery notice, then creates the vault with one workspace and opens it

#### Scenario: Sign-in without saving
- **WHEN** a user signs in without "Save as a workspace on this device"
- **THEN** no vault is created or changed and the session lasts for this tab only

### Requirement: Unlock modes
The system SHALL offer two unlock modes: "Ask for the passphrase on every visit" (default) and "Stay unlocked on this device". In "Ask on every visit", the key SHALL be held only in memory of open tabs. In "Stay unlocked on this device", the key SHALL additionally be stored as a non-extractable WebCrypto key in IndexedDB. The mode SHALL be changeable in Settings.

#### Scenario: Ask on every visit
- **WHEN** a user in "Ask on every visit" mode closes all Workaddict tabs and opens the app again
- **THEN** the app asks for the passphrase before showing any workspace

#### Scenario: Stay unlocked
- **WHEN** a user in "Stay unlocked on this device" mode closes the browser and opens the app the next day
- **THEN** the app opens their most recently used workspace without asking for the passphrase

### Requirement: Shared unlock across tabs
An unlocked tab SHALL share the unlocked state with other Workaddict tabs on the same device, so that a new tab opened while another is unlocked does not ask for the passphrase. Changes to the vault in one tab SHALL be visible in all open tabs without a reload. Vault writes from different tabs SHALL NOT overwrite each other's changes when the browser supports Web Locks.

#### Scenario: New tab while unlocked
- **WHEN** one tab is unlocked in "Ask on every visit" mode and the user opens a second tab
- **THEN** the second tab is unlocked without a passphrase prompt

#### Scenario: Workspace added in another tab
- **WHEN** the user adds `globex/hours` in tab A
- **THEN** the workspace switcher in tab B lists `globex/hours` without a reload

### Requirement: Lock
The system SHALL provide a "Lock" action that removes the key from every open tab and from IndexedDB, ends the workspace sessions in all tabs, and shows the unlock screen. Tab-only sessions SHALL NOT be affected by Lock.

#### Scenario: Lock from the menu
- **WHEN** the user clicks "Lock" with two tabs open on two workspaces
- **THEN** both tabs show the unlock screen and opening the app again asks for the passphrase

### Requirement: Unlock screen
When a vault exists and is locked, the start page SHALL show an unlock form (passphrase, and the "Stay unlocked on this device" checkbox pre-set from the saved mode), a "Forgot passphrase?" action, an "Import workspaces" action and a "Sign in without saving" link. The unlock screen SHALL NOT show repository names.

#### Scenario: Locked start page
- **WHEN** a user with a locked vault opens the app
- **THEN** the start page shows the unlock form instead of the landing content, and no repository name is visible

### Requirement: Reset after forgotten passphrase
"Forgot passphrase?" SHALL explain that the passphrase cannot be recovered and SHALL offer "Reset workspaces", which after confirmation deletes the vault, the stored key, the legacy remembered session and the cached repository data on this device, and shows the sign-in page. It SHALL state that nothing on GitHub changes.

#### Scenario: Reset
- **WHEN** the user confirms "Reset workspaces"
- **THEN** `localStorage` no longer contains the vault, the IndexedDB key and blob cache are empty, and the sign-in page is shown

### Requirement: Workspaces and tokens
A workspace SHALL consist of a data repository (`owner/name`), its branch, a name the user can change in Settings (default `owner/name`, kept encrypted in the vault), and a reference to a stored token. A token SHALL be stored once and MAY be referenced by several workspaces. For each token the system SHALL store the GitHub login it belongs to, and its kind (classic or fine-grained). A repository SHALL appear in at most one workspace.

#### Scenario: Renaming a workspace
- **WHEN** the user renames `globex/hours` to "Globex client" in Settings
- **THEN** the switcher and the top bar show "Globex client", and an empty name shows `globex/hours` again

#### Scenario: Two repositories with one token
- **WHEN** the user adds `acme/time-data` and `acme/other-data` with the same fine-grained token
- **THEN** the vault holds one token and two workspaces referencing it

#### Scenario: Adding an existing repository
- **WHEN** the user adds `acme/time-data` and a workspace for it already exists
- **THEN** the system switches to the existing workspace and offers to replace its token instead of creating a duplicate

### Requirement: Adding a project
The signed-in app SHALL offer "+ Add workspace", which opens a page with the repository field and the token field from the sign-in form. When the vault holds a token that is not rejected and belongs to the repository's owner, or is a classic token, the page SHALL offer "Use your token for <owner>" as the default and "Enter a new token" as the alternative. The check SHALL be the same as for sign-in. On success the workspace SHALL be saved and the tab SHALL switch to it. On failure the app SHALL go to the fix page.

#### Scenario: Reusing a token
- **WHEN** a user with a token for `acme` adds `acme/other-data` and keeps "Use your token for acme"
- **THEN** the system checks access with that token and, on success, opens `acme/other-data` without asking for a token

#### Scenario: Other organization
- **WHEN** the user adds `globex/hours` and the vault holds only fine-grained tokens for `acme`
- **THEN** the page asks for a new token and offers no reuse

#### Scenario: Reused token lacks access
- **WHEN** the reused `acme` token cannot access `acme/other-data`
- **THEN** the app shows the fix page for that error, and "Change token or repository" returns to the add page with "Enter a new token" selected

### Requirement: Workspace switcher
The avatar menu SHALL list all workspaces by label, mark the workspace active in this tab, and switch to another workspace with one click and no confirmation. A switch SHALL open the selected workspace's data on the tracker page, SHALL discard the previous workspace's loaded data from memory, and SHALL keep the content cache that is addressed by blob SHA. When the menu opens, the system SHALL check each other workspace for a running timer of the user and SHALL mark such workspaces with a timer indicator. A failed check SHALL show no indicator. Workspaces with a rejected token SHALL be marked "Token rejected".

#### Scenario: One-click switch
- **WHEN** the user on `acme/time-data` clicks `globex/hours` in the avatar menu
- **THEN** the tracker shows `globex/hours` data without asking for a token or confirmation

#### Scenario: Timer running in another workspace
- **WHEN** the user has a running timer in `acme/time-data` and opens the menu while on `globex/hours`
- **THEN** `acme/time-data` shows the timer indicator

### Requirement: Per-tab active workspace
Each tab SHALL have its own active workspace, which survives a reload of that tab. A tab opened without an active workspace SHALL open the most recently used workspace. Switching in one tab SHALL NOT change the workspace shown in other tabs.

#### Scenario: Two projects side by side
- **WHEN** tab A shows `acme/time-data` and the user switches tab B to `globex/hours`
- **THEN** tab A still shows `acme/time-data`, and reloading tab A keeps `acme/time-data`

#### Scenario: New tab
- **WHEN** the user last switched to `globex/hours` and opens a new tab
- **THEN** the new tab opens `globex/hours`

### Requirement: Removing a workspace
The avatar menu and Settings SHALL offer "Remove this workspace". After confirmation it SHALL delete the workspace and, when no other workspace references the token, the token. When the removed workspace is active, the tab SHALL switch to the most recently used remaining workspace, or show the workspace picker when none is left.

#### Scenario: Remove last workspace of a token
- **WHEN** the user removes `globex/hours`, the only workspace using the globex token
- **THEN** the vault no longer contains that token

### Requirement: Workspace picker
When the vault is unlocked and the tab has no workspace to open (all tokens rejected, the last workspace removed, or the active workspace was removed elsewhere), the start page SHALL show the workspaces with their status, "+ Add workspace", "Import workspaces" and "Sign in without saving".

#### Scenario: All tokens rejected
- **WHEN** the only stored token is rejected by GitHub
- **THEN** the workspace picker lists its workspaces marked "Token rejected", each leading to the fix page with "Replace token for this workspace"

### Requirement: Export workspaces
Settings SHALL offer "Export workspaces", which asks for the current passphrase and downloads the encrypted vault as a JSON file named `workaddict-workspaces-<YYYY-MM-DD>.json`. The export SHALL state that the file contains the tokens encrypted with the passphrase, that anyone with the file and passphrase gets their access, and that the file is useless without the passphrase.

#### Scenario: Export
- **WHEN** the user exports with the correct passphrase
- **THEN** a file downloads that contains no plaintext token or repository name and that the import on another device accepts with the same passphrase

### Requirement: Import workspaces
The system SHALL import an exported file after the user enters the file's passphrase. Without a vault on the device, the file SHALL become the vault and the user SHALL choose the unlock mode. With an unlocked vault, workspaces SHALL be merged by repository (case-insensitive): new repositories are added, and for a repository with a different token the user chooses per repository whether to keep this device's token or use the imported one. The local passphrase SHALL stay unchanged. Files with an unknown format or a newer format version SHALL be refused with a message.

#### Scenario: Import on a new device
- **WHEN** a user without a vault imports a file with the correct passphrase and chooses "Stay unlocked on this device"
- **THEN** the device holds the same workspaces and opens the most recently used one

#### Scenario: Merge with a conflict
- **WHEN** both the device and the file have `acme/time-data` with different tokens, and the file adds `globex/hours`
- **THEN** the user is asked which `acme/time-data` token to keep, and `globex/hours` is added

#### Scenario: Wrong file passphrase
- **WHEN** the file's passphrase is wrong
- **THEN** the import is refused and the local vault is unchanged

### Requirement: Change passphrase
Settings SHALL offer "Change passphrase", which requires the current passphrase, re-encrypts the vault under the new one with a new salt, and keeps the unlock mode. Other tabs SHALL stay unlocked with the new key.

#### Scenario: Passphrase changed
- **WHEN** the user changes the passphrase
- **THEN** the old passphrase no longer unlocks the vault and earlier exports still need the old passphrase

### Requirement: Migration of remembered plaintext sessions
When a session remembered by an earlier version exists in plaintext in `localStorage` and no vault exists, the system SHALL sign in from it as before and SHALL offer "Protect with a passphrase and enable workspaces" in the app and in Settings. Accepting SHALL create the vault with that token and repository as the first workspace and SHALL then delete the plaintext session. The system SHALL NOT write new plaintext sessions to `localStorage`.

#### Scenario: Accept migration
- **WHEN** a user with a remembered plaintext session accepts and sets a passphrase
- **THEN** the vault holds the workspace, the plaintext key `workaddict.session` is gone from `localStorage`, and the user stays signed in

#### Scenario: Ignore migration
- **WHEN** the user dismisses the offer
- **THEN** the app keeps working with the plaintext session and Settings still shows the offer
