## MODIFIED Requirements

### Requirement: How it works steps
Below the highlights, the start page SHALL explain the setup in three numbered steps: create a private GitHub repository, create a fine-grained token for it, and sign in so the app sets up the repository. The steps SHALL offer a link that opens the setup wizard for team owners, a hint that members who received an invite link should open that link, and a link that opens the existing token help.

#### Scenario: Open token help from steps
- **WHEN** the visitor clicks the token help link in the "How it works" steps
- **THEN** the token help in the sign-in form is expanded and scrolled into view

#### Scenario: Open setup wizard from steps
- **WHEN** the visitor clicks the setup wizard link in the "How it works" steps
- **THEN** the setup wizard opens at `#/setup`

### Requirement: Unchanged sign-in behavior
The sign-in form on the start page SHALL keep its fields, validation, classic-token warning, remember-me option, session-expired and offline banners, and the demo button as before. Error messages and the token help MAY change as defined by the auth-and-workspace capability.

#### Scenario: Sign in from start page
- **WHEN** a visitor enters a valid repository and token in the form on the start page and submits
- **THEN** the user is signed in exactly as before

#### Scenario: Session expired banner
- **WHEN** the start page opens because the session expired
- **THEN** the "session expired" banner is shown inside the sign-in form
