## MODIFIED Requirements

### Requirement: Permission matrix
The system SHALL grant permissions by effective role as follows, and SHALL hide or disable UI actions the current user lacks permission for:

| Permission | Worker | Editor | Team leader |
| --- | --- | --- | --- |
| Track time, run own timer, create/edit/delete own entries | yes | yes | yes |
| View all members' entries and statistics, export | yes | yes | yes |
| Create, edit, and delete other members' entries | no | yes | yes |
| View team live activity (other members' running timers) | no | yes | yes |
| Stop or discard other members' running timers | no | yes | yes |
| Create, rename, recolor, archive, and delete projects and tags | no | yes | yes |
| Run the Clockify import | no | no | yes |
| Set the team time zone | no | no | yes |
| Shift entry times | no | no | yes |
| Assign roles | owner only | owner only | owner only |

#### Scenario: Worker cannot manage projects
- **WHEN** a worker opens the Projects & Tags page
- **THEN** the projects and tags are listed with their hours, and no create, rename, recolor, archive, or delete controls are shown

#### Scenario: Editor edits another member's entry
- **WHEN** an editor changes the description of `bob`'s entry
- **THEN** the entry is saved in `bob`'s entry file and still belongs to `bob`

#### Scenario: Editor creates another member's entry
- **WHEN** an editor adds a manual entry for `bob`
- **THEN** the entry is saved in `bob`'s entry file and belongs to `bob`

#### Scenario: Team leader who is not owner
- **WHEN** a team leader who is not an owner opens the role management
- **THEN** the roles are shown read-only

#### Scenario: Worker has no team live view
- **WHEN** a worker opens the tracker page
- **THEN** no other members' running timers and no stop or discard controls for them are shown

#### Scenario: Editor stops another member's timer
- **WHEN** an editor stops `bob`'s running timer
- **THEN** the entry is saved in `bob`'s entry file and `bob`'s timer is cleared

#### Scenario: Editor cannot change the team time zone
- **WHEN** an editor opens Settings
- **THEN** the team time zone is shown read-only and no "Shift entry times" action is shown

## ADDED Requirements

### Requirement: Creating other members' entries enforced in the storage layer
The storage adapter SHALL refuse to create an entry whose owner is not the acting user unless the acting user is an editor or team leader. In that case it SHALL write nothing and throw `forbiddenRole`.

#### Scenario: Worker creates entry for another member
- **WHEN** a worker's adapter is asked to save a new entry whose login is `bob`
- **THEN** it writes nothing and throws `forbiddenRole`

#### Scenario: Editor creates entry for another member
- **WHEN** editor `alice`'s adapter saves a new entry whose login is `bob`
- **THEN** the entry is written to `bob`'s entry file with `alice` recorded as the adder
