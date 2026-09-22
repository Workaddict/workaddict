## MODIFIED Requirements

### Requirement: Efficient reads with content cache
The GitHub adapter SHALL check the branch head commit before discovering files, SHALL reuse the last file list when the head commit is unchanged, and otherwise SHALL discover files through a single recursive tree request for that head commit. It SHALL fetch file contents only for blob SHAs not already in its local cache, with at most 8 content requests in flight at any time across all concurrent reads.

#### Scenario: Unchanged data refresh
- **WHEN** data is refreshed and no commit landed on the branch since the last refresh
- **THEN** the adapter makes one branch-head request, no tree request, and no content requests

#### Scenario: One file changed
- **WHEN** one entry file changed since the last refresh
- **THEN** the adapter makes one branch-head request, one tree request, and fetches the content of only that file

#### Scenario: Cold cache with many files
- **WHEN** all entries are read with an empty local cache and the repository has 360 entry files
- **THEN** every file is fetched once and no more than 8 content requests are in flight at the same time

#### Scenario: After own write
- **WHEN** the current user's write succeeded or failed with a conflict
- **THEN** the next refresh fetches the tree again even if the branch-head request reports the previously seen commit

#### Scenario: Empty repository
- **WHEN** the branch-head request reports an empty repository or a missing branch
- **THEN** the adapter treats the repository as having no files
