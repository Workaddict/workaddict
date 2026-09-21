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
The system SHALL provide the full UI in English and German, select the language from the browser settings on first visit, and let the user switch language at any time with the choice remembered on that device; dates, numbers, and durations SHALL be formatted for the active language.

#### Scenario: German browser
- **WHEN** a user with browser language `de-DE` opens the app for the first time
- **THEN** the UI is shown in German

#### Scenario: Switch language
- **WHEN** the user switches the language to English in settings
- **THEN** all UI text changes to English immediately and stays English on the next visit

### Requirement: Responsive clean design
The system SHALL be usable on screens from 360 px wide to desktop, without horizontal scrolling, with touch-friendly controls on mobile, and SHALL support light and dark themes following the system setting with a manual override.

#### Scenario: Phone layout
- **WHEN** the app is opened on a 375 px wide screen
- **THEN** navigation collapses into a mobile layout and all pages are usable without horizontal scrolling

#### Scenario: Dark mode
- **WHEN** the operating system uses a dark color scheme and the user has not chosen a theme
- **THEN** the app renders in its dark theme

### Requirement: Content Security Policy
The system SHALL ship a Content Security Policy that restricts scripts to the app's own origin and network connections to the GitHub API.

#### Scenario: Blocked foreign request
- **WHEN** any code attempts to send a request to a host other than `api.github.com`
- **THEN** the browser blocks the request

### Requirement: GitHub Pages deployment
The repository SHALL contain a GitHub Actions workflow that, on every push to `main`, installs dependencies, runs tests, builds the app, and deploys it to GitHub Pages, failing the deployment if tests fail.

#### Scenario: Successful push
- **WHEN** a commit with passing tests is pushed to `main`
- **THEN** the new version is live on the GitHub Pages URL after the workflow completes

#### Scenario: Failing tests
- **WHEN** a commit with a failing test is pushed to `main`
- **THEN** the workflow fails and the previously deployed version stays live

### Requirement: Settings page
The system SHALL provide a settings page showing the connected data repository and user, language and theme selection, the JSON backup download, and the logout action.

#### Scenario: Open settings
- **WHEN** the user opens Settings
- **THEN** the page shows `owner/name` of the data repository, the logged-in login, and the language, theme, backup, and logout controls

