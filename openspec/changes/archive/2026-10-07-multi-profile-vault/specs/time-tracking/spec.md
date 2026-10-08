## MODIFIED Requirements

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
