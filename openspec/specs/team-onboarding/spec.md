# team-onboarding Specification

## Purpose
TBD - created by archiving change guided-team-onboarding. Update Purpose after archive.
## Requirements
### Requirement: Setup wizard entry
The start page SHALL offer a "Set up a team" action that opens the owner setup wizard at `#/setup` without signing in.

#### Scenario: Open wizard from start page
- **WHEN** a logged-out visitor clicks "Set up a team" on the start page
- **THEN** the setup wizard opens at its first step

### Requirement: Setup path for one person or a team
The setup wizard SHALL first ask whether the setup is for one person or for a team, and SHALL remember the answer with the rest of the progress. A person who only tracks their own time SHALL NOT be asked to create an organization: a fine-grained token reaches a private repository in the user's own account without one.

For the solo path the wizard SHALL ask for the user's GitHub username instead of an organization name and SHALL show only these steps: create the private data repository; create the token; sign in. It SHALL NOT show the organization, base permission, token approval, invite or invite-link steps, and SHALL state that a repository in a personal account cannot be shared with other people using fine-grained tokens, so working with others later means moving the repository to an organization.

#### Scenario: Solo setup skips the organization steps
- **WHEN** the user chooses "Just me" and enters the username `my-name`
- **THEN** the wizard shows two steps plus sign-in, links to `https://github.com/new?owner=my-name&name=time-data&visibility=private`, prefills the sign-in repository with `my-name/time-data`, and shows no organization, base permission, approval or invite step

#### Scenario: Switching the path
- **WHEN** the user has chosen one path and then picks the other
- **THEN** the wizard shows that path's field and step count

#### Scenario: Progress saved before the choice existed
- **WHEN** saved progress holds a name but no chosen path
- **THEN** the wizard treats it as a team setup and keeps the progress

### Requirement: Personalized setup steps
For a team, the setup wizard SHALL ask for the organization name once, with a repository name defaulting to `time-data`, and SHALL show these steps in order, each with a link to the matching GitHub page personalized with the organization and repository names, a short explanation, a fallback menu path, and a "Done" checkbox: create a free organization; create the private data repository from a link that prefills owner, name and private visibility; set the organization's base repository permission to Write; choose the fine-grained token approval policy; invite members; create the owner's own token; invite the team; sign in.

#### Scenario: Links use the entered names
- **WHEN** the owner enters the organization `my-team` and keeps the repository name `time-data`
- **THEN** the repository step links to `https://github.com/new` with owner `my-team`, name `time-data` and private visibility, and the organization settings links contain `my-team`

#### Scenario: Invalid organization name
- **WHEN** the owner enters an organization name that does not match GitHub's login pattern
- **THEN** the wizard shows a validation message and does not build links from it

#### Scenario: Base permission explained
- **WHEN** the owner views the base permission step
- **THEN** the wizard explains that Write applies to all repositories of the organization and recommends an organization used only for the time data

### Requirement: Wizard progress survives navigation
The setup wizard SHALL keep the entered names, checked steps and approval choice in this browser, so that leaving for GitHub and reloading the page does not lose progress, and SHALL work without saving when browser storage is unavailable.

#### Scenario: Reload during setup
- **WHEN** the owner has checked the first three steps and reloads the page
- **THEN** the wizard shows the same names and the same three steps checked

#### Scenario: Storage blocked
- **WHEN** browser storage throws on access
- **THEN** the wizard still works for the current page view

### Requirement: Approval policy guidance
The approval step SHALL state that new organizations require administrator approval for members' fine-grained tokens by default, SHALL recommend turning approval off for small trusted teams, and SHALL let the owner record the choice. When the owner keeps approval on, the final step and the invite message SHALL tell the owner to approve each member's token and SHALL link to the organization's pending token requests page.

#### Scenario: Approval kept on
- **WHEN** the owner records that approval stays required and reaches the final step
- **THEN** the wizard shows a link to `https://github.com/organizations/<org>/settings/personal-access-token-requests` and the invite message mentions that tokens must be approved there

#### Scenario: Approval turned off
- **WHEN** the owner records that approval is not required
- **THEN** neither the final step nor the invite message mention token approval

### Requirement: Generated GitHub CLI commands
The invite step SHALL offer an optional "with GitHub CLI" section in which the owner enters member usernames, and the app SHALL render copyable `gh` commands that refresh the `admin:org` scope, create the private repository, set the base permission to Write, and invite each member to the organization. Usernames that do not match GitHub's login pattern SHALL be rejected and SHALL NOT appear in commands.

#### Scenario: Commands for two members
- **WHEN** the owner enters `anna, ben` for organization `my-team`
- **THEN** the commands include one organization membership invitation each for `anna` and `ben`, and a copy button copies all commands

#### Scenario: Invalid username
- **WHEN** the owner enters `anna; rm -rf ~`
- **THEN** the input is flagged as invalid and no command is rendered for it

### Requirement: Invite link and message
Before the final sign-in step, the wizard SHALL show an invite link `#/join?repo=<owner>/<name>` on the app's current URL and a ready-to-copy invite message in the current language that contains the link and says to accept the organization invitation first. The same link and message SHALL stay available after sign-in in the team helper in settings.

#### Scenario: Copy invite message
- **WHEN** the owner clicks "Copy message"
- **THEN** the clipboard contains the message with the invite link, and the button confirms the copy

#### Scenario: Clipboard unavailable
- **WHEN** the clipboard API is unavailable or rejects
- **THEN** the message is shown selected in a read-only text field so the owner can copy it manually

### Requirement: Join flow
Opening `#/join?repo=<owner>/<name>` while logged out SHALL show a join flow for that repository with these steps in order: accept the invitation, confirm access to the repository in the browser, create a token, sign in. The token step SHALL stay locked until the member confirms they can open the repository. The sign-in step SHALL prefill the repository.

#### Scenario: Valid join link
- **WHEN** a logged-out member opens `#/join?repo=my-team/time-data`
- **THEN** the join flow shows the repository `my-team/time-data` and a link to `https://github.com/orgs/my-team/invitation`

#### Scenario: Invalid join link
- **WHEN** a member opens `#/join?repo=not a repo`
- **THEN** the start page opens with a notice that the invite link is invalid

#### Scenario: Member cannot open the repository
- **WHEN** the member answers that the repository shows a 404 page
- **THEN** the token step stays locked, the flow explains that access is missing, and it offers a copyable message for the owner

#### Scenario: Member can open the repository
- **WHEN** the member confirms they can see the repository
- **THEN** the token step unlocks with a prefilled token creation link and a checklist naming the resource owner, the repository and the Contents read-and-write permission

#### Scenario: Logged-in user opens join link
- **WHEN** a signed-in user opens a join link
- **THEN** the app shows the tracker page as for any unknown route

### Requirement: Team helper for owners
On the settings page, owners of a data repository owned by an organization SHALL see the invite link and message with copy buttons, an "Add a member" section with the people page link and generated `gh` commands, and a link to the organization's pending token requests.

#### Scenario: Owner of organization repository
- **WHEN** an owner of an organization-owned data repository opens settings
- **THEN** the team helper shows the invite link, the add-member helper and the pending token requests link

#### Scenario: Non-owner
- **WHEN** a member without admin permission opens settings
- **THEN** the team helper is not shown

### Requirement: Central GitHub links
All GitHub URLs used for onboarding SHALL be built by one module from the organization and repository names, and every link SHALL be shown together with a localized menu path that leads to the same page.

#### Scenario: Link and fallback shown
- **WHEN** any onboarding step shows a GitHub link
- **THEN** the step also shows the menu path to reach the same page on GitHub

