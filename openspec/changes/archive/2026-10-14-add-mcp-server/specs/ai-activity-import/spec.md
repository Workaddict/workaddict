## ADDED Requirements

### Requirement: Claude Code activity analysis
The MCP server SHALL offer the read-only tool `claude_code_activity(date, gapMinutes?)`. It reads the local Claude Code transcripts under `~/.claude/projects` (or `CLAUDE_CONFIG_DIR`) and returns activity blocks for the given day in the effective time zone. Activity points SHALL be the timestamps of user and assistant messages. Points less than `gapMinutes` (default 15) apart SHALL form one block, which runs from its first point to its last point plus at most 5 minutes. Blocks with the same working directory and branch SHALL be merged across sessions. Unreadable lines and files SHALL be skipped.

#### Scenario: Pause splits blocks
- **WHEN** a transcript has messages from 09:10 to 10:40, nothing until 11:20, then messages until 12:00
- **THEN** the tool returns two blocks, 09:10–10:45 and 11:20–12:05

#### Scenario: Parallel sessions in one repository
- **WHEN** two sessions in the same working directory and branch were active 09:00–10:00 and 09:30–10:30
- **THEN** the tool returns one block 09:00–10:35

#### Scenario: No activity
- **WHEN** there are no transcript lines for the requested day
- **THEN** the tool returns an empty list

### Requirement: Mapping to repository, issue and project
For each block the tool SHALL determine the GitHub repository (`owner/repo`) from the working directory's `origin` remote, an issue guess `owner/repo#N` from the first standalone number in the branch name, and the candidate projects whose linked repositories contain the repository.

#### Scenario: Branch with issue number
- **WHEN** a block ran in a clone of `acme/web` on branch `fix/42-login`
- **THEN** the block has repository `acme/web`, issue guess `acme/web#42`, and as candidate the project linked to `acme/web`

#### Scenario: Not a GitHub repository
- **WHEN** a block ran in a folder without a git remote
- **THEN** the block has no repository, issue or project candidate, and is still returned

### Requirement: Transcript content stays local
The tool SHALL NOT write anything and SHALL NOT send transcript content to the data repository or to any network service. Each block SHALL contain at most the first 3 user prompts, each cut to 200 characters, and no assistant answers or tool outputs. Only the description the AI later passes to `add_entries` SHALL be saved.

#### Scenario: Activity call
- **WHEN** a client calls `claude_code_activity`
- **THEN** no request goes to GitHub and no file is written

### Requirement: Log-today skill with confirmation
The Claude Code plugin `workaddict` SHALL provide the skill `log-today`. It reads the day's activity and the entries already tracked, shows a table of suggestions (time, project, issue, description), and calls `add_entries` only after the user explicitly confirms. Blocks already covered by tracked entries SHALL be shown as covered and SHALL NOT be suggested again.

#### Scenario: User confirms with a correction
- **WHEN** the skill suggests three blocks, and the user answers "second one is Customer Huber, otherwise ok"
- **THEN** the skill saves the three entries with the corrected project for the second one

#### Scenario: Already tracked
- **WHEN** the user tracked 09:00–10:00 in the app and the activity has a block 09:05–09:55
- **THEN** that block is shown as covered and is not saved

### Requirement: New-project skill
The plugin SHALL provide the skill `new-project`. From the user's description it suggests project names, colors, linked repositories and tags, and creates them with `create_projects` only after confirmation.

#### Scenario: Description to project
- **WHEN** the user says "new client Huber, shop is github.com/acme/huber-shop, we do support and development"
- **THEN** the skill suggests the project "Huber" linked to `acme/huber-shop` with tags "support" and "development", and creates them after confirmation
