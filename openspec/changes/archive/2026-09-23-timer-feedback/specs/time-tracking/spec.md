## ADDED Requirements

### Requirement: Elapsed time in the tab title
While the signed-in user's own timer is running, the system SHALL show its elapsed time in the document title in the form `▶ <elapsed> · Workaddict`, using the same clock format as the timer display and updating it at least once per minute, also while the tab is in the background. When no own timer is running, or after signing out, the system SHALL restore the page's normal title. Timers of other members SHALL NOT affect the title.

#### Scenario: Timer running
- **WHEN** the user's timer has been running for 1 hour, 23 minutes and 45 seconds
- **THEN** the document title is `▶ 1:23:45 · Workaddict`

#### Scenario: Timer stopped
- **WHEN** the user stops their timer
- **THEN** the document title returns to the page's normal title

#### Scenario: Only another member's timer runs
- **WHEN** the user has no running timer and another member's timer is running
- **THEN** the document title is the page's normal title

### Requirement: Stop on page close
The system SHALL offer a per-device setting "Stop timer when I close the page", enabled by default. While the setting is on, the device on which the user started a timer SHALL remember the last time any Workaddict page was open on that device. When the app is loaded on that device, the user's running timer was started there, and no other Workaddict page is open on the device, the system SHALL ask when the page was opened anew (new tab, typed address, bookmark), however short the gap, or when it was reloaded or reached by back/forward after no Workaddict page was open for more than 2 minutes. It SHALL ask the user what to do with the timer, offering "Stop at <last open time>" (the default action), "Keep running", and "Stop now". A tab that is only hidden, or a device that was asleep while the page stayed open, SHALL NOT count as closed. The system SHALL NOT ask about a timer that was started on another device, in demo mode, or for a read-only session, and SHALL ask at most once per timer after the user chose "Keep running". The stop SHALL use the same idempotent stop behavior as a normal stop; if the timer was already stopped or replaced meanwhile, the system SHALL create no entry and close the question.

#### Scenario: Page closed and reopened later
- **WHEN** the user starts a timer at 09:00 on a laptop, closes the last Workaddict tab at 17:32, reopens the app the next morning, and chooses "Stop at 17:32"
- **THEN** an entry from 09:00 to 17:32 is created and the timer is cleared

#### Scenario: Keep running
- **WHEN** the question appears and the user chooses "Keep running"
- **THEN** the timer keeps running and the question does not appear again for this timer on this device

#### Scenario: Stop now
- **WHEN** the question appears and the user chooses "Stop now"
- **THEN** the timer becomes an entry ending at the current time

#### Scenario: Closed and reopened seconds later
- **WHEN** the user closes the only Workaddict tab and opens the app in a new tab 5 seconds later
- **THEN** the question appears, offering to stop at the time the tab was closed

#### Scenario: Reload
- **WHEN** the user reloads the page while the timer is running
- **THEN** no question appears and the timer keeps running

#### Scenario: Another tab stays open
- **WHEN** the user closes one of two Workaddict tabs for an hour and then opens a new tab
- **THEN** no question appears, because the other tab was open the whole time

#### Scenario: Laptop asleep
- **WHEN** the laptop sleeps for an hour with the Workaddict tab open and wakes up
- **THEN** no question appears and the timer keeps running

#### Scenario: Timer from another device
- **WHEN** the timer was started on the phone and the user opens the app on a laptop where Workaddict was closed for a day
- **THEN** no question appears on the laptop

#### Scenario: Setting off
- **WHEN** the user has turned the setting off on this device, closes the page while the timer runs, and reopens it an hour later
- **THEN** no question appears and the timer keeps running

#### Scenario: Timer already stopped elsewhere
- **WHEN** the question is shown and the timer was stopped on another device meanwhile, and the user chooses "Stop at 17:32"
- **THEN** no additional entry is created and the question closes with the "already stopped" notice

### Requirement: Time format
The system SHALL show clock times of day (entry times, timer start, "Team now", dialogs, notices and the PDF export) in the time format chosen on the device: 24-hour (`14:30`) by default, or 12-hour (`2:30 PM`). Time input fields SHALL show and prefill values in the chosen format and SHALL accept either format when typed, including `14:30`, `1430`, `14.30`, `9`, `2:30 pm` and `2pm`. Times SHALL be stored unchanged.

#### Scenario: Default 24-hour
- **WHEN** a user who never changed the time format views an entry from 14:30 to 15:00
- **THEN** its times show as `14:30` and `15:00`, whatever the browser's language

#### Scenario: 12-hour chosen
- **WHEN** the user chose "12-hour" and views the same entry
- **THEN** its times show as `2:30 PM` and `3:00 PM`

#### Scenario: Typing the other format
- **WHEN** the 24-hour format is chosen and the user types `2:30 pm` as the start time of an entry
- **THEN** the start is saved as 14:30

## MODIFIED Requirements

### Requirement: Live timer
The system SHALL let a user start a timer with an optional description, project, and tags, display the elapsed time updating every second, and stop it to create a time entry. The user SHALL be able to change the start time of their running timer in place by clicking the shown start time; Enter or leaving the field SHALL save it, Escape SHALL cancel it. The entered time SHALL be read as that time today; if that is later than now, it SHALL be read as the previous day only when the timer's current start is before today, and SHALL otherwise be rejected with a validation error while keeping the typed value and saving nothing.

#### Scenario: Start and stop
- **WHEN** the user starts a timer at 09:00 and stops it at 10:30
- **THEN** a time entry from 09:00 to 10:30 with the timer's description, project, and tags is created and the timer is cleared

#### Scenario: Edit while running
- **WHEN** the user changes the description, project, or tags of a running timer
- **THEN** the changes are saved to the running timer and applied to the entry created on stop

#### Scenario: Change start time while running
- **WHEN** the timer shows "Running since 09:12" at 10:00 and the user clicks the time, enters 08:45, and presses Enter
- **THEN** the timer is saved with start 08:45 today, the elapsed time shows 1:15:00, and the entry created on stop starts at 08:45

#### Scenario: Start time in the future
- **WHEN** at 10:00 the user enters 10:30 as the start time of a timer that started today
- **THEN** the system shows a validation error, keeps the typed value, and saves nothing

#### Scenario: Timer running past midnight
- **WHEN** at 00:15 the user enters 23:00 as the start time of a timer that started yesterday at 23:30
- **THEN** the timer is saved with start 23:00 yesterday

#### Scenario: Discard timer
- **WHEN** the user discards a running timer
- **THEN** the timer is cleared and no entry is created

### Requirement: Inline entry editing
The system SHALL let a user with permission to change an entry edit its description, project, tags, start time, end time, and duration directly in the entry list by clicking the field, without opening a dialog. Editable start time, end time, and duration SHALL be recognizable as editable without hovering, including on touch screens. After a timer is stopped, the confirmation SHALL tell the user that the times can be corrected in the entry list. Enter or leaving the field SHALL save the change, Escape SHALL cancel it, and an unchanged field SHALL NOT be saved. Invalid values SHALL be rejected with the same validation as manual entries while keeping the typed value. The edit dialog SHALL remain available for changing the date.

#### Scenario: Editable times visible on touch screens
- **WHEN** a user views their entries on a phone
- **THEN** start time, end time, and duration show a visible edit affordance without any hover

#### Scenario: Hint after stopping
- **WHEN** the user stops their timer
- **THEN** the confirmation says that the entry was saved and that its times can be corrected by tapping them in the list

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
