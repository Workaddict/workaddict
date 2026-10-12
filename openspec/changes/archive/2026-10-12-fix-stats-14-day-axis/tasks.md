## 1. Label plan

- [x] 1.1 Add a pure `axisLabelPlan(widthPx, bucketCount, granularity)` returning the label format (`long` "EEE d" / `short` day + weekday initial / `day` "d" / unchanged for week and month) and the thinning step
- [x] 1.2 Unit tests: 14 daily buckets at 300 px → every bar labeled (step 1, short format); 7 buckets at 900 px → long format; 31 buckets at 330 px → step > 1, first and last labeled; unknown width → long format, step 1

## 2. Chart

- [x] 2.1 Measure the chart width in `HoursBarChart` (ResponsiveContainer `onResize` or a ResizeObserver on the wrapper)
- [x] 2.2 Replace `interval="preserveStartEnd"` with `interval={0}` and a custom `tick` that skips unplanned labels, that renders the planned format (two lines for `short`) and always labels the last bar
- [x] 2.3 Keep the full-date tooltip for every bar

## 3. Verification

- [x] 3.1 Component test: "Last 14 days" with a mocked 320 px width renders 14 tick labels including the one for 5 Oct 2026
- [x] 3.2 Check by hand in the browser at 320 px, 375 px, and desktop, in English and German: "Last 14 days", "This week", "This month", "This year" (done in Chrome, German, desktop plus the chart card forced to 320 px phone width; a real iPhone check is still open)
- [x] 3.3 `npm run lint`, `npm test`, `npm run build`
