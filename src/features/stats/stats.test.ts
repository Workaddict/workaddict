import type { TimeEntry, Workspace } from '../../domain/types'
import { setDeviceZone } from '../../timeZone'
import {
  allTimeRange,
  axisLabelPlan,
  byMember,
  byProject,
  byTag,
  filterEntries,
  granularityFor,
  isLabeledBar,
  NO_FILTERS,
  NO_PROJECT,
  NO_TAG,
  presetRange,
  summarize,
  timeBuckets,
} from './stats'

const H = 3_600_000
const ws: Workspace = {
  projects: [
    { id: 'web', name: 'Website', color: '#00f', archived: false },
    { id: 'app', name: 'App', color: '#0f0', archived: true },
  ],
  tags: [
    { id: 'meet', name: 'meeting', archived: false },
    { id: 'client', name: 'client', archived: false },
  ],
}

let n = 0
function e(login: string, day: number, hours: number, projectId: string | null, tagIds: string[] = []): TimeEntry {
  const start = new Date(2026, 8, day, 9, 0)
  return {
    id: String(++n),
    login,
    start: start.toISOString(),
    end: new Date(start.getTime() + hours * H).toISOString(),
    description: '',
    projectId,
    tagIds,
    createdAt: '',
    updatedAt: '',
  }
}

const entries = [
  e('alice', 1, 6, 'web', ['meet', 'client']),
  e('alice', 2, 2, 'app'),
  e('bob', 2, 1, null, ['meet']),
  e('bob', 3, 1, 'deleted-project', ['deleted-tag']),
]

describe('presetRange', () => {
  const now = new Date(2026, 8, 21, 15, 0) // Monday 2026-09-21
  it('last month covers the whole previous month', () => {
    const r = presetRange('lastMonth', now)
    expect(r.from).toEqual(new Date(2026, 7, 1))
    expect(r.to.getDate()).toBe(31)
    expect(r.to.getMonth()).toBe(7)
  })
  it('weeks start on Monday', () => {
    const r = presetRange('thisWeek', new Date(2026, 8, 23))
    expect(r.from).toEqual(new Date(2026, 8, 21))
    expect(presetRange('lastWeek', now).from).toEqual(new Date(2026, 8, 14))
  })
  it('last 14 days covers today and the 14 days before it', () => {
    const monday = new Date(2026, 9, 5, 10, 0) // Monday 2026-10-05
    const r = presetRange('lastTwoWeeks', monday)
    expect(r.from).toEqual(new Date(2026, 8, 21)) // Monday two weeks ago
    expect(r.to).toEqual(new Date(2026, 9, 5, 23, 59, 59, 999))
    // "Last week" stays a calendar week.
    expect(presetRange('lastWeek', monday)).toEqual({
      from: new Date(2026, 8, 28),
      to: new Date(2026, 9, 4, 23, 59, 59, 999),
    })
  })
  it('last 14 days spans 15 calendar days across the DST change', () => {
    setDeviceZone('Europe/Vienna')
    try {
      // Monday 2 November 2026, 10:00 in Vienna; DST ended on 25 October.
      const r = presetRange('lastTwoWeeks', new Date('2026-11-02T09:00:00Z'))
      expect(r.from).toEqual(new Date('2026-10-18T22:00:00Z')) // 19 October 00:00 CEST
      expect(r.to).toEqual(new Date('2026-11-02T22:59:59.999Z')) // 2 November 23:59:59.999 CET
    } finally {
      setDeviceZone(null)
    }
  })
})

describe('allTimeRange', () => {
  const now = new Date(2026, 9, 5, 10, 0)
  it('starts on the day of the earliest entry and ends today', () => {
    const r = allTimeRange(entries, now)
    expect(r.from).toEqual(new Date(2026, 8, 1))
    expect(r.to).toEqual(new Date(2026, 9, 5, 23, 59, 59, 999))
  })
  it('covers only today without entries', () => {
    const r = allTimeRange([], now)
    expect(r.from).toEqual(new Date(2026, 9, 5))
    expect(r.to).toEqual(new Date(2026, 9, 5, 23, 59, 59, 999))
  })
})

describe('filterEntries', () => {
  it('returns everything without filters', () => {
    expect(filterEntries(entries, NO_FILTERS, ws)).toHaveLength(4)
  })
  it('filters by member and project', () => {
    const r = filterEntries(entries, { members: ['alice'], projects: ['web'], tags: null }, ws)
    expect(r.map((x) => x.id)).toEqual([entries[0]!.id])
  })
  it('treats missing and deleted projects as "no project"', () => {
    const r = filterEntries(entries, { ...NO_FILTERS, projects: [NO_PROJECT] }, ws)
    expect(r.map((x) => x.login)).toEqual(['bob', 'bob'])
  })
  it('filters by any selected tag, including "no tag"', () => {
    expect(filterEntries(entries, { ...NO_FILTERS, tags: ['meet'] }, ws)).toHaveLength(2)
    expect(filterEntries(entries, { ...NO_FILTERS, tags: [NO_TAG] }, ws)).toHaveLength(2)
  })
})

describe('summaries and breakdowns', () => {
  it('summarizes totals and average per tracked day', () => {
    const s = summarize(entries)
    expect(s.totalMs).toBe(10 * H)
    expect(s.count).toBe(4)
    expect(s.trackedDays).toBe(3)
    expect(s.avgPerDayMs).toBeCloseTo((10 * H) / 3)
  })

  it('breaks down by project with shares (archived still included)', () => {
    const rows = byProject(entries, ws, 'No project')
    expect(rows.map((r) => [r.label, r.ms / H, r.share])).toEqual([
      ['Website', 6, 0.6],
      ['App', 2, 0.2],
      ['No project', 2, 0.2],
    ])
  })

  it('breaks down by member', () => {
    expect(byMember(entries).map((r) => [r.key, r.ms / H])).toEqual([
      ['alice', 8],
      ['bob', 2],
    ])
  })

  it('credits every tag of a multi-tag entry fully', () => {
    const rows = byTag(entries, ws, 'No tag')
    expect(Object.fromEntries(rows.map((r) => [r.label, r.ms / H]))).toEqual({
      meeting: 7,
      client: 6,
      'No tag': 3,
    })
  })
})

describe('time buckets', () => {
  it('uses days up to 62 days and weeks beyond', () => {
    expect(granularityFor({ from: new Date(2026, 0, 1), to: new Date(2026, 2, 3) })).toBe('day')
    expect(granularityFor({ from: new Date(2026, 0, 1), to: new Date(2026, 2, 4) })).toBe('week')
  })

  it('uses weeks up to 366 days and months beyond', () => {
    expect(granularityFor({ from: new Date(2024, 0, 1), to: new Date(2024, 11, 31) })).toBe('week') // leap year
    expect(granularityFor({ from: new Date(2025, 0, 1), to: new Date(2026, 0, 2) })).toBe('month')
  })

  it('groups monthly buckets across a year boundary', () => {
    const range = { from: new Date(2025, 10, 15), to: new Date(2026, 8, 30, 23, 59) }
    const b = timeBuckets(entries, range, ws, 'month')
    expect(b).toHaveLength(11) // Nov 2025 .. Sep 2026
    expect(b[0]!.start).toEqual(new Date(2025, 10, 1))
    expect(b[2]!.start).toEqual(new Date(2026, 0, 1))
    expect(b[10]!.totalMs).toBe(10 * H)
  })

  it('creates one bucket per day including empty days, stacked by project', () => {
    const range = { from: new Date(2026, 8, 1), to: new Date(2026, 8, 7, 23, 59) }
    const b = timeBuckets(entries, range, ws)
    expect(b).toHaveLength(7)
    expect(b[0]!.byProject).toEqual({ web: 6 * H })
    expect(b[1]!.byProject).toEqual({ app: 2 * H, [NO_PROJECT]: H })
    expect(b[6]!.totalMs).toBe(0)
  })

  it('groups weekly buckets starting on Monday', () => {
    const range = { from: new Date(2026, 0, 1), to: new Date(2026, 11, 31) }
    const b = timeBuckets(entries, range, ws)
    expect(b[0]!.start.getDay()).toBe(1)
    const week = b.find((x) => x.totalMs > 0)!
    expect(week.totalMs).toBe(10 * H) // Sep 1-3 2026 fall in the same week
  })
})

describe('axis labels', () => {
  const labeled = (count: number, step: number) =>
    Array.from({ length: count }, (_, i) => i).filter((i) => isLabeledBar(i, count, step))

  it('labels all 15 days of "Last 14 days" on a phone, shortened', () => {
    const plan = axisLabelPlan(300, 15, 'day', 6)
    expect(plan).toEqual({ format: 'short', step: 1 })
    expect(labeled(15, plan.step)).toHaveLength(15)
  })

  it('keeps every day labeled even on the narrowest chart', () => {
    expect(axisLabelPlan(180, 15, 'day', 6)).toEqual({ format: 'short', step: 1 })
  })

  it('uses long labels when they fit', () => {
    expect(axisLabelPlan(900, 7, 'day', 6)).toEqual({ format: 'long', step: 1 })
    expect(axisLabelPlan(700, 14, 'day', 6)).toEqual({ format: 'long', step: 1 })
    // 14 days on a desktop chart card: ~42 px per bar fits "Wed 30".
    expect(axisLabelPlan(595, 14, 'day', 6)).toEqual({ format: 'long', step: 1 })
  })

  it('thins a month on a phone at a regular step, keeping the first and last day', () => {
    const plan = axisLabelPlan(330, 31, 'day', 6)
    expect(plan.format).toBe('long')
    expect(plan.step).toBeGreaterThan(1)
    const shown = labeled(31, plan.step)
    expect(shown[0]).toBe(0)
    expect(shown.at(-1)).toBe(30)
    for (let i = 1; i < shown.length; i++) expect(shown[i]! - shown[i - 1]!).toBeGreaterThanOrEqual(plan.step)
  })

  it('drops the regular label that would crowd the last one', () => {
    expect(labeled(30, 3)).toEqual([0, 3, 6, 9, 12, 15, 18, 21, 24, 29])
  })

  it('thins weeks instead of shortening them', () => {
    expect(axisLabelPlan(250, 53, 'week', 7).format).toBe('long')
    expect(axisLabelPlan(250, 53, 'week', 7).step).toBeGreaterThan(1)
  })

  it('labels everything while the width is unknown', () => {
    expect(axisLabelPlan(null, 31, 'day', 6)).toEqual({ format: 'long', step: 1 })
    expect(axisLabelPlan(0, 14, 'day', 6)).toEqual({ format: 'long', step: 1 })
  })
})
