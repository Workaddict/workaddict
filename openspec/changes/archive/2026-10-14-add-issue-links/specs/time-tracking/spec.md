## ADDED Requirements

### Requirement: Issue link on entries
The system SHALL offer an optional "Issue" input in the timer bar, the manual entry form, inline entry editing and the edit dialog. The running timer SHALL keep the issue link and pass it to the entry it creates when stopped, and quick restart SHALL copy it. The entry list SHALL show the issue link next to the description. Every member who may edit an entry may change its issue link.

#### Scenario: Timer with issue
- **WHEN** a user starts the timer with description "Login bug" and issue `acme/web#42`, then stops it
- **THEN** the saved entry has `issueRef` `acme/web#42`

#### Scenario: Quick restart
- **WHEN** a user restarts an entry that links to `acme/web#42`
- **THEN** the new running timer links to `acme/web#42`

#### Scenario: Remove link
- **WHEN** a user clears the issue input of an entry and saves
- **THEN** the entry no longer has an `issueRef`

#### Scenario: Bulk manual entries
- **WHEN** a team leader adds a manual entry for 3 members with issue `acme/web#42`
- **THEN** all 3 entries link to `acme/web#42`
