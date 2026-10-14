## 0. Prerequisite

- [x] 0.1 `add-issue-links` is implemented (`issueRef`, `Project.repos`, `parseIssueInput`)

## 1. Web app: AI marking

- [x] 1.1 `types.ts`: add `TimeEntry.addedVia?: string` and `Workspace.markAiEntries?: boolean`. Validate both in `validate.ts` (a bad value is ignored, not the whole record)
- [x] 1.2 `RepoAdapter`: optional `client?: { name: string }` in the constructor or options. On new entries set `addedVia` when `markAiEntries` is on, keep it on edits (like `addedBy`). Commit message suffix `(via <client>)` whenever a client is set
- [x] 1.3 Contract tests: marking off → no `addedVia`; on → set; edit keeps it; suffix in the commit message
- [x] 1.4 Settings: switch "Mark AI entries" (team leader only, read-only for others) and `setMarkAiEntries` in the workspace actions
- [x] 1.5 `EntryList`: show "via <client>" (known names in readable form: `claude-code` → "Claude Code")
- [x] 1.6 i18n en/de

## 2. MCP package setup

- [x] 2.1 Folder `mcp/` with `package.json` (`name: workaddict-mcp`, `bin`, `engines.node >=20`), `tsconfig`, esbuild bundle importing `../src/domain` and `../src/storage`
- [x] 2.2 Node `BlobCache` (Map). Make sure nothing in `src/storage` or `src/domain` except `blobCache.ts` uses browser APIs (test or lint rule)
- [x] 2.3 Dependency `@modelcontextprotocol/sdk`, stdio transport, read `clientInfo.name` from `initialize`
- [x] 2.4 Config: `WORKADDICT_TOKEN`, `WORKADDICT_REPO`, `WORKADDICT_BRANCH`, opt-in `WORKADDICT_USE_GH=1` → `gh auth token`. Startup check (token, repository, `tracker.json`) with clear errors. Make sure the token never appears in output

## 3. Tools

- [x] 3.1 `whoami`, `list_projects`, `list_tags`, `list_members`, `get_timer`
- [x] 3.2 `list_entries(from, to, login?)` with day boundaries in the effective time zone (reuse `zoned.ts`)
- [x] 3.3 `create_projects` (one commit, color through `nextProjectColor`, per-item duplicate errors, editor+) and `link_repos`
- [x] 3.4 `add_entries`: parse times (ISO with offset or local), normalize issues through `parseIssueInput`, overlap check against existing and new entries, `allowOverlap`, one commit through `saveEntries`
- [x] 3.5 Tests for all tools against the fake GitHub API (`fakeGitHub.ts`): roles, overlap, duplicates, validation errors, commit suffix
- [x] 3.6 Check the tool list: no destructive tools

## 4. Claude Code activity

- [x] 4.1 Transcript reader: find `~/.claude/projects/**/*.jsonl` (or `CLAUDE_CONFIG_DIR`), stream line by line, tolerant of broken lines and unknown types, prefilter by file modification time
- [x] 4.2 Block building: points from user and assistant lines, `gapMinutes`, +5 min tail, merge by (cwd, branch), mark `overlapsWith`
- [x] 4.3 Repository from `git remote get-url origin` (HTTPS and SSH forms), issue guess from the branch, project candidates through `repos`
- [x] 4.4 `prompts`: at most 3 user prompts, each at most 200 characters. No assistant or tool content
- [x] 4.5 Tests with fixture JSONL files: pause split, parallel sessions, day boundary across time zones, no remote, broken lines

## 5. Claude Code plugin

- [x] 5.1 `plugin/.claude-plugin/plugin.json`, `plugin/.mcp.json` (`npx -y workaddict-mcp@<version>`, env `${WORKADDICT_TOKEN}`, `${WORKADDICT_REPO}`)
- [x] 5.2 Skill `log-today`: activity + tracked entries → suggestion table → confirmation → `add_entries`. Mark covered blocks
- [x] 5.3 Skill `new-project`: description → suggestion → confirmation → `create_projects`

## 6. Docs & release

- [x] 6.1 README section and in-app help page "Connect AI": configuration for Claude Code (plugin), Claude Desktop and other MCP clients, token recommendation (fine-grained, data repository only), privacy notice about transcripts
- [x] 6.2 CI: build, lint and test `mcp/`. Manual npm publish workflow with provenance
- [x] 6.3 Check that the npm name `workaddict-mcp` is free before the first release
