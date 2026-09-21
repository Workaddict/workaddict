## MODIFIED Requirements

### Requirement: Import availability and replacing existing data
The system SHALL offer the Clockify import in Settings only to team leaders and only while the data is not read-only. When the data repository already contains time entries, projects, or tags, the system SHALL warn that the import replaces them, SHALL show how many will be replaced, and SHALL require an explicit confirmation before writing.

#### Scenario: Empty repository
- **WHEN** a team leader opens Settings in a repository without entries, projects, or tags
- **THEN** an "Import from Clockify" action is available

#### Scenario: Not a team leader
- **WHEN** an editor or worker opens Settings
- **THEN** no "Import from Clockify" action is shown

#### Scenario: Repository already in use
- **WHEN** a team leader opens Settings in a repository that contains at least one entry, project, or tag
- **THEN** the import action is available and a hint states that importing replaces the existing data

#### Scenario: Confirm replacement
- **WHEN** the preview is shown for a repository with 120 entries, 3 projects, and 2 tags
- **THEN** a warning states these counts and that they will be replaced, and the import button stays disabled until the user confirms

#### Scenario: Replacing import
- **WHEN** the user confirms the replacement and imports
- **THEN** all previous entries, projects, and tags are removed and the imported data is written in the same single commit; running timers are kept

#### Scenario: Data added during the wizard
- **WHEN** the repository was empty at preview time, another member creates an entry, and the user then confirms the import
- **THEN** the system writes nothing and shows the replacement warning
