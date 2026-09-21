const MINUTE = 60_000
const HOUR = 60 * MINUTE
export const MAX_ENTRY_MS = 24 * HOUR

export function durationMs(start: string | Date, end: string | Date): number {
  return new Date(end).getTime() - new Date(start).getTime()
}

export function isValidDuration(ms: number): boolean {
  return ms > 0 && ms <= MAX_ENTRY_MS
}

/** Parses "1:30", "1h 30m", "90m", "1.5" or "1,5" (hours) into milliseconds. Returns null if invalid. */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase()
  if (!s) return null
  let m = /^(\d+):([0-5]?\d)$/.exec(s)
  if (m) return Number(m[1]) * HOUR + Number(m[2]) * MINUTE
  m = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?$/.exec(s)
  if (m && (m[1] || m[2])) return Number(m[1] ?? 0) * HOUR + Number(m[2] ?? 0) * MINUTE
  m = /^(\d+(?:[.,]\d+)?)$/.exec(s)
  if (m) return Math.round(Number(m[1]!.replace(',', '.')) * 60) * MINUTE
  return null
}

/** Combines a local date "yyyy-MM-dd" and local time "HH:mm" into a Date. */
export function localDateTime(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const t = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!d || !t) return null
  const h = Number(t[1])
  const min = Number(t[2])
  if (h > 23 || min > 59) return null
  return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), h, min, 0, 0)
}

export type ManualTimeInput = {
  date: string
  startTime: string
} & ({ endTime: string; duration?: undefined } | { duration: string; endTime?: undefined })

export type ManualTimeResult =
  | { ok: true; start: Date; end: Date; overnight: boolean }
  | { ok: false; error: 'invalidStart' | 'invalidEnd' | 'invalidDuration' }

/**
 * Resolves manual input into start/end. An end time earlier than (or equal to) the
 * start time is treated as ending on the following day.
 */
export function resolveManualTimes(input: ManualTimeInput): ManualTimeResult {
  const start = localDateTime(input.date, input.startTime)
  if (!start) return { ok: false, error: 'invalidStart' }

  if (input.duration !== undefined) {
    const ms = parseDuration(input.duration)
    if (ms === null || !isValidDuration(ms)) return { ok: false, error: 'invalidDuration' }
    return { ok: true, start, end: new Date(start.getTime() + ms), overnight: false }
  }

  let end = localDateTime(input.date, input.endTime)
  if (!end) return { ok: false, error: 'invalidEnd' }
  let overnight = false
  // Only an end strictly before the start rolls over; equal times are a zero duration (invalid).
  if (end.getTime() < start.getTime()) {
    end = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate() + 1,
      end.getHours(),
      end.getMinutes(),
    )
    overnight = true
  }
  if (!isValidDuration(durationMs(start, end))) return { ok: false, error: 'invalidDuration' }
  return { ok: true, start, end, overnight }
}

/** "1:05:09" — used by the live timer. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** "2:15" (hours:minutes) — used in lists and reports. */
export function formatHM(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / MINUTE))
  return `${Math.floor(totalMin / 60)}:${String(totalMin % 60).padStart(2, '0')}`
}

/** Decimal hours rounded to 2 places, e.g. 2.25. */
export function toHours(ms: number): number {
  return Math.round((ms / HOUR) * 100) / 100
}
