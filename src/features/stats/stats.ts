import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from '../../domain/zoned'
import { durationMs } from '../../domain/time'
import type { DateRange, TimeEntry, Workspace } from '../../domain/types'

export const NO_PROJECT = '__none__'
export const NO_TAG = '__none__'

// ---- ranges ------------------------------------------------------------------

export type RangePreset =
  | 'today'
  | 'thisWeek'
  | 'lastWeek'
  | 'lastTwoWeeks'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'allTime'
export const RANGE_PRESETS: RangePreset[] = [
  'today',
  'thisWeek',
  'lastWeek',
  'lastTwoWeeks',
  'thisMonth',
  'lastMonth',
  'thisYear',
  'allTime',
]

/** Presets whose range depends only on the date; 'allTime' depends on the entries (see allTimeRange). */
export type DatePreset = Exclude<RangePreset, 'allTime'>

/** Range for a preset in the effective time zone; weeks start on Monday. */
export function presetRange(preset: DatePreset, now = new Date()): DateRange {
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'thisWeek':
      return { from: startOfWeek(now), to: endOfWeek(now) }
    case 'lastWeek': {
      const d = addWeeks(now, -1)
      return { from: startOfWeek(d), to: endOfWeek(d) }
    }
    // Labeled "Last 14 days": the 14 days ending today. The key stays so remembered filters keep working.
    case 'lastTwoWeeks':
      return { from: startOfDay(addDays(now, -13)), to: endOfDay(now) }
    case 'thisMonth':
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'lastMonth': {
      const d = addMonths(now, -1)
      return { from: startOfMonth(d), to: endOfMonth(d) }
    }
    case 'thisYear':
      return { from: startOfYear(now), to: endOfYear(now) }
  }
}

/** From the day of the earliest entry through the end of today; just today without entries. */
export function allTimeRange(entries: TimeEntry[], now = new Date()): DateRange {
  let first = now.getTime()
  for (const e of entries) first = Math.min(first, new Date(e.start).getTime())
  return { from: startOfDay(first), to: endOfDay(now) }
}

// ---- filtering ---------------------------------------------------------------

/** null = everything selected (no filtering on that dimension). */
export interface StatsFilters {
  members: string[] | null
  projects: string[] | null
  tags: string[] | null
}
export const NO_FILTERS: StatsFilters = { members: null, projects: null, tags: null }

/** Project key for grouping; deleted projects count as "no project". */
export function projectKey(e: TimeEntry, projectIds: Set<string>): string {
  return e.projectId && projectIds.has(e.projectId) ? e.projectId : NO_PROJECT
}

/** Tag keys of an entry, ignoring deleted tags; untagged entries get NO_TAG. */
export function tagKeys(e: TimeEntry, tagIds: Set<string>): string[] {
  const keys = e.tagIds.filter((id) => tagIds.has(id))
  return keys.length ? keys : [NO_TAG]
}

export function filterEntries(entries: TimeEntry[], f: StatsFilters, ws: Workspace): TimeEntry[] {
  const projectIds = new Set(ws.projects.map((p) => p.id))
  const tagIds = new Set(ws.tags.map((t) => t.id))
  return entries.filter(
    (e) =>
      (f.members === null || f.members.includes(e.login)) &&
      (f.projects === null || f.projects.includes(projectKey(e, projectIds))) &&
      (f.tags === null || tagKeys(e, tagIds).some((k) => f.tags!.includes(k))),
  )
}

// ---- summary -----------------------------------------------------------------

export interface Summary {
  totalMs: number
  count: number
  trackedDays: number
  avgPerDayMs: number
}

export function summarize(entries: TimeEntry[]): Summary {
  let totalMs = 0
  const days = new Set<number>()
  for (const e of entries) {
    totalMs += durationMs(e.start, e.end)
    days.add(startOfDay(new Date(e.start)).getTime())
  }
  return {
    totalMs,
    count: entries.length,
    trackedDays: days.size,
    avgPerDayMs: days.size ? totalMs / days.size : 0,
  }
}

// ---- breakdowns --------------------------------------------------------------

export interface BreakdownRow {
  key: string
  label: string
  color?: string
  ms: number
  /** Share of the overall total, 0..1. */
  share: number
}

function breakdown(
  entries: TimeEntry[],
  keysOf: (e: TimeEntry) => string[],
  describe: (key: string) => { label: string; color?: string },
): BreakdownRow[] {
  const total = entries.reduce((s, e) => s + durationMs(e.start, e.end), 0)
  const sums = new Map<string, number>()
  for (const e of entries) {
    const ms = durationMs(e.start, e.end)
    for (const k of keysOf(e)) sums.set(k, (sums.get(k) ?? 0) + ms)
  }
  return [...sums]
    .map(([key, ms]) => ({ key, ms, share: total ? ms / total : 0, ...describe(key) }))
    .sort((a, b) => b.ms - a.ms || a.label.localeCompare(b.label))
}

export const NO_PROJECT_COLOR = '#9ca3af'

export function byProject(entries: TimeEntry[], ws: Workspace, noProjectLabel: string) {
  const projects = new Map(ws.projects.map((p) => [p.id, p]))
  const ids = new Set(projects.keys())
  return breakdown(
    entries,
    (e) => [projectKey(e, ids)],
    (k) => {
      const p = projects.get(k)
      return p ? { label: p.name, color: p.color } : { label: noProjectLabel, color: NO_PROJECT_COLOR }
    },
  )
}

export function byMember(entries: TimeEntry[]) {
  return breakdown(
    entries,
    (e) => [e.login],
    (k) => ({ label: k }),
  )
}

/** Each tag is credited the full duration of every entry carrying it. */
export function byTag(entries: TimeEntry[], ws: Workspace, noTagLabel: string) {
  const tags = new Map(ws.tags.map((t) => [t.id, t]))
  const ids = new Set(tags.keys())
  return breakdown(
    entries,
    (e) => tagKeys(e, ids),
    (k) => ({ label: tags.get(k)?.name ?? noTagLabel }),
  )
}

// ---- time buckets ------------------------------------------------------------

export type Granularity = 'day' | 'week' | 'month'

/** Daily bars up to 62 days, weekly bars up to 366 days, monthly bars beyond. */
export function granularityFor(range: DateRange): Granularity {
  const days = differenceInCalendarDays(range.to, range.from) + 1
  return days > 366 ? 'month' : days > 62 ? 'week' : 'day'
}

/**
 * How the bar chart labels its x-axis: `long` is the regular label ("Mon 5", "5.10.", "5 Oct"),
 * `short` the day of the month with the weekday initial below it. `step` labels every n-th bar.
 */
export interface AxisLabelPlan {
  format: 'long' | 'short'
  step: number
}

/** Approximate width of one label character at the 12 px axis font, and the gap between labels. */
const LABEL_CHAR_PX = 6.2
const LABEL_GAP_PX = 4

/**
 * Picks the axis labels for a plot area `plotWidth` px wide whose longest regular label has
 * `labelChars` characters. Up to 14 daily bars every bar is labeled, shortened where long labels
 * don't fit; longer ranges are thinned at a regular step instead. An unknown width (not measured
 * yet) keeps every long label.
 */
export function axisLabelPlan(
  plotWidth: number | null,
  count: number,
  granularity: Granularity,
  labelChars: number,
): AxisLabelPlan {
  if (!plotWidth || plotWidth <= 0 || count <= 0) return { format: 'long', step: 1 }
  const perBar = plotWidth / count
  const needed = labelChars * LABEL_CHAR_PX + LABEL_GAP_PX
  if (perBar >= needed) return { format: 'long', step: 1 }
  if (granularity === 'day' && count <= 14) return { format: 'short', step: 1 }
  return { format: 'long', step: Math.ceil(needed / perBar) }
}

/** Whether bar `index` of `count` gets a label: every `step`-th from the first, and the last. */
export function isLabeledBar(index: number, count: number, step: number): boolean {
  const last = count - 1
  if (index === last) return true
  // Skip a regular label that would crowd the last one.
  return index % step === 0 && last - index >= step
}

export interface Bucket {
  start: Date
  totalMs: number
  /** Milliseconds per project key. */
  byProject: Record<string, number>
}

export function timeBuckets(
  entries: TimeEntry[],
  range: DateRange,
  ws: Workspace,
  granularity: Granularity = granularityFor(range),
): Bucket[] {
  const bucketStart = { day: startOfDay, week: startOfWeek, month: startOfMonth }[granularity]
  const step = (d: Date) =>
    granularity === 'day' ? addDays(d, 1) : granularity === 'week' ? addWeeks(d, 1) : addMonths(d, 1)
  const buckets = new Map<number, Bucket>()
  for (let d = bucketStart(range.from); d <= range.to; d = step(d)) {
    buckets.set(d.getTime(), { start: d, totalMs: 0, byProject: {} })
  }
  const ids = new Set(ws.projects.map((p) => p.id))
  for (const e of entries) {
    const b = buckets.get(bucketStart(new Date(e.start)).getTime())
    if (!b) continue
    const ms = durationMs(e.start, e.end)
    const k = projectKey(e, ids)
    b.totalMs += ms
    b.byProject[k] = (b.byProject[k] ?? 0) + ms
  }
  return [...buckets.values()]
}
