## ADDED Requirements

### Requirement: Team now block
The system SHALL show a "Team now" block on the tracker page below the user's own timer to users with permission to view team live activity (editors and team leaders), and SHALL NOT render it for workers. The block SHALL list every member except the current user.

#### Scenario: Editor opens the tracker
- **WHEN** editor `carol` opens the tracker page
- **THEN** a "Team now" block lists all members except `carol`

#### Scenario: Worker opens the tracker
- **WHEN** worker `bob` opens the tracker page
- **THEN** no "Team now" block is shown

### Requirement: Running member details
For each member with a running timer, the block SHALL show the timer's description, project, tags, and elapsed time updating every second. It SHALL reflect timers that other members start, change, or stop within one timer refresh (at most 30 seconds while the page is visible).

#### Scenario: Member is tracking
- **WHEN** `bob` started a timer "Review PR" with project "Website" and tag "meeting" at 09:00 and it is now 09:42
- **THEN** `bob`'s row shows "Review PR", "Website", "meeting", and an elapsed time of 0:42 that keeps counting

#### Scenario: Member stops on their own
- **WHEN** `bob` stops his timer while team leader `alice` has the tracker page open
- **THEN** `bob`'s row shows him as not tracking after the next timer refresh

### Requirement: Daily total and last activity
For every listed member the block SHALL show the time tracked today: entries starting today plus the part of the running timer since midnight. For members without a running timer it SHALL also show the end time of their latest entry today, or "no entries today" if there is none.

#### Scenario: Idle member with entries today
- **WHEN** `erin` has entries today of 3:00 and 1:30, the later one ending at 14:00, and no running timer
- **THEN** `erin`'s row shows today 4:30 and last active 14:00

#### Scenario: Running member total
- **WHEN** `bob` has 4:28 of entries today and a timer running for 0:42
- **THEN** `bob`'s row shows today 5:10

#### Scenario: Timer running since yesterday
- **WHEN** `dave`'s timer started yesterday at 16:30, he has no entries today, and it is now 09:00
- **THEN** `dave`'s row shows today 9:00

#### Scenario: No entries today
- **WHEN** `frank` has no entries today and no running timer
- **THEN** `frank`'s row shows today 0:00 and "no entries today"

### Requirement: Order of rows
The block SHALL list members with a running timer first, ordered by longest elapsed time, followed by the other members in alphabetical order of their login.

#### Scenario: Mixed team
- **WHEN** `carol` has run for 3:15, `bob` for 0:42, and `erin` and `dave` are not tracking
- **THEN** the order is `carol`, `bob`, `dave`, `erin`

### Requirement: Running too long flag
The system SHALL flag a running timer as running too long when its elapsed time exceeds 10 hours or it started before midnight of the current local day, and SHALL mark such rows visibly.

#### Scenario: Long timer
- **WHEN** `dave`'s timer has been running for 10 hours and 1 minute
- **THEN** `dave`'s row is flagged as running too long

#### Scenario: Timer from yesterday
- **WHEN** `dave`'s timer started yesterday at 23:30 and it is now 00:15
- **THEN** `dave`'s row is flagged as running too long

#### Scenario: Normal timer
- **WHEN** `bob`'s timer started today at 08:00 and it is now 12:00
- **THEN** `bob`'s row is not flagged

### Requirement: Stop another member's timer from the block
The block SHALL offer users with permission to stop other members' timers a "Stop at…" action on each running row. The action SHALL open a dialog with an end time. The end time SHALL default to now, or, when the timer is running too long, to the earlier of start + 8 hours and now. The dialog SHALL reject an end time before the start or in the future.

#### Scenario: Stop with default end
- **WHEN** at 10:30, editor `carol` chooses "Stop at…" on `bob`'s timer started at 09:00 and confirms without changes
- **THEN** an entry for `bob` from 09:00 to 10:30 is created and `bob`'s timer is cleared

#### Scenario: Forgotten timer
- **WHEN** team leader `alice` opens "Stop at…" on `dave`'s timer started yesterday at 09:00
- **THEN** the dialog warns that the timer is running too long and proposes 17:00 yesterday as the end time

#### Scenario: End before start
- **WHEN** `carol` enters an end time before the timer's start
- **THEN** the dialog shows a validation error and stops nothing

#### Scenario: Timer changed meanwhile
- **WHEN** `bob` stops his timer and starts a new one while `carol`'s stop dialog for the old timer is open, and `carol` then confirms
- **THEN** `bob`'s new timer keeps running, no entry is created by `carol`, and `carol` sees a notice that the timer has changed

### Requirement: Discard another member's timer from the block
The block SHALL offer users with permission to stop other members' timers a "Discard" action on each running row. After confirmation, the action SHALL clear the timer without creating an entry.

#### Scenario: Discard
- **WHEN** editor `carol` discards `bob`'s running timer and confirms
- **THEN** `bob`'s timer is cleared and no entry is created

### Requirement: Stopped-by notice
When another member stopped the current user's timer, the system SHALL show the current user a notice naming that member once. It SHALL NOT show a notice when the user stopped the timer themselves on any device.

#### Scenario: Stopped by team leader
- **WHEN** `alice` stops `dave`'s timer while `dave` has the app open
- **THEN** after the next refresh `dave` sees "Your timer was stopped by alice" once

#### Scenario: Stopped on own phone
- **WHEN** `dave` stops his timer on his phone while the app is open on his laptop
- **THEN** the laptop shows the timer as stopped and no notice

### Requirement: Visibility limitation disclosed
The block SHALL state that its visibility is enforced by the app only and that every member can read running timers in the data repository on GitHub.

#### Scenario: Footnote
- **WHEN** an editor views the "Team now" block
- **THEN** a note explains that the view is restricted by the app, not by GitHub
