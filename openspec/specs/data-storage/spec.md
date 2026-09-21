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
The GitHub adapter SHALL store data as JSON files: `tracker.json`, `workspace.json` (projects and tags), `entries/<login>/<YYYY-MM>.json` (a user's entries whose start falls in that UTC month), and `timers/<login>.json` (the user's running timer or `null`).

#### Scenario: Saving an entry
- **WHEN** user `alice` saves an entry starting 2026-09-21T08:00:00Z
- **THEN** the entry is stored in `entries/alice/2026-09.json`

#### Scenario: Entry spanning months
- **WHEN** an entry starts 2026-09-30T22:00:00Z and ends 2026-10-01T01:00:00Z
- **THEN** the entry is stored only in the file for 2026-09

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
Every write SHALL create a commit whose message states the kind of change, a short summary, and the acting user's login.

#### Scenario: Entry commit message
- **WHEN** user `alice` adds a 2-hour entry described "Fix login"
- **THEN** the commit message contains "entry", "Fix login", and "alice"

### Requirement: Error reporting
The system SHALL show a clear, non-technical error when a read or write fails due to network errors, rate limiting, or revoked access, and SHALL keep the user's unsaved input.

#### Scenario: Rate limit reached
- **WHEN** the GitHub API responds with a rate-limit error
- **THEN** the system shows a message including the time when requests will be possible again

#### Scenario: Offline
- **WHEN** the device is offline while the user saves an entry
- **THEN** the system shows a "could not save, you are offline" message and keeps the entry form filled

