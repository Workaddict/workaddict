## Why

On an iPhone (Safari, ~375 px), the manual entry form is broken (screenshot from 2026-10-12):
- The date field is wider than its grid cell and runs under the Start field. It is also taller than the other fields and centers its text, so the "Date" and "Start" labels sit at different heights.
- End wraps alone into a second row at half width.
- The "For" picker and the "Add entry" button share one row that doesn't wrap, so the member name is cut off ("BenediktLehner (m").

This breaks the existing "Responsive clean design" requirement (usable from 320 px, no overflow).

## What Changes

- Native date and time fields get the same height, text alignment, and shrinking behavior as text fields on all browsers, including iOS Safari. A field never overflows its cell.
- On phones the time grid is laid out on purpose: Date takes the full width on its own row, and Start and End (or Duration) sit side by side underneath. On wider screens Date, Start, and End stay in one row.
- Field labels in one row line up at the same height.
- On phones the form footer stacks: the member picker (if shown) takes the full width, and the submit button takes the full width below it. The running-timer hint and button also wrap instead of overflowing.
- The same grid fix applies to the "Stop timer" dialog in the team live view, which uses the same grid.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `app-shell`: "Responsive clean design" gains scenarios for form fields (native date/time fields don't overflow, and the manual entry form layout on phones).

## Impact

- `src/styles/global.css` (`.input` for date and time types, `.manual-grid`, new footer class for the manual form)
- `src/features/tracker/EntryFields.tsx` (grid markup or class for the date cell)
- `src/features/tracker/TimerBar.tsx` (footer row class)
- `src/features/tracker/TeamNow.tsx` (stop dialog uses the same grid)
- Interacts with `add-bulk-manual-entries`, which replaces the picker inside the footer. The footer layout defined here applies to both.
