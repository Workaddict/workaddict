## Context

Workaddict is a static SPA. All data is JSON in the team's GitHub data repository, written through `RepoAdapter` → `GitHubFileStore` (Contents API, optimistic concurrency, `writeMany` for one commit). The only browser dependency in the storage layer is `blobCache.ts` (idb-keyval), and it is injected through `GitHubFileStoreOptions.cache`. Role checks (`entryActor`, `entryAdder`, permission matrix) live in the adapter, so every client that uses the adapter follows the same rules. GitHub cannot enforce them; the app already discloses this limitation.

Claude Code stores each session as JSONL in `~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl`. Every line has `timestamp`, `cwd`, `gitBranch`, `sessionId` and `type` (user / assistant / …).

## Goals / Non-Goals

**Goals:**
- Any MCP-capable AI can read Workaddict and create projects and entries, with the user's own token and role.
- "Log what I did with Claude today" in one skill call, with the user confirming the suggestion.
- No server, no AI key and no cost for the Workaddict operator.

**Non-Goals:**
- An AI chat in the web app (bring-your-own-key in the browser). Maybe later as a separate change.
- Automatic logging without confirmation (for example a `SessionEnd` hook that saves directly). The skill may suggest it, but this change does not ship it.
- Activity sources other than Claude Code (Cursor, Codex, …). The parser interface allows them later.
- Deleting entries, projects or tags through MCP.
- Reading GitHub Projects or issues through the API (the issue comes from the branch name).

## Decisions

1. **The MCP server lives in the monorepo under `mcp/`, has its own `package.json`, and imports `src/domain` and `src/storage` directly.** It is bundled with esbuild into one ESM file (`dist/index.js`, Node ≥ 20 for global `fetch`). Alternative: a separate repository or copied code. Rejected because the validation and permission logic would drift apart. A lint rule or test makes sure `src/storage` and `src/domain` import nothing browser-only except `blobCache.ts`.
2. **In-memory `BlobCache`** for Node (a `Map`). The process lives as long as the AI session. A disk cache is not worth it.
3. **Configuration through environment variables** in the MCP client configuration: `WORKADDICT_TOKEN`, `WORKADDICT_REPO` (`owner/repo`), optional `WORKADDICT_BRANCH`. Fallback when `WORKADDICT_TOKEN` is missing: `gh auth token`, but only if the user sets `WORKADDICT_USE_GH=1`, because the gh token usually has broad access. On startup the server checks token and repository like the app's sign-in check (`signInAttempt.ts` logic where it can be reused) and fails with a clear message.
   - Alternative: OAuth device flow. Rejected for now because it needs a registered GitHub app and token storage.
4. **Tool set (v1):**

   | Tool | Effect | Role |
   |---|---|---|
   | `whoami` | login, role, team time zone, AI marking on/off | all |
   | `list_projects` | id, name, color, archived, repos | all |
   | `list_tags`, `list_members` | | all |
   | `list_entries(from, to, login?)` | entries in range, in the effective time zone | all |
   | `get_timer` | own running timer | all |
   | `create_projects([{name, color?, repos?}], tags?)` | one commit, duplicates are refused per item | editor+ |
   | `link_repos(projectId, repos)` | | editor+ |
   | `add_entries([{start, end, description, projectId?, tagIds?, issueRef?, login?}], allowOverlap?)` | one commit; `login` ≠ me only for editor+ | all |
   | `claude_code_activity(date, gapMinutes?)` | local analysis, writes nothing | all |

   Every write tool returns what was saved, including ids. Times are accepted as ISO with an offset, or as local times in the effective time zone.
5. **Overlap check in `add_entries`:** if a new entry overlaps an existing entry of the same member or another new one, the tool saves nothing and returns the conflicts, unless `allowOverlap: true` is set. Reason: AI suggestions often double-count time that was already tracked in the app.
6. **Activity blocks (`claude_code_activity`):**
   - Read every JSONL whose line `timestamp` falls on the requested day (in the effective time zone). Stream line by line, ignore broken lines.
   - Activity points = timestamps of `user` and `assistant` lines. Points less than `gapMinutes` apart (default 15) belong to the same block. A block runs from its first to its last point, plus at most 5 minutes after the last point.
   - Group by (`cwd`, `gitBranch`). Blocks from parallel sessions in the same repository are merged. Blocks in different repositories that overlap stay separate and are marked `overlapsWith`.
   - Repository: `git -C <cwd> remote get-url origin` → `owner/repo` (GitHub only). Issue guess: the first number from the branch name with the pattern `(^|[/_-])(\d+)([/_-]|$)`, combined with the repository to form `owner/repo#N`. Project guess: the projects whose `repos` contain the repository (exactly one → suggested; several → all as candidates).
   - It returns per block: `start`, `end`, `minutes`, `repo`, `branch`, `issueRef?`, `projectCandidates`, and `prompts` (the first 3 user prompts, each cut to 200 characters) as material for the AI's description. There is no assistant text and no tool output.
7. **AI marking:** `Workspace.markAiEntries?: boolean` (missing = off). The adapter gets an optional `client: { name: string }` (from the MCP `initialize` `clientInfo.name`, e.g. "claude-code"). When `markAiEntries` is on, the adapter sets `addedVia = client.name` on new entries and keeps it on edits (like `addedBy`). The commit message gets the suffix `(via <client>)` either way, because the git history is not a place to hide it. Only team leaders can change the setting, like the team time zone.
8. **Plugin:** folder `plugin/` with `.claude-plugin/plugin.json`, `.mcp.json` (`npx -y workaddict-mcp@<version>`, env from the user's environment) and two skills:
   - `log-today`: call `whoami` + `claude_code_activity` + `list_entries(today)` → table of suggestions (time, project, issue, description) → wait for confirmation or corrections → `add_entries`. It never saves without confirmation.
   - `new-project`: from a description, suggest name, color, repositories and tags → confirm → `create_projects`.
9. **No delete tool.** This limits the damage of a prompt injection (for example through transcript content) to new or extra data that can be seen and removed in the app.

## Risks / Trade-offs

- [The token sits in plain text in the MCP configuration] → the docs recommend a fine-grained token limited to the data repository and setting it through the environment, not in the repository. The `.mcp.json` of the plugin only references `${WORKADDICT_TOKEN}`.
- [Prompt injection through transcripts or prompts] → no delete tool, overlap check, the skill always asks for confirmation, and the `prompts` excerpt is short.
- [The heuristic misjudges real working time (reading or testing without Claude is missing; idle phases)] → the result is a suggestion with `minutes`, the user corrects it. `gapMinutes` is adjustable.
- [The Claude Code transcript format changes] → the parser is tolerant (unknown lines are ignored), has tests with fixture files, and is versioned in the package.
- [A worker writes entries for others with a manipulated client] → the same limitation as in the app (GitHub only knows "write access"). It stays disclosed.
- [Concurrent writes from the app and MCP] → `writeMany` with conflict retry, as with bulk entries.
- [npm publish and supply chain] → manual release with provenance, the plugin pins the version.

## Migration Plan

`markAiEntries` and `addedVia` are optional, and `SCHEMA_VERSION` stays 1. The package is released separately from the web app. Rollback: unpublish or deprecate the npm version. The data stays valid.

## Resolved Questions

- Package name: `workaddict-mcp` (no scope, no npm organization needed). Check availability before the first release.
- `SessionEnd` hook: not in this change. Decide after `log-today` has proven itself in daily use.
- "Connect AI" help page: yes, with a generated configuration snippet with the data repository filled in (task 6.1).
- Commit suffix `(via <client>)`: always, independent of `markAiEntries`.

## Implementation Notes

- `mcp/` is an npm workspace of the root package, so `npm ci` installs it and the root `npm test` and `npm run lint` cover it. All of its dependencies (`@modelcontextprotocol/sdk` 1.31.0, `zod`, `esbuild`, `@types/node`) are pinned dev dependencies: esbuild bundles everything into `dist/index.js`, so the published package has no runtime dependencies.
- The sign-in check runs as soon as the client has initialized (its name is known then), and its error goes to stderr. Every tool call repeats it until it succeeds.
- `nextProjectColor` moved to `src/domain/projectColor.ts`, so the server does not bundle React Query. A lint rule keeps browser globals out of `src/storage` and `src/domain` (except `blobCache.ts`).
- The plugin's `.mcp.json` starts the server with `npx`. On native Windows, Claude Code may need `cmd /c npx`; the Connect AI page and the README show the `claude mcp add` alternative with `cmd /c`.
- A marketplace manifest at the repository root (`.claude-plugin/marketplace.json`) makes `/plugin install workaddict --marketplace Workaddict/workaddict` work.
