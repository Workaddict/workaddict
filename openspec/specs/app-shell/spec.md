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
The system SHALL ship a Content Security Policy that restricts scripts to the app's own origin and network connections to the GitHub API and Clockify's API hosts (`*.clockify.me`). The policy SHALL require Trusted Types for script sinks (`require-trusted-types-for 'script'`) and SHALL allow no Trusted Types policies except ones a bundled library is shown to need, each named explicitly. The policy SHALL NOT allow inline styles unless a bundled library is shown to need them, and the build configuration SHALL name that library.

#### Scenario: Blocked foreign request
- **WHEN** any code attempts to send a request to a host other than `api.github.com` or a `clockify.me` subdomain
- **THEN** the browser blocks the request

#### Scenario: Clockify import request
- **WHEN** the Clockify import sends a request to `https://api.clockify.me`
- **THEN** the browser allows the request

#### Scenario: Injected HTML string
- **WHEN** any code in the production build assigns a plain string to `innerHTML` or a script's `src`
- **THEN** the browser blocks the assignment

#### Scenario: App works under the policy
- **WHEN** a user opens every page, exports PDF and Excel, and runs the Clockify import in the production build
- **THEN** the browser console shows no CSP or Trusted Types violations

### Requirement: GitHub Pages deployment
The repository SHALL contain a GitHub Actions workflow that, on every push to `main`, installs dependencies, checks production dependencies for known vulnerabilities, runs tests, builds the app, and deploys it to GitHub Pages, failing the deployment if tests fail or a production dependency has a known vulnerability of high or critical severity. The workflow SHALL reference every action by full commit SHA, SHALL NOT persist the checkout credentials, and SHALL grant Pages and OIDC write permissions only to the deploy job.

#### Scenario: Successful push
- **WHEN** a commit with passing tests is pushed to `main`
- **THEN** the new version is live on the GitHub Pages URL after the workflow completes

#### Scenario: Failing tests
- **WHEN** a commit with a failing test is pushed to `main`
- **THEN** the workflow fails and the previously deployed version stays live

#### Scenario: Vulnerable dependency
- **WHEN** `npm audit` reports a high-severity advisory for a production dependency
- **THEN** the workflow fails before building and the previously deployed version stays live

#### Scenario: Pinned actions
- **WHEN** the workflow file is inspected
- **THEN** every `uses:` line references a 40-character commit SHA

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

### Requirement: Frame protection
The system SHALL NOT render the application when it is loaded inside a frame, and SHALL instead show a short message with a link that opens the app in its own tab.

#### Scenario: Embedded by another site
- **WHEN** another website loads the app in an `iframe`
- **THEN** the frame shows only the message and link, and no login form or data

#### Scenario: Top-level visit
- **WHEN** the user opens the app URL directly
- **THEN** the app renders normally

### Requirement: Dependency updates
The repository SHALL configure automated dependency update pull requests for npm packages and GitHub Actions at least weekly, with a waiting period of at least 7 days after a release before it is proposed.

#### Scenario: New dependency release
- **WHEN** a new version of a dependency is published
- **THEN** an update pull request is opened no earlier than 7 days after the release

### Requirement: Security policy
The repository SHALL contain a `SECURITY.md` that explains how to report a vulnerability privately, which version is supported, and the app's threat model (token held in browser storage, roles enforced by the app only, what the Content Security Policy and frame protection cover). The README SHALL link to it from a security section.

#### Scenario: Researcher finds a vulnerability
- **WHEN** someone opens the repository's security policy
- **THEN** they find a private reporting channel and do not need to open a public issue

