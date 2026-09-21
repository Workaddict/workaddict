## MODIFIED Requirements

### Requirement: Team members
The system SHALL list team members as the collaborators of the data repository, showing each member's GitHub login, avatar, and role, marking repository admins as owners, and SHALL fall back to logins found in the repository's data files and `roles.json` when the collaborator list is unavailable.

#### Scenario: Collaborators available
- **WHEN** the collaborator list can be read with the user's token
- **THEN** the system shows all collaborators as members, with admins marked as owner and team leader

#### Scenario: Collaborators unavailable
- **WHEN** the collaborator request is denied
- **THEN** the system derives members from the logins under `entries/` and `timers/` and in `roles.json`, includes the current user, and determines only the current user's owner status (from the repository permission)
