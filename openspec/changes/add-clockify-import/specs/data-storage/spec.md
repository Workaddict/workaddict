## ADDED Requirements

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
