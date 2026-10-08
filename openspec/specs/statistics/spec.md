# statistics Specification

## Purpose
TBD - created by archiving change build-time-tracker-mvp. Update Purpose after archive.
## Requirements
### Requirement: Date range filter
The stats page SHALL provide preset ranges (today, this week, last week, last 14 days, this month, last month, this year, all time) and a custom from/to range, defaulting to this week, with weeks starting on Monday. "Last 14 days" SHALL cover the start of the day 13 days before today through the end of today in the effective time zone, so that it always contains exactly 14 calendar days ending today. All other presets SHALL remain calendar-aligned. "All time" SHALL cover the start of the earliest entry through the end of today, or only today when there are no entries.

#### Scenario: Preset range
- **WHEN** the user selects "Last month" on 2026-09-21
- **THEN** stats cover 2026-08-01 through 2026-08-31 in local time

#### Scenario: Last 14 days
- **WHEN** the user selects "Last 14 days" on Monday 2026-10-05
- **THEN** stats cover 2026-09-22 through 2026-10-05 in local time and include no future days

#### Scenario: Last 14 days follows the date
- **WHEN** the user left "Last 14 days" selected on 2026-10-05 and returns in the same browser tab on 2026-10-06
- **THEN** stats cover 2026-09-23 through 2026-10-06

#### Scenario: Last week stays a calendar week
- **WHEN** the user selects "Last week" on Monday 2026-10-05
- **THEN** stats cover 2026-09-28 through 2026-10-04

#### Scenario: All time
- **WHEN** the user selects "All time" and the earliest entry started on 2024-03-14 09:00
- **THEN** stats cover every completed entry from 2024-03-14 through the end of today, and the displayed range starts on 2024-03-14

#### Scenario: All time without entries
- **WHEN** the user selects "All time" and no entries exist
- **THEN** the range covers only today and the page shows the empty state

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
The stats page SHALL show a bar chart of tracked hours stacked by project, with one bar per day for ranges up to 62 days, one bar per week for ranges up to 366 days, and one bar per month for longer ranges, and a donut chart of the share per project.

#### Scenario: Weekly bars for long ranges
- **WHEN** the selected range is "This year"
- **THEN** the bar chart shows one bar per week

#### Scenario: Monthly bars for very long ranges
- **WHEN** the selected range is "All time" and the earliest entry is more than 366 days ago
- **THEN** the bar chart shows one bar per calendar month

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

### Requirement: Filter persistence
The stats page SHALL remember the selected range preset, custom from/to dates, and member, project, and tag filters for the current browser tab session, separately per workspace, so that leaving the stats page or reloading it restores them. A remembered preset SHALL be re-evaluated against the current date, not stored as fixed dates. Remembered values that are malformed or unknown SHALL fall back to the defaults; remembered member, project, or tag ids that no longer exist SHALL be dropped, and a filter left with no valid ids SHALL revert to all selected.

#### Scenario: Switching tabs keeps filters
- **WHEN** the user selects "Last month" and project "Website" on the stats page, opens the time tracking page, and returns to the stats page
- **THEN** the range is still "Last month" and only "Website" is selected

#### Scenario: Reload keeps filters
- **WHEN** the user selects "Last 2 weeks" and reloads the page in the same browser tab
- **THEN** the stats page shows "Last 2 weeks"

#### Scenario: Preset follows the calendar
- **WHEN** the user left "This week" selected on 2026-10-04 and returns in the same browser tab on 2026-10-05
- **THEN** stats cover the week starting 2026-10-05

#### Scenario: Separate per workspace
- **WHEN** the user filters by a project in workspace A and then opens the stats page of workspace B in the same browser tab
- **THEN** workspace B shows its own remembered filters, or the defaults if none

#### Scenario: Deleted project in remembered filter
- **WHEN** the only remembered project filter refers to a project that has since been deleted
- **THEN** the project filter reverts to all projects selected

#### Scenario: New browser tab starts fresh
- **WHEN** the user opens the app in a new browser tab
- **THEN** the stats page starts with "This week" and all members, projects, and tags selected

