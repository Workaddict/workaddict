## ADDED Requirements

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
