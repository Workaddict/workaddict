## Context

The spreadsheet exports are built from one tabular model: `reportSheets()` in `src/features/export/report.ts` returns four `Sheet`s (summary, entries, by project, by member), which `ods.ts` and `csv.ts` render (CSV uses the entries sheet only). `xlsx.ts` builds the same four sheets directly with exceljs, repeating the layout by hand.

Findings from the manual check on 2026-09-25 (Excel for Microsoft 365, German):

- Excel opens the `.ods` without a repair prompt but with a yellow information bar about differences between ODS and XLSX. Four variants (default cell style, font declarations, both, and Excel's own complete `styles.xml`) all still show it, so it is Excel's general notice for `.ods` files and not something the export can fix. It is out of scope.
- Data is correct: 243 entry rows, the hours column sums to 537.5075 h = 537:30, the same as the stats page.
- Summary sheet: header row "Name | Wert", value column 12.6 cm (width 60, sized for the filter text), numbers right-aligned at the far edge. Dates everywhere are `yyyy-MM-dd` (fixed `N_date` style in ODS, `numFmt: 'yyyy-mm-dd'` in XLSX).
- The PDF export already localizes: dates with date-fns `'P'` in the report locale, times with `formatTime(d, getTimeFormat())`.

## Goals / Non-Goals

**Goals:**
- The summary sheet reads like a summary: title row, labels with their values right beside them, no table header.
- Date and time cells display like the PDF and the app: locale short date, 12/24-hour time from the setting.
- ODS and XLSX stay identical in sheets, columns, and summary layout.

**Non-Goals:**
- Hours as `h:mm`. Decimal hours stay, because they sum and multiply directly.
- Changing CSV output. CSV is for import, and ISO dates are the unambiguous choice there.
- Moving XLSX onto the shared `Sheet` model. That would be a nice cleanup, but it isn't needed for this change.

## Decisions

### D1: The summary shape lives in `reportSheets()`, as data

Add two optional fields to `Sheet`: `title?: string` (a bold first row spanning the sheet, without header styling) and `header?: false` (no column header row). The summary sheet sets both; the other sheets are unchanged. The old first data row ("Zeitbericht | range") moves into the title: `"<reportTitle> <from> – <to>"`. `ods.ts` renders the title row with a bold cell style and skips `table:table-header-rows` when `header` is false. `xlsx.ts` mirrors the same rows by hand.

*Alternative:* special-case the summary inside each writer. Rejected, because the layout would then live in three places and drift apart.

### D2: Column widths: fit the values, let long text overflow

The summary value column gets a width fitted to the values (about 20 characters: the datetime and the hour numbers), not 60. The filter text is not wrapped. Spreadsheets draw non-wrapped text into empty neighbouring cells, so the long line stays readable without widening the column. XLSX currently sets `wrapText: true` on the value column; that goes. Values in the summary are left-aligned. In ODS that means a cell style with `fo:text-align="start"` and `style:text-align-source="fix"`, applied to the summary's number, hours, and datetime cells. In XLSX it's `alignment: { horizontal: 'left' }`.

*Alternative:* wrap the filter text. Rejected, because a three-line filter row looks worse than overflow and makes the row height uneven.

### D3: Date and time patterns come from the report locale and the time format setting

Add `timeFormat: TimeFormat` to `Report` (filled from `getTimeFormat()` where the report is built) so the writers stay pure and testable. Derive the date pattern from the date-fns locale's short date pattern (`locale.formatLong.date({ width: 'short' })`, which gives `dd.MM.y` for `de` and `MM/dd/yyyy` for `enUS`), the same source the PDF's `'P'` uses. A small helper tokenizes that pattern into parts (day, month, year, literal):

- ODS: parts become `<number:day number:style="long"/>`, `<number:text>.</number:text>`, … in `N_date` and `N_datetime`. Time becomes `<number:hours number:style="long"/>:<number:minutes …/>` for 24h, and `<number:hours/>:<number:minutes number:style="long"/> <number:am-pm/>` for 12h.
- XLSX: parts become a number format string (`dd.mm.yyyy`, `mm/dd/yyyy`), plus `hh:mm` or `h:mm AM/PM`.

*Alternative:* `Intl.DateTimeFormat(...).formatToParts`. Rejected, because it can differ from date-fns in detail (zero padding), and the PDF and the app already use date-fns.

*Alternative:* the XLSX built-in short date format (id 14), which follows the viewer's system locale. Rejected, because ODS has no equivalent, and the two formats must match.

## Risks / Trade-offs

- [Title text in A1 overflows into B1 only while B1 is empty] → The title row has only one cell; keep it that way, and add a test.
- [12-hour times in ODS: `number:am-pm` renders as "AM/PM" in LibreOffice but localized in Excel] → Acceptable. English is the only language with 12h by default, and both show a correct time.
- [Changing the XLSX summary breaks someone's formula referring to `B4`] → Low risk for a report export, and not a stable API. The total moves one row. Mention it in the commit.

## Open Questions

- None blocking. The exact title wording reuses `exports.reportTitle` ("Zeitbericht" / "Time report") plus the formatted range.
