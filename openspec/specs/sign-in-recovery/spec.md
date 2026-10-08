# sign-in-recovery Specification

## Purpose
TBD - created by archiving change fix-login. Update Purpose after archive.
## Requirements
### Requirement: Sign-in fix page
The app SHALL provide a page at `#/fix?e=<error>&repo=<owner>/<name>&from=<start|setup|join|add|workspace>`, in the signed-out app and in the signed-in app, whose only content is solving one sign-in error: a back link, a headline naming the problem and repository, one block of steps for that error, and the actions "Try again" and "Change token or repository". The page SHALL NOT show the landing hero, highlights, "how it works", demo and setup calls to action, or the signed-in app's navigation. Every GitHub link on it SHALL open in a new tab, be built by the central GitHub links module, and be shown with its localized menu path.

#### Scenario: Redirect after failure
- **WHEN** a sign-in fails with `orgRepoNotAccessible` for `acme/time-data` on the start page
- **THEN** the URL becomes `#/fix?e=orgRepoNotAccessible&repo=acme/time-data&from=start` and the page shows only the fix content for that error

#### Scenario: Fix page while signed in
- **WHEN** adding `globex/hours` fails with `invalidToken` while the user is signed in to `acme/time-data`
- **THEN** the URL becomes `#/fix?e=invalidToken&repo=globex/hours&from=add`, the fix content is shown without app navigation, and the back link returns to the tracker of `acme/time-data`

#### Scenario: Unknown or missing error code
- **WHEN** a user opens `#/fix` with a missing or unknown `e` value
- **THEN** the page shows the general "something went wrong" block with "Back to sign-in"

#### Scenario: Invalid repository parameter
- **WHEN** the `repo` parameter does not pass the owner and repository name validation
- **THEN** the page builds no repository-specific GitHub links and shows the steps that do not need the repository

### Requirement: Steps per sign-in error
The fix page SHALL show for each error only the steps the member can take themselves, each as one line of text with at most one button:
- `badRepoFormat`, `ownerNotFound`: copy `owner/name` from the address bar of the repository on GitHub.
- `invalidToken`: the token was copied incompletely or has expired, with the fine-grained token checklist and a button to the prefilled token form.
- `orgRepoNotAccessible`, `repoNotFound`: accept the organization invitation, open the repository (a 404 page means an owner has to give access), and check the token's resource owner and repository selection (with a token created before access was granted as a sub-point).
- `ownRepoNotAccessible`: check the repository name and the token's repository selection.
- `personalRepoNotAccessible`: with a fine-grained token, the two alternatives (move the repository into an organization, or use a classic token); with a classic token, accept the repository invitation.
- `noPushAccess`: create a token with Contents read and write.
- `offline`: check the internet connection. `rateLimit`: try again after the given time. `unknown`: try again.

#### Scenario: Organization repository not accessible
- **WHEN** the fix page shows `orgRepoNotAccessible` for `acme/time-data`
- **THEN** it shows three numbered steps with buttons to `https://github.com/orgs/acme/invitation`, `https://github.com/acme/time-data` and the member's token list, and no step about token approval

#### Scenario: Rate limit
- **WHEN** the fix page shows `rateLimit` with a reset time
- **THEN** it shows the reset time in the user's time format and the "Try again" action

### Requirement: Owner link on the fix page
For the errors `orgRepoNotAccessible`, `repoNotFound`, `personalRepoNotAccessible` with a classic token, and `noPushAccess`, the fix page SHALL offer "Copy message for your owner". The message SHALL be short, name the repository and, when known, the member's GitHub login, and contain a link to the owner page for that repository and member, with `kind=user` when the repository belongs to a personal account. The message and link SHALL NOT contain the token.

#### Scenario: Copy owner message
- **WHEN** member `alice` copies the owner message for `acme/time-data`
- **THEN** the copied text contains `#/approve?org=acme&repo=time-data&member=alice` based on the current app URL and does not contain the token

#### Scenario: No owner action possible
- **WHEN** the fix page shows `invalidToken`, `badRepoFormat`, `ownerNotFound`, `ownRepoNotAccessible`, `offline`, `rateLimit` or `unknown`
- **THEN** no owner message is offered

### Requirement: Retry without retyping
When the redirect comes from a sign-in attempt in the same tab, the fix page SHALL keep the entered token, repository, the save-as-profile choice and the workspace being repaired in memory only, never in the URL or browser storage. "Try again" SHALL run the sign-in check again with them: on success the user is signed in (or the workspace is added or repaired), on failure the fix page updates to the new error. "Change token or repository" SHALL return to the page given by `from` with the repository prefilled; for `from=add` that is the "Add workspace" page, and for `from=profile` the replace-token form of that workspace. When no attempt is held in memory (reload or opened link), the page SHALL show "Back to sign-in" instead of "Try again", or "Back" when signed in.

#### Scenario: Retry succeeds after the owner acted
- **WHEN** the owner has approved the token and the member clicks "Try again"
- **THEN** the member is signed in and sees the tracker without entering the token again

#### Scenario: Retry fails with a different error
- **WHEN** "Try again" fails with `noPushAccess` after an earlier `orgRepoNotAccessible`
- **THEN** the URL and content change to `noPushAccess`

#### Scenario: Page reloaded
- **WHEN** the member reloads `#/fix`
- **THEN** the steps are still shown, "Try again" is replaced by "Back to sign-in", and no token is present in the URL, `localStorage` or `sessionStorage`

### Requirement: Owner action page
The app SHALL provide `#/approve?org=<owner>&repo=<name>&member=<login>[&kind=user]` in both the logged-in and the logged-out app. It SHALL greet the owner with the member and repository and show one large button per action, in this order: for an organization owner, approve the member's token under Pending requests, check that the member is in People, and check Write access; for a personal-account owner (`kind=user`), add the member as a collaborator with Write access. Directly under the approve button it SHALL explain that an empty Pending requests list means the token was created for the wrong resource owner or approval is off, and offer a copyable note for the member. Below the actions it SHALL recommend turning token approval off, with a link to the organization's token policy. When `member` is missing, the page SHALL use neutral wording. When `org` or `repo` fails validation, the page SHALL show only a notice that the link is broken.

#### Scenario: Logged-in owner opens the link
- **WHEN** a signed-in owner opens `#/approve?org=acme&repo=time-data&member=alice`
- **THEN** the owner page is shown inside the app instead of redirecting to the tracker, with a button to `https://github.com/organizations/acme/settings/personal-access-token-requests`

#### Scenario: Empty pending list
- **WHEN** the owner reads the hint under the approve button
- **THEN** it says that alice's token is not listed if it was created for alice's own account, and a "Copy note for alice" button copies a message asking them to create a new token with `acme` as the resource owner

#### Scenario: Broken owner link
- **WHEN** someone opens `#/approve?org=<script>&repo=x`
- **THEN** the page shows only a broken-link notice and no GitHub buttons

### Requirement: Replace token for a workspace
For a workspace whose token GitHub rejected, the app SHALL lead to `#/fix?e=invalidToken&repo=<repo>&from=profile` with the action "Replace token for this workspace". It SHALL open a form with the repository locked and an empty token field. On a successful check the stored token SHALL be replaced, which clears "Token rejected" for every workspace that used it, and the tab SHALL switch to that workspace. The workspace identifier SHALL be kept in memory only, not in the URL.

#### Scenario: Token replaced
- **WHEN** the `acme` token was rejected, two workspaces use it, and the user replaces it from the `acme/time-data` workspace with a valid new token
- **THEN** both `acme` workspaces are no longer marked "Token rejected" and the tab opens `acme/time-data`

#### Scenario: New token also fails
- **WHEN** the replacement token lacks access to the repository
- **THEN** the fix page shows the new error with `from=profile`, and the stored token is unchanged

