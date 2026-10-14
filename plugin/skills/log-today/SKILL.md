---
name: log-today
description: Suggest Workaddict time entries for what the user did with Claude Code on a day (default today), confirm them with the user, then save them. Use when the user asks to log, book or track today's (or a given day's) Claude Code work in Workaddict.
---

# Log a day of Claude Code work in Workaddict

Uses the `workaddict` MCP server. Never save anything before the user has confirmed the list.

## Steps

1. **Day and context.** Use the day the user named, else today. Call `whoami` (login, role, time zone, read-only) and `list_projects`. If `whoami` fails, show its message and stop: the server explains what to fix (token, repository).

2. **Activity and tracked time.** Call `claude_code_activity` with the day and `list_entries` with the same day as `from` and `to`, limited to the user's login.

3. **Build suggestions**, one per activity block:
   - **Time:** the block's `start`–`end`. Round to 5 minutes when it does not create an overlap.
   - **Covered:** if the block overlaps an entry the user already tracked, show it as covered by that entry and do not suggest it. If it only partly overlaps, suggest only the uncovered part.
   - **Project:** the single `projectCandidates` entry; with several, pick the best match and say so; with none, leave it empty and ask.
   - **Issue:** the block's `issueRef`, if any.
   - **Description:** a short, plain summary of the work in the user's language (at most about 80 characters), written from the block's `prompts`, branch and repository. Never copy prompts verbatim if they contain secrets, tokens, customer data or personal details; the description is visible to the whole team.
   - Merge blocks of the same project and issue that are less than 15 minutes apart into one entry.

4. **Show a table** and ask for confirmation:

   | #   | Time | Project | Issue | Description |
   | --- | ---- | ------- | ----- | ----------- |

   Then list the covered blocks in one line each. Mention that activity is only measured while Claude was working: time spent reading, testing or in meetings without Claude is missing, and the user can add or stretch entries.

5. **Apply corrections** the user gives ("2 is Customer Huber", "drop 3", "start at 08:30") and show the table again if anything changed beyond a single field.

6. **Save** only after an explicit yes: call `add_entries` with all confirmed entries in one call (times as ISO with offset, `projectId`, `issueRef`). If it returns `conflicts`, nothing was saved: show them, adjust with the user, and try again. Use `allowOverlap: true` only when the user explicitly wants overlapping entries.

7. **Report** the saved entries (count and total time) in one or two lines.

If there is no activity for the day, say so and offer to add entries manually with `add_entries`.
