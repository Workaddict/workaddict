## Context

`StatsPage` builds a format-neutral `Report` (`src/features/export/report.ts`) and passes it to a lazily imported writer: `pdf.ts` (jsPDF) or `xlsx.ts` (exceljs). Each format has its own toolbar button. A private `Popover` in `src/components/Pickers.tsx` already handles fixed positioning (it can't be clipped and flips above the button when there's no room below), outside-click and Escape.

This change adds `.ods` and `.csv` and replaces the buttons with one menu (option A from exploration).

## Goals / Non-Goals

**Goals:**
- One **Export ▾** control that lists every format, grouped by Document and Spreadsheet.
- Native `.ods` with the same structure as the `.xlsx` export.
- CSV that opens correctly on double-click in Excel and LibreOffice for the UI language.
- No new npm dependencies, and writers stay lazy-loaded.

**Non-Goals:**
- Remembering the last-used format or a split button (option B). This can come later.
- Per-export options such as a delimiter picker or choosing sheets (option D dialog).
- A Clockify-compatible CSV layout.
- Changes to the JSON backup in settings.

## Decisions

### 1. Format registry
`src/features/export/formats.ts` exports:

```ts
type ExportFormat = 'pdf' | 'xlsx' | 'ods' | 'csv'
const EXPORT_GROUPS: { group: 'document' | 'spreadsheet'; formats: ExportFormat[] }[]
function loadWriter(f: ExportFormat): Promise<(r: Report) => Promise<void>>  // dynamic import per format
```

The menu renders from `EXPORT_GROUPS`, and `runExport(format)` calls `loadWriter`. Adding a format later means one registry entry and one writer file. *Alternative:* a switch inside `StatsPage`. Rejected because it spreads format knowledge into the page.

### 2. Menu reuses an extracted Popover
Move `usePopover` and `Popover` out of `Pickers.tsx` into `src/components/Popover.tsx`. Add a `buttonClassName` prop (defaults to the picker style) and an `aria-haspopup` prop (`'listbox'` for pickers, `'menu'` for export). The export menu renders `role="menu"` with `role="menuitem"` buttons and group labels. Arrow-key navigation between items and focus returning to the trigger on close are part of the menu. *Alternative:* a new menu library. Rejected because the in-house popover already solves the clipping bug (bb3087c).

While an export runs, the trigger shows a spinner and is disabled. The menu closes as soon as a format is chosen, so the loading state lives on the trigger.

### 3. ODS: hand-written, store-only zip
exceljs can't write ODF. Options:

| Option | Verdict |
|---|---|
| SheetJS | Rejected. The npm release `xlsx@0.18.5` is stale with known advisories, and current builds are only on the SheetJS CDN |
| Flat ODS (`.fods`, single XML) | Rejected. Excel can't open it and the extension is unfamiliar |
| jszip (transitive through exceljs) | Rejected. Relying on a transitive dependency is fragile |
| **Own store-only zip writer + ODS XML** | **Chosen**. About 60 lines of zip (local headers, central directory, CRC-32) plus the XML templates |

ODS requires the `mimetype` entry to be first and stored uncompressed, which store-only writing does anyway. The files are small text (a year of entries is a few MB of XML), so skipping compression is fine. Package contents: `mimetype`, `META-INF/manifest.xml`, `content.xml`, `styles.xml` (minimal), `meta.xml`.

Cell typing mirrors `xlsx.ts`:
- date: `office:value-type="date"` with `office:date-value="2026-09-01"` and a date style
- start/end: `office:value-type="time"`, `office:time-value="PT09H30M00S"`
- hours: `office:value-type="float"`, style `0.00`, unrounded
- share: `office:value-type="percentage"`, style `0.0%`
- header row bold. Frozen header via `settings.xml` is nice to have and optional.

ODF dates are wall-clock values with no timezone, so no UTC shift like `excelDate` is needed. The ODS writer formats local fields directly. All strings go through XML escaping (`& < > " '`, plus control characters stripped).

### 4. CSV dialect follows UI language
CSV has no type information, so the goal is "opens right on double-click":

| UI language | Delimiter | Decimal | 
|---|---|---|
| `de` | `;` | `,` |
| `en` | `,` | `.` |

- UTF-8 with BOM (`﻿`) so Excel detects the encoding for umlauts.
- CRLF line endings, RFC 4180 quoting (quote a field that contains the delimiter, a quote, CR or LF; double inner quotes).
- Columns match the Entries sheet: date `yyyy-MM-dd`, start and end `HH:mm`, member, project, tags, description, hours (2 decimals, localized mark).
- Formula injection guard: a text field starting with `= + - @` (or tab or CR) gets a leading `'`. Descriptions are user-typed and the file gets opened in spreadsheets.
- Only entries are included. The menu labels CSV "entries only".

*Alternative:* always `,` and `.` (a "machine CSV"). Rejected as the default because German Excel would put everything in column A. A delimiter option can come with a future export dialog.

### 5. Shared tabular model
`xlsx.ts`, `ods.ts` and `csv.ts` all need the same column definitions and sheet list. Add `sheets(report)` in `report.ts`, returning `{ name, columns: { header, kind: 'date'|'time'|'text'|'hours'|'percent'|'datetime'|'number' }[], rows: unknown[][] }[]`. ODS and CSV use it (CSV takes only the entries sheet). Porting `xlsx.ts` to it is optional. Leave xlsx as is unless the port is trivial, so its tested output doesn't change.

## Risks / Trade-offs

- [Hand-written ODS rejected by LibreOffice or Excel] → validate the output by opening it in LibreOffice and Excel during implementation. Unit-test the zip structure: mimetype first and stored, CRCs correct, readable by an independent unzip in the test (Node `zlib` can't read zips, so parse the central directory manually or check with `unzip -t` in a spike).
- [CRC-32 or zip bugs] → small, well-known algorithm. Test against known vectors (`crc32("123456789") = 0xCBF43926`).
- [CSV locale guess wrong for the user's Excel] → the dialect is tied to the UI language, which the user controls. Documented as a known limitation.
- [Menu adds a click for PDF and Excel] → accepted trade-off for scalability. Option B (remember last) is the follow-up if people complain.
- [Popover extraction breaks pickers] → pure move with a defaulted prop. Existing picker behavior is covered by manual checks and tests.
