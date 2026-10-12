## Context

- `.manual-grid` is `grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); align-items: end`. At ~315 px of content width that gives 2 columns, so the third field (End/Duration) wraps alone.
- iOS Safari draws `input[type=date|time]` with WebKit's own appearance. It has an intrinsic min-width (it ignores `min-width: 0` of the grid item unless the input itself shrinks), a larger height than `.input`'s `min-height: 38px`, and centered text through `::-webkit-date-and-time-value`. That explains the overlap and the label offset: with `align-items: end`, the taller date cell pushes its label up relative to Start.
- The footer is `<div className="row" style={{ justifyContent: 'flex-end' }}>`, which holds `MemberPicker` (label + `<select class="select">` with `width: 100%`) and the button. `.row` doesn't wrap, so the select gets squeezed.
- `TeamNow.tsx` (stop dialog) also uses `.manual-grid` with a date field.

## Goals / Non-Goals

**Goals:**
- No overflow, the same field height, and aligned labels for date and time fields on iOS Safari, Chrome Android, and desktop.
- A clear phone layout for the time grid and the footer.

**Non-Goals:**
- Replacing native date and time pickers with custom widgets.
- Redesigning the timer mode or other pages.
- The multi-member picker itself (`add-bulk-manual-entries`).

## Decisions

1. **Normalize native date and time inputs globally** in `global.css`:
   ```
   .input[type='date'], .input[type='time'] {
     -webkit-appearance: none; appearance: none;
     min-width: 0; height: 38px (match .input box);
     line-height: normal; text-align: left;
   }
   .input::-webkit-date-and-time-value { text-align: left; margin: 0; }
   ```
   Keep `font-size ≥ 16px` on phones (the existing no-zoom rule). This fixes every date and time field in the app (entry list inline edit, edit modal, stop dialog), not just the manual form.
   - Alternative considered: wrapping the date input in a div with `overflow: hidden`. That hides the symptom and still leaves the height mismatch. Rejected.
2. **Make the grid explicit instead of auto-fit:**
   - Default (phones): `grid-template-columns: 1fr 1fr`, with the date cell spanning `1 / -1` (class `.field-date` or `:first-child`).
   - `@media (min-width: 560px)`: `grid-template-columns: minmax(140px, 1.3fr) 1fr 1fr`, with no span, so it's one row.
   - `align-items: start` (labels in a row line up because each field's label sits on top and all inputs have the same height).
   - Alternative considered: keep auto-fit and tune minmax. That still depends on the content width and can't give "date full width, times paired". Rejected.
3. **Footer class `.manual-actions`:** `display:flex; flex-wrap:wrap; gap; justify-content:flex-end; align-items:center`. Under 560 px each child gets `flex: 1 1 100%`: the picker label is a row with the "For" text and the control growing (`flex:1; min-width:0`), and the button is full width. The running-timer hint wraps as its own line. `add-bulk-manual-entries` drops its popover button into the same slot.
4. **The breakpoint is 560 px,** in line with the existing phone breakpoints in `global.css`. Check what's there and reuse it rather than adding a new one.

## Risks / Trade-offs

- [`appearance: none` removes the iOS picker affordance (no visible chevron)] → Tapping still opens the native picker. If needed, add a calendar or clock icon as a background-image so the field still reads as a picker.
- [The global input change affects the inline time inputs in the entry list (`.inline-input`, fixed width 7.5em)] → Check the entry list on phone and desktop. `.inline-input` overrides min-height and padding and should keep doing that.
- [Simulators don't match real Safari exactly] → Check on a real iPhone through the deployed preview or on the local network (`vite --host`).
