## ADDED Requirements

### Requirement: Local MCP server package
The system SHALL provide a Node package `workaddict-mcp` (Node 20 or newer) that runs as a local MCP server over stdio and reads and writes the data repository through the same storage adapter, validation and permission checks as the web app. It SHALL NOT need a Workaddict server or an AI provider key.

#### Scenario: Start through npx
- **WHEN** an MCP client starts `npx -y workaddict-mcp` with `WORKADDICT_TOKEN` and `WORKADDICT_REPO=acme/time-data`
- **THEN** the server announces its tools to the client and answers `whoami` with the token's login and role

#### Scenario: Same validation as the app
- **WHEN** a client calls `add_entries` with an entry whose end is before its start
- **THEN** the tool fails with a validation error and nothing is written

### Requirement: Configuration and sign-in check
The server SHALL read the token from `WORKADDICT_TOKEN` and the data repository from `WORKADDICT_REPO` (`owner/repo`), with an optional branch in `WORKADDICT_BRANCH`. It SHALL use `gh auth token` only when `WORKADDICT_TOKEN` is missing and `WORKADDICT_USE_GH=1` is set. On startup it SHALL check that the token is valid, the repository is reachable and the repository is a Workaddict data repository. If not, it SHALL report a clear error to every tool call and write nothing. The token SHALL NOT appear in tool results or logs.

#### Scenario: Missing repository
- **WHEN** the server starts without `WORKADDICT_REPO`
- **THEN** every tool call returns "WORKADDICT_REPO is not set (expected owner/repo)"

#### Scenario: Not a data repository
- **WHEN** `WORKADDICT_REPO` points to a repository without `tracker.json`
- **THEN** every tool call returns an error explaining that the repository is not a Workaddict data repository

### Requirement: Read tools
The server SHALL offer the tools `whoami` (login, role, owner flag, effective team time zone, AI marking on or off), `list_projects` (including archived flag and linked repositories), `list_tags`, `list_members`, `list_entries` (range `from`–`to` as dates in the effective time zone, optionally limited to one member) and `get_timer` (the user's running timer or none).

#### Scenario: Entries for one day
- **WHEN** a client calls `list_entries` with `from` and `to` `2026-10-14` in a team with time zone `Europe/Vienna`
- **THEN** the result contains all entries starting between 2026-10-14 00:00 and 24:00 Vienna time, with start and end as ISO timestamps with offset

### Requirement: Project setup tool
The server SHALL offer `create_projects`, which creates several projects (name, optional color from the project palette, optional linked repositories) and optionally tags in one commit. Missing colors SHALL be chosen as in the app. Names that already exist (case-insensitive) SHALL be refused per item, and the other items SHALL still be created. The tool SHALL be refused for workers. The server SHALL also offer `link_repos` to add repositories to an existing project, with the same permission.

#### Scenario: Project from a prompt
- **WHEN** an editor's AI calls `create_projects` with "Customer Huber" (repos `acme/huber-shop`) and tags "support" and "development"
- **THEN** one commit creates the project with the next free palette color and linked repository, plus both tags, and the result lists their ids

#### Scenario: Duplicate in the batch
- **WHEN** `create_projects` gets "Website" and "Intranet" while "website" exists
- **THEN** "Intranet" is created, and the result reports "Website" as "name already exists"

#### Scenario: Worker
- **WHEN** a worker's AI calls `create_projects`
- **THEN** the tool fails with "editor or team leader required" and nothing is written

### Requirement: Add entries tool
The server SHALL offer `add_entries`, which creates one or more entries (start, end, description, optional project, tags, issue link and member) in one commit. Times SHALL be accepted as ISO timestamps with offset, or as local date and time in the effective time zone. Entries for other members SHALL follow the same rules as in the app, including `addedBy`. Issue input SHALL be normalized as in the app, including the short form through the project's linked repositories. If a new entry overlaps an existing entry of the same member or another new entry, the tool SHALL save nothing and return the conflicts, unless `allowOverlap` is true.

#### Scenario: Log several blocks
- **WHEN** a client calls `add_entries` with three non-overlapping entries for the user
- **THEN** one commit writes all three, and the result contains their ids

#### Scenario: Overlap with tracked time
- **WHEN** the user tracked 09:00–10:00 in the app and `add_entries` gets an entry 09:30–11:00
- **THEN** nothing is saved, and the result names the conflicting entry 09:00–10:00

#### Scenario: Worker for another member
- **WHEN** a worker's AI calls `add_entries` with `login` set to `bob`
- **THEN** the tool fails with a permission error and nothing is written

### Requirement: No destructive tools
The server SHALL NOT offer tools that delete or archive entries, projects, tags or timers, or that change roles or the team time zone.

#### Scenario: Tool list
- **WHEN** a client lists the server's tools
- **THEN** no tool deletes, archives, changes roles or changes the team time zone

### Requirement: Commit messages name the client
Every commit the server makes SHALL end with `(via <client>)`, where `<client>` is the client name the MCP client sent at initialization, or `mcp` if it sent none.

#### Scenario: Commit from Claude Code
- **WHEN** Claude Code adds two entries through the server
- **THEN** the commit message ends with `(via claude-code)`
