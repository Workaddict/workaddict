## MODIFIED Requirements

### Requirement: Excel export
The system SHALL export the currently filtered statistics as an `.xlsx` workbook with the sheets "Summary", "Entries", "By project", and "By member", where dates are real date cells and durations are numeric hours. The "Summary" sheet SHALL start with a title row naming the report and its date range and SHALL NOT have a "Name / Value" header row; its value column SHALL be sized for the values rather than for the longest text, with values left-aligned next to their labels. Date cells SHALL display in the app language's short date pattern (German `05.01.2026`, English `01/05/2026`) and time cells SHALL follow the 12/24-hour time format setting, while staying real date and time values.

#### Scenario: Export Excel
- **WHEN** the user chooses "Excel (.xlsx)" from the Export menu
- **THEN** the browser downloads an `.xlsx` file whose "Entries" sheet has one row per filtered entry with date, start, end, member, project, tags, description, and hours

#### Scenario: Summable hours
- **WHEN** the user opens the "Entries" sheet in Excel and sums the hours column
- **THEN** the sum equals the total shown on the stats page (within rounding)

#### Scenario: Summary layout in Excel
- **WHEN** the user opens the "Summary" sheet of an `.xlsx` export for January to December 2026 with the app in German
- **THEN** the first row is a title such as "Zeitbericht 01.01.2026 – 31.12.2026", there is no "Name" / "Wert" header row, and the total, entry count, and average stand directly next to their labels instead of at the far edge of a wide column

#### Scenario: Localized dates in Excel
- **WHEN** the app is in German with the 24-hour format and an entry started on 5 January 2026 at 16:20
- **THEN** its date cell shows `05.01.2026` and its start cell shows `16:20`, and both are date/time values Excel can sort and calculate with

### Requirement: OpenDocument export
The system SHALL export the currently filtered statistics as an OpenDocument spreadsheet (`.ods`) with the same sheets and columns as the Excel export ("Summary", "Entries", "By project", "By member"), where dates and times are real date and time cells, hours are numeric, and shares are percentages. The "Summary" sheet SHALL use the same layout as the Excel export (title row, no "Name / Value" header row, value column sized for the values). Date and time cells SHALL use the same localized display patterns as the Excel export. The file SHALL open without repair prompts in LibreOffice Calc and Microsoft Excel.

#### Scenario: Export ODS
- **WHEN** the user chooses "OpenDocument (.ods)" for September 2026
- **THEN** the browser downloads `time-report_2026-09-01_2026-09-30.ods` whose "Entries" sheet has one row per filtered entry with date, start, end, member, project, tags, description, and hours

#### Scenario: Summable hours in ODS
- **WHEN** the user opens the "Entries" sheet in LibreOffice and sums the hours column
- **THEN** the sum equals the total shown on the stats page (within rounding)

#### Scenario: Wall-clock times
- **WHEN** an entry started at 09:30 local time
- **THEN** its start cell in the `.ods` file shows 09:30

#### Scenario: Localized dates in ODS
- **WHEN** the app is in English with the 12-hour format and an entry started on 5 January 2026 at 16:20
- **THEN** its date cell in the `.ods` file shows `01/05/2026` and its start cell shows `4:20 PM`

#### Scenario: Opens cleanly in Excel
- **WHEN** the user opens an exported `.ods` file in Microsoft Excel
- **THEN** Excel shows no repair prompt and all sheets, rows, and number formats are present
