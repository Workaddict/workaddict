## MODIFIED Requirements

### Requirement: Token setup guidance
The login page SHALL link to a separate token help page (`#/token-help`, available while logged out) that opens in a new tab and explains how to create a suitable token, including choosing the organization that owns the data repository as the resource owner, selecting only the data repository, the recommended fine-grained token permissions (Contents: read and write, Metadata: read), that the invitation must be accepted and repository access must exist before the token is created, that organization owners may have to approve the token, and the classic-token fallback for repositories owned by another personal account. The help page SHALL link to a prefilled token creation page and SHALL offer a "Back to sign-in" button that closes its tab, or opens the start page when the browser does not allow closing it. The system SHALL warn, without blocking login, when the entered token is a classic token, and SHALL show on the settings page for the whole session that a classic token is in use, including a statement that the token can access all of the user's private repositories when GitHub reports the `repo` scope.

#### Scenario: User opens token help
- **WHEN** the user clicks "How do I get a token?" on the login page
- **THEN** the token help page opens in a new tab and shows step-by-step instructions covering order, resource owner, repository selection, permissions and approval, with a link to GitHub's prefilled token creation page and a warning about the broader scope of classic tokens

#### Scenario: Back to sign-in
- **WHEN** the user clicks "Back to sign-in" on the token help page
- **THEN** the help tab closes and the user is back at the sign-in form, or the start page opens in the same tab if the browser does not allow closing it

#### Scenario: Classic token entered
- **WHEN** the user types a token starting with `ghp_` into the login form
- **THEN** a warning next to the field recommends a fine-grained token and links to the setup steps, and the login button stays enabled
