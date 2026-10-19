## 1. Domain

- [x] 1.1 `Project.board?`; `parseBoardInput`, `isBoardRef`, `boardUrl`; `parseRepoInput` refuses board URLs
- [x] 1.2 `parseIssueInput`: board card links, `boardLink` and `boardNoRepo` errors, used repositories after linked ones; `reposOf`
- [x] 1.3 Tests with the real Team-Wels card URL format (checked on the live board)

## 2. Storage

- [x] 2.1 `workspaceCodec` drops an invalid `board` and counts the repair; round-trip test

## 3. UI

- [x] 3.1 Projects & Tags: one field for board or repository, board chip with link and remove button, hints for board without repository
- [x] 3.2 Issue field, inline edit and edit dialog resolve through used repositories (`useParseIssue`, `useUsedRepos`)
- [x] 3.3 German and English texts; tests for linking, unlinking, card link, board error and used repository

## 4. AI integration

- [x] 4.1 MCP `list_projects` returns the board URL; `add_entries` accepts card links and explains the new errors

## 5. Docs

- [x] 5.1 Spec `issue-links` and README
