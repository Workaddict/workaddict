## Why

The stats page can export to PDF and Excel only, with one button per format. Users also need plain CSV (for scripts, payroll, other tools) and native OpenDocument (`.ods`) for LibreOffice. Some organizations, German public sector in particular, require ODF. Adding a button per format doesn't scale, so the page needs one entry point that holds every format.

## What Changes

- Replace the "Export PDF" and "Export Excel" buttons on the stats page with a single **Export ▾** menu, grouped into:
  - **Document**: PDF report
  - **Spreadsheet**: Excel (`.xlsx`), OpenDocument (`.ods`), CSV (entries only)
- Add an OpenDocument spreadsheet export with the same sheets as the Excel export (Summary, Entries, By project, By member), real date and time cells, and numeric hours.
- Add a CSV export of the filtered entries. It works when opened directly in Excel or LibreOffice for the current UI language: UTF-8 with BOM, `;` delimiter and decimal comma in German, `,` delimiter and decimal point in English.
- Extract the fixed-position popover from `Pickers.tsx` into a reusable component so the export menu can use it.
- All export writers stay lazy-loaded. No new runtime dependency.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `data-export`: the Excel export requirement is triggered from the new menu. New requirements cover the export menu, the OpenDocument export, and the CSV export. The PDF scenario is updated to be triggered from the menu. Export feedback now applies to every format.

## Impact

- `src/features/stats/StatsPage.tsx`: the export toolbar becomes one menu, and the `exporting` state widens to an `ExportFormat` union.
- `src/features/export/`: new `ods.ts`, `csv.ts`, and a small store-only zip writer (`zip.ts`), plus a format registry that maps each format to its lazy writer.
- `src/components/Pickers.tsx` → the popover moves to `src/components/Popover.tsx` and the pickers import it.
- `src/i18n/en.ts`, `src/i18n/de.ts`: menu labels, group headings, format names.
- Styles for the menu (reuses the `picker-pop` look).
- No new npm dependency. Bundle impact is limited to the new lazy chunks.
