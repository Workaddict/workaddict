import {
  addDays,
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
  subMonths,
  subWeeks,
} from 'date-fns'
import { durationMs } from '../../domain/time'
import type { DateRange, TimeEntry, Workspace } from '../../domain/types'

export const NO_PROJECT = '__none__'
export const NO_TAG = '__none__'
const WEEK = { weekStartsOn: 1 } as const

// ---- ranges ------------------------------------------------------------------

export type RangePreset = 'today' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear'
export const RANGE_PRESETS: RangePreset[] = [
  'today',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'thisYear',
]

/** Local-time range for a preset; weeks start on Monday. */
export function presetRange(preset: RangePreset, now = new Date()): DateRange {
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'thisWeek':
      return { from: startOfWeek(now, WEEK), to: endOfWeek(now, WEEK) }
    case 'lastWeek': {
      const d = subWeeks(now, 1)
      return { from: startOfWeek(d, WEEK), to: endOfWeek(d, WEEK) }
    }
    case 'thisMonth':
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'lastMonth': {
      const d = subMonths(now, 1)
      return { from: startOfMonth(d), to: endOfMonth(d) }
    }
    case 'thisYear':
      return { from: startOfYear(now), to: endOfYear(now) }
  }
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

export type Granularity = 'day' | 'week'

/** Daily bars up to 62 days, weekly bars beyond. */
export function granularityFor(range: DateRange): Granularity {
  return differenceInCalendarDays(range.to, range.from) + 1 > 62 ? 'week' : 'day'
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
  const bucketStart = (d: Date) => (granularity === 'day' ? startOfDay(d) : startOfWeek(d, WEEK))
  const step = (d: Date) => (granularity === 'day' ? addDays(d, 1) : addWeeks(d, 1))
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
