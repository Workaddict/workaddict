## MODIFIED Requirements

### Requirement: Bilingual interface
The system SHALL provide the full UI in English and German, select the language from the browser settings on first visit, and let the user switch language at any time, including on the login page before signing in, with the choice remembered on that device; dates, numbers, and durations SHALL be formatted for the active language.

#### Scenario: German browser
- **WHEN** a user with browser language `de-DE` opens the app for the first time
- **THEN** the UI is shown in German

#### Scenario: Switch language
- **WHEN** the user switches the language to English in settings
- **THEN** all UI text changes to English immediately and stays English on the next visit

#### Scenario: Switch language on login page
- **WHEN** a user who is not logged in selects German in the language switch on the login page
- **THEN** the login page, including the token help, is shown in German immediately, and the app stays German after logging in and on the next visit

### Requirement: Settings page
The system SHALL provide a settings page showing the connected data repository, the logged-in user and their role, language and theme selection, the "Team & roles" section, the JSON backup download, the Clockify import entry point for team leaders, and the logout action.

#### Scenario: Open settings
- **WHEN** a team leader opens Settings
- **THEN** the page shows `owner/name` of the data repository, the logged-in login with the role "Team leader", and the language, theme, team & roles, backup, Clockify import, and logout controls

#### Scenario: Worker opens settings
- **WHEN** a worker opens Settings
- **THEN** the page shows the role "Worker" and no Clockify import action

## ADDED Requirements

### Requirement: One-click theme toggle
The system SHALL show a theme toggle button in the header and on the login page that switches between light and dark theme with one click. The button SHALL show the theme it switches to, SHALL remember the choice on the device, and, when the current preference is "System", SHALL switch to the opposite of the currently rendered theme. Settings SHALL keep the choice of "System", "Light", and "Dark".

#### Scenario: Toggle from system dark
- **WHEN** the preference is "System", the OS uses a dark scheme, and the user clicks the toggle
- **THEN** the app switches to the light theme and the preference becomes "Light"

#### Scenario: Toggle remembered
- **WHEN** the user switches to dark with the toggle and reloads the page
- **THEN** the app renders in the dark theme

#### Scenario: Back to system
- **WHEN** the user selects "System" in Settings after using the toggle
- **THEN** the theme follows the OS setting again
