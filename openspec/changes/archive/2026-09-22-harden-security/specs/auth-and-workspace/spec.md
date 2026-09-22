## MODIFIED Requirements

### Requirement: Token setup guidance
The login page SHALL explain how to create a suitable token, including the recommended fine-grained token permissions (Contents: read and write, Metadata: read) and the classic-token fallback for repositories owned by another personal account. The system SHALL warn, without blocking login, when the entered token is a classic token, and SHALL show on the settings page for the whole session that a classic token is in use, including a statement that the token can access all of the user's private repositories when GitHub reports the `repo` scope.

#### Scenario: User opens token help
- **WHEN** the user expands the token help on the login page
- **THEN** the system shows step-by-step instructions with a link to GitHub's token creation page and a warning about the broader scope of classic tokens

#### Scenario: Classic token entered
- **WHEN** the user types a token starting with `ghp_` into the login form
- **THEN** a warning next to the field recommends a fine-grained token and links to the setup steps, and the login button stays enabled

#### Scenario: Classic token with repo scope in settings
- **WHEN** a user logged in with a classic token whose `X-OAuth-Scopes` include `repo` opens the settings page
- **THEN** the settings page states that this token can read and write all of the user's private repositories and recommends replacing it with a fine-grained token

#### Scenario: Fine-grained token
- **WHEN** the user logs in with a token starting with `github_pat_`
- **THEN** no classic-token warning is shown on the login or settings page

### Requirement: Session persistence
The system SHALL store the token and repository in `localStorage` when the user selects "Remember me", and in `sessionStorage` otherwise. The "Remember me" option SHALL state that the token is then saved on this device and that the option is meant for personal devices only.

#### Scenario: Remembered session
- **WHEN** a user who logged in with "Remember me" reopens the app in a new browser session
- **THEN** the system logs them in automatically without asking for the token

#### Scenario: Non-remembered session
- **WHEN** a user who logged in without "Remember me" closes the tab and reopens the app
- **THEN** the system shows the login page

#### Scenario: Stored token revoked
- **WHEN** the app starts with a stored token that GitHub now rejects
- **THEN** the system clears the stored credentials and shows the login page with a "session expired" message

#### Scenario: Shared-device notice
- **WHEN** the user views the login form
- **THEN** the "Remember me" option shows a note that the token will be saved on this device and should only be used on personal devices
