## Why

Creating projects and writing up the day afterwards is manual work. Many team members already work with an AI assistant (Claude Code, Claude Desktop, Cursor, …) that knows what they did. Workaddict has no backend and should not hold AI keys. So the AI connects to Workaddict, not the other way round: everyone who uses an AI can bring their own, and everyone else keeps using the app as before.

## What Changes

- New package **`workaddict-mcp`** (folder `mcp/` in this repository, published to npm, started with `npx workaddict-mcp`). It is a local MCP server (stdio) that each user starts with their **own** token and data repository. It uses the existing `RepoAdapter` / `GitHubFileStore` and the domain logic unchanged, so roles, validation and conflict handling are exactly as in the app.
- MCP tools for:
  - **reading**: who am I and my role, projects (with linked repositories), tags, members, entries in a time range, running timer
  - **project setup by prompt**: create projects (with color, linked repositories) and tags, several in one commit, only for editors and team leaders
  - **logging**: add entries (several in one commit), with an overlap check against existing entries, and an issue link (`add-issue-links`)
  - **Claude Code activity**: a local, read-only analysis of the Claude Code transcripts (`~/.claude/projects`) for a day. It returns activity blocks with start, end, repository, branch, an issue guess and a suggested project. The transcripts never leave the machine. Only what the AI writes as the description is saved.
- **Claude Code plugin** `workaddict` with the MCP configuration and skills `/workaddict:log-today` (suggest the day's entries from the activity, confirm, save) and `/workaddict:new-project` (set up a project from a description).
- **Team setting "Mark AI entries"** (default **off**, only team leaders can change it, stored in `workspace.json`). When it is on, entries created through MCP get `addedVia` with the client name, and the entry list shows "via Claude Code". When it is off, nothing is stored.
- No delete tool. AI can create and fill in data, but not delete it.

## Capabilities

### New Capabilities
- `mcp-server`: the package, configuration, authentication, tool set, permissions and commit conventions of the MCP server.
- `ai-activity-import`: building activity blocks from Claude Code transcripts, mapping them to projects and issues, the privacy limits, and the plugin skills.

### Modified Capabilities
- `time-tracking`: new requirement "Entries added through an AI assistant" (`addedVia` marker and display).
- `roles-and-permissions`: the permission matrix gets "Turn AI entry marking on or off" (team leader only).

## Impact

- New: `mcp/` (package.json, tsconfig, entry point, tools, transcript parser, tests), `plugin/` (Claude Code plugin with `.mcp.json` and skills)
- `src/domain/types.ts`: `TimeEntry.addedVia?`, `Workspace.markAiEntries?`
- `src/storage/validate.ts`: validate the new fields
- `src/storage/repoAdapter.ts`: an optional "client" context that sets `addedVia` and the commit message suffix
- `src/features/tracker/EntryList.tsx`: "via …" badge
- `src/features/settings/SettingsPage.tsx`: team setting
- `src/i18n/*`, README, a new help page "Connect AI"
- New dependency (only in `mcp/`): `@modelcontextprotocol/sdk`
- CI: build and test `mcp/`, npm publish workflow (manual)
- Depends on `add-issue-links` (issue links, `Project.repos`)
