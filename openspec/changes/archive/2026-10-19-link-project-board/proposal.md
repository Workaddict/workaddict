## Why

The Team-Wels scrum board is a GitHub Projects board of the organization, not a repository, and it holds issues from several repositories. The Projects & Tags page only accepted a repository, so a team that thinks in terms of its board did not know what to enter, and a board URL was refused as "Not a repository".

## What Changes

- A project can link one **board** (`https://github.com/orgs/owner/projects/N` or `/users/…`), stored as `"board": "orgs/owner/projects/N"`. The link field accepts a board URL or a repository. The board is shown as a link; editors and team leaders can remove it.
- The issue field accepts the link of a **board card** (`…/projects/N?pane=issue&itemId=…&issue=owner%7Crepo%7Cnumber`) and reads the issue from it. A board link without a card gets its own error.
- `#42` works without a linked repository once the project has an issue link: it resolves to the repository of the project's most recent issue link (loaded entries and running timers). Linked repositories still come first. Nothing is written to the workspace, so workers can use it too.
- The app still never reads the board through the GitHub API; the token keeps access to the data repository only.
- No schema version bump: `board` is optional, and older versions keep unknown project fields.

## Capabilities

### Modified Capabilities
- `issue-links`: card links in "Issue input parsing", used repositories and the board error in "Short form resolved through the project", new requirement "Project board link".
