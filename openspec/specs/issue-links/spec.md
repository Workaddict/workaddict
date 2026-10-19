# issue-links Specification

## Purpose
TBD - created by archiving change add-issue-links. Update Purpose after archive.
## Requirements
### Requirement: Issue reference format
The system SHALL store an entry's or running timer's issue link in the optional field `issueRef` as `owner/repo#number`, where `owner` has 1–39 characters from `A-Z a-z 0-9 -`, `repo` has 1–100 characters from `A-Z a-z 0-9 . _ -`, and `number` is a positive integer without leading zeros. An entry has at most one issue link.

#### Scenario: Stored format
- **WHEN** a user links an entry to issue 42 of `acme/web`
- **THEN** the entry is stored with `"issueRef": "acme/web#42"`

#### Scenario: Malformed value in the data file
- **WHEN** an entry in an entry file has `"issueRef": "javascript:alert(1)"`
- **THEN** the entry is still loaded and counted, and no issue link is shown for it

#### Scenario: Entry without link
- **WHEN** a user saves an entry without an issue
- **THEN** the entry has no `issueRef` field

### Requirement: Issue input parsing
The system SHALL accept as issue input `owner/repo#number`, a GitHub issue URL `https://github.com/owner/repo/issues/number`, a pull request URL `https://github.com/owner/repo/pull/number` (with an optional query or fragment), the link of a GitHub Projects board card (a board URL whose query has `issue=owner|repo|number`), and a short form `#number` or `number`, and SHALL normalize every accepted input to `owner/repo#number`. Surrounding whitespace SHALL be ignored, and an empty input SHALL remove the link.

#### Scenario: URL pasted
- **WHEN** a user pastes `https://github.com/acme/web/pull/17#discussion_r1`
- **THEN** the input is normalized to `acme/web#17`

#### Scenario: Board card pasted
- **WHEN** a user pastes `https://github.com/orgs/acme/projects/1/views/1?pane=issue&itemId=5&issue=acme%7Cweb%7C17`
- **THEN** the input is normalized to `acme/web#17`

#### Scenario: Board link without a card
- **WHEN** a user pastes `https://github.com/orgs/acme/projects/1`
- **THEN** an inline error says this is the board link and to open the card and copy its address

#### Scenario: Invalid input
- **WHEN** a user enters `fix login`
- **THEN** an inline error "Not an issue reference" is shown and the entry cannot be saved until the input is corrected or cleared

### Requirement: Short form resolved through the project
The system SHALL resolve the short form `#number` against the entry's project: the project's first linked repository (its default) SHALL be used; without a linked repository, the repository of the most recent issue link among the project's loaded entries and running timers SHALL be used. The form `name#number` SHALL resolve to the linked or used repository whose name (without owner) is `name`, case-insensitively. If the entry has no project or no repository is known for its project, the system SHALL refuse the short form: for a project with a linked board it SHALL ask to paste a board card link once, otherwise to paste the link of the issue or a board card once. If `name` matches no or several linked repositories, the system SHALL refuse it and ask for `owner/repo#number`. Editors and team leaders SHALL be able to make another linked repository the default. Changing the project later SHALL NOT change an issue link that is already stored.

#### Scenario: One linked repository
- **WHEN** an entry's project "Website" is linked only to `acme/web` and the user enters `#42`
- **THEN** the issue link becomes `acme/web#42`

#### Scenario: Several linked repositories
- **WHEN** an entry's project is linked to `acme/web` (first) and `acme/api` and the user enters `#42`
- **THEN** the issue link becomes `acme/web#42`

#### Scenario: Repository by name
- **WHEN** an entry's project is linked to `acme/web` and `acme/api` and the user enters `api#7`
- **THEN** the issue link becomes `acme/api#7`

#### Scenario: Repository known from an earlier link
- **WHEN** an entry's project has no linked repository, an earlier entry of the project links `acme/app#101`, and the user enters `#42`
- **THEN** the issue link becomes `acme/app#42`

#### Scenario: No known repository
- **WHEN** an entry's project has no linked repository and no entry of it has an issue link, and the user enters `#42`
- **THEN** an inline error says to paste the link of the issue or a board card once

#### Scenario: Board without known repository
- **WHEN** an entry's project links a board but no repository is known for it, and the user enters `#42`
- **THEN** an inline error says to paste the link of a card from the board once

#### Scenario: Project changed afterwards
- **WHEN** an entry has `acme/web#42` and the user changes its project to one linked to `acme/api`
- **THEN** the issue link stays `acme/web#42`

### Requirement: Project board link
The system SHALL let editors and team leaders link one GitHub Projects board to a project by pasting its URL (`https://github.com/orgs/owner/projects/N` or `https://github.com/users/owner/projects/N`, with any view path or query), stored as `"board": "orgs/owner/projects/N"`. The same field SHALL accept a board URL or a repository; a new board SHALL replace the linked one. The project list SHALL show the board as a link that opens it, and with a board but no repository it SHALL explain that a card link pasted into the issue field is enough. The system SHALL NOT read the board through the GitHub API. An invalid stored board SHALL be dropped when the data is loaded.

#### Scenario: Board linked
- **WHEN** an editor pastes `https://github.com/orgs/acme/projects/1/views/1` into the project's link field
- **THEN** the project is stored with `"board": "orgs/acme/projects/1"` and shows a link to `https://github.com/orgs/acme/projects/1`

#### Scenario: Board unlinked
- **WHEN** an editor removes the board of a project
- **THEN** the project has no `board` field

### Requirement: Issue link display without API access
The system SHALL show an entry's issue link as the text `owner/repo#number`, linking to `https://github.com/owner/repo/issues/number` and opening in a new tab. It SHALL NOT make GitHub API requests outside the data repository to show issue links.

#### Scenario: Open the issue
- **WHEN** a user clicks `acme/web#42` in the entry list
- **THEN** `https://github.com/acme/web/issues/42` opens in a new tab

#### Scenario: No extra requests
- **WHEN** the entry list shows 50 entries with issue links
- **THEN** no request goes to a GitHub API path outside the data repository

