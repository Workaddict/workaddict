## ADDED Requirements

### Requirement: Welcome dialog
After the first successful sign-in on a device, the system SHALL show a welcome dialog with "Start tour", "Later", "No thanks" and "I know my way around", unless Expert mode is on. "Later" SHALL show the dialog again on the next app load, and after the second "Later" it SHALL behave like "No thanks". "I know my way around" SHALL turn on Expert mode. The choice SHALL be remembered on the device. A member who already has own entries older than 7 days when the dialog would first appear SHALL NOT see the dialog; instead the system SHALL show a one-time notice that help and a guided tour are available in Settings.

#### Scenario: First sign-in
- **WHEN** a new member signs in for the first time on a device
- **THEN** the welcome dialog offers "Start tour", "Later", "No thanks" and "I know my way around"

#### Scenario: Later twice
- **WHEN** the member chose "Later" on two app loads
- **THEN** the dialog does not appear on the third app load

#### Scenario: Experienced user
- **WHEN** the member chooses "I know my way around"
- **THEN** the dialog closes, Expert mode is on, and the dialog does not appear again

#### Scenario: Existing user after the update
- **WHEN** a member with entries from last month opens the updated app on a device for the first time
- **THEN** no welcome dialog appears and a one-time notice says help and the tour are in Settings

### Requirement: Guided tour
The system SHALL offer a guided tour that highlights one control at a time with a dimmed background, shows a bubble with title, one or two sentences, "Step <n> of <total>", "Back", "Next" (or "Done" on the last step) and "End tour", and navigates between pages as needed. The tour SHALL cover: timer and manual entry, the entry list (editing by clicking a field), projects and tags, statistics and export, the workspace chip and avatar menu, and where to find help. Editors and team leaders SHALL additionally get "Team now" and the member filter; team leaders SHALL additionally get "Team & roles". Steps whose control is not on screen at the current width SHALL be skipped. The tour SHALL NOT create, change or delete data. Focus SHALL move to the bubble, Escape SHALL end the tour, and transitions SHALL be off when the user prefers reduced motion. Ending or finishing the tour SHALL be remembered on the device.

#### Scenario: Worker tour
- **WHEN** a worker starts the tour
- **THEN** the tour shows the worker steps and no "Team now" or "Team & roles" step

#### Scenario: Team leader tour
- **WHEN** a team leader starts the tour
- **THEN** the tour includes "Team now", the member filter and "Team & roles" in Settings

#### Scenario: Moving between pages
- **WHEN** the user clicks "Next" on the last Tracker step
- **THEN** the Statistics page opens and its first step is highlighted

#### Scenario: Phone layout
- **WHEN** the tour runs at 375 px width
- **THEN** navigation steps point to the bottom navigation, and no bubble extends outside the screen

#### Scenario: No data change
- **WHEN** a user goes through the whole tour in a real workspace
- **THEN** no write request is sent to GitHub

#### Scenario: End with Escape
- **WHEN** the user presses Escape during the tour
- **THEN** the tour ends, the dimmed background disappears, and focus returns to the page

### Requirement: Tour in the demo
The landing page SHALL offer "Demo with tour" next to "Try the demo", which opens the demo and starts the tour. Entering the demo without it SHALL offer the tour in the welcome dialog. The demo's tour state SHALL NOT affect the welcome dialog of a real sign-in.

#### Scenario: Demo with tour
- **WHEN** a visitor clicks "Demo with tour"
- **THEN** the demo opens and the first tour step is shown

#### Scenario: Demo then real sign-in
- **WHEN** a visitor finished the tour in the demo and later signs in to a real workspace
- **THEN** the welcome dialog is still shown

### Requirement: Restart tour and reset hints
The "Help & guide" section in Settings and the help overlay SHALL offer "Restart tour", which starts the tour from the first step. Settings SHALL also offer "Show tips again", which shows the first steps checklist again and lets the welcome dialog appear on the next app load.

#### Scenario: Restart from Settings
- **WHEN** a user who finished the tour clicks "Restart tour" in Settings
- **THEN** the tour starts at step 1 on the Tracker

#### Scenario: Show tips again
- **WHEN** a user who dismissed the checklist clicks "Show tips again"
- **THEN** the checklist appears on the Tracker again if items are still open

### Requirement: First steps checklist
In Guided mode the Tracker SHALL show a "First steps" card with items that tick themselves off from the workspace data: "Track your first time" (an own entry or a running timer), "Create a project", "Create a tag", for owners and team leaders "Invite your team" (more than one member in the workspace), and the optional "Connect an AI assistant" (ticked once the user opened the Connect AI page on the device). Items the user's role cannot do SHALL be replaced by a link to the matching help topic. The card SHALL show progress ("2 of 4"), SHALL be dismissible, and SHALL disappear when all required items are done. It SHALL NOT be shown in Expert mode, in demo mode, or to members treated as existing users by the welcome dialog rule.

#### Scenario: Ticks itself off
- **WHEN** a new member stops their first timer
- **THEN** "Track your first time" is ticked and the progress increases

#### Scenario: All done
- **WHEN** the last required item is completed
- **THEN** the card disappears for good on the device

#### Scenario: Worker
- **WHEN** a worker views the checklist
- **THEN** "Create a project" is replaced by a link explaining who creates projects, and there is no "Invite your team" item
