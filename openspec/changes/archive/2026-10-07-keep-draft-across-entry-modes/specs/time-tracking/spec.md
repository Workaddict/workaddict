## ADDED Requirements

### Requirement: Draft kept across entry modes
The system SHALL keep the description, project and tags the user entered when switching the tracker between timer mode and manual mode, in either direction, for the current page view. Switching modes SHALL NOT start, stop, discard or otherwise change the running timer by itself. Times entered in manual mode SHALL NOT carry over to timer mode when no timer is running.

#### Scenario: Timer to manual without a running timer
- **WHEN** no timer is running, the user types "Review" and selects project "Alpha" in timer mode, then switches to manual mode
- **THEN** the manual form shows description "Review" and project "Alpha"

#### Scenario: Manual to timer without a running timer
- **WHEN** no timer is running, the user types "Review", selects project "Alpha" and enters start 13:00 in manual mode, then switches to timer mode
- **THEN** the timer form shows description "Review" and project "Alpha", and starting the timer starts it now

#### Scenario: Draft cleared after use
- **WHEN** the user starts a timer or adds a manual entry from the draft
- **THEN** the draft is empty in both modes

### Requirement: Finish a running timer from the manual form
When a timer is running, the manual form SHALL show that timer as an editable entry: description, project and tags from the timer, date and start from the timer's start, and end set to the time the user switched to manual mode, entered as end time or duration according to the remembered choice. The save button SHALL read "Stop & save". Saving SHALL validate the times as for manual entries, apply the description, project, tags and start to the running timer, and stop it at the chosen end, creating exactly one entry. Leaving manual mode without saving SHALL keep the timer running with the description, project and tag edits applied and SHALL drop the time edits. If the timer was stopped elsewhere before saving, the system SHALL save nothing and tell the user the timer was already stopped.

#### Scenario: Correct and stop a running timer
- **WHEN** a timer "Review" started at 09:00 is running, the user switches to manual mode at 10:40, changes the start to 08:50 and the end to 10:30, and clicks "Stop & save"
- **THEN** one entry "Review" from 08:50 to 10:30 is created and no timer is running

#### Scenario: End frozen at switch
- **WHEN** a timer is running and the user switches to manual mode at 10:40 and clicks "Stop & save" at 10:45 without changing the times
- **THEN** the entry ends at 10:40

#### Scenario: Leave manual without saving
- **WHEN** a timer is running, the user switches to manual mode, changes the description to "Planning" and the start time, then switches back to timer mode
- **THEN** the timer is still running with description "Planning" and its original start time

#### Scenario: Invalid times
- **WHEN** a timer is running and the user enters a duration of 25:00 in manual mode and clicks "Stop & save"
- **THEN** the system shows the validation error and the timer keeps running unchanged

#### Scenario: Timer stopped elsewhere
- **WHEN** the user has the running timer open in manual mode and the timer is stopped on another device before the user clicks "Stop & save"
- **THEN** no new entry is created and the user is told the timer was already stopped
