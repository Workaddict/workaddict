## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Replace token for a workspace
For a workspace whose token GitHub rejected, the app SHALL lead to `#/fix?e=invalidToken&repo=<repo>&from=profile` with the action "Replace token for this workspace". It SHALL open a form with the repository locked and an empty token field. On a successful check the stored token SHALL be replaced, which clears "Token rejected" for every workspace that used it, and the tab SHALL switch to that workspace. The workspace identifier SHALL be kept in memory only, not in the URL.

#### Scenario: Token replaced
- **WHEN** the `acme` token was rejected, two workspaces use it, and the user replaces it from the `acme/time-data` workspace with a valid new token
- **THEN** both `acme` workspaces are no longer marked "Token rejected" and the tab opens `acme/time-data`

#### Scenario: New token also fails
- **WHEN** the replacement token lacks access to the repository
- **THEN** the fix page shows the new error with `from=profile`, and the stored token is unchanged
