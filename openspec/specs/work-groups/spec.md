# work-groups Specification

## Purpose
TBD - created by archiving change build-time-tracker-mvp. Update Purpose after archive.
## Requirements
### Requirement: Projects
The system SHALL let editors and team leaders create, rename, recolor, archive, unarchive, and delete projects, each having a unique name (case-insensitive) and a color from a predefined palette. Workers SHALL only select existing projects.

#### Scenario: Create project
- **WHEN** an editor creates a project named "Website" with color blue
- **THEN** the project is available for selection on entries and timers for all members

#### Scenario: Duplicate name
- **WHEN** an editor creates a project named "website" while "Website" exists
- **THEN** the system refuses and shows a "name already exists" error

#### Scenario: Archive project
- **WHEN** an editor archives a project
- **THEN** it no longer appears in project pickers, but existing entries keep it and stats still include it

#### Scenario: Worker project picker
- **WHEN** a worker opens the project picker of a timer
- **THEN** only existing active projects are offered and no create option is shown

### Requirement: Tags
The system SHALL let editors and team leaders create, rename, archive, unarchive, and delete tags with unique names (case-insensitive), SHALL let workers attach only existing tags, and SHALL allow any number of tags per entry.

#### Scenario: Create tag inline
- **WHEN** an editor types a new tag name in an entry's tag picker and confirms
- **THEN** the tag is created and attached to the entry

#### Scenario: Worker types unknown tag
- **WHEN** a worker types a tag name that does not exist in the tag picker
- **THEN** no create option is shown

#### Scenario: Multiple tags
- **WHEN** a member attaches tags "meeting" and "client" to an entry
- **THEN** the entry shows both tags

### Requirement: One project per entry
Each time entry and running timer SHALL have zero or one project.

#### Scenario: No project
- **WHEN** a member saves an entry without selecting a project
- **THEN** the entry is saved and shown as "No project" in lists and stats

### Requirement: Deleting work groups
The system SHALL ask for confirmation before deleting a project or tag, stating how many entries use it; deletion SHALL remove the reference from affected entries' display without rewriting other members' entry files.

#### Scenario: Delete used project
- **WHEN** a member deletes a project used by 12 entries and confirms
- **THEN** the project is removed from the workspace and those entries display and count as "No project"

#### Scenario: Delete used tag
- **WHEN** a member deletes a tag used by entries and confirms
- **THEN** the tag is removed and no longer displayed on those entries

### Requirement: Work group management page
The system SHALL provide a page listing all projects and tags with their total tracked hours and a toggle to show archived items, and SHALL offer the create, rename, recolor, archive, and delete actions only to editors and team leaders.

#### Scenario: View projects with hours
- **WHEN** a member opens the management page
- **THEN** each active project is listed with its color and total tracked hours

#### Scenario: Worker views page
- **WHEN** a worker opens the management page
- **THEN** no create, rename, recolor, archive, or delete controls are shown

