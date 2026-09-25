## 1. Shared model

- [x] 1.1 Add `timeFormat: TimeFormat` to `Report` and `buildReport`; pass `getTimeFormat()` from `StatsPage`
- [x] 1.2 Add a date-pattern helper that tokenizes `locale.formatLong.date({ width: 'short' })` into day/month/year/literal parts, with unit tests for `de` (`dd.MM.y`) and `enUS` (`MM/dd/yyyy`)
- [x] 1.3 Add optional `title` and `header: false` to `Sheet`; make the summary sheet use them: title `"<reportTitle> <from> – <to>"`, no header row, the range row removed, value column width fitted to the values (about 20)
- [x] 1.4 Check `csv.ts` still reads only the entries sheet and keeps ISO dates and `HH:mm`; the existing CSV tests pass unchanged

## 2. OpenDocument writer

- [x] 2.1 Build `N_date`, `N_time`, and `N_datetime` from the date parts and the time format (24h: `hh:mm`; 12h: `h:mm` + `number:am-pm`)
- [x] 2.2 Render the `title` row with a bold cell style (no fill), and skip `table:table-header-rows` when `header` is false
- [x] 2.3 Add a left-aligned variant of the number/hours/datetime cell styles (`fo:text-align="start"`, `style:text-align-source="fix"`) and use it on the summary sheet
- [x] 2.4 Tests: summary has a title row and no header row; `N_date` for `de` is day-dot-month-dot-year and for `enUS` month/day/year; 12h time style contains `number:am-pm`; the entries sheet is unchanged

## 3. Excel writer

- [x] 3.1 Mirror the summary layout in `xlsx.ts`: bold title row in A1, no header row, label/value rows, value column fitted, left-aligned, no `wrapText`
- [x] 3.2 Use number formats from the date parts and the time format for the entries date/start/end columns and the "generated" datetime
- [x] 3.3 Tests (or extend the existing ones): summary A1 holds the title, no "Name"/"Value" header, entries date `numFmt` is `dd.mm.yyyy` for `de` and `mm/dd/yyyy` for `enUS`, time `h:mm AM/PM` for 12h

## 4. Verify

- [x] 4.1 `npm test`, `npm run lint`, `npm run build` pass
- [ ] 4.2 (not done; left to the team using the app, on the user's request 2026-09-25) Manual check in Excel (German, 24h): the `.ods` opens without a repair prompt; summary shows the title, values next to their labels, `05.01.2026` and `16:20` in the entries; the hours column sums to the stats total. Then the same for the `.xlsx`
- [ ] 4.3 (not done; left to the team using the app, on the user's request 2026-09-25) Manual check with the app in English and 12h: dates `01/05/2026`, times like `4:20 PM`, in both `.ods` and `.xlsx`
- [ ] 4.4 (not done; left to the team using the app, on the user's request 2026-09-25) After 4.2 passes, tick task 3.5 of `openspec/changes/archive/2026-09-22-multi-format-export/tasks.md` with the note "Excel only; LibreOffice not installed"
