## MODIFIED Requirements

### Requirement: Deleting work groups
The system SHALL ask for confirmation before deleting a project or tag, stating how many entries use it, where the count SHALL be computed from all entries loaded before the confirmation is shown; deletion SHALL remove the reference from affected entries' display without rewriting other members' entry files.

#### Scenario: Delete used project
- **WHEN** a member deletes a project used by 12 entries and confirms
- **THEN** the project is removed from the workspace and those entries display and count as "No project"

#### Scenario: Delete used tag
- **WHEN** a member deletes a tag used by entries and confirms
- **THEN** the tag is removed and no longer displayed on those entries

#### Scenario: Delete before totals were loaded
- **WHEN** an editor clicks delete on a project used by 12 entries before total hours were shown on the page
- **THEN** the system loads all entries first and the confirmation states 12 entries, never 0 while loading

#### Scenario: Usage cannot be loaded
- **WHEN** loading all entries for the confirmation fails
- **THEN** the confirmation states that the number of affected entries could not be determined and still allows deleting

### Requirement: Work group management page
The system SHALL provide a page listing all projects and tags with their color and a toggle to show archived items, SHALL show total tracked hours per project and tag only after the user requests them or when all entries are already loaded in the session, and SHALL offer the create, rename, recolor, archive, and delete actions only to editors and team leaders.

#### Scenario: Open page
- **WHEN** a member opens the management page and all entries are not loaded in this session
- **THEN** each active project is listed with its color, no entry files are read, and a "Show total hours" control is shown

#### Scenario: View projects with hours
- **WHEN** a member selects "Show total hours"
- **THEN** all entries are loaded and each listed project and tag shows its total tracked hours, with a loading placeholder instead of 0:00 until then

#### Scenario: Entries already loaded
- **WHEN** a member opens the management page after all entries were loaded earlier in the session
- **THEN** total hours are shown immediately without selecting "Show total hours"

#### Scenario: Worker views page
- **WHEN** a worker opens the management page
- **THEN** no create, rename, recolor, archive, or delete controls are shown
