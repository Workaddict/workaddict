---
name: new-project
description: Set up Workaddict projects, linked GitHub repositories and tags from the user's own description, after confirmation. Use when the user wants to create a project, client or set of tags in Workaddict.
---

# Set up Workaddict projects from a description

Uses the `workaddict` MCP server. Never create anything before the user has confirmed the suggestion.

## Steps

1. **Check the role.** Call `whoami`. Creating projects needs the role `editor` or `leader`; for a `worker`, explain that an editor or team leader has to create it, and offer a message they can send.

2. **Read what exists.** Call `list_projects` (with `includeArchived: true`) and `list_tags`, so you reuse existing names instead of creating near-duplicates ("Website" vs "website", "Dev" vs "Development").

3. **Suggest** from the user's description:
   - **Projects:** short names (a client, product or internal topic). Leave the color out unless the user asks for one; the server picks a free palette color.
   - **Repositories:** `owner/repo` for every GitHub repository the user mentioned or that belongs to the project. With a linked repository, "#42" in an entry resolves to an issue there, and Claude Code activity in that repository is matched to the project.
   - **Tags:** kinds of work that apply across projects (support, development, meeting). Only suggest tags that do not exist yet.
   - If the current folder is a git repository with a GitHub remote and the user talks about "this project", suggest that repository.

   Show the suggestion as a short list (project → repositories; then new tags) and ask for confirmation or changes.

4. **Create** after an explicit yes with one `create_projects` call. To add repositories to an existing project, use `link_repos` instead.

5. **Report** what was created and anything the server refused (existing names, invalid repositories) in a few lines.
