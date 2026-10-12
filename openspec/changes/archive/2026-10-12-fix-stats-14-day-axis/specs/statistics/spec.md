## MODIFIED Requirements

### Requirement: Charts
The stats page SHALL show a bar chart of tracked hours stacked by project, with one bar per day for ranges up to 62 days, one bar per week for ranges up to 366 days, and one bar per month for longer ranges, and a donut chart of the share per project.

The bar chart's x-axis labels SHALL let the user tell which bar belongs to which period at every width from 320 px:
- For daily bars in ranges of up to 14 days, every bar SHALL have a visible label at every supported width. On narrow charts the label SHALL shorten (e.g. to the day of the month) instead of being hidden.
- For longer ranges where not every label fits, labels SHALL be thinned at a regular step counted from the first bar (every n-th bar), and the first and last bars SHALL be labeled.
- The tooltip SHALL show the full date or period of the bar it belongs to.

#### Scenario: Weekly bars for long ranges
- **WHEN** the selected range is "This year"
- **THEN** the bar chart shows one bar per week

#### Scenario: Monthly bars for very long ranges
- **WHEN** the selected range is "All time" and the earliest entry is more than 366 days ago
- **THEN** the bar chart shows one bar per calendar month

#### Scenario: Empty range
- **WHEN** no entries match the filters
- **THEN** the page shows an empty state message instead of empty charts

#### Scenario: Every day labeled for last 14 days on a phone
- **WHEN** on 2026-10-12 the user selects "Last 14 days" on a 320 px wide screen
- **THEN** the bar chart shows 14 bars from 29 Sep to 12 Oct and each bar, including 5 Oct, has its own visible x-axis label

#### Scenario: Every day labeled on desktop
- **WHEN** the user selects "This week" on a desktop screen
- **THEN** each of the 7 bars is labeled with the weekday and day of the month

#### Scenario: Regular thinning for a month
- **WHEN** the user selects "This month" for a 31-day month on a 375 px wide screen and not every label fits
- **THEN** labels appear on the first bar, at a regular step after it, and on the last bar, and no label overlaps another

#### Scenario: Tooltip shows full date
- **WHEN** the user taps or hovers a bar whose label is shortened or hidden
- **THEN** the tooltip shows that bar's full date (for example "Monday, 5 Oct 2026")
