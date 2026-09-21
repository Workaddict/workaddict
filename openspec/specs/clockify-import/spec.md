# clockify-import Specification

## Purpose
TBD - created by archiving change add-clockify-import. Update Purpose after archive.
## Requirements
### Requirement: Import availability and replacing existing data
The system SHALL offer the Clockify import in Settings unless the data is read-only. When the data repository already contains time entries, projects, or tags, the system SHALL warn that the import replaces them, SHALL show how many will be replaced, and SHALL require an explicit confirmation before writing.

#### Scenario: Empty repository
- **WHEN** a member opens Settings in a repository without entries, projects, or tags
- **THEN** an "Import from Clockify" action is available

#### Scenario: Repository already in use
- **WHEN** a member opens Settings in a repository that contains at least one entry, project, or tag
- **THEN** the import action is available and a hint states that importing replaces the existing data

#### Scenario: Confirm replacement
- **WHEN** the preview is shown for a repository with 120 entries, 3 projects, and 2 tags
- **THEN** a warning states these counts and that they will be replaced, and the import button stays disabled until the user confirms

#### Scenario: Replacing import
- **WHEN** the user confirms the replacement and imports
- **THEN** all previous entries, projects, and tags are removed and the imported data is written in the same single commit; running timers are kept

#### Scenario: Data added during the wizard
- **WHEN** the repository was empty at preview time, another member creates an entry, and the user then confirms the import
- **THEN** the system writes nothing and shows the replacement warning

### Requirement: Clockify API key handling
The system SHALL ask for a Clockify API key, SHALL send it only to Clockify's API, and SHALL NOT persist it in any browser storage, URL, log, or error message.

#### Scenario: Key entered
- **WHEN** the user pastes an API key and continues
- **THEN** the system validates it by loading the Clockify user and the list of workspaces

#### Scenario: Invalid key
- **WHEN** Clockify rejects the key
- **THEN** the system shows "Clockify API key is not valid" and keeps the wizard open

#### Scenario: Key not persisted
- **WHEN** the wizard is closed or the page is reloaded
- **THEN** the key is no longer available and is not found in local or session storage

#### Scenario: Advice after import
- **WHEN** the import finished successfully
- **THEN** the system recommends deleting the API key in Clockify's profile settings

### Requirement: Workspace selection
The system SHALL let the user choose which Clockify workspace to import when the key has access to more than one, and SHALL select it automatically when there is only one.

#### Scenario: Several workspaces
- **WHEN** the key has access to workspaces "Acme" and "Private"
- **THEN** the user selects one before any further data is loaded

### Requirement: User mapping
The system SHALL list every Clockify user of the workspace, including deactivated users, and SHALL let the user map each one to a GitHub login of the team, keep them as a former member, or skip them. A GitHub login SHALL NOT be assigned to more than one Clockify user.

#### Scenario: Automatic suggestion
- **WHEN** a Clockify user's name or email local part equals a team member's GitHub login (case-insensitive)
- **THEN** that login is pre-selected

#### Scenario: Former member
- **WHEN** the user keeps Clockify user "Jane Doe" as a former member
- **THEN** her entries are imported under the login `clockify.jane-doe`, count in statistics and exports, and cannot be edited by anyone

#### Scenario: Skipped user
- **WHEN** a Clockify user is set to skip
- **THEN** none of that user's entries are fetched or imported

#### Scenario: Duplicate login
- **WHEN** two Clockify users are mapped to the same GitHub login
- **THEN** the system refuses to continue and marks both rows

### Requirement: Economical data fetching
The system SHALL fetch users, projects, tags, and the time entries of each mapped user with large pages, requesting a further page only when the previous page was full, and SHALL show the number of Clockify requests made.

#### Scenario: Typical team on Free plan
- **WHEN** a workspace with 8 users and about 1,200 entries per user is imported
- **THEN** the import completes with at most 25 Clockify requests

#### Scenario: Progress
- **WHEN** entries are being fetched
- **THEN** the system shows per user how many entries were loaded and whether fetching is complete

### Requirement: Clockify rate limit handling
The system SHALL stop fetching when Clockify reports a rate limit, SHALL keep all data fetched so far, and SHALL let the user continue later from where fetching stopped.

#### Scenario: Limit reached
- **WHEN** Clockify responds with a rate-limit error after 3 of 6 users were fetched
- **THEN** the system shows that the Clockify limit was reached and when to continue, and offers a Continue action

#### Scenario: Continue
- **WHEN** the user presses Continue after the limit has reset
- **THEN** fetching resumes with the 4th user without re-fetching the first three

### Requirement: Missing permission for other users
The system SHALL detect when the API key cannot read the entries of a Clockify user and SHALL let the user continue without that user's entries.

#### Scenario: Non-admin key
- **WHEN** Clockify denies access to user "Tom"'s entries
- **THEN** the system states that only a Clockify workspace admin can import other users' entries and offers to continue without Tom

### Requirement: Data conversion
The system SHALL convert Clockify projects, tags, and completed time entries to Workaddict projects, tags, and entries, and SHALL NOT import clients, tasks, billable flags, rates, custom fields, or running timers.

#### Scenario: Project conversion
- **WHEN** Clockify project "Website" with color `#03A9F4` is archived
- **THEN** an archived Workaddict project "Website" is created with the nearest color from the project palette

#### Scenario: Duplicate project names
- **WHEN** Clockify has project "Website" under client "Acme" and project "Website" under client "Globex"
- **THEN** the projects are imported as "Website (Acme)" and "Website (Globex)"

#### Scenario: Entry conversion
- **WHEN** a Clockify entry runs from `2026-07-25T08:00:00Z` to `2026-07-25T10:00:00Z` with project "Website" and tags "meeting"
- **THEN** a Workaddict entry with the same UTC start and end, description, project, and tags is created for the mapped login

#### Scenario: Running timer
- **WHEN** a Clockify entry has no end time
- **THEN** it is not imported and is counted as skipped in the preview

#### Scenario: Invalid duration
- **WHEN** a Clockify entry ends at or before its start
- **THEN** it is not imported and is counted as skipped in the preview

### Requirement: Import preview
Before writing, the system SHALL show a preview with the number of projects, tags, entries per mapped login, total tracked hours per project, and the counts of skipped entries and of entries whose task or billable information will not be carried over.

#### Scenario: Preview shown
- **WHEN** all entries are fetched
- **THEN** the preview lists entries and hours per login and hours per project so the user can compare them with Clockify

#### Scenario: Cancel
- **WHEN** the user cancels in the preview
- **THEN** nothing is written to the data repository

### Requirement: Single-commit import
The system SHALL write all imported projects, tags, and entries to the data repository in one commit, and SHALL write nothing if the import fails.

#### Scenario: Successful import
- **WHEN** the user confirms a preview of 7,850 entries for 6 logins
- **THEN** one commit adds `workspace.json` with the projects and tags and all `entries/<login>/<YYYY-MM>.json` files, and the tracker shows the imported entries

#### Scenario: Failure while writing
- **WHEN** the write fails due to a network error
- **THEN** the data repository is unchanged, the fetched data is kept, and the user can retry

