## MODIFIED Requirements

### Requirement: Permission matrix
The system SHALL grant permissions by effective role as follows, and SHALL hide or disable UI actions the current user lacks permission for:

| Permission | Worker | Editor | Team leader |
| --- | --- | --- | --- |
| Track time, run own timer, create/edit/delete own entries | yes | yes | yes |
| View all members' entries and statistics, export | yes | yes | yes |
| Edit and delete other members' entries | no | yes | yes |
| View team live activity (other members' running timers) | no | yes | yes |
| Stop or discard other members' running timers | no | yes | yes |
| Create, rename, recolor, archive, and delete projects and tags | no | yes | yes |
| Run the Clockify import | no | no | yes |
| Assign roles | owner only | owner only | owner only |

#### Scenario: Worker cannot manage projects
- **WHEN** a worker opens the Projects & Tags page
- **THEN** the projects and tags are listed with their hours, and no create, rename, recolor, archive, or delete controls are shown

#### Scenario: Editor edits another member's entry
- **WHEN** an editor changes the description of `bob`'s entry
- **THEN** the entry is saved in `bob`'s entry file and still belongs to `bob`

#### Scenario: Team leader who is not owner
- **WHEN** a team leader who is not an owner opens the role management
- **THEN** the roles are shown read-only

#### Scenario: Worker has no team live view
- **WHEN** a worker opens the tracker page
- **THEN** no other members' running timers and no stop or discard controls for them are shown

#### Scenario: Editor stops another member's timer
- **WHEN** an editor stops `bob`'s running timer
- **THEN** the entry is saved in `bob`'s entry file and `bob`'s timer is cleared

## ADDED Requirements

### Requirement: Stopping other members' timers enforced in the storage layer
The storage adapter SHALL refuse to stop or discard another member's timer with a `forbiddenRole` error when the acting user's role is below editor, and SHALL write nothing in that case.

#### Scenario: Worker adapter stops another timer
- **WHEN** a worker's adapter is asked to stop `carol`'s timer
- **THEN** it writes nothing and throws `forbiddenRole`

#### Scenario: Editor adapter stops another timer
- **WHEN** an editor's adapter is asked to stop `bob`'s timer
- **THEN** the stop succeeds
