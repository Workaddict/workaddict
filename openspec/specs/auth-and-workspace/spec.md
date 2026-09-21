# auth-and-workspace Specification

## Purpose
TBD - created by archiving change build-time-tracker-mvp. Update Purpose after archive.
## Requirements
### Requirement: Token login
The system SHALL let a user log in by entering a GitHub Personal Access Token and a data repository identifier in the form `owner/name`, and SHALL validate both before granting access.

#### Scenario: Valid token and repository
- **WHEN** the user submits a token that authenticates against the GitHub API and a repository on which that token has push permission
- **THEN** the system logs the user in and shows the time tracker page

#### Scenario: Invalid token
- **WHEN** the user submits a token that GitHub rejects
- **THEN** the system stays on the login page and shows an "invalid token" error

#### Scenario: Repository not accessible
- **WHEN** the token is valid but the repository does not exist or is not visible to the token
- **THEN** the system shows an error explaining that the repository cannot be accessed and how to grant token access

#### Scenario: Read-only access
- **WHEN** the token can read the repository but lacks push permission
- **THEN** the system refuses login and shows an error that write access is required

### Requirement: Token setup guidance
The login page SHALL explain how to create a suitable token, including the recommended fine-grained token permissions (Contents: read and write, Metadata: read) and the classic-token fallback for repositories owned by another personal account.

#### Scenario: User opens token help
- **WHEN** the user expands the token help on the login page
- **THEN** the system shows step-by-step instructions with a link to GitHub's token creation page and a warning about the broader scope of classic tokens

### Requirement: Session persistence
The system SHALL store the token and repository in `localStorage` when the user selects "Remember me", and in `sessionStorage` otherwise.

#### Scenario: Remembered session
- **WHEN** a user who logged in with "Remember me" reopens the app in a new browser session
- **THEN** the system logs them in automatically without asking for the token

#### Scenario: Non-remembered session
- **WHEN** a user who logged in without "Remember me" closes the tab and reopens the app
- **THEN** the system shows the login page

#### Scenario: Stored token revoked
- **WHEN** the app starts with a stored token that GitHub now rejects
- **THEN** the system clears the stored credentials and shows the login page with a "session expired" message

### Requirement: Logout
The system SHALL provide a logout action that removes the token and repository from all browser storage and clears cached data belonging to the session.

#### Scenario: User logs out
- **WHEN** the user clicks "Log out"
- **THEN** the system removes stored credentials and cached data and shows the login page

### Requirement: Data repository initialization
The system SHALL initialize an empty data repository by creating `tracker.json` (with `schemaVersion`) and an empty `workspace.json` when they are absent.

#### Scenario: First login to an empty repository
- **WHEN** a user logs in to a repository without `tracker.json`
- **THEN** the system creates `tracker.json` and `workspace.json` and proceeds normally

#### Scenario: Newer schema version
- **WHEN** `tracker.json` declares a schema version newer than the app supports
- **THEN** the system opens in read-only mode and shows a message to reload or update the app

### Requirement: Team members
The system SHALL list team members as the collaborators of the data repository, showing each member's GitHub login, avatar, and role, marking repository admins as owners, and SHALL fall back to logins found in the repository's data files and `roles.json` when the collaborator list is unavailable.

#### Scenario: Collaborators available
- **WHEN** the collaborator list can be read with the user's token
- **THEN** the system shows all collaborators as members, with admins marked as owner and team leader

#### Scenario: Collaborators unavailable
- **WHEN** the collaborator request is denied
- **THEN** the system derives members from the logins under `entries/` and `timers/` and in `roles.json`, includes the current user, and determines only the current user's owner status (from the repository permission)

