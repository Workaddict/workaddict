import { startOfDay } from 'date-fns'
import { durationMs } from './time'
import type { Member, RunningTimer, TimeEntry } from './types'

const HOUR = 3_600_000
/** A timer running longer than this (or since before today) is probably forgotten. */
export const TOO_LONG_MS = 10 * HOUR
/** Suggested length of a forgotten timer when someone else stops it. */
export const SUGGESTED_DAY_MS = 8 * HOUR

export function isRunningTooLong(start: string | Date, now: Date): boolean {
  const s = new Date(start)
  return durationMs(s, now) > TOO_LONG_MS || s.getTime() < startOfDay(now).getTime()
}

/** Default end when stopping another member's timer: now, or start + 8h for a forgotten timer. */
export function suggestedStopEnd(start: string | Date, now: Date): Date {
  if (!isRunningTooLong(start, now)) return now
  return new Date(Math.min(new Date(start).getTime() + SUGGESTED_DAY_MS, now.getTime()))
}

export interface TeamRow {
  member: Member
  timer: RunningTimer | null
  /** Elapsed time of the running timer, 0 when idle. */
  elapsedMs: number
  /** Entries starting today plus the part of the running timer since midnight. */
  todayMs: number
  /** End of the latest entry starting today, if any. */
  lastEnd: string | null
  tooLong: boolean
}

/**
 * Rows of the "Team now" block: every member except `me`, running timers first (longest
 * elapsed first), then idle members by login.
 */
export function buildTeamRows(input: {
  members: Member[]
  timers: RunningTimer[]
  entries: TimeEntry[]
  me: string
  now: Date
}): TeamRow[] {
  const { members, timers, entries, me, now } = input
  const dayStart = startOfDay(now).getTime()
  const dayEnd = dayStart + 24 * HOUR
  const timerByLogin = new Map(timers.map((t) => [t.login, t]))

  const logins = new Map(members.map((m) => [m.login, m]))
  for (const t of timers)
    if (!logins.has(t.login)) logins.set(t.login, { login: t.login, avatarUrl: null })

  const rows: TeamRow[] = []
  for (const member of logins.values()) {
    if (member.login === me) continue
    const today = entries.filter((e) => {
      const s = new Date(e.start).getTime()
      return e.login === member.login && s >= dayStart && s < dayEnd
    })
    const timer = timerByLogin.get(member.login) ?? null
    const elapsedMs = timer ? Math.max(0, durationMs(timer.start, now)) : 0
    const lastEnd = today.reduce<string | null>(
      (latest, e) => (latest === null || e.end > latest ? e.end : latest),
      null,
    )
    rows.push({
      member,
      timer,
      elapsedMs,
      todayMs:
        today.reduce((sum, e) => sum + durationMs(e.start, e.end), 0) +
        (timer ? Math.max(0, now.getTime() - Math.max(new Date(timer.start).getTime(), dayStart)) : 0),
      lastEnd,
      tooLong: timer ? isRunningTooLong(timer.start, now) : false,
    })
  }

  return rows.sort((a, b) => {
    if (a.timer && b.timer) return b.elapsedMs - a.elapsedMs
    if (a.timer) return -1
    if (b.timer) return 1
    return a.member.login.localeCompare(b.member.login)
  })
}
