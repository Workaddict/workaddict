## MODIFIED Requirements

### Requirement: Navigation
The system SHALL provide navigation to the pages Tracker, Statistics, Projects & Tags, and Settings, show the current user's avatar with a menu containing the workspace switcher, "+ Add workspace", "Lock" (for workspace sessions) or "Sign out" (for tab-only sessions), show the name of the open workspace in the top bar between the theme toggle and the avatar, where it opens the same menu and is briefly highlighted after a switch, and keep a running timer visible on every page.

#### Scenario: Timer visible everywhere
- **WHEN** a timer is running and the user navigates to Statistics
- **THEN** the elapsed time and a stop button remain visible in the header

#### Scenario: Current workspace in the top bar
- **WHEN** the user switches from `acme/time-data` to `globex/hours`
- **THEN** the top bar shows `globex/hours` next to the avatar and highlights it briefly, and clicking it opens the workspace switcher

#### Scenario: Avatar menu with workspaces
- **WHEN** a user with three saved workspaces opens the avatar menu
- **THEN** the menu shows the three workspaces with the active one marked, "+ Add workspace", Settings and "Lock"

### Requirement: Settings page
The system SHALL provide a settings page showing the connected data repository, the logged-in user and their role, language, theme and time format (24-hour or 12-hour) selection, the "Time zone" section (see the `time-zone` capability), the "Stop timer when I close the page" setting for this device, the "Team & roles" section, the JSON backup download, the Clockify import entry point and the "Shift entry times" action for team leaders, the "Workspaces" section, and an "About" section. The "Workspaces" section SHALL list the saved workspaces with a "Remove" action each, and SHALL offer the unlock mode, "Change passphrase", "Export workspaces", "Import workspaces" and "Forget all workspaces on this device"; in a tab-only session it SHALL offer "Sign out" and saving the current session as a workspace instead; with a plaintext session from an earlier version it SHALL offer "Protect with a passphrase and enable workspaces". The "Stop timer when I close the page" setting SHALL be on by default, SHALL be remembered on the device, and SHALL explain that the question appears when the app is opened again and that other devices keep showing the timer as running until then. The time format SHALL default to 24-hour and SHALL be remembered on the device. The "About" section SHALL show the app version, the credit "Made by Benedikt Lehner" with the name linking to `https://github.com/BenediktLehner`, and links to the GitHub project (`https://github.com/Workaddict/workaddict`), its issues, and its security policy, opening in a new tab; it SHALL be shown for every role and in demo mode.

#### Scenario: Open settings
- **WHEN** a team leader opens Settings
- **THEN** the page shows `owner/name` of the data repository, the logged-in login with the role "Team leader", and the language, theme, time format, time zone, stop-on-close, team & roles, backup, Clockify import, shift entry times, workspaces, and about controls

#### Scenario: Workspaces section
- **WHEN** a user with saved workspaces opens Settings
- **THEN** the "Workspaces" section lists the workspaces and offers unlock mode, change passphrase, export, import and forget all

#### Scenario: Stop-on-close setting
- **WHEN** a user opens Settings on a device where they never changed the setting
- **THEN** "Stop timer when I close the page" is on, and turning it off is remembered on that device after a reload

#### Scenario: Time format setting
- **WHEN** a user opens Settings on a device where they never changed the time format
- **THEN** "24-hour" is selected, and choosing "12-hour" is remembered on that device after a reload

#### Scenario: Worker opens settings
- **WHEN** a worker opens Settings
- **THEN** the page shows the role "Worker" and no Clockify import or shift entry times action

#### Scenario: About section
- **WHEN** any user, including a demo user, opens Settings
- **THEN** the "About" section shows the app version, "Made by Benedikt Lehner", and links to the GitHub project, its issues, and its security policy

### Requirement: Security policy
The repository SHALL contain a `SECURITY.md` that explains how to report a vulnerability privately, which version is supported, and the app's threat model (tokens held in browser storage, encrypted in the workspace vault or tab-only, what the vault and its export file protect against and that they do not protect against script running in the app or a weak passphrase, roles enforced by the app only, what the Content Security Policy and frame protection cover). The README SHALL link to it from a security section.

#### Scenario: Researcher finds a vulnerability
- **WHEN** someone opens the repository's security policy
- **THEN** they find a private reporting channel and do not need to open a public issue

#### Scenario: Vault threat model
- **WHEN** someone reads the threat model
- **THEN** it states that saved tokens are encrypted at rest and in exports with the user's passphrase, that an unlocked app holds them in memory, and that XSS protection relies on the Content Security Policy
