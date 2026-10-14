## ADDED Requirements

### Requirement: Entries added through an AI assistant
The system SHALL have a team setting "Mark AI entries", stored as `markAiEntries` in `workspace.json`, which is off when missing. When it is on, the storage layer SHALL record in the optional field `addedVia` the client name of the AI assistant that created the entry, and SHALL keep it unchanged when the entry is later edited. When it is off, `addedVia` SHALL NOT be set on new entries. The entry list SHALL show "via <client>" on entries that have `addedVia`, to every viewer, whatever the current setting.

#### Scenario: Marking off (default)
- **WHEN** the team has never changed the setting and Claude Code adds an entry through the MCP server
- **THEN** the entry has no `addedVia` and shows no marker

#### Scenario: Marking on
- **WHEN** a team leader turned "Mark AI entries" on and Claude Code adds an entry
- **THEN** the entry has `"addedVia": "claude-code"` and the entry list shows "via Claude Code"

#### Scenario: Marker survives edits
- **WHEN** a member edits the description of an entry with `addedVia` in the app
- **THEN** the entry keeps `addedVia` and its marker

#### Scenario: Turned off later
- **WHEN** a team leader turns the setting off
- **THEN** existing entries keep their marker, and new AI entries get none
