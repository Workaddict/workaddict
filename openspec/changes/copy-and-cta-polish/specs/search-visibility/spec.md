## MODIFIED Requirements

### Requirement: Crawlable static content
The served `index.html` SHALL contain, inside the app's root element, static English content matching the start page: the intro headline as the only `<h1>`, the one-sentence description, the three facts, the six benefit highlights, the three "How it works" steps, and links to the source code on GitHub and to the author. The app SHALL replace this content when it starts, so users with JavaScript see the normal start page. The static content SHALL be readable without JavaScript and SHALL NOT be hidden by CSS.

#### Scenario: Content without JavaScript
- **WHEN** the page is loaded with JavaScript disabled
- **THEN** the headline "Free time tracking. Your data stays yours.", the highlights including "Switch from Clockify", the setup steps, and a link to the source code are visible

#### Scenario: App replaces fallback
- **WHEN** the page is loaded with JavaScript enabled
- **THEN** the start page renders as before, and no static fallback content remains in the DOM

#### Scenario: Headline stays in sync
- **WHEN** the English `landing.headline` text differs from the static `<h1>` in `index.html`
- **THEN** the test suite fails
