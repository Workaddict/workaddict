## MODIFIED Requirements

### Requirement: Setup path for one person or a team
The setup wizard SHALL first ask whether the setup is for one person or for a team, and SHALL remember the answer with the rest of the progress. The choice SHALL be presented as a selector with the two options "Just me" and "A team" that stays visible at the top of the wizard after a choice is made: choosing an option SHALL mark it as selected and open the rest of the wizard below it, and the user SHALL be able to switch to the other option at any time from the same selector. Before a choice is made, nothing below the selector SHALL be shown except a short hint on which option to pick. A person who only tracks their own time SHALL NOT be asked to create an organization: a fine-grained token reaches a private repository in the user's own account without one.

For the solo path the wizard SHALL ask for the user's GitHub username instead of an organization name and SHALL show only these steps: create the private data repository; create the token; sign in. It SHALL NOT show the organization, base permission, token approval, invite or invite-link steps, and SHALL state that a repository in a personal account cannot be shared with other people using fine-grained tokens, so working with others later means moving the repository to an organization.

#### Scenario: Solo setup skips the organization steps
- **WHEN** the user chooses "Just me" and enters the username `my-name`
- **THEN** the wizard shows two steps plus sign-in, links to `https://github.com/new?owner=my-name&name=time-data&visibility=private`, prefills the sign-in repository with `my-name/time-data`, and shows no organization, base permission, approval or invite step

#### Scenario: Choice stays visible
- **WHEN** the user chooses "A team"
- **THEN** both options remain visible, "A team" is shown as selected, and the organization field and team steps appear below the selector

#### Scenario: Switching the path
- **WHEN** the user has chosen one path and then selects the other option in the selector
- **THEN** the wizard shows that path's field and step count, keeping the entered name

#### Scenario: Nothing chosen yet
- **WHEN** the wizard opens without saved progress
- **THEN** neither option is selected and no name field or step is shown

#### Scenario: Keyboard selection
- **WHEN** a keyboard user focuses the selector and presses an arrow key
- **THEN** the other option becomes selected, as in a radio group

#### Scenario: Progress saved before the choice existed
- **WHEN** saved progress holds a name but no chosen path
- **THEN** the wizard treats it as a team setup and keeps the progress

### Requirement: Personalized setup steps
For a team, the setup wizard SHALL ask for the organization name once, with a repository name defaulting to `time-data`, and SHALL show these steps in order, each with a link to the matching GitHub page personalized with the organization and repository names, a short explanation, a fallback menu path, and a "Done" checkbox: create a free organization; create the private data repository from a link that prefills owner, name and private visibility; set the organization's base repository permission to Write; choose the fine-grained token approval policy; invite members; create the owner's own token; invite the team; sign in.

Until the name field (organization for a team, username for one person) holds a valid GitHub login and the repository name is valid, every step including sign-in SHALL be locked: it SHALL show its number and title, the first step SHALL also show one note saying which field to fill in (not repeated on every step), and it SHALL NOT show its explanation, links, choices, commands, copy buttons, sign-in form or "Done" checkbox. Steps already ticked SHALL stay ticked while locked and SHALL unlock unchanged once the names are valid again.

#### Scenario: Links use the entered names
- **WHEN** the owner enters the organization `my-team` and keeps the repository name `time-data`
- **THEN** the repository step links to `https://github.com/new` with owner `my-team`, name `time-data` and private visibility, and the organization settings links contain `my-team`

#### Scenario: Steps locked before a name
- **WHEN** the owner has chosen "A team" and the organization field is empty
- **THEN** every step is shown locked, the first step notes to enter the organization name first, and no step offers a "Done" checkbox or GitHub link

#### Scenario: Invalid organization name
- **WHEN** the owner enters an organization name that does not match GitHub's login pattern
- **THEN** the wizard shows a validation message at the field, keeps every step locked, and does not build links from the name

#### Scenario: Invalid repository name
- **WHEN** the owner enters a valid organization name but an invalid repository name
- **THEN** every step stays locked and the first step notes to fix the repository name

#### Scenario: Steps unlock with a valid name
- **WHEN** the owner enters a valid organization name while the repository name is valid
- **THEN** all steps unlock and previously ticked steps are still ticked

#### Scenario: Base permission explained
- **WHEN** the owner views the base permission step
- **THEN** the wizard explains that Write applies to all repositories of the organization and recommends an organization used only for the time data
