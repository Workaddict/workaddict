## MODIFIED Requirements

### Requirement: Settings page
The system SHALL provide a settings page showing the connected data repository, the logged-in user and their role, language, theme and time format (24-hour or 12-hour) selection, the "Stop timer when I close the page" setting for this device, the "Team & roles" section, the JSON backup download, the Clockify import entry point for team leaders, the logout action, and an "About" section. The "Stop timer when I close the page" setting SHALL be on by default, SHALL be remembered on the device, and SHALL explain that the question appears when the app is opened again and that other devices keep showing the timer as running until then. The time format SHALL default to 24-hour and SHALL be remembered on the device. The "About" section SHALL show the app version, the credit "Made by Benedikt Lehner" with the name linking to `https://github.com/BenediktLehner`, and links to the GitHub project (`https://github.com/Workaddict/workaddict`), its issues, and its security policy, opening in a new tab; it SHALL be shown for every role and in demo mode.

#### Scenario: Open settings
- **WHEN** a team leader opens Settings
- **THEN** the page shows `owner/name` of the data repository, the logged-in login with the role "Team leader", and the language, theme, time format, stop-on-close, team & roles, backup, Clockify import, logout, and about controls

#### Scenario: Stop-on-close setting
- **WHEN** a user opens Settings on a device where they never changed the setting
- **THEN** "Stop timer when I close the page" is on, and turning it off is remembered on that device after a reload

#### Scenario: Time format setting
- **WHEN** a user opens Settings on a device where they never changed the time format
- **THEN** "24-hour" is selected, and choosing "12-hour" is remembered on that device after a reload

#### Scenario: Worker opens settings
- **WHEN** a worker opens Settings
- **THEN** the page shows the role "Worker" and no Clockify import action

#### Scenario: About section
- **WHEN** any user, including a demo user, opens Settings
- **THEN** the "About" section shows the app version, "Made by Benedikt Lehner", and links to the GitHub project, its issues, and its security policy
