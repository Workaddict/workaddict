import {
  durationMs,
  formatClock,
  formatHM,
  isValidDuration,
  parseDuration,
  resolveManualTimes,
  toHours,
} from './time'

const H = 3_600_000
const M = 60_000

describe('parseDuration', () => {
  it.each([
    ['1:30', 90 * M],
    ['0:05', 5 * M],
    ['1h 30m', 90 * M],
    ['2h', 2 * H],
    ['45m', 45 * M],
    ['45min', 45 * M],
    ['1.5', 90 * M],
    ['1,25', 75 * M],
  ])('parses %s', (input, expected) => {
    expect(parseDuration(input)).toBe(expected)
  })

  it.each(['', 'abc', '1:75', '-1'])('rejects %s', (input) => {
    expect(parseDuration(input)).toBeNull()
  })
})

describe('isValidDuration', () => {
  it('requires 0 < duration <= 24h', () => {
    expect(isValidDuration(0)).toBe(false)
    expect(isValidDuration(-1)).toBe(false)
    expect(isValidDuration(1)).toBe(true)
    expect(isValidDuration(24 * H)).toBe(true)
    expect(isValidDuration(24 * H + 1)).toBe(false)
  })
})

describe('resolveManualTimes', () => {
  it('uses end time on the same day', () => {
    const r = resolveManualTimes({ date: '2026-09-21', startTime: '13:00', endTime: '15:15' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(durationMs(r.start, r.end)).toBe(2 * H + 15 * M)
    expect(r.overnight).toBe(false)
    expect(r.start.getHours()).toBe(13)
  })

  it('derives end from duration', () => {
    const r = resolveManualTimes({ date: '2026-09-21', startTime: '13:00', duration: '1:30' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.end.getHours()).toBe(14)
    expect(r.end.getMinutes()).toBe(30)
  })

  it('treats end before start as next day', () => {
    const r = resolveManualTimes({ date: '2026-09-21', startTime: '22:00', endTime: '01:00' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.overnight).toBe(true)
    expect(r.end.getDate()).toBe(22)
    expect(durationMs(r.start, r.end)).toBe(3 * H)
  })

  it('rejects equal start and end instead of rolling over to 24h', () => {
    const r = resolveManualTimes({ date: '2026-09-21', startTime: '10:39', endTime: '10:39' })
    expect(r).toEqual({ ok: false, error: 'invalidDuration' })
  })

  it('rejects zero and >24h durations', () => {
    expect(
      resolveManualTimes({ date: '2026-09-21', startTime: '10:00', duration: '0:00' }),
    ).toEqual({ ok: false, error: 'invalidDuration' })
    expect(
      resolveManualTimes({ date: '2026-09-21', startTime: '10:00', duration: '25:00' }),
    ).toEqual({ ok: false, error: 'invalidDuration' })
  })

  it('rejects invalid start/end', () => {
    expect(resolveManualTimes({ date: 'x', startTime: '10:00', endTime: '11:00' }).ok).toBe(false)
    expect(
      resolveManualTimes({ date: '2026-09-21', startTime: '25:00', endTime: '11:00' }),
    ).toEqual({
      ok: false,
      error: 'invalidStart',
    })
    expect(resolveManualTimes({ date: '2026-09-21', startTime: '10:00', endTime: 'x' })).toEqual({
      ok: false,
      error: 'invalidEnd',
    })
  })
})

describe('formatting', () => {
  it('formats clock and hours', () => {
    expect(formatClock(3_909_000)).toBe('1:05:09')
    expect(formatClock(-5)).toBe('0:00:00')
    expect(formatHM(2 * H + 15 * M)).toBe('2:15')
    expect(toHours(2 * H + 15 * M)).toBe(2.25)
  })
})
