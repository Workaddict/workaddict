import {
  applyInlineTime,
  durationMs,
  formatClock,
  formatHM,
  isValidDuration,
  parseDuration,
  resolveManualTimes,
  resolveTimerStart,
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

describe('applyInlineTime', () => {
  const at = (h: number, m = 0, day = 21) => new Date(2026, 8, day, h, m)

  it('changes the start and keeps the end', () => {
    expect(applyInlineTime(at(9), at(10), 'start', '08:30')).toMatchObject({
      ok: true,
      start: at(8, 30),
      end: at(10),
    })
  })

  it('changes the end on the same day', () => {
    expect(applyInlineTime(at(9), at(10), 'end', '11:15')).toMatchObject({ ok: true, end: at(11, 15) })
  })

  it('moves an end before the start to the next day', () => {
    expect(applyInlineTime(at(22), at(23), 'end', '01:00')).toMatchObject({
      ok: true,
      end: at(1, 0, 22),
      overnight: true,
    })
  })

  it('changes the duration and keeps the start', () => {
    expect(applyInlineTime(at(9), at(10), 'duration', '2:15')).toMatchObject({
      ok: true,
      start: at(9),
      end: at(11, 15),
    })
  })

  it('rejects durations over 24 hours', () => {
    expect(applyInlineTime(at(9), at(10), 'duration', '25:00')).toEqual({ ok: false, error: 'invalidDuration' })
  })

  it('rejects a start after the end', () => {
    expect(applyInlineTime(at(9), at(10), 'start', '10:30')).toEqual({ ok: false, error: 'invalidDuration' })
  })

  it('rejects malformed times', () => {
    expect(applyInlineTime(at(9), at(10), 'start', '25:00')).toEqual({ ok: false, error: 'invalidStart' })
    expect(applyInlineTime(at(9), at(10), 'end', 'x')).toEqual({ ok: false, error: 'invalidEnd' })
  })

  it('keeps sub-minute precision of an untouched start', () => {
    const start = new Date(2026, 8, 21, 9, 0, 42)
    const r = applyInlineTime(start, at(10), 'duration', '1:00')
    expect(r).toMatchObject({ ok: true, start, end: new Date(2026, 8, 21, 10, 0, 42) })
  })
})

describe('resolveTimerStart', () => {
  const d = (day: number, h: number, m = 0) => new Date(2026, 8, day, h, m)

  it('reads the time as today', () => {
    expect(resolveTimerStart(d(23, 9, 12), '08:45', d(23, 10))).toEqual({ ok: true, start: d(23, 8, 45) })
  })

  it('rejects a start later than now for a timer started today', () => {
    expect(resolveTimerStart(d(23, 9), '10:30', d(23, 10))).toEqual({ ok: false, error: 'startInFuture' })
  })

  it('reads a later time as yesterday for a timer running past midnight', () => {
    expect(resolveTimerStart(d(22, 23, 30), '23:00', d(23, 0, 15))).toEqual({
      ok: true,
      start: d(22, 23),
    })
  })

  it('keeps a time after midnight today for a timer started yesterday', () => {
    expect(resolveTimerStart(d(22, 23, 30), '00:05', d(23, 0, 15))).toEqual({
      ok: true,
      start: d(23, 0, 5),
    })
  })

  it('rejects malformed times', () => {
    expect(resolveTimerStart(d(23, 9), '24:00', d(23, 10))).toEqual({ ok: false, error: 'invalidStart' })
  })
})
