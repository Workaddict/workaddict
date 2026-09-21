## ADDED Requirements

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
