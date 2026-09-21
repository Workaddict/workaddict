import { describe, expect, it } from 'vitest'
import { buildTeamRows, isRunningTooLong, suggestedStopEnd } from './teamNow'
import type { RunningTimer, TimeEntry } from './types'

const H = 3_600_000
const M = 60_000

/** Local time on 2026-09-21. */
const at = (h: number, m = 0, day = 21) => new Date(2026, 8, day, h, m)

function timer(login: string, start: Date): RunningTimer {
  return {
    id: `t-${login}`,
    login,
    start: start.toISOString(),
    description: 'Work',
    projectId: null,
    tagIds: [],
  }
}

function entry(login: string, start: Date, end: Date): TimeEntry {
  const iso = start.toISOString()
  return {
    id: `e-${login}-${iso}`,
    login,
    start: iso,
    end: end.toISOString(),
    description: 'Done',
    projectId: null,
    tagIds: [],
    createdAt: iso,
    updatedAt: iso,
  }
}

const members = ['alice', 'bob', 'carol', 'dave', 'erin', 'frank'].map((login) => ({
  login,
  avatarUrl: null,
}))

describe('isRunningTooLong', () => {
  it('flags timers longer than 10 hours', () => {
    expect(isRunningTooLong(at(1), at(11, 1))).toBe(true)
    expect(isRunningTooLong(at(8), at(12))).toBe(false)
  })

  it('flags timers started before today', () => {
    expect(isRunningTooLong(at(23, 30, 20), at(0, 15))).toBe(true)
  })
})

describe('suggestedStopEnd', () => {
  it('suggests now for a normal timer', () => {
    expect(suggestedStopEnd(at(9), at(10, 30))).toEqual(at(10, 30))
  })

  it('suggests start + 8h for a forgotten timer', () => {
    expect(suggestedStopEnd(at(9, 0, 20), at(7))).toEqual(at(17, 0, 20))
  })

  it('never suggests an end in the future', () => {
    expect(suggestedStopEnd(at(23, 30, 20), at(0, 15))).toEqual(at(0, 15))
  })
})

describe('buildTeamRows', () => {
  const now = at(12)

  it('excludes the current user and orders running first, then by login', () => {
    const rows = buildTeamRows({
      members,
      timers: [timer('bob', at(11, 18)), timer('carol', at(8, 45)), timer('alice', at(9))],
      entries: [],
      me: 'alice',
      now,
    })
    expect(rows.map((r) => r.member.login)).toEqual(['carol', 'bob', 'dave', 'erin', 'frank'])
  })

  it('sums entries starting today plus the running timer', () => {
    const rows = buildTeamRows({
      members,
      timers: [timer('bob', at(11, 18))],
      entries: [
        entry('bob', at(6), at(10, 28)),
        entry('bob', at(9, 0, 20), at(17, 0, 20)), // yesterday, ignored
      ],
      me: 'alice',
      now,
    })
    const bob = rows.find((r) => r.member.login === 'bob')!
    expect(bob.elapsedMs).toBe(42 * M)
    expect(bob.todayMs).toBe(4 * H + 28 * M + 42 * M)
  })

  it('reports the latest end today for idle members', () => {
    const rows = buildTeamRows({
      members,
      timers: [],
      entries: [entry('erin', at(8), at(11)), entry('erin', at(12, 30), at(14))],
      me: 'alice',
      now: at(15),
    })
    const erin = rows.find((r) => r.member.login === 'erin')!
    expect(erin.todayMs).toBe(4 * H + 30 * M)
    expect(erin.lastEnd).toBe(at(14).toISOString())
    const frank = rows.find((r) => r.member.login === 'frank')!
    expect(frank.todayMs).toBe(0)
    expect(frank.lastEnd).toBeNull()
  })

  it('flags forgotten timers', () => {
    const rows = buildTeamRows({
      members,
      timers: [timer('dave', at(9, 0, 20))],
      entries: [],
      me: 'alice',
      now,
    })
    // Only the part since midnight counts toward today.
    expect(rows[0]).toMatchObject({ tooLong: true, todayMs: 12 * H })
  })

  it('lists members with a timer who are missing from the member list', () => {
    const rows = buildTeamRows({
      members: [],
      timers: [timer('zoe', at(11))],
      entries: [],
      me: 'alice',
      now,
    })
    expect(rows.map((r) => r.member.login)).toEqual(['zoe'])
  })
})
