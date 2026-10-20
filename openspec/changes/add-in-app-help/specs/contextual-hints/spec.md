## ADDED Requirements

### Requirement: Hint level
The system SHALL offer two hint levels, "Guided" (default) and "Expert mode", chosen in the "Help & guide" section of Settings and remembered on the device. Expert mode SHALL hide glossary underlines and their tips, the first steps checklist, "New" markers and the welcome dialog, and SHALL hide the explanation text of empty states. Expert mode SHALL NOT hide icon-button tips, accessible labels, "?" buttons, help pages, or the help overlay. Changing the level SHALL take effect immediately without a reload.

#### Scenario: Default level
- **WHEN** a user opens the app on a device where the hint level was never changed
- **THEN** the hint level is "Guided" and glossary terms are underlined

#### Scenario: Turn on Expert mode
- **WHEN** a user turns on Expert mode in Settings and opens the Tracker
- **THEN** no glossary term is underlined, no checklist and no "New" marker is shown, and the icon buttons still show their tips and keep their accessible labels

#### Scenario: Remembered on the device
- **WHEN** a user turned on Expert mode and reloads the page
- **THEN** Expert mode is still on

#### Scenario: Help stays reachable
- **WHEN** a user in Expert mode clicks the "?" next to "Team & roles"
- **THEN** the roles help page opens

### Requirement: Info tips
The system SHALL show an info tip for every icon-only button and for every glossary term shown with a dotted underline. A tip SHALL open on mouse hover, on keyboard focus, on tap of a glossary term, and on long-press of an icon button, where a normal tap still triggers the button. A tip SHALL close on Escape, when focus or the pointer leaves, and on a tap outside. A tip SHALL be connected to its trigger with `aria-describedby`, SHALL stay inside the viewport at 320 px width, and a glossary term's tip SHALL contain one sentence and a "Learn more" link to its help topic. Icon-only buttons SHALL NOT rely on the native `title` attribute; `title` SHALL only be used to reveal truncated text.

#### Scenario: Hover on an icon button
- **WHEN** a user hovers the mouse over the theme toggle
- **THEN** a tip "Switch theme" appears next to it

#### Scenario: Keyboard focus
- **WHEN** a keyboard user tabs to the stop button in the header
- **THEN** its tip appears and is announced as the button's description

#### Scenario: Tap on a term
- **WHEN** a phone user taps the underlined word "Workspace" in Settings
- **THEN** a tip explains the term in one sentence with a "Learn more" link, and tapping outside closes it

#### Scenario: Tap on an icon button
- **WHEN** a phone user taps the stop button briefly
- **THEN** the timer stops and no tip stays open

#### Scenario: No native title on icon buttons
- **WHEN** the rendered app is inspected
- **THEN** no icon-only button has a `title` attribute

### Requirement: Glossary terms in the UI
The system SHALL mark the first occurrence per page of each glossary term (at least: data repository, token, workspace, passphrase, role, owner, worker, editor, team leader, project, tag, Team now, issue link, project board, MCP, backup) with a dotted underline and an info tip, in both languages, using the wording of the glossary. Every term used in the UI SHALL exist in the glossary in English and German.

#### Scenario: Term on the settings page
- **WHEN** a user in Guided mode opens Settings
- **THEN** "Data repository" is underlined once and its tip explains that the entries are stored there

#### Scenario: Missing glossary entry
- **WHEN** a component marks a term that has no glossary entry in one of the languages
- **THEN** the test suite fails

### Requirement: Helpful empty states
Every empty state SHALL show a title, a one-sentence explanation of what will appear there (hidden in Expert mode), and, where the user is allowed to do it, an action for the next step.

#### Scenario: No entries yet
- **WHEN** a user with no entries opens the Tracker in Guided mode
- **THEN** the entry list explains that tracked times will appear there and offers "Start your first timer", which focuses the timer description field

#### Scenario: Empty state in Expert mode
- **WHEN** a user in Expert mode opens a statistics period without entries
- **THEN** the empty state shows its title and the "Pick another period" action, without the explanation

#### Scenario: Worker without permission
- **WHEN** a worker opens Projects & Tags without any projects
- **THEN** the empty state explains that an editor or team leader creates projects and shows no "Create a project" action

### Requirement: New feature markers
The system SHALL show a small "New" dot on features that were added in an app version later than the one in which the device first opened the app. A dot SHALL disappear for good on that device once its feature was opened. Dots SHALL have an accessible label "New" and SHALL be hidden in Expert mode.

#### Scenario: New user
- **WHEN** a user opens the app for the first time on a device
- **THEN** no "New" dot is shown

#### Scenario: Feature added after the first visit
- **WHEN** a device first used version 1.0.0 and the app is updated to a version that adds the project board link
- **THEN** the project board link shows a "New" dot until the user opens it once
