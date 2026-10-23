## MODIFIED Requirements

### Requirement: Setup wizard entry
The start page SHALL offer a "Set up a team" action that opens the owner setup wizard at `#/setup` without signing in. The wizard SHALL also be reachable while signed in, from "+ Add workspace", and SHALL then be shown without app chrome. Signed in, the wizard's back link SHALL return to "+ Add workspace", and its sign-in step SHALL behave like "+ Add workspace": the "Save as a profile" option SHALL NOT be shown, the repository SHALL always be saved as a workspace and the tab SHALL switch to it, an already saved repository SHALL offer "Open workspace" and "Replace token" instead of signing in, and a suitable vault token SHALL be offered for reuse. The current workspace SHALL stay saved and SHALL NOT be replaced by an unsaved session.

#### Scenario: Open wizard from start page
- **WHEN** a logged-out visitor clicks "Set up a team" on the start page
- **THEN** the setup wizard opens at its first step

#### Scenario: Open wizard while signed in
- **WHEN** a signed-in user opens `#/setup`
- **THEN** the setup wizard opens without app chrome instead of the tracker, and its back link leads to "+ Add workspace"

#### Scenario: Finish wizard while signed in
- **WHEN** a signed-in user with workspace `acme/time-data` finishes the wizard for `acme/client-hours` and the check succeeds
- **THEN** `acme/client-hours` is saved as a workspace, the tab switches to it, and `acme/time-data` is still listed in the workspace switcher

#### Scenario: Failed sign-in from the wizard while signed in
- **WHEN** the check at the end of the wizard fails for a signed-in user
- **THEN** the fix page opens, the current workspace stays signed in, and "Change token or repository" returns to the matching wizard step

### Requirement: Join flow
Opening `#/join?repo=<owner>/<name>` SHALL show a join flow for that repository with these steps in order: accept the invitation, confirm access to the repository in the browser, create a token, sign in. This SHALL apply while logged out and while signed in; signed in, the flow SHALL be shown without app chrome, its back link SHALL return to "+ Add workspace", and its sign-in step SHALL add a workspace as described for the setup wizard entry. The token step SHALL stay locked until the member confirms they can open the repository. The sign-in step SHALL prefill the repository. With `&kind=user`, the invitation step SHALL link to the repository invitation `https://github.com/<owner>/<name>/invitations`, and the token step SHALL guide the member to a classic token with the "repo" scope, warning that it can access all of their repositories.

#### Scenario: Valid join link
- **WHEN** a logged-out member opens `#/join?repo=my-team/time-data`
- **THEN** the join flow shows the repository `my-team/time-data` and a link to `https://github.com/orgs/my-team/invitation`

#### Scenario: Join link for a personal account
- **WHEN** a logged-out member opens `#/join?repo=ben/time-data&kind=user`
- **THEN** the invitation step links to `https://github.com/ben/time-data/invitations` and, once access is confirmed, the token step links to the classic token form with the "repo" scope and shows the warning

#### Scenario: Invalid join link
- **WHEN** a logged-out member opens `#/join?repo=not a repo`
- **THEN** the start page opens with a notice that the invite link is invalid

#### Scenario: Invalid join link while signed in
- **WHEN** a signed-in user opens `#/join?repo=not a repo`
- **THEN** "+ Add workspace" opens with a notice that the invite link is invalid

#### Scenario: Member cannot open the repository
- **WHEN** the member answers that the repository shows a 404 page
- **THEN** the token step stays locked, the flow explains that access is missing, and it offers a copyable message for the owner

#### Scenario: Member can open the repository
- **WHEN** the member confirms they can see the repository of an organization
- **THEN** the token step unlocks with a prefilled token creation link and a checklist naming the resource owner, the repository and the Contents read-and-write permission

#### Scenario: Logged-in user opens join link
- **WHEN** a signed-in user with workspace `acme/time-data` opens `#/join?repo=globex/hours`
- **THEN** the join flow for `globex/hours` opens, and after a successful sign-in step `globex/hours` is saved as a workspace and the tab switches to it while `acme/time-data` stays saved
