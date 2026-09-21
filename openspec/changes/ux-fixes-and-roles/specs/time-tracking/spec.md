## MODIFIED Requirements

### Requirement: Edit and delete own entries
The system SHALL let a user edit all fields of and delete their own entries, SHALL let editors and team leaders also edit and delete other members' entries without changing the entry's owner, and SHALL NOT offer edit or delete actions for entries the user lacks permission to change.

#### Scenario: Edit own entry
- **WHEN** the user changes the project of one of their entries and saves
- **THEN** the entry is updated and moved to the correct month file if its start month changed

#### Scenario: Delete with confirmation
- **WHEN** the user deletes one of their entries and confirms
- **THEN** the entry is removed

#### Scenario: Other member's entry as worker
- **WHEN** a worker views another member's entry
- **THEN** no edit or delete controls are shown and its fields are not editable inline

#### Scenario: Other member's entry as editor
- **WHEN** an editor changes the end time of `bob`'s entry
- **THEN** the entry is saved in `bob`'s entry file, keeps `bob` as its member, and the commit message names both `bob` and the editor

## ADDED Requirements

### Requirement: Inline entry editing
The system SHALL let a user with permission to change an entry edit its description, project, tags, start time, end time, and duration directly in the entry list by clicking the field, without opening a dialog. Enter or leaving the field SHALL save the change, Escape SHALL cancel it, and an unchanged field SHALL NOT be saved. Invalid values SHALL be rejected with the same validation as manual entries while keeping the typed value. The edit dialog SHALL remain available for changing the date.

#### Scenario: Edit description inline
- **WHEN** the user clicks the description of their entry, types "Review PR", and presses Enter
- **THEN** the entry's description is saved as "Review PR" without a dialog opening

#### Scenario: Edit start time inline
- **WHEN** the user clicks the start time 09:00 of their 09:00–10:00 entry, enters 08:30, and leaves the field
- **THEN** the entry is saved as 08:30–10:00 and its shown duration becomes 1:30

#### Scenario: Edit duration inline
- **WHEN** the user clicks the duration 1:00 of their 09:00–10:00 entry and enters 2:15
- **THEN** the entry is saved as 09:00–11:15

#### Scenario: Cancel with Escape
- **WHEN** the user changes the description inline and presses Escape
- **THEN** the original description is shown and nothing is saved

#### Scenario: Invalid inline value
- **WHEN** the user enters a duration of 25:00 inline
- **THEN** the system shows a validation error, keeps the field in edit mode with the typed value, and saves nothing

#### Scenario: Change project inline
- **WHEN** the user clicks the project chip of their entry and selects "Website"
- **THEN** the entry's project is saved as "Website"

#### Scenario: Save fails
- **WHEN** an inline save fails because the device is offline
- **THEN** the system shows the offline error and restores the field to edit mode with the typed value
