# landing-page Specification

## Purpose
TBD - created by archiving change landing-page-and-about. Update Purpose after archive.
## Requirements
### Requirement: Short intro on the start page
The logged-out start page SHALL show, next to the sign-in form on wide screens and above it on phones, a short intro with a headline stating that Workaddict is free and open-source time tracking, one sentence of description, and three short facts: it is free with no paid plans, it is open source with a link to the source code on GitHub (`https://github.com/Workaddict/workaddict`), and entries stay in the user's own private GitHub repository. The intro SHALL offer one "Try the demo" button that starts the demo session. The intro SHALL NOT contain marketing elements such as product screenshots or mockups, comparison claims against other products, or requests to star the repository. The page header SHALL keep the language switch and the theme toggle.

#### Scenario: First visit
- **WHEN** a logged-out visitor opens the app
- **THEN** the page shows the headline "Free and open-source time tracking", one sentence of description, the three facts, a "Try the demo" button, and the sign-in form

#### Scenario: Start demo from intro
- **WHEN** the visitor clicks "Try the demo" in the intro
- **THEN** the demo session starts and the tracker page is shown, with nothing saved

#### Scenario: Open source link
- **WHEN** the visitor clicks "Read the code on GitHub"
- **THEN** the project repository opens in a new tab

#### Scenario: Desktop layout
- **WHEN** a visitor opens the start page on a 1280 px wide screen
- **THEN** the intro and the sign-in form are shown side by side and the form is visible without scrolling

### Requirement: Benefit highlights
Below the intro and the sign-in form, the start page SHALL show six short benefit highlights, each with an icon, a title, and one sentence: no cost and no server, data in the user's own private repository with full history, team roles and the live team view, a timer that syncs across devices, statistics and exports (PDF, Excel, OpenDocument, CSV), and the Clockify import.

#### Scenario: Highlights visible
- **WHEN** a visitor scrolls below the intro and sign-in form
- **THEN** the page shows the six benefit highlights, including the Clockify import and the exports

### Requirement: How it works steps
Below the highlights, the start page SHALL explain the setup in three numbered steps: create a private GitHub repository, create a fine-grained token for it, and sign in so the app sets up the repository. The token step SHALL offer a link that opens the existing token help.

#### Scenario: Open token help from steps
- **WHEN** the visitor clicks the token help link in the "How it works" steps
- **THEN** the token help in the sign-in form is expanded and scrolled into view

### Requirement: Unchanged sign-in behavior
The sign-in form on the start page SHALL keep its fields, validation, error messages, classic-token warning, remember-me option, token help, session-expired and offline banners, and the demo button exactly as before this change.

#### Scenario: Sign in from start page
- **WHEN** a visitor enters a valid repository and token in the form on the start page and submits
- **THEN** the user is signed in exactly as before

#### Scenario: Session expired banner
- **WHEN** the start page opens because the session expired
- **THEN** the "session expired" banner is shown inside the sign-in form

### Requirement: Start page footer
The start page SHALL end with a footer that contains a link to the source code on GitHub (`https://github.com/Workaddict/workaddict`), a "Made by Benedikt Lehner" credit whose name links to `https://github.com/BenediktLehner`, a link to report an issue, and a link to the security policy. External links SHALL open in a new tab without sending a referrer.

#### Scenario: Footer links
- **WHEN** a visitor scrolls to the bottom of the start page
- **THEN** the footer shows "Made by Benedikt Lehner" with the name linking to the author's GitHub profile, and links to the source code, its issues, and its security policy, each opening in a new tab

### Requirement: Start page quality
The start page SHALL be fully translated into English and German, SHALL render correctly in light and dark themes, SHALL NOT scroll horizontally at 360 px width, and SHALL load no images, fonts, scripts, or data from origins other than the app itself (the Content Security Policy stays unchanged).

#### Scenario: German start page
- **WHEN** a visitor with German selected opens the start page
- **THEN** intro, form, highlights, steps, and footer text are German, while the author name and project name stay unchanged

#### Scenario: No external requests before login
- **WHEN** a visitor opens the start page in the production build
- **THEN** the browser makes no network requests to other origins and logs no CSP violations

