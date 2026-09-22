## ADDED Requirements

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
The system SHALL export the currently filtered statistics as an OpenDocument spreadsheet (`.ods`) with the same sheets and columns as the Excel export ("Summary", "Entries", "By project", "By member"), where dates and times are real date and time cells, hours are numeric, and shares are percentages. The file SHALL open without repair prompts in LibreOffice Calc and Microsoft Excel.

#### Scenario: Export ODS
- **WHEN** the user chooses "OpenDocument (.ods)" for September 2026
- **THEN** the browser downloads `time-report_2026-09-01_2026-09-30.ods` whose "Entries" sheet has one row per filtered entry with date, start, end, member, project, tags, description, and hours

#### Scenario: Summable hours in ODS
- **WHEN** the user opens the "Entries" sheet in LibreOffice and sums the hours column
- **THEN** the sum equals the total shown on the stats page (within rounding)

#### Scenario: Wall-clock times
- **WHEN** an entry started at 09:30 local time
- **THEN** its start cell in the `.ods` file shows 09:30

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

## MODIFIED Requirements

### Requirement: PDF report export
The system SHALL export the currently filtered statistics as a PDF report containing the title, date range, applied filters, total time, the project and member breakdown tables, the charts, and the detailed entry list, using the current UI language.

#### Scenario: Export PDF
- **WHEN** the user chooses "PDF report" from the Export menu on the stats page for September 2026
- **THEN** the browser downloads a file named like `time-report_2026-09-01_2026-09-30.pdf` with the report contents

### Requirement: Excel export
The system SHALL export the currently filtered statistics as an `.xlsx` workbook with the sheets "Summary", "Entries", "By project", and "By member", where dates are real date cells and durations are numeric hours.

#### Scenario: Export Excel
- **WHEN** the user chooses "Excel (.xlsx)" from the Export menu
- **THEN** the browser downloads an `.xlsx` file whose "Entries" sheet has one row per filtered entry with date, start, end, member, project, tags, description, and hours

#### Scenario: Summable hours
- **WHEN** the user opens the "Entries" sheet in Excel and sums the hours column
- **THEN** the sum equals the total shown on the stats page (within rounding)

### Requirement: Export feedback
The system SHALL show progress while an export of any format is generated and a clear error if generation fails, and SHALL load each format's export code only when that format is requested.

#### Scenario: Large export
- **WHEN** an export takes longer than half a second to generate
- **THEN** the Export control shows a loading state and stays disabled until the download starts

#### Scenario: Lazy loading
- **WHEN** the user opens the stats page without exporting
- **THEN** no PDF, Excel, OpenDocument, or CSV writer code is loaded
