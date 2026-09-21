import { monthKey, monthKeysInRange, previousMonthKey } from './month'
import { isNameTaken } from './ids'

describe('monthKey', () => {
  it('uses the UTC month of the timestamp', () => {
    expect(monthKey('2026-09-21T08:00:00Z')).toBe('2026-09')
    expect(monthKey('2026-09-30T23:30:00Z')).toBe('2026-09')
    expect(monthKey('2026-10-01T00:00:00Z')).toBe('2026-10')
  })
})

describe('monthKeysInRange', () => {
  it('lists all months touched, crossing a year', () => {
    expect(
      monthKeysInRange(new Date('2025-11-15T00:00:00Z'), new Date('2026-02-01T00:00:00Z')),
    ).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })

  it('returns one month for a range inside a month', () => {
    expect(
      monthKeysInRange(new Date('2026-09-01T00:00:00Z'), new Date('2026-09-30T00:00:00Z')),
    ).toEqual(['2026-09'])
  })

  it('returns nothing for an inverted range', () => {
    expect(monthKeysInRange(new Date('2026-09-02'), new Date('2026-09-01'))).toEqual([])
  })
})

describe('previousMonthKey', () => {
  it('wraps the year', () => {
    expect(previousMonthKey('2026-01')).toBe('2025-12')
    expect(previousMonthKey('2026-10')).toBe('2026-09')
  })
})

describe('isNameTaken', () => {
  const items = [{ id: 'a', name: 'Website' }]
  it('is case-insensitive and trims', () => {
    expect(isNameTaken(items, ' website ')).toBe(true)
    expect(isNameTaken(items, 'App')).toBe(false)
  })
  it('ignores the item being renamed', () => {
    expect(isNameTaken(items, 'WEBSITE', 'a')).toBe(false)
  })
})
