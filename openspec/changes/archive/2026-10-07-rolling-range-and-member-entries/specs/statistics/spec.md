## MODIFIED Requirements

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
