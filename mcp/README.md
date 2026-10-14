# workaddict-mcp

> **Beta.** Tools and behavior may still change before 1.0.0.

MCP server for [Workaddict](https://github.com/Workaddict/workaddict), the time tracker that keeps its data as JSON in your own private GitHub repository. It lets your AI assistant (Claude Code, Claude Desktop, Cursor or any other MCP client) read your projects and entries, set up projects, and log time, with your own token and your Workaddict role.

It runs on your computer over stdio. There is no Workaddict server and no AI key involved.

## Setup

1. Create a **fine-grained token** on GitHub: resource owner = the owner of your data repository, only that repository, _Contents: read and write_, _Metadata: read_.
2. Configure your MCP client:

```json
{
  "mcpServers": {
    "workaddict": {
      "command": "npx",
      "args": ["-y", "workaddict-mcp@1.0.0-beta.1"],
      "env": { "WORKADDICT_REPO": "owner/repo", "WORKADDICT_TOKEN": "github_pat_…" }
    }
  }
}
```

For Claude Code, the Workaddict plugin brings this configuration plus the skills `/workaddict:log-today` and `/workaddict:new-project`:

```
/plugin install workaddict --marketplace Workaddict/workaddict
```

It reads `WORKADDICT_TOKEN` and `WORKADDICT_REPO` from your environment.

| Variable              |                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `WORKADDICT_REPO`     | Data repository, `owner/repo` (required)                                                                                                |
| `WORKADDICT_TOKEN`    | GitHub token with write access to it (required)                                                                                         |
| `WORKADDICT_BRANCH`   | Branch, if not the repository's default branch                                                                                          |
| `WORKADDICT_USE_GH=1` | Use `gh auth token` when `WORKADDICT_TOKEN` is not set. That token usually reaches all your repositories, so prefer a fine-grained one. |

The repository must already be a Workaddict data repository (sign in to the web app once). The server never initializes one.

## Tools

| Tool                                         |                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `whoami`                                     | Login, role, team time zone, AI entry marking                                                         |
| `list_projects`, `list_tags`, `list_members` | Workspace data, projects with linked repositories                                                     |
| `list_entries`                               | Entries between two days, in the team time zone                                                       |
| `get_timer`                                  | Your running timer                                                                                    |
| `create_projects`                            | Projects (color, linked repositories) and tags in one commit — editors and team leaders               |
| `link_repos`                                 | Link repositories to a project — editors and team leaders                                             |
| `add_entries`                                | Entries in one commit; refuses overlaps with tracked time unless `allowOverlap`                       |
| `claude_code_activity`                       | Activity blocks of a day from local Claude Code transcripts (read-only, nothing leaves your computer) |

There are no tools that delete or archive data, change roles or the team time zone. Every commit ends with `(via <client>)`; team leaders can also mark AI entries in the app.

## Development

In the Workaddict repository: `npm test` runs these tests with the app's, `npm run build -w mcp` bundles `dist/index.js`, `npm run typecheck -w mcp` type-checks.

License: AGPL-3.0-only
