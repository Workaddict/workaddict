## MODIFIED Requirements

### Requirement: Content Security Policy
The system SHALL ship a Content Security Policy that restricts scripts to the app's own origin and network connections to the GitHub API and Clockify's API hosts (`*.clockify.me`).

#### Scenario: Blocked foreign request
- **WHEN** any code attempts to send a request to a host other than `api.github.com` or a `clockify.me` subdomain
- **THEN** the browser blocks the request

#### Scenario: Clockify import request
- **WHEN** the Clockify import sends a request to `https://api.clockify.me`
- **THEN** the browser allows the request

### Requirement: Settings page
The system SHALL provide a settings page showing the connected data repository and user, language and theme selection, the JSON backup download, the Clockify import entry point, and the logout action.

#### Scenario: Open settings
- **WHEN** the user opens Settings
- **THEN** the page shows `owner/name` of the data repository, the logged-in login, and the language, theme, backup, Clockify import, and logout controls
