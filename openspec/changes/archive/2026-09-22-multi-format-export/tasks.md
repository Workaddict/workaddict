## 1. Shared building blocks

- [x] 1.1 Move `usePopover`/`Popover` from `src/components/Pickers.tsx` to `src/components/Popover.tsx`, add `buttonClassName` and `aria-haspopup` props with picker defaults; update pickers to import it and verify they behave unchanged
- [x] 1.2 Add `src/features/export/formats.ts` with the `ExportFormat` union, `EXPORT_GROUPS` (document: pdf; spreadsheet: xlsx, ods, csv) and `loadWriter(format)` doing a dynamic import per format
- [x] 1.3 Add `sheets(report)` to `report.ts` returning typed columns and rows for Summary, Entries, By project, By member; unit-test that Entries hours sum to `summary.totalMs`

## 2. CSV export

- [x] 2.1 Implement `src/features/export/csv.ts`: dialect from `report.locale`/UI language (`de` → `;` + `,`; else `,` + `.`), BOM, CRLF, RFC 4180 quoting, formula-injection prefix, download as `time-report_<from>_<to>.csv`
- [x] 2.2 Unit tests: German and English dialects, quoting of delimiter/quote/newline, `=SUM(...)` prefixed, BOM present, one row per entry

## 3. OpenDocument export

- [x] 3.1 Implement `src/features/export/zip.ts`: CRC-32 and store-only zip writer (local headers, central directory, end record) returning a `Uint8Array`
- [x] 3.2 Unit tests for zip: CRC-32 vector `123456789` → `0xCBF43926`, entry order preserved, `mimetype` first and uncompressed, central directory offsets correct
- [x] 3.3 Implement `src/features/export/ods.ts`: `mimetype`, `META-INF/manifest.xml`, `meta.xml`, `styles.xml`, `content.xml` with one table per sheet; typed cells (date, time, float `0.00`, percentage `0.0%`), bold header, XML escaping and control-character stripping; download as `.ods`
- [x] 3.4 Unit tests for ODS: `content.xml` has four tables, entry rows with `office:date-value`/`office:time-value` in local wall-clock time, hours as float, escaped special characters
- [ ] 3.5 Manually open a generated `.ods` in LibreOffice Calc and Excel: no repair prompt, dates/times/hours/percent formatted, hours column sums to the total

## 4. Export menu UI

- [x] 4.1 Add i18n keys in `en.ts` and `de.ts`: `stats.export`, group labels (Document / Spreadsheet), format labels (PDF report, Excel (.xlsx), OpenDocument (.ods), CSV (entries only)); remove unused `exportPdf`/`exportExcel` keys
- [x] 4.2 Replace the two buttons in `StatsPage.tsx` with an `ExportMenu` (Popover, `role="menu"`, grouped `menuitem`s from `EXPORT_GROUPS`, arrow-key navigation, focus returns to trigger on close)
- [x] 4.3 Widen `exporting` state to `ExportFormat | null`; `runExport(format)` uses `loadWriter`; trigger shows spinner and is disabled while exporting or when no entries match; errors still toast `stats.exportFailed`
- [x] 4.4 Style the menu (group headings, item hover/focus) reusing `picker-pop`; check mobile width and dark mode

## 5. Verification

- [x] 5.1 Run `npm test`, lint and typecheck; build and confirm pdf, xlsx, ods and csv writers are separate lazy chunks not loaded on stats page open
- [x] 5.2 Manually export all four formats in German and English and check filenames and contents against the spec scenarios
- [x] 5.3 Update README export section to list the formats
