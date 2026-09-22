## MODIFIED Requirements

### Requirement: Settings page
The system SHALL provide a settings page showing the connected data repository, the logged-in user and their role, language and theme selection, the "Team & roles" section, the JSON backup download, the Clockify import entry point for team leaders, the logout action, and an "About" section. The "About" section SHALL show the app version, the credit "Made by Benedikt Lehner" with the name linking to `https://github.com/BenediktLehner`, and links to the GitHub project (`https://github.com/Workaddict/workaddict`), its issues, and its security policy, opening in a new tab; it SHALL be shown for every role and in demo mode.

#### Scenario: Open settings
- **WHEN** a team leader opens Settings
- **THEN** the page shows `owner/name` of the data repository, the logged-in login with the role "Team leader", and the language, theme, team & roles, backup, Clockify import, logout, and about controls

#### Scenario: Worker opens settings
- **WHEN** a worker opens Settings
- **THEN** the page shows the role "Worker" and no Clockify import action

#### Scenario: About section
- **WHEN** any user, including a demo user, opens Settings
- **THEN** the "About" section shows the app version, "Made by Benedikt Lehner", and links to the GitHub project, its issues, and its security policy
