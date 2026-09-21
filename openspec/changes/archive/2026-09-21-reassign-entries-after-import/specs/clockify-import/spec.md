## MODIFIED Requirements

### Requirement: User mapping
The system SHALL list every Clockify user of the workspace, including deactivated users, and SHALL let the user map each one to a GitHub login of the team, keep them as a former member, or skip them. A GitHub login SHALL NOT be assigned to more than one Clockify user.

#### Scenario: Automatic suggestion
- **WHEN** a Clockify user's name or email local part equals a team member's GitHub login (case-insensitive)
- **THEN** that login is pre-selected

#### Scenario: Former member
- **WHEN** the user keeps Clockify user "Jane Doe" as a former member
- **THEN** her entries are imported under the login `clockify.jane-doe`, count in statistics and exports, and can be edited only by editors and team leaders

#### Scenario: Skipped user
- **WHEN** a Clockify user is set to skip
- **THEN** none of that user's entries are fetched or imported

#### Scenario: Duplicate login
- **WHEN** two Clockify users are mapped to the same GitHub login
- **THEN** the system refuses to continue and marks both rows

## ADDED Requirements

### Requirement: Changing the mapping after the import
The system SHALL let team leaders move all time entries of one member, including former members, to another member in Settings, optionally only entries that started before a chosen date, SHALL show the number of affected entries and their hours before confirming, and SHALL point to this action at the end of the import.

#### Scenario: Former member joins the team
- **WHEN** a team leader reassigns the entries of `clockify.jane-doe` to `jane`
- **THEN** all of those entries belong to `jane`, keep their times, projects, and tags, and `clockify.jane-doe` no longer appears in the entries

#### Scenario: Wrong mapping with later own entries
- **WHEN** Clockify user "Max" was mapped to `bob`, `bob` tracked entries in Workaddict after the import on 2026-09-01, and a team leader reassigns `bob`'s entries before 2026-09-01 to `max`
- **THEN** only the imported entries move to `max`, and `bob` keeps the entries he tracked since the import

#### Scenario: Preview
- **WHEN** a team leader selects source, target, and cutoff
- **THEN** the dialog shows how many entries and hours will move, and the confirm action is disabled when no entry matches

#### Scenario: Not a team leader
- **WHEN** an editor or worker opens Settings
- **THEN** no "Reassign entries" action is shown
