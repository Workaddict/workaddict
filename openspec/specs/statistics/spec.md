# statistics Specification

## Purpose
TBD - created by archiving change build-time-tracker-mvp. Update Purpose after archive.
## Requirements
### Requirement: Date range filter
The stats page SHALL provide preset ranges (today, this week, last week, this month, last month, this year) and a custom from/to range, defaulting to this week, with weeks starting on Monday.

#### Scenario: Preset range
- **WHEN** the user selects "Last month" on 2026-09-21
- **THEN** stats cover 2026-08-01 through 2026-08-31 in local time

#### Scenario: Custom range
- **WHEN** the user picks 2026-09-01 to 2026-09-15
- **THEN** stats include only entries starting within those dates

### Requirement: Dimension filters
The stats page SHALL filter by members, projects (including "No project"), and tags, each allowing multiple selections, with all selected by default.

#### Scenario: Filter by member and project
- **WHEN** the user selects member "alice" and project "Website"
- **THEN** all totals, charts, and tables include only alice's entries on "Website"

### Requirement: Totals and breakdowns
The stats page SHALL show the total tracked time, number of entries, and average time per day with tracked time, plus breakdown tables of hours and percentage by project, by member, and by tag.

#### Scenario: Project breakdown
- **WHEN** the filtered entries total 10 h, of which 6 h are on "Website"
- **THEN** the project table shows "Website" with 6 h and 60 %

#### Scenario: Multi-tag entries
- **WHEN** a 2 h entry has tags "meeting" and "client"
- **THEN** both tags are credited 2 h in the tag breakdown, and the tag table notes that an entry can count toward several tags

### Requirement: Charts
The stats page SHALL show a bar chart of tracked hours per day (per week when the range exceeds 62 days), stacked by project, and a donut chart of the share per project.

#### Scenario: Weekly bars for long ranges
- **WHEN** the selected range is "This year"
- **THEN** the bar chart shows one bar per week

#### Scenario: Empty range
- **WHEN** no entries match the filters
- **THEN** the page shows an empty state message instead of empty charts

### Requirement: Running timers excluded
Statistics SHALL include only completed entries and SHALL NOT include running timers.

#### Scenario: Timer running
- **WHEN** a member has a running timer started 1 h ago
- **THEN** that hour is not included in any statistic

### Requirement: Detailed entry table
The stats page SHALL show a sortable table of all filtered entries with date, member, project, tags, description, and duration.

#### Scenario: Sort by duration
- **WHEN** the user clicks the duration column header
- **THEN** entries are sorted by duration descending, and clicking again sorts ascending

