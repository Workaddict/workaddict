/** UTC month key "YYYY-MM" of a timestamp; entries are sharded by the month of their start. */
export function monthKey(iso: string | Date): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** All UTC month keys touched by [from, to], in ascending order. */
export function monthKeysInRange(from: Date, to: Date): string[] {
  if (to.getTime() < from.getTime()) return []
  const keys: string[] = []
  let y = from.getUTCFullYear()
  let m = from.getUTCMonth()
  const endY = to.getUTCFullYear()
  const endM = to.getUTCMonth()
  while (y < endY || (y === endY && m <= endM)) {
    keys.push(`${y}-${String(m + 1).padStart(2, '0')}`)
    m++
    if (m === 12) {
      m = 0
      y++
    }
  }
  return keys
}

/** Month key immediately before the given one. */
export function previousMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number) as [number, number]
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}
