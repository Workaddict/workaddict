## MODIFIED Requirements

### Requirement: Repository file layout
The GitHub adapter SHALL store data as JSON files: `tracker.json`, `workspace.json` (projects and tags), `roles.json` (role assignments, optional), `entries/<login>/<YYYY-MM>.json` (a user's entries whose start falls in that UTC month), and `timers/<login>.json` (the user's running timer or `null`).

#### Scenario: Saving an entry
- **WHEN** user `alice` saves an entry starting 2026-09-21T08:00:00Z
- **THEN** the entry is stored in `entries/alice/2026-09.json`

#### Scenario: Entry spanning months
- **WHEN** an entry starts 2026-09-30T22:00:00Z and ends 2026-10-01T01:00:00Z
- **THEN** the entry is stored only in the file for 2026-09

#### Scenario: Editor saves another member's entry
- **WHEN** editor `carol` saves `bob`'s entry starting 2026-09-21T08:00:00Z
- **THEN** the entry is stored in `entries/bob/2026-09.json`

#### Scenario: Role assignment
- **WHEN** an owner assigns `bob` the role editor
- **THEN** `roles.json` contains `"bob": "editor"`

### Requirement: Descriptive commits
Every write SHALL create a commit whose message states the kind of change, a short summary, and the acting user's login; when the acting user changes another member's entry, the message SHALL also name that member.

#### Scenario: Entry commit message
- **WHEN** user `alice` adds a 2-hour entry described "Fix login"
- **THEN** the commit message contains "entry", "Fix login", and "alice"

#### Scenario: Entry changed for another member
- **WHEN** editor `carol` deletes `bob`'s entry described "Standup"
- **THEN** the commit message contains "entry", "Standup", "bob", and "carol"

## ADDED Requirements

### Requirement: Current user's role
The storage adapter SHALL provide the current user's effective role and owner status and the role assignments of all members, determined from the repository admin permission and `roles.json`, and SHALL refresh them together with the other data.

#### Scenario: Role after promotion
- **WHEN** an owner promotes `bob` to editor while `bob` has the app open
- **THEN** `bob`'s app shows editor permissions after its next data refresh without logging in again
