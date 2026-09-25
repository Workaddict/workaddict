## Why

The manual check of the OpenDocument export (task 3.5 of `multi-format-export`) found that the `.ods` opens in Excel without a repair prompt and with correct data (hours sum to the stats total), but the file looks clumsy. The summary sheet has a meaningless "Name / Value" header, a 60-character value column sized for the filter text that pushes numbers far away from their labels, and dates in ISO form (`2026-01-05`) where the PDF export and the app show `05.01.2026`. The Excel export shares the same summary layout and ISO dates, so it has the same problems.

## What Changes

- **Summary sheet layout (ODS and XLSX):** no "Name / Value" header row. The sheet starts with a title row naming the report and its date range, followed by label/value rows. The value column is sized for the values, not for the filter text, and values are left-aligned next to their labels. Long text (the filter line) no longer decides the column width.
- **Localized dates and times (ODS and XLSX):** date cells use the app language's short date pattern (German `05.01.2026`, English `01/05/2026`), and time cells follow the 12/24-hour setting, as in the PDF export. Cells stay real date and time values. CSV stays ISO (`yyyy-MM-dd`, `HH:mm`) because it is meant for import.
- Out of scope: showing hours as `h:mm` (hours stay decimal so they can be summed), and Excel's yellow information bar about ODS/XLSX differences. It stays even with Excel's own `styles.xml` (checked 2026-09-25), so it is Excel's general notice for `.ods` files, not a defect.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `data-export`: the Excel and OpenDocument requirements gain rules for the summary layout (title row, no key/value header, value column fitted to values) and for dates and times following the app language and time format.

## Impact

- `src/features/export/report.ts` (`reportSheets`: summary sheet shape, column widths; date/time pattern from locale and time format)
- `src/features/export/ods.ts` (localized data styles, title row without header styling, left-aligned summary values)
- `src/features/export/xlsx.ts` (summary layout, number formats from the locale and time format)
- `src/features/export/csv.ts` (reads the entries sheet only; must keep ISO output and ignore the summary change)
- Tests: `src/features/export/export.test.ts` and ODS tests
- No new dependencies. No change to the file names, sheet names, or entry columns.
