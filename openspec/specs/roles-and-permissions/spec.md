# roles-and-permissions Specification

## Purpose
TBD - created by archiving change ux-fixes-and-roles. Update Purpose after archive.
## Requirements
### Requirement: Roles
The system SHALL know three roles, ordered from most to least privileged: team leader, editor, worker. Every member SHALL have exactly one effective role; a member without an assigned role SHALL be a worker.

#### Scenario: Member without assignment
- **WHEN** `bob` is a collaborator of the data repository and `roles.json` contains no entry for `bob`
- **THEN** the system treats `bob` as a worker

#### Scenario: Assigned role
- **WHEN** `roles.json` assigns `carol` the role editor
- **THEN** the system treats `carol` as an editor

### Requirement: Owner
The system SHALL treat every GitHub user with admin permission on the data repository as an owner. An owner's effective role SHALL always be team leader, regardless of `roles.json`, and SHALL NOT be changeable in the app. In demo mode the demo user SHALL be an owner.

#### Scenario: Personal repository
- **WHEN** `alice` logs in to `alice/time-data`, which her personal account owns
- **THEN** `alice` is an owner and a team leader

#### Scenario: Organization repository
- **WHEN** `bob` has the admin role on `my-team/time-data`
- **THEN** `bob` is an owner and a team leader

#### Scenario: Stale role for owner
- **WHEN** `roles.json` assigns the owner `alice` the role worker
- **THEN** `alice` is still a team leader and the role management list shows her as owner without a role selector

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

### Requirement: Role storage
The system SHALL store role assignments in `roles.json` in the data repository as a map from GitHub login to role, and SHALL treat a missing or unreadable file as containing no assignments.

#### Scenario: Repository without roles file
- **WHEN** the data repository has no `roles.json`
- **THEN** owners are team leaders, all other members are workers, and no file is created until an owner assigns a role

#### Scenario: Unknown role value
- **WHEN** `roles.json` assigns `dave` the value `"admin"`
- **THEN** the system treats `dave` as a worker

### Requirement: Role management
The system SHALL let owners assign the role team leader, editor, or worker to every non-owner member in a "Team & roles" section of Settings, SHALL save each change as a commit stating the member, the new role, and the acting owner, and SHALL show all other users the members and their roles read-only.

#### Scenario: Owner promotes a member
- **WHEN** owner `alice` sets `bob`'s role to editor
- **THEN** `roles.json` maps `bob` to editor, the commit message contains "role", "bob", "editor", and "alice", and `bob` gains editor permissions on his next data refresh

#### Scenario: Owner makes another team leader
- **WHEN** owner `alice` sets `carol`'s role to team leader
- **THEN** `carol` can run the Clockify import but cannot change roles

#### Scenario: Hint before first assignment
- **WHEN** an owner uses the app while `roles.json` does not exist
- **THEN** a dismissible banner suggests assigning roles in Settings → Team & roles

#### Scenario: Non-owner tries to change roles
- **WHEN** a user who is not an owner attempts to write `roles.json` through the app
- **THEN** the storage layer refuses with a permission error and writes nothing

### Requirement: Permissions enforced in the storage layer
The storage adapter SHALL check the acting user's permission before every write and SHALL refuse writes the user lacks permission for with a `forbiddenRole` error, independent of what the UI shows.

#### Scenario: Worker writes workspace
- **WHEN** a worker's adapter is asked to update the workspace
- **THEN** it writes nothing and throws `forbiddenRole`

#### Scenario: Worker edits another member's entry
- **WHEN** a worker's adapter is asked to save an entry whose login is another member
- **THEN** it writes nothing and throws `forbiddenRole`

### Requirement: Enforcement limitation disclosed
The system SHALL state in the role management section and in the README that roles are enforced by the app only, that any member with write access to the data repository can bypass them by editing files on GitHub, and that every change remains visible in the repository's commit history.

#### Scenario: Owner reads the notice
- **WHEN** an owner opens "Team & roles"
- **THEN** a notice explains that roles are enforced by the app and not by GitHub

### Requirement: Stopping other members' timers enforced in the storage layer
The storage adapter SHALL refuse to stop or discard another member's timer with a `forbiddenRole` error when the acting user's role is below editor, and SHALL write nothing in that case.

#### Scenario: Worker adapter stops another timer
- **WHEN** a worker's adapter is asked to stop `carol`'s timer
- **THEN** it writes nothing and throws `forbiddenRole`

#### Scenario: Editor adapter stops another timer
- **WHEN** an editor's adapter is asked to stop `bob`'s timer
- **THEN** the stop succeeds

