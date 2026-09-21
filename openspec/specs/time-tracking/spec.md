# time-tracking Specification

## Purpose
TBD - created by archiving change build-time-tracker-mvp. Update Purpose after archive.
## Requirements
### Requirement: Live timer
The system SHALL let a user start a timer with an optional description, project, and tags, display the elapsed time updating every second, and stop it to create a time entry.

#### Scenario: Start and stop
- **WHEN** the user starts a timer at 09:00 and stops it at 10:30
- **THEN** a time entry from 09:00 to 10:30 with the timer's description, project, and tags is created and the timer is cleared

#### Scenario: Edit while running
- **WHEN** the user changes the description, project, or tags of a running timer
- **THEN** the changes are saved to the running timer and applied to the entry created on stop

#### Scenario: Discard timer
- **WHEN** the user discards a running timer
- **THEN** the timer is cleared and no entry is created

### Requirement: One running timer per user
The system SHALL allow at most one running timer per user; starting a new timer while one is running SHALL stop the running one first and save it as an entry.

#### Scenario: Start while running
- **WHEN** a timer is running and the user starts a new one
- **THEN** the running timer becomes a time entry ending now and the new timer starts

### Requirement: Timer synced across devices
The system SHALL persist the running timer in the data repository so the same user sees and controls it from any device, refreshing timer state at least every 30 seconds while the page is visible and whenever the page regains focus.

#### Scenario: Continue on another device
- **WHEN** the user starts a timer on a laptop and opens the app on a phone
- **THEN** the phone shows the running timer with the correct elapsed time

#### Scenario: Stopped elsewhere
- **WHEN** the timer was stopped on another device and the user tries to stop it again
- **THEN** the system shows the timer as stopped and creates no duplicate entry

#### Scenario: Interrupted stop
- **WHEN** a stop created the entry but failed before clearing the timer, and the user stops again
- **THEN** the timer is cleared and exactly one entry exists for it

### Requirement: Manual entries
The system SHALL let a user create an entry manually by entering date, start time, and either end time or duration, plus description, project, and tags.

#### Scenario: Entry with end time
- **WHEN** the user enters date 2026-09-21, start 13:00, end 15:15
- **THEN** an entry of 2 h 15 min is created

#### Scenario: Entry with duration
- **WHEN** the user enters date 2026-09-21, start 13:00, duration 1:30
- **THEN** an entry from 13:00 to 14:30 is created

#### Scenario: End before start
- **WHEN** the end time is earlier than the start time on the same date
- **THEN** the system treats the entry as ending on the following day and shows the resulting duration before saving

#### Scenario: Invalid duration
- **WHEN** the resulting duration is zero or exceeds 24 hours
- **THEN** the system refuses to save and shows a validation error

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

### Requirement: Entry list
The system SHALL show time entries grouped by day, newest first, with each day's total, and each entry's description, project (with color), tags, member, time range, and duration; the list SHALL default to the current user's entries with a filter to show all members.

#### Scenario: Daily grouping
- **WHEN** the user has three entries today and two yesterday
- **THEN** the list shows a "Today" group with three entries and its total, followed by a "Yesterday" group

#### Scenario: Show all members
- **WHEN** the user switches the member filter to "Everyone"
- **THEN** the list includes entries of all members, each labeled with the member's avatar and login

#### Scenario: Load older entries
- **WHEN** the user scrolls to the end of the list
- **THEN** the system loads entries from the previous month

### Requirement: Quick restart
The system SHALL let a user start a new timer pre-filled with an existing entry's description, project, and tags.

#### Scenario: Continue an entry
- **WHEN** the user clicks "Continue" on an entry
- **THEN** a timer starts now with that entry's description, project, and tags

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

