## ADDED Requirements

### Requirement: Visual guidance in setup steps
Each setup wizard step and each join step that sends the user to a GitHub screen SHALL show a cropped screenshot of the control the user has to find there, loaded from the app's own origin, with alternative text describing what to look for, and the step SHALL stay understandable when the image does not load. Terms from the glossary in these steps SHALL be marked as glossary terms with info tips (see `contextual-hints`), and each step SHALL link to the matching help topic.

#### Scenario: Token step
- **WHEN** a new member views the token step of the join flow
- **THEN** the step shows a screenshot of GitHub's fine-grained token form with the repository access setting highlighted, and "Token" is underlined with a tip

#### Scenario: Image missing
- **WHEN** the screenshot of the repository step fails to load
- **THEN** the step text, the "Done when …" criterion and the actions are still shown, and the alternative text describes the screen
