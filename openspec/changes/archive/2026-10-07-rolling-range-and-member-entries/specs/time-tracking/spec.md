## ADDED Requirements

### Requirement: Manual entries for other members
The manual entry form SHALL show editors and team leaders a "For" member picker that defaults to the current user and lists all current members of the workspace. Workers SHALL NOT see it. When another member is selected, saving SHALL create the entry with that member as its owner in that member's entry file, the commit message SHALL name both the member and the acting user, and the success message SHALL name the member. The picker SHALL keep the chosen member after saving until the page is reloaded or the tracker leaves manual mode.

#### Scenario: Editor adds a missing entry
- **WHEN** editor `bene` selects "For: simon", enters date 2026-09-22, 09:00 to 11:30, description "Client call" and project "Alpha", and saves
- **THEN** an entry of 2 h 30 min owned by `simon` is saved in `simon`'s entry file for 2026-09, the commit message contains "simon" and "bene", and the message "Added for simon" is shown

#### Scenario: Worker has no picker
- **WHEN** a worker opens the manual entry form
- **THEN** no member picker is shown and entries are always created for the worker

#### Scenario: Picker kept for the next entry
- **WHEN** an editor has just added an entry for `simon`
- **THEN** the picker still shows `simon` and the description, project, and tags are cleared

#### Scenario: Own timer running
- **WHEN** an editor's own timer is running, the editor is in manual mode, and selects "For: simon"
- **THEN** the form is emptied, the save button reads "Add entry for simon", saving creates an entry for `simon`, and the editor's timer keeps running unchanged

#### Scenario: Validation as for own entries
- **WHEN** an editor enters a duration of 25:00 for another member
- **THEN** the system refuses to save and shows the validation error

### Requirement: Entries added by another member
The system SHALL record on an entry the login of the member who created it on behalf of its owner. The storage layer SHALL set it when an entry is created for another member and keep it unchanged when the entry is later edited. The entry list SHALL show "added by <login>" on such entries to every viewer.

#### Scenario: Marker in the list
- **WHEN** `simon` views his entries and one was added for him by `bene`
- **THEN** that entry shows "added by bene"

#### Scenario: Own entries unmarked
- **WHEN** a user adds an entry for themselves
- **THEN** the entry records no adder and shows no marker

#### Scenario: Marker survives edits
- **WHEN** `simon` edits the description of an entry `bene` added for him
- **THEN** the entry still shows "added by bene"
