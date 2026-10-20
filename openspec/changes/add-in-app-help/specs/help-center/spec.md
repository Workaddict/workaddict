## ADDED Requirements

### Requirement: Help pages
The system SHALL serve a help index at `#/help` and one page per topic at `#/help/<topic>`, reachable signed in (inside the app layout) and signed out (with the public header), in English and German. Topics SHALL include at least: `token` (token & data repository), `workspaces` (workspaces & passphrase), `roles`, `work-groups`, `team-now`, `issue-links` (issue links & project boards), `connect-ai`, `export` (export & backup), `clockify-import`, `time-zone`, `shortcuts` and `glossary`. Each page SHALL have one `<h1>`, a short summary, sections with headings, and links to related topics. The `clockify-import` topic SHALL link to the existing import guide page. An unknown topic SHALL show the help index with a "Topic not found" notice. `#/token-help` SHALL redirect to `#/help/token`.

#### Scenario: Signed-out help
- **WHEN** a visitor who is not signed in opens `#/help/token`
- **THEN** the token help is shown with the public header and the token checklist

#### Scenario: Signed-in help
- **WHEN** a signed-in user opens `#/help/roles`
- **THEN** the roles page is shown inside the app layout, and a running timer stays visible in the header

#### Scenario: Old token help link
- **WHEN** a visitor opens `#/token-help`
- **THEN** the address changes to `#/help/token` and the token help is shown

#### Scenario: Unknown topic
- **WHEN** a user opens `#/help/does-not-exist`
- **THEN** the help index is shown with a "Topic not found" notice

#### Scenario: Same topics in both languages
- **WHEN** the test suite compares the English and German help content
- **THEN** both have the same topic ids, section counts, glossary ids, and every related link resolves

### Requirement: Glossary page
The system SHALL provide `#/help/glossary` listing every glossary term alphabetically in the active language with its one-sentence explanation and a link to its topic. Each term SHALL have an anchor so that `#/help/glossary?term=<id>` scrolls to it and highlights it.

#### Scenario: Jump to a term
- **WHEN** a user follows "Learn more" from a glossary term without its own topic
- **THEN** the glossary opens scrolled to that term with the term highlighted

### Requirement: Help buttons on complex features
The system SHALL show a "?" button with the accessible label "Help: <topic title>" next to the heading or control of each complex feature: Team now, Team & roles, Work groups, the issue field, the project board link, Connect AI, the Export menu, the Clockify import, Time zone, Workspaces (unlock mode, passphrase), and the token field on the sign-in page. The button SHALL open the matching help topic, signed in in the same tab and on the sign-in page in a new tab so typed input is kept.

#### Scenario: Help next to Team now
- **WHEN** an editor clicks the "?" next to "Team now"
- **THEN** `#/help/team-now` opens

#### Scenario: Help from the sign-in page
- **WHEN** a visitor who typed a repository name clicks the "?" next to the token field
- **THEN** the token help opens in a new tab and the sign-in form keeps the typed repository

### Requirement: Help overlay
The system SHALL open a help overlay when the user presses `?` while focus is not in a text field, select or editable area and no dialog is open, and from a "Help" entry in the avatar menu and in the public header. The overlay SHALL offer a search field that matches topic titles, keywords and glossary terms in the active language, ignoring case and accents, SHALL list the keyboard shortcuts, SHALL link to the help index, and SHALL offer "Restart tour" when signed in. It SHALL close with Escape and return focus to where it was.

#### Scenario: Open with the keyboard
- **WHEN** a user on the Tracker presses `?` with focus on the page body
- **THEN** the help overlay opens with focus in the search field

#### Scenario: Typing a question mark
- **WHEN** a user types `?` into the entry description field
- **THEN** the character is typed and no overlay opens

#### Scenario: Search
- **WHEN** a German user types "passwort" into the overlay search
- **THEN** the results include the "Workspaces & Passphrase" topic and the glossary term "Passphrase"

#### Scenario: Close
- **WHEN** the overlay is open and the user presses Escape
- **THEN** the overlay closes and focus returns to the element that had it before

### Requirement: Feedback on help pages
Each help page SHALL end with "Was this helpful?" and 👍/👎 buttons. 👍 SHALL show a thank-you note. 👎 SHALL show a link "Ask a question on GitHub" that opens a new GitHub Discussion in the project's Q&A category with the topic in the title, in a new tab. The app SHALL NOT store or send the answer.

#### Scenario: Not helpful
- **WHEN** a user clicks 👎 on the roles help page
- **THEN** a link to a new GitHub Discussion titled "Help: Roles" is shown, and no network request is made by the app

### Requirement: Help page quality
Help pages SHALL follow the app's design tokens and themes, SHALL NOT scroll horizontally at 320 px width in either language, SHALL load images only from the app's own origin with descriptive alternative text, SHALL render their text without HTML strings, and SHALL be loaded on demand so they do not enlarge the initial app bundle.

#### Scenario: Phone width in German
- **WHEN** every help page is shown in German at 320 px width
- **THEN** no page scrolls horizontally

#### Scenario: Images
- **WHEN** a help page with a screenshot is opened in the production build
- **THEN** the image is loaded from the app's origin, has alternative text, and the console shows no CSP violations
