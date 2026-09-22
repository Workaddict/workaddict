## ADDED Requirements

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
