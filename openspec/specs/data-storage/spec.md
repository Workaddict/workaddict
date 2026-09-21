# data-storage Specification

## Purpose
TBD - created by archiving change build-time-tracker-mvp. Update Purpose after archive.
## Requirements
### Requirement: Storage adapter boundary
The system SHALL perform all data reads and writes through a single `StorageAdapter` interface, and UI code SHALL NOT call the GitHub API directly.

#### Scenario: Swapping the adapter
- **WHEN** the application is started with the in-memory adapter instead of the GitHub adapter
- **THEN** all features (tracking, work groups, stats, export) work without code changes outside the adapter module

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

### Requirement: UTC timestamps
The system SHALL store all timestamps as ISO-8601 UTC strings and SHALL display them in the user's local time zone.

#### Scenario: Display in local time
- **WHEN** an entry stored with start `2026-09-21T08:00:00Z` is shown to a user in Europe/Berlin (UTC+2)
- **THEN** the start time is displayed as 10:00

### Requirement: Efficient reads with content cache
The GitHub adapter SHALL discover files through a single recursive tree request and SHALL fetch file contents only for blob SHAs not already in its local cache.

#### Scenario: Unchanged data refresh
- **WHEN** data is refreshed and no files changed since the last refresh
- **THEN** the adapter makes one tree request and no content requests

#### Scenario: One file changed
- **WHEN** one entry file changed since the last refresh
- **THEN** the adapter fetches the content of only that file

### Requirement: Conflict-safe writes
The GitHub adapter SHALL write files with the current file SHA and, on a SHA conflict, SHALL refetch the file, re-apply the change, and retry up to 3 times before reporting an error.

#### Scenario: Concurrent workspace edit
- **WHEN** two users add different projects at the same moment
- **THEN** both projects are present in `workspace.json` after both writes complete

#### Scenario: Persistent conflict
- **WHEN** a write still conflicts after 3 retries
- **THEN** the system shows an error and the user's change is not silently lost from the form

### Requirement: Descriptive commits
Every write SHALL create a commit whose message states the kind of change, a short summary, and the acting user's login; when the acting user changes another member's entry, the message SHALL also name that member.

#### Scenario: Entry commit message
- **WHEN** user `alice` adds a 2-hour entry described "Fix login"
- **THEN** the commit message contains "entry", "Fix login", and "alice"

#### Scenario: Entry changed for another member
- **WHEN** editor `carol` deletes `bob`'s entry described "Standup"
- **THEN** the commit message contains "entry", "Standup", "bob", and "carol"

### Requirement: Error reporting
The system SHALL show a clear, non-technical error when a read or write fails due to network errors, rate limiting, or revoked access, and SHALL keep the user's unsaved input.

#### Scenario: Rate limit reached
- **WHEN** the GitHub API responds with a rate-limit error
- **THEN** the system shows a message including the time when requests will be possible again

#### Scenario: Offline
- **WHEN** the device is offline while the user saves an entry
- **THEN** the system shows a "could not save, you are offline" message and keeps the entry form filled

### Requirement: Atomic multi-file write
The storage layer SHALL support writing many files in a single commit, such that either all files are written or none; the GitHub adapter SHALL implement it with the Git Data API using a constant number of requests independent of the number of files.

#### Scenario: Many files, one commit
- **WHEN** 100 files are written in one multi-file write
- **THEN** the data repository gains exactly one commit containing all 100 files

#### Scenario: Concurrent commit
- **WHEN** another commit lands on the branch between reading the branch head and updating it
- **THEN** the adapter re-reads the head, re-validates, and retries up to 3 times before reporting a conflict, without force-pushing

### Requirement: Bulk data import
The storage adapter SHALL provide an import operation that writes a workspace and entries of several members in one commit, storing each entry under its own login and UTC start month. It SHALL refuse if the repository already contains entries, projects, or tags, unless the caller requests overwriting; then it SHALL delete all existing entry files and replace the workspace in the same commit, keeping running timers.

#### Scenario: Import into empty repository
- **WHEN** entries of `alice` and `bob` for 2025-10 and 2025-11 are imported into an empty repository
- **THEN** the files `entries/alice/2025-10.json`, `entries/alice/2025-11.json`, `entries/bob/2025-10.json`, `entries/bob/2025-11.json`, and `workspace.json` are written in one commit whose message contains "import" and the acting user's login

#### Scenario: Repository not empty
- **WHEN** an import is attempted while `workspace.json` contains a project
- **THEN** the adapter writes nothing and reports that the workspace is not empty

#### Scenario: Overwriting import
- **WHEN** an import with overwrite is attempted while `entries/carol/2024-01.json` exists
- **THEN** one commit deletes that file, replaces `workspace.json`, and adds the imported entry files

#### Scenario: Read-only repository
- **WHEN** an import is attempted while the adapter is read-only because of a newer schema version
- **THEN** the adapter writes nothing and reports the read-only state

### Requirement: Current user's role
The storage adapter SHALL provide the current user's effective role and owner status and the role assignments of all members, determined from the repository admin permission and `roles.json`, and SHALL refresh them together with the other data.

#### Scenario: Role after promotion
- **WHEN** an owner promotes `bob` to editor while `bob` has the app open
- **THEN** `bob`'s app shows editor permissions after its next data refresh without logging in again

### Requirement: Entry reassignment
The storage adapter SHALL provide an operation that moves the entries of one login to another login, optionally only entries starting before a given time, writing all changed entry files in one commit whose message states the number of entries, both logins, the cutoff, and the acting user. Moved entries SHALL keep their id, times, description, project, and tags. Source files left without entries SHALL be deleted. The operation SHALL be allowed only for team leaders, SHALL refuse equal source and target logins, SHALL write nothing when no entry matches, and SHALL write nothing and report a conflict when any affected file changed after it was read.

#### Scenario: Single commit
- **WHEN** a team leader reassigns 1 entry of `bob` before 2025-11-01 to `carol`
- **THEN** exactly one commit with the message `reassign: 1 entry from bob to carol before 2025-11-01 (alice)` moves it into `carol`'s month file and deletes `bob`'s emptied file

#### Scenario: Concurrent change
- **WHEN** another member writes to an affected target file during the reassignment
- **THEN** the adapter writes nothing and reports a conflict

#### Scenario: Not a team leader
- **WHEN** an editor attempts a reassignment
- **THEN** the adapter writes nothing and throws `forbiddenRole`

