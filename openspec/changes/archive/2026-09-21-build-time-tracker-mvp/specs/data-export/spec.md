## ADDED Requirements

### Requirement: PDF report export
The system SHALL export the currently filtered statistics as a PDF report containing the title, date range, applied filters, total time, the project and member breakdown tables, the charts, and the detailed entry list, using the current UI language.

#### Scenario: Export PDF
- **WHEN** the user clicks "Export PDF" on the stats page for September 2026
- **THEN** the browser downloads a file named like `time-report_2026-09-01_2026-09-30.pdf` with the report contents

### Requirement: Excel export
The system SHALL export the currently filtered statistics as an `.xlsx` workbook with the sheets "Summary", "Entries", "By project", and "By member", where dates are real date cells and durations are numeric hours.

#### Scenario: Export Excel
- **WHEN** the user clicks "Export Excel"
- **THEN** the browser downloads an `.xlsx` file whose "Entries" sheet has one row per filtered entry with date, start, end, member, project, tags, description, and hours

#### Scenario: Summable hours
- **WHEN** the user opens the "Entries" sheet in Excel and sums the hours column
- **THEN** the sum equals the total shown on the stats page (within rounding)

### Requirement: JSON backup export
The system SHALL export a complete backup of all data (workspace, all members' entries, members, schema version, export timestamp) as a single JSON file, independent of filters and of the storage layout.

#### Scenario: Full backup
- **WHEN** the user clicks "Download backup" in settings
- **THEN** the browser downloads a JSON file containing every entry of every member and all projects and tags

### Requirement: Export feedback
The system SHALL show progress while an export is generated and a clear error if generation fails, and SHALL load export libraries only when an export is requested.

#### Scenario: Large export
- **WHEN** an export takes longer than half a second to generate
- **THEN** the export button shows a loading state until the download starts
