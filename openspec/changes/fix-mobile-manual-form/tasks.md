## 1. Native date and time fields

- [x] 1.1 In `global.css`, normalize `.input[type='date']` and `.input[type='time']`: `appearance: none`, `min-width: 0`, the same height and line-height as `.input`, left-aligned text including `::-webkit-date-and-time-value`
- [x] 1.2 Check that the existing no-zoom rule (font-size ≥ 16px on phones) still applies to these fields
- [x] 1.3 Check that the entry list inline time and date inputs (`.inline-input`) and the edit modal look unchanged on desktop

## 2. Time grid

- [x] 2.1 Replace `.manual-grid` auto-fit with an explicit layout: 2 columns with the date spanning the full row on phones, 3 columns (date, start, end/duration) from the phone breakpoint up; `align-items: start`
- [x] 2.2 Mark the date cell in `EntryFields.tsx` (`TimeInputs`) and in the `TeamNow.tsx` stop dialog (class `field-date` or similar)

## 3. Footer

- [x] 3.1 Add a `.manual-actions` class (wrapping flex row, right-aligned) and use it for the footer in `ManualEntryView` instead of the inline-styled `.row`
- [x] 3.2 On phones: the picker label row (label + growing control with `min-width: 0` and ellipsis) and the submit button each take the full width; the running-timer hint wraps on its own line
- [x] 3.3 Remove `marginRight: 'auto'` from `MemberPicker` if the new footer handles alignment

## 4. Verification

- [x] 4.1 Check in browser device mode at 320 px and 375 px, English and German, as editor (with picker) and worker (without): no overflow, Date full width, Start/End side by side, footer stacked (emulated in Chrome: German, editor, form card forced to 347 px with the ≤560 px rules applied; the Chrome window couldn't be resized, so 320 px, English and worker still need a real device-mode check)
- [x] 4.2 Check on desktop (≥ 1024 px): Date, Start, End in one row, footer right-aligned in one row
- [ ] 4.3 Check on a real iPhone (Safari): the date field doesn't overlap and its height matches the time fields; the stop dialog in the team view looks right as well
- [x] 4.4 `npm run lint`, `npm test`, `npm run build`
