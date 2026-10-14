## ADDED Requirements

### Requirement: Linked repositories
The system SHALL let editors and team leaders link a project to up to 20 GitHub repositories, given as `owner/repo` or as a repository URL, and stored in the project's optional `repos` list. Each repository may appear only once per project (case-insensitive). Workers SHALL see the linked repositories read-only. The same repository MAY be linked to several projects.

#### Scenario: Link a repository
- **WHEN** an editor adds `https://github.com/acme/web` to the project "Website"
- **THEN** the project "Website" in `workspace.json` has `"repos": ["acme/web"]`

#### Scenario: Duplicate repository
- **WHEN** an editor adds `Acme/Web` to a project already linked to `acme/web`
- **THEN** the system refuses and shows "Repository already linked"

#### Scenario: Worker view
- **WHEN** a worker opens the Projects & Tags page
- **THEN** each project's linked repositories are listed, with no add or remove controls

#### Scenario: Older app version
- **WHEN** an older app version without this feature renames a project that has linked repositories
- **THEN** the linked repositories are kept in `workspace.json`
