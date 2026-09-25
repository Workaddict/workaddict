# data-export Specification

## Purpose
TBD - created by archiving change build-time-tracker-mvp. Update Purpose after archive.
## Requirements
### Requirement: PDF report export
The system SHALL export the currently filtered statistics as a PDF report containing the title, date range, applied filters, total time, the project and member breakdown tables, the charts, and the detailed entry list, using the current UI language.

#### Scenario: Export PDF
- **WHEN** the user chooses "PDF report" from the Export menu on the stats page for September 2026
- **THEN** the browser downloads a file named like `time-report_2026-09-01_2026-09-30.pdf` with the report contents

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

### Requirement: JSON backup export
The system SHALL export a complete backup of all data (workspace, all members' entries, members, schema version, export timestamp) as a single JSON file, independent of filters and of the storage layout.

#### Scenario: Full backup
- **WHEN** the user clicks "Download backup" in settings
- **THEN** the browser downloads a JSON file containing every entry of every member and all projects and tags

### Requirement: Export feedback
The system SHALL show progress while an export of any format is generated and a clear error if generation fails, and SHALL load each format's export code only when that format is requested.

#### Scenario: Large export
- **WHEN** an export takes longer than half a second to generate
- **THEN** the Export control shows a loading state and stays disabled until the download starts

#### Scenario: Lazy loading
- **WHEN** the user opens the stats page without exporting
- **THEN** no PDF, Excel, OpenDocument, or CSV writer code is loaded

### Requirement: Export menu
The stats page SHALL offer a single "Export" control that opens a menu listing every export format, grouped into "Document" (PDF report) and "Spreadsheet" (Excel `.xlsx`, OpenDocument `.ods`, CSV), instead of one button per format. The menu SHALL be keyboard accessible, SHALL close on selection, outside click, or Escape, and SHALL NOT be clipped by its container. The control SHALL be disabled when the current filters match no entries.

#### Scenario: Pick a format
- **WHEN** the user opens the Export menu and chooses "OpenDocument (.ods)"
- **THEN** the menu closes and the browser downloads the `.ods` file for the current filters

#### Scenario: Keyboard use
- **WHEN** the user focuses the Export control, presses Enter, moves with the arrow keys to "CSV" and presses Enter
- **THEN** the CSV export starts and focus returns to the Export control

#### Scenario: Nothing to export
- **WHEN** the current filters match no entries
- **THEN** the Export control is disabled

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

### Requirement: CSV export
The system SHALL export the currently filtered entries as a CSV file with one header row and one row per entry (date, start, end, member, project, tags, description, hours), encoded as UTF-8 with a byte-order mark and quoted per RFC 4180. The delimiter and decimal separator SHALL follow the UI language: `;` and `,` for German, `,` and `.` for English. Text fields that begin with `=`, `+`, `-`, `@`, tab, or carriage return SHALL be prefixed with `'` so spreadsheets do not evaluate them as formulas.

#### Scenario: Export CSV in German
- **WHEN** the UI language is German and the user chooses "CSV"
- **THEN** the browser downloads `time-report_<from>_<to>.csv` using `;` between fields and `,` as the decimal mark in the hours column, and umlauts display correctly when the file is opened in Excel

#### Scenario: Export CSV in English
- **WHEN** the UI language is English and the user chooses "CSV"
- **THEN** the file uses `,` between fields and `.` as the decimal mark

#### Scenario: Special characters in descriptions
- **WHEN** an entry description contains the delimiter, a double quote, or a line break
- **THEN** the field is wrapped in double quotes with inner quotes doubled, and the row still parses as one record

#### Scenario: Formula-like description
- **WHEN** an entry description is `=SUM(A1:A9)`
- **THEN** the CSV field is `'=SUM(A1:A9)` and is shown as text when opened

