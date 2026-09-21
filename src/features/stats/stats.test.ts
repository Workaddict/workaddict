import type { TimeEntry, Workspace } from '../../domain/types'
import {
  byMember,
  byProject,
  byTag,
  filterEntries,
  granularityFor,
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
