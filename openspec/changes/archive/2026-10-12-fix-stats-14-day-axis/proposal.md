## Why

On a phone, "Last 14 days" looks like it skips days: on 2026-10-12 the bar chart had no "Mon 5" label, so the user read it as 2026-10-05 being missing from the range. The range and data are correct (29 Sep – 12 Oct). The cause is the bar chart's x-axis, which has `interval="preserveStartEnd"`: Recharts silently hides tick labels that don't fit, and 14 labels such as "Mon 5" don't fit on a ~320 px wide chart. The axis must make it obvious which bar is which day.

## What Changes

- Daily bar charts show a label for every bar for ranges up to 14 days, at every supported width (from 320 px).
- On narrow charts the daily labels get shorter (day of month only, e.g. "5", with the weekday initial on a second line where it fits) instead of being hidden.
- For longer daily ranges (15–62 days), labels may be thinned, but at a regular step aligned to the first day (e.g. every 2nd or 7th day), never at random. The bar under the cursor or finger still shows its full date in the tooltip.
- No change to range calculation, data loading, or the weekly/monthly granularity.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `statistics`: the "Charts" requirement gains rules for x-axis labels (every day labeled up to 14 days, regular thinning beyond).

## Impact

- `src/features/stats/Charts.tsx` (`HoursBarChart`: label format, `interval`, tick rendering based on width)
- Possibly a small helper in `src/features/stats/stats.ts` for the label step, with unit tests
- No storage, API, or data changes
