# time-tracking Specification

## Purpose
TBD - created by archiving change build-time-tracker-mvp. Update Purpose after archive.
## Requirements
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
The system SHALL let a user with permission to change an entry edit its description, project, tags, date, start time, end time, and duration directly in the entry list by clicking the field, without opening a dialog. The editable date, start time, end time, and duration SHALL be recognizable as editable without hovering, including on touch screens. After a timer is stopped, the confirmation SHALL tell the user that the times can be corrected in the entry list. Enter or leaving the field SHALL save the change, Escape SHALL cancel it, and an unchanged field SHALL NOT be saved. Invalid values SHALL be rejected with the same validation as manual entries while keeping the typed value. Changing the date SHALL move the start and end by the same number of days, keeping the times and the duration, and SHALL show the entry in the group of its new day.

#### Scenario: Editable times visible on touch screens
- **WHEN** a user views their entries on a phone
- **THEN** date, start time, end time, and duration show a visible edit affordance without any hover

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

#### Scenario: Edit date inline
- **WHEN** the user clicks the date of their entry from 2026-09-21 09:00–10:00 and picks 2026-09-18
- **THEN** the entry is saved as 2026-09-18 09:00–10:00 without a dialog opening and appears in the group of that day

#### Scenario: Date moved to another month
- **WHEN** the user changes the date of an entry from 2026-10-01 to 2026-09-30
- **THEN** the entry is saved in the September entry file and removed from the October file

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
The system SHALL offer a per-device setting "Stop timer when I close the page", enabled by default. While the setting is on, the device on which the user started a timer SHALL remember, per data repository, that the timer was started there, and SHALL remember the last time any Workaddict page was open on that device. When the app is loaded on that device, the user's running timer in the opened repository was started there, and no other Workaddict page is open on the device, the system SHALL ask when the page was opened anew (new tab, typed address, bookmark), however short the gap, or when it was reloaded or reached by back/forward after no Workaddict page was open for more than 2 minutes. A Workaddict page open on another workspace SHALL count as open. It SHALL ask the user what to do with the timer, offering "Stop at <last open time>" (the default action), "Keep running", and "Stop now". A tab that is only hidden, or a device that was asleep while the page stayed open, SHALL NOT count as closed. The system SHALL NOT ask about a timer that was started on another device, in demo mode, or for a read-only session, and SHALL ask at most once per timer after the user chose "Keep running". The stop SHALL use the same idempotent stop behavior as a normal stop; if the timer was already stopped or replaced meanwhile, the system SHALL create no entry and close the question.

#### Scenario: Page closed and reopened later
- **WHEN** the user starts a timer at 09:00 on a laptop, closes the last Workaddict tab at 17:32, reopens the app the next morning, and chooses "Stop at 17:32"
- **THEN** an entry from 09:00 to 17:32 is created and the timer is cleared

#### Scenario: Timers in two workspaces
- **WHEN** the user starts a timer in `acme/time-data`, then one in `globex/hours` on the same laptop, closes all tabs and reopens `acme/time-data` later
- **THEN** the question appears for the `acme/time-data` timer

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

### Requirement: Edit dialog closes after a valid save
When the user saves the edit dialog and the values pass validation, the dialog SHALL close immediately and the entry list SHALL show the new values, without waiting for the save to reach GitHub. When that save later fails, the system SHALL restore the previous values in the list and SHALL show an error with an action to open the dialog again with the values the user entered. When the values do not pass validation, the dialog SHALL stay open and show the errors.

#### Scenario: Valid save
- **WHEN** the user changes the description in the edit dialog and clicks Save
- **THEN** the dialog closes at once and the list shows the new description

#### Scenario: Save fails later
- **WHEN** the dialog has closed and the save fails because the device is offline
- **THEN** the list shows the previous values and an error offers "Open again", which reopens the dialog with the entered values

#### Scenario: Invalid values
- **WHEN** the user enters a duration of 25:00 in the edit dialog and clicks Save
- **THEN** the dialog stays open and shows the validation error

### Requirement: Remembered entry preferences
The system SHALL remember in this browser, for the current viewer, the last chosen entry mode (timer or manual), whether manual times are entered as end time or as duration, and the entry list's member filter (me or everyone), and SHALL use them as the starting values on the next visit. The edit dialog SHALL start with the remembered end-time or duration choice. When browser storage is unavailable, the defaults SHALL apply and changing them SHALL work for the current page view.

#### Scenario: Manual mode with duration remembered
- **WHEN** the user switches to manual mode, chooses to enter a duration, and reloads the page
- **THEN** the tracker opens in manual mode with the duration input selected

#### Scenario: Member filter remembered
- **WHEN** an editor sets the entry list filter to "Everyone" and reloads the page
- **THEN** the list shows everyone's entries

#### Scenario: Storage blocked
- **WHEN** browser storage throws on access
- **THEN** the tracker opens in timer mode with end time input and the "Me" filter, and switching still works

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

