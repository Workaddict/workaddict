## MODIFIED Requirements

### Requirement: Adding a project
The signed-in app SHALL offer "+ Add workspace", which opens a page with three ways to add a workspace: "Existing data repository" (selected by default), "Set up a new data repository" and "I have an invite link".

"Existing data repository" SHALL show the repository field and the token field from the sign-in form. When the vault holds a token that is not rejected and belongs to the repository's owner, or is a classic token, the page SHALL offer "Use your token for <owner>" as the default and "Enter a new token" as the alternative. The check SHALL be the same as for sign-in. On success the workspace SHALL be saved and the tab SHALL switch to it. On failure the app SHALL go to the fix page.

"Set up a new data repository" SHALL explain in one sentence that the wizard guides through creating the repository on GitHub and SHALL link to the setup wizard at `#/setup`. The app SHALL NOT create repositories itself.

"I have an invite link" SHALL show a field that accepts an invite link or `owner/name` and an "Open invite" button that opens the join flow for that repository, keeping `kind=user` from the link. Input that is neither SHALL show an inline error and SHALL NOT navigate.

The form on this page and on "Replace token" SHALL be shown in a card with inner padding and the width of the sign-in card; fields and buttons SHALL NOT touch the card border.

#### Scenario: Reusing a token
- **WHEN** a user with a token for `acme` adds `acme/other-data` and keeps "Use your token for acme"
- **THEN** the system checks access with that token and, on success, opens `acme/other-data` without asking for a token

#### Scenario: Other organization
- **WHEN** the user adds `globex/hours` and the vault holds only fine-grained tokens for `acme`
- **THEN** the page asks for a new token and offers no reuse

#### Scenario: Reused token lacks access
- **WHEN** the reused `acme` token cannot access `acme/other-data`
- **THEN** the app shows the fix page for that error, and "Change token or repository" returns to the add page with "Enter a new token" selected

#### Scenario: Start a new data repository
- **WHEN** a signed-in user opens "+ Add workspace" and chooses "Set up a new data repository"
- **THEN** the page offers a link to the setup wizard, and following it opens `#/setup` while the current workspace stays signed in

#### Scenario: Open an invite link
- **WHEN** the user chooses "I have an invite link", pastes `https://workaddict.me/#/join?repo=ben/time-data&kind=user` and clicks "Open invite"
- **THEN** the app opens `#/join?repo=ben/time-data&kind=user`

#### Scenario: Invalid invite input
- **WHEN** the user enters `not a repo` as invite link and clicks "Open invite"
- **THEN** the field shows an error and the page stays open

#### Scenario: Form card layout
- **WHEN** the add page or the replace-token page is shown on a desktop or a 375px wide screen
- **THEN** the form card has inner padding, is at most as wide as the sign-in card, and no field or button touches its border
