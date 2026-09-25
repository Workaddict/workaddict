## MODIFIED Requirements

### Requirement: Short intro on the start page
The logged-out start page SHALL show, next to the sign-in form on wide screens and above it on phones, a short intro with a headline saying that Workaddict is free time tracking where the user's data stays theirs ("Free time tracking. Your data stays yours."), one sentence of description, and three short facts: it is free with no paid plans, it is open source with a link to the source code on GitHub (`https://github.com/Workaddict/workaddict`), and entries stay in the user's own private GitHub repository. The intro SHALL offer exactly two buttons: a primary "Try the demo" button that starts the demo session, and a secondary "Set up for free" button that opens the setup wizard at `#/setup`. Neither button's label or icon SHALL refer to teams only, because the wizard also offers a solo path. The intro SHALL NOT contain marketing elements such as product screenshots or mockups, comparison claims against other products, or requests to star the repository. The page header SHALL keep the language switch and the theme toggle.

#### Scenario: First visit
- **WHEN** a logged-out visitor opens the app
- **THEN** the page shows the headline "Free time tracking. Your data stays yours.", one sentence of description, the three facts, a primary "Try the demo" button, a secondary "Set up for free" button, and the sign-in form

#### Scenario: Start demo from intro
- **WHEN** the visitor clicks "Try the demo" in the intro
- **THEN** the demo session starts and the tracker page is shown, with nothing saved

#### Scenario: Start setup from intro
- **WHEN** the visitor clicks "Set up for free" in the intro
- **THEN** the setup wizard opens at `#/setup` and asks whether it is for one person or a team

#### Scenario: German intro
- **WHEN** a visitor with German selected opens the start page
- **THEN** the headline reads "Kostenlose Zeiterfassung. Deine Daten bleiben bei dir." and the buttons read "Demo ausprobieren" and "Kostenlos einrichten"

#### Scenario: Open source link
- **WHEN** the visitor clicks "Read the code on GitHub"
- **THEN** the project repository opens in a new tab

#### Scenario: Desktop layout
- **WHEN** a visitor opens the start page on a 1280 px wide screen
- **THEN** the intro and the sign-in form are shown side by side and the form is visible without scrolling

#### Scenario: Tall sign-in card keeps the intro in view
- **WHEN** a visitor on a 1280 px wide screen gets a sign-in diagnosis that makes the sign-in card taller than the screen
- **THEN** the intro stays aligned with the top of the card instead of moving down to its middle, and stays visible while the visitor scrolls

### Requirement: How it works steps
Below the highlights, the start page SHALL explain the setup in three numbered steps: create a private GitHub repository, create a fine-grained token for it, and sign in so the app sets up the repository. Step 1 SHALL offer a link that opens the setup wizard, step 2 SHALL offer a link that opens the token help page at `#/token-help` in a new tab, and step 3 SHALL offer a "Go to sign-in" link that scrolls the sign-in form into view and focuses its first field. All three step links SHALL look alike. Below the steps, a separate note SHALL tell members who received an invite link to open that link.

#### Scenario: Open token help from steps
- **WHEN** the visitor clicks the token help link in the "How it works" steps
- **THEN** the token help page opens at `#/token-help` in a new tab

#### Scenario: Open setup wizard from steps
- **WHEN** the visitor clicks the setup wizard link in the "How it works" steps
- **THEN** the setup wizard opens at `#/setup`

#### Scenario: Go to sign-in from steps
- **WHEN** the visitor clicks "Go to sign-in" in step 3
- **THEN** the sign-in form is scrolled into view and its first field has focus

### Requirement: Unchanged sign-in behavior
The sign-in form on the start page SHALL keep its fields, validation, classic-token warning, remember-me option, and session-expired and offline banners as before. Its heading SHALL address returning users ("Already set up? Sign in"). The form SHALL NOT repeat the demo button or an "or" divider, since the intro already offers the demo. Its setup link SHALL address visitors without a data repository ("No data repository yet? Start the setup"). The token help SHALL NOT be expanded inside the card; the card SHALL instead link to the token help page at `#/token-help`, opening in a new tab, so the card and the entered values stay as they are. Error messages and the token help MAY change as defined by the auth-and-workspace capability.

#### Scenario: Sign in from start page
- **WHEN** a visitor enters a valid repository and token in the form on the start page and submits
- **THEN** the user is signed in exactly as before

#### Scenario: Session expired banner
- **WHEN** the start page opens because the session expired
- **THEN** the "session expired" banner is shown inside the sign-in form

#### Scenario: Token help link in the card
- **WHEN** the visitor clicks "How do I get a token?" in the sign-in card
- **THEN** the token help page opens in a new tab, and the start page with anything already typed into the form stays unchanged in the original tab

#### Scenario: Single demo entry point
- **WHEN** a visitor views the start page
- **THEN** exactly one button starts the demo, and it is in the intro
