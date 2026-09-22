## MODIFIED Requirements

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

## ADDED Requirements

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
