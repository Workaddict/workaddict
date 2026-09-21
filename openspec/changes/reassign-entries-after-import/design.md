## Context

Imported entries carry no reference to their Clockify user; the mapping only determined the `login` and therefore the file `entries/<login>/<YYYY-MM>.json`. Changing the mapping afterwards therefore means moving entries between logins.

## Goals / Non-Goals

**Goals:** fix a wrong mapping or merge a former member into a real login after the import, safely and in one commit.

**Non-Goals:** remembering the original Clockify user per entry; moving running timers; merging workspaces.

## Decisions

- **Move by login, optional date cutoff.** Without a Clockify reference, "all entries of login A" is the only reliable selection. A cutoff (`start < before`, local midnight of the chosen day) covers the case where A also tracked new entries after the import. *Alternative:* add a `source` marker to imported entries. Rejected: existing imports lack it.
- **One commit via `writeMany`.** Target month files get the moved entries appended (same ids, `login` = target, fresh `updatedAt`); source files keep the rest or are deleted when empty. Commit: `reassign: 3 entries from clockify.jane to jane before 2026-09-01 (alice)`.
- **Abort on concurrent change.** File contents are computed once; the `prepare` hook re-lists the tree before every attempt and throws `conflict` if any source or target file's blob SHA changed, so a concurrent write is never overwritten. Unrelated commits only cause a normal retry.
- **Team leaders only** (new action `reassignEntries`, same level as the import), checked in the storage layer; the Settings row is shown only to team leaders.

## Risks / Trade-offs

- [A cutoff date in the wrong time zone moves one day too many/few] → The cutoff is local midnight, matching how dates are shown in the app; the preview shows the exact count and hours before confirming.
- [Large histories: all entry files of the source member are read] → They are already cached by blob SHA; one commit regardless of size.
