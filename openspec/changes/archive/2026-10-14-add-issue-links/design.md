## Context

Entries (`TimeEntry`) and projects (`Project`) live in the data repository as JSON (`entries/<login>/<YYYY-MM>.json`, `workspace.json`). The app is a static SPA and talks to GitHub only through a token, which the token help recommends limiting to the data repository (Contents: read and write, Metadata: read).

Relevant facts from the code:
- `isTimeEntry` (`src/storage/validate.ts`) does not reject unknown keys, and edits spread the entry (`{ ...entry, ...patch }`). Older app versions therefore keep a new optional field when they edit.
- `workspaceCodec` spreads each project and keeps unknown top-level keys. A new `Project.repos` survives older versions too.
- The `addedBy` / `stoppedBy` fields already set the pattern for optional extra fields on entries.

## Goals / Non-Goals

**Goals:**
- Link a time entry to exactly one GitHub issue or pull request.
- Link a project to the repositories its work happens in, so `#42` is enough to type.
- Show and export the link without giving the app token more access.

**Non-Goals:**
- Loading issue titles, state or labels from GitHub (that needs access to the code repositories).
- Statistics per issue (possible later, see Open Questions).
- Importing a GitHub Projects board or syncing with it.
- Several issues per entry.

## Decisions

1. **Storage format `owner/repo#number` as a string, not a URL.** It is short, readable in raw JSON, the same for issues and pull requests (GitHub redirects `/issues/N` to `/pull/N`), and safe to build a URL from. Alternative: storing the full URL. Rejected because the data gets longer, other hosts would have to be validated, and the link would be harder to read in exports.
   - Regex: `^[A-Za-z0-9-]{1,39}/[A-Za-z0-9._-]{1,100}#[1-9][0-9]{0,9}$`.
2. **Parsing in one pure function** `parseIssueInput(text, project)` in `src/domain/issueRef.ts`. It accepts:
   - `owner/repo#42` as is
   - `https://github.com/owner/repo/issues/42` and `/pull/42`, with an optional query or fragment
   - `#42` or `42` → if `project.repos` has exactly one entry, it becomes `<repo>#42`. Otherwise the input is rejected with "Repository unclear".
   It returns `{ ok: true, ref } | { ok: false, reason: 'format' | 'ambiguousRepo' }`. All forms use the same function, and the MCP server (`add-mcp-server`) uses it too.
3. **Invalid values on read are dropped from the field, not from the record.** An entry whose `issueRef` is malformed stays valid, and the field is ignored for display (as with a bad project color). This way a malformed link never hides tracked time.
4. **The link is always `https://github.com/<owner>/<repo>/issues/<n>`.** It opens with `target="_blank" rel="noopener noreferrer"`. The owner and repo are checked by the regex, so the URL cannot be injected.
5. **`Project.repos?: string[]`** (`owner/repo`, unique, case-insensitive, at most 20). The same permissions apply as for renaming a project (editor and team leader). Workers see the list read-only.
6. **Input UI:** a small text field "Issue" next to the description in the timer bar, the manual form, inline editing and the edit dialog. On blur, the input is normalized to `owner/repo#42` and shown as a chip. An error shows inline and does not block saving the other fields. Saving with an invalid issue input is refused, as with an invalid time.
7. **Changing the project does not rewrite an existing `issueRef`.** It was resolved at input time and is absolute.
8. **The running timer carries `issueRef` too**, so stopping it creates an entry with the link. Quick restart copies the link.

## Risks / Trade-offs

- [An older app version shows no issue field, but keeps it] → acceptable. Mixed versions only happen briefly after a deploy.
- [An older version drops `issueRef` when a field-by-field copy builds a new entry instead of a spread] → check every save path in the tracker for this. A contract test makes sure `saveEntry` keeps unknown fields.
- [The link points to a private repository the viewer cannot see] → GitHub shows 404. This is wanted, the app reveals nothing beyond the reference.
- [Without titles the link is less readable] → the description stays the human-readable text. The MCP server can put the title into the description.

## Migration Plan

None needed. Both fields are optional, and `SCHEMA_VERSION` stays 1. Rollback: an older deploy ignores the fields and keeps them.

## Open Questions

- Should statistics get an "Issue" grouping (option (c) from the discussion)? Not in this change.
- Should the backup and Clockify import map Clockify "tasks" to `issueRef`? Probably not, since Clockify tasks are not GitHub issues.
