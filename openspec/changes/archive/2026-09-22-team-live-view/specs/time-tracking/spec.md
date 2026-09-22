## ADDED Requirements

### Requirement: Stopping and discarding another member's timer
The system SHALL let a user with permission to stop other members' timers stop another member's running timer at a given end time, or discard it. The entry SHALL be stored under the timer owner's login, and the same idempotent stop behaviour as for own timers SHALL apply. The operation SHALL act only on the timer the actor saw, identified by its id, and SHALL leave a newer timer untouched. Commit messages SHALL name the timer owner and the acting member.

#### Scenario: Editor stops a timer
- **WHEN** editor `carol` stops `bob`'s timer (started 09:00) with end 10:30
- **THEN** `bob`'s entry file for that month contains an entry from 09:00 to 10:30 with the timer's id, description, project, and tags, `timers/bob.json` is `null`, and the commit message contains "bob" and "by carol"

#### Scenario: Owner and editor stop at the same time
- **WHEN** `bob` and editor `carol` stop `bob`'s timer at the same moment
- **THEN** exactly one entry exists for the timer and the timer is cleared

#### Scenario: Timer replaced meanwhile
- **WHEN** `carol` stops `bob`'s timer with id X while `bob` has already started a new timer with id Y
- **THEN** no entry is created, `bob`'s timer Y keeps running, and the operation reports that the timer was not found

#### Scenario: Editor discards a timer
- **WHEN** editor `carol` discards `bob`'s timer
- **THEN** `timers/bob.json` is `null`, no entry is created, and the commit message contains "discard", "bob", and "by carol"

#### Scenario: Worker tries to stop another timer
- **WHEN** worker `bob`'s adapter is asked to stop or discard `carol`'s timer
- **THEN** it writes nothing and throws `forbiddenRole`
