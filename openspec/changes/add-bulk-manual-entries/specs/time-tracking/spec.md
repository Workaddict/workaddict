## MODIFIED Requirements

### Requirement: Manual entries for other members
The manual entry form SHALL show editors and team leaders a "For" member picker that defaults to the current user and lists the current user ("Me") and all other current members of the workspace. Workers SHALL NOT see it. The picker SHALL allow selecting several members and SHALL offer a "Select all" option that selects or clears every listed member. At least one member SHALL be selected to save.

When exactly one other member is selected, saving SHALL create the entry with that member as its owner in that member's entry file, the commit message SHALL name both the member and the acting user, and the success message SHALL name the member.

When several members are selected, saving SHALL create one independent entry per selected member with identical date, start, end, description, project, and tags, each owned by its member and stored in that member's entry file. All of these entries SHALL be written in a single commit, and if any of them can't be saved, none SHALL be saved. The commit message SHALL name the number of entries and the acting user. The save button and the success message SHALL name the number of selected members. While several members are selected, the form SHALL NOT use or change the user's own running timer, even if the user is among them.

The picker SHALL keep the chosen members after saving until the page is reloaded or the tracker leaves manual mode.

#### Scenario: Editor adds a missing entry
- **WHEN** editor `bene` selects only "simon", enters date 2026-09-22, 09:00 to 11:30, description "Client call" and project "Alpha", and saves
- **THEN** an entry of 2 h 30 min owned by `simon` is saved in `simon`'s entry file for 2026-09, the commit message contains "simon" and "bene", and the message "Added for simon" is shown

#### Scenario: Worker has no picker
- **WHEN** a worker opens the manual entry form
- **THEN** no member picker is shown and entries are always created for the worker

#### Scenario: Picker kept for the next entry
- **WHEN** an editor has just added an entry for `simon` and `jakob`
- **THEN** the picker still has `simon` and `jakob` selected and the description, project, and tags are cleared

#### Scenario: Own timer running
- **WHEN** an editor's own timer is running, the editor is in manual mode, and selects only "simon"
- **THEN** the form is emptied, the save button reads "Add entry for simon", saving creates an entry for `simon`, and the editor's timer keeps running unchanged

#### Scenario: Validation as for own entries
- **WHEN** an editor enters a duration of 25:00 for another member
- **THEN** the system refuses to save and shows the validation error

#### Scenario: Same time for the whole team
- **WHEN** team leader `bene` chooses "Select all" in a workspace with members `bene`, `jakob`, and `simon`, enters 2026-10-12, 08:00 to 09:00, description "Team meeting", and saves
- **THEN** three entries of 1 h with description "Team meeting" are saved, one owned by each of `bene`, `jakob`, and `simon` in their own entry files, `jakob`'s and `simon`'s entries record `bene` as adder, `bene`'s entry records no adder, exactly one commit is made, and the message "Added for 3 members" is shown

#### Scenario: Selection of some members
- **WHEN** an editor selects `jakob` and `simon` but not themselves and saves
- **THEN** exactly two entries are created, one for `jakob` and one for `simon`, and the save button read "Add for 2 members" beforehand

#### Scenario: All or nothing
- **WHEN** an editor saves an entry for `jakob` and `simon` and the write fails
- **THEN** neither `jakob` nor `simon` gets the entry, an error is shown, and the form keeps its input

#### Scenario: Own running timer untouched with several members
- **WHEN** an editor's own timer is running and the editor selects themselves and `simon` in manual mode and saves 09:00 to 10:00
- **THEN** two new entries are created, and the editor's timer keeps running unchanged

#### Scenario: Entries independent afterwards
- **WHEN** `simon` edits or deletes the entry that was added for `simon`, `jakob`, and `bene` together
- **THEN** only `simon`'s entry changes and the entries of `jakob` and `bene` stay as they were

#### Scenario: Nothing selected
- **WHEN** an editor clears all members in the picker
- **THEN** the save button is disabled
