## MODIFIED Requirements

### Requirement: Token login
The system SHALL let a user log in by entering a GitHub Personal Access Token and a data repository identifier in the form `owner/name`, and SHALL validate both before granting access. When the repository cannot be accessed, the system SHALL look up the repository owner with the same token and SHALL show a diagnosis that distinguishes a nonexistent owner, an organization-owned repository, the user's own repository, and another user's personal repository. Every sign-in error SHALL show the cause, what the user can do, and, where another person has to act, a "Copy message for the owner" button whose text names the member, the repository, the problem and the relevant GitHub links, and never contains the token.

#### Scenario: Valid token and repository
- **WHEN** the user submits a token that authenticates against the GitHub API and a repository on which that token has push permission
- **THEN** the system logs the user in and shows the time tracker page

#### Scenario: Invalid token
- **WHEN** the user submits a token that GitHub rejects
- **THEN** the system stays on the login page and shows an "invalid token" error

#### Scenario: Owner does not exist
- **WHEN** the token is valid, the repository is not accessible, and GitHub reports that the owner account does not exist
- **THEN** the system shows that the owner name is probably misspelled and shows the entered owner

#### Scenario: Organization repository not accessible with fine-grained token
- **WHEN** the token is a fine-grained token, the repository is not accessible, and the owner is an organization
- **THEN** the system shows a numbered checklist whose first item is that the token may be waiting for approval by an organization owner, with a link to `https://github.com/organizations/<owner>/settings/personal-access-token-requests`, followed by accepting the organization invitation, the token's resource owner, a token created before access was granted, and the repository name, and offers a copyable message for the owner

#### Scenario: Another user's personal repository with fine-grained token
- **WHEN** the token is a fine-grained token, the repository is not accessible, and the owner is a user other than the token's user
- **THEN** the system explains that fine-grained tokens cannot access repositories in another person's personal account and names the alternatives (move the repository to an organization, or use a classic token)

#### Scenario: Own repository not accessible
- **WHEN** the repository is not accessible and the owner is the token's own user
- **THEN** the system explains that the repository name may be wrong or the token was not given access to this repository

#### Scenario: Owner lookup fails
- **WHEN** the repository is not accessible and the owner lookup itself fails
- **THEN** the system shows the general error explaining that the repository cannot be accessed and how to grant token access

#### Scenario: Read-only access
- **WHEN** the token can read the repository but lacks push permission
- **THEN** the system refuses login, shows that write access is required, explains both causes (token permission Contents read-only, or repository role Read), and offers a copyable message for the owner

### Requirement: Token setup guidance
The login page SHALL explain how to create a suitable token, including choosing the organization that owns the data repository as the resource owner, selecting only the data repository, the recommended fine-grained token permissions (Contents: read and write, Metadata: read), that the invitation must be accepted and repository access must exist before the token is created, that organization owners may have to approve the token, and the classic-token fallback for repositories owned by another personal account. The help SHALL link to a prefilled token creation page. The system SHALL warn, without blocking login, when the entered token is a classic token, and SHALL show on the settings page for the whole session that a classic token is in use, including a statement that the token can access all of the user's private repositories when GitHub reports the `repo` scope.

#### Scenario: User opens token help
- **WHEN** the user expands the token help on the login page
- **THEN** the system shows step-by-step instructions covering order, resource owner, repository selection, permissions and approval, with a link to GitHub's prefilled token creation page and a warning about the broader scope of classic tokens

#### Scenario: Classic token entered
- **WHEN** the user types a token starting with `ghp_` into the login form
- **THEN** a warning next to the field recommends a fine-grained token and links to the setup steps, and the login button stays enabled

#### Scenario: Classic token with repo scope in settings
- **WHEN** a user logged in with a classic token whose `X-OAuth-Scopes` include `repo` opens the settings page
- **THEN** the settings page states that this token can read and write all of the user's private repositories and recommends replacing it with a fine-grained token

#### Scenario: Fine-grained token
- **WHEN** the user logs in with a token starting with `github_pat_`
- **THEN** no classic-token warning is shown on the login or settings page
