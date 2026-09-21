# app-shell Specification

## Purpose
TBD - created by archiving change build-time-tracker-mvp. Update Purpose after archive.
## Requirements
### Requirement: Navigation
The system SHALL provide navigation to the pages Tracker, Statistics, Projects & Tags, and Settings, show the current user's avatar with a logout action, and keep a running timer visible on every page.

#### Scenario: Timer visible everywhere
- **WHEN** a timer is running and the user navigates to Statistics
- **THEN** the elapsed time and a stop button remain visible in the header

### Requirement: Static-hosting compatible routing
The system SHALL use hash-based routes so that every page URL works when opened directly or reloaded on GitHub Pages.

#### Scenario: Reload on stats page
- **WHEN** the user reloads the browser on the Statistics page
- **THEN** the Statistics page loads without a 404

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

### Requirement: Responsive clean design
The system SHALL be usable on screens from 360 px wide to desktop, without horizontal scrolling, with touch-friendly controls on mobile, and SHALL support light and dark themes following the system setting with a manual override.

#### Scenario: Phone layout
- **WHEN** the app is opened on a 375 px wide screen
- **THEN** navigation collapses into a mobile layout and all pages are usable without horizontal scrolling

#### Scenario: Dark mode
- **WHEN** the operating system uses a dark color scheme and the user has not chosen a theme
- **THEN** the app renders in its dark theme

### Requirement: Content Security Policy
The system SHALL ship a Content Security Policy that restricts scripts to the app's own origin and network connections to the GitHub API and Clockify's API hosts (`*.clockify.me`).

#### Scenario: Blocked foreign request
- **WHEN** any code attempts to send a request to a host other than `api.github.com` or a `clockify.me` subdomain
- **THEN** the browser blocks the request

#### Scenario: Clockify import request
- **WHEN** the Clockify import sends a request to `https://api.clockify.me`
- **THEN** the browser allows the request

### Requirement: GitHub Pages deployment
The repository SHALL contain a GitHub Actions workflow that, on every push to `main`, installs dependencies, runs tests, builds the app, and deploys it to GitHub Pages, failing the deployment if tests fail.

#### Scenario: Successful push
- **WHEN** a commit with passing tests is pushed to `main`
- **THEN** the new version is live on the GitHub Pages URL after the workflow completes

#### Scenario: Failing tests
- **WHEN** a commit with a failing test is pushed to `main`
- **THEN** the workflow fails and the previously deployed version stays live

### Requirement: Settings page
The system SHALL provide a settings page showing the connected data repository, the logged-in user and their role, language and theme selection, the "Team & roles" section, the JSON backup download, the Clockify import entry point for team leaders, and the logout action.

#### Scenario: Open settings
- **WHEN** a team leader opens Settings
- **THEN** the page shows `owner/name` of the data repository, the logged-in login with the role "Team leader", and the language, theme, team & roles, backup, Clockify import, and logout controls

#### Scenario: Worker opens settings
- **WHEN** a worker opens Settings
- **THEN** the page shows the role "Worker" and no Clockify import action

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

