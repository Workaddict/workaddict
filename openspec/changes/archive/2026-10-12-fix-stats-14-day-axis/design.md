## Context

`HoursBarChart` (`src/features/stats/Charts.tsx`) renders a Recharts `BarChart` with `XAxis interval="preserveStartEnd"`. Labels are `EEE d` ("Mon 5") for ≤14 daily buckets and `d.M.` otherwise. Recharts measures the label widths and drops any that would collide, keeping the first and last. Which labels it drops depends on the width and can't be predicted. On a phone with "Last 14 days" this means the labels for some days, such as 5 Oct, disappear even though their bars are there. `presetRange('lastTwoWeeks')` and data loading were checked and are correct.

## Goals / Non-Goals

**Goals:**
- Every daily bar is labeled for ranges up to 14 days, from 320 px upward.
- Thinning is predictable (regular step from the first bar) where it's unavoidable.

**Non-Goals:**
- Changing range presets, granularity thresholds, or chart type.
- Making the chart horizontally scrollable.

## Decisions

1. **Measure the chart width and pick the label format and step ourselves.** We stop leaving it to Recharts' `preserveStartEnd`. The chart already sits in a `ResponsiveContainer`, and its `onResize` (or a small `ResizeObserver` hook on the wrapper) gives the width. From `width / buckets.length` we get the room each label has:
   - Room for "Mon 5" (≈ 40 px at 12 px font): `EEE d`.
   - Less room: day of month only (`d`), with the weekday initial as a second, smaller line (`EEEEE`) if there is at least ≈ 18 px. Implement this with a custom `tick` component that renders two `<tspan>`s.
   - Even that doesn't fit (more than 14 buckets on a phone): thin to every `step`-th bar, where `step = ceil(neededPx / pxPerBar)`.
   - As implemented: `XAxis interval={0}` renders every tick, and the custom tick decides itself whether to draw a label (`isLabeledBar`: index 0, step, 2·step, … and the last bar; a regular label too close to the last one is skipped). On a thinned axis the last label ends at the plot edge (`textAnchor="end"`) so it isn't clipped.
   - As implemented: the space a long label needs is estimated from the longest label's character count (≈ 6.2 px per character at 12 px plus a 4 px gap) instead of one fixed number. Measured in Chrome: "Wed 30" is 40 px and "Mi. 30" 33 px, so 14 days on a desktop chart card (~42 px per bar) keep their long labels.
   - Alternative considered: rotating labels −45°. That costs vertical space, still overlaps at 14 bars on 320 px with "Mon 5", and reads poorly. Rejected.
   - Alternative considered: `interval={0}` with a smaller font. 14 × "Mon 5" at 10 px still doesn't fit 300 px. Rejected.
2. **Put the width → step logic in pure functions** (`axisLabelPlan(plotWidth, count, granularity, labelChars) → { format: 'long' | 'short', step }` and `isLabeledBar`) in `stats.ts`, so they can be unit-tested without rendering Recharts.
3. **The tooltip stays as it is** (`title` already holds the full date via `labelFormatter`).

## Risks / Trade-offs

- [Pixel thresholds depend on font and locale (e.g. German "Mo. 5")] → Base the thresholds on the longest label in the locale (`EEE` of a Wednesday plus "30"), with a margin. Check in German at 320 px.
- [The custom tick also changes weekly/monthly labels] → Use the same plan function, but leave weekly and monthly formats as they are. Only `step` applies to them.
- [`ResizeObserver` in tests (jsdom)] → The pure function is unit-tested. The component falls back to the long format when the width is unknown.
