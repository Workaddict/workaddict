## ADDED Requirements

### Requirement: Issue column
The entry tables of the Excel, OpenDocument, CSV and PDF exports SHALL contain an "Issue" column (German "Issue") right after the description, with the entry's issue link as `owner/repo#number`, or empty when there is none. In Excel and OpenDocument the cell SHALL be a hyperlink to the issue. The JSON backup SHALL contain `issueRef` on entries and `repos` on projects unchanged.

#### Scenario: CSV export
- **WHEN** the user exports CSV and one entry links to `acme/web#42`
- **THEN** that entry's row has `acme/web#42` in the "Issue" column, and rows without a link have an empty cell

#### Scenario: Excel hyperlink
- **WHEN** the user opens the "Entries" sheet of an `.xlsx` export
- **THEN** the cell `acme/web#42` is a hyperlink to `https://github.com/acme/web/issues/42`

#### Scenario: Backup round trip
- **WHEN** a backup with issue links and linked repositories is exported
- **THEN** the backup file contains every `issueRef` and every project's `repos`
