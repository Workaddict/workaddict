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
The GitHub adapter SHALL check the branch head commit before discovering files, SHALL reuse the last file list when the head commit is unchanged, and otherwise SHALL discover files through a single recursive tree request for that head commit. It SHALL fetch file contents only for blob SHAs not already in its local cache, with at most 8 content requests in flight at any time across all concurrent reads.

#### Scenario: Unchanged data refresh
- **WHEN** data is refreshed and no commit landed on the branch since the last refresh
- **THEN** the adapter makes one branch-head request, no tree request, and no content requests

#### Scenario: One file changed
- **WHEN** one entry file changed since the last refresh
- **THEN** the adapter makes one branch-head request, one tree request, and fetches the content of only that file

#### Scenario: Cold cache with many files
- **WHEN** all entries are read with an empty local cache and the repository has 360 entry files
- **THEN** every file is fetched once and no more than 8 content requests are in flight at the same time

#### Scenario: After own write
- **WHEN** the current user's write succeeded or failed with a conflict
- **THEN** the next refresh fetches the tree again even if the branch-head request reports the previously seen commit

#### Scenario: Empty repository
- **WHEN** the branch-head request reports an empty repository or a missing branch
- **THEN** the adapter treats the repository as having no files

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

### Requirement: Stop attribution on entries
A time entry SHALL have an optional `stoppedBy` field holding the login of the member who stopped the timer that created it. The field SHALL be set only when that member differs from the entry's owner, and SHALL be kept when the entry is later edited.

#### Scenario: Self stop
- **WHEN** `bob` stops his own timer
- **THEN** the created entry has no `stoppedBy` field

#### Scenario: Stopped by editor
- **WHEN** editor `carol` stops `bob`'s timer
- **THEN** the entry in `bob`'s entry file has `stoppedBy` `"carol"`

#### Scenario: Edited afterwards
- **WHEN** `bob` changes the description of an entry with `stoppedBy` `"carol"`
- **THEN** the saved entry still has `stoppedBy` `"carol"`

### Requirement: Untrusted repository data
The GitHub adapter SHALL validate every file read from the data repository before the app uses it, because any member with push access can write arbitrary content. It SHALL ignore records that fail validation, SHALL keep those records unchanged when writing the file back, and SHALL NOT crash or stop showing valid data because of invalid content. Validation SHALL include: entry and timer fields have the expected types, `start` and `end` are valid ISO timestamps with `end` not before `start`, an entry's or timer's `login` equals the login in its file path, project colors are hex colors (`#rgb` or `#rrggbb`), and logins taken from file paths match the app's login format (GitHub logins and `clockify.<name>` pseudo-logins).

#### Scenario: Malformed record in an entry file
- **WHEN** `entries/bob/2026-09.json` contains three valid entries and one object without a `start`
- **THEN** the app shows the three valid entries and a notice that some repository data could not be read

#### Scenario: Invalid record kept on write
- **WHEN** bob adds an entry to `entries/bob/2026-09.json`, which contains one invalid record
- **THEN** the written file contains the new entry, the existing valid entries, and the invalid record unchanged

#### Scenario: Entry claims another member
- **WHEN** `entries/bob/2026-09.json` contains an entry with `"login": "alice"`
- **THEN** the entry is not counted for alice or bob and is reported as invalid

#### Scenario: Unreadable file root
- **WHEN** `entries/bob/2026-09.json` contains `{"entries": 42}`
- **THEN** the app treats the file as having no entries, shows the notice, and refuses to write to that file with an error that names the file

#### Scenario: Invalid project color
- **WHEN** `workspace.json` contains a project with color `"red; background:url(x)"`
- **THEN** the project is shown with the default palette color

#### Scenario: Invalid login in a path
- **WHEN** the repository contains `timers/../../x.json` or `entries/a b/2026-09.json`
- **THEN** the file is ignored and no member with that login is listed

### Requirement: Repository file size limit
The GitHub adapter SHALL NOT fetch the content of a data file larger than 2 MB, as reported by the tree listing, and SHALL treat such a file as unreadable and include it in the data notice.

#### Scenario: Oversized entry file
- **WHEN** `entries/bob/2026-09.json` is 20 MB
- **THEN** the adapter makes no content request for it, and the app shows the notice and all other data

### Requirement: Data problem notice
The system SHALL report validation and size problems in one notice per refresh that lists the affected file paths without their content, and SHALL NOT show the notice again for a file whose content has not changed since the notice was dismissed.

#### Scenario: Repeated polling
- **WHEN** a notice about `entries/bob/2026-09.json` was dismissed and the file is unchanged at the next refresh
- **THEN** no new notice appears

### Requirement: Local cache lifetime
The system SHALL persist cached repository content in browser storage only for sessions logged in with "Remember me", SHALL keep it in memory only for other sessions, and SHALL delete any persisted repository content when the app starts without a remembered session.

#### Scenario: Non-remembered session
- **WHEN** a user logs in without "Remember me" and loads their entries
- **THEN** no repository content is written to IndexedDB

#### Scenario: Leftover cache from a closed tab
- **WHEN** the app starts, no remembered session exists, and IndexedDB still contains cached repository content
- **THEN** the system deletes that content before showing the login page

#### Scenario: Remembered session
- **WHEN** a user who logged in with "Remember me" reopens the app
- **THEN** unchanged files are served from the persisted cache without content requests

