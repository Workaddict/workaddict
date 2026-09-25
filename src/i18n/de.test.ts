import { describe, expect, it } from 'vitest'
import de from './de'

/** All German strings with their dotted key, e.g. ['stats.byTag', 'Nach Label']. */
function entries(obj: object, prefix = ''): [string, string][] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[prefix + key, value] as [string, string]]
      : entries(value as object, `${prefix}${key}.`),
  )
}

describe('German terminology', () => {
  const all = entries(de)

  it('calls tags labels, except when naming Clockify tags', () => {
    // "Tag" alone is also a calendar day ("am nächsten Tag"), so singular only counts in tag keys.
    const clockify = /Clockify|import\.(loadingMeta|unknownRefs)/
    const offenders = all.filter(
      ([key, text]) =>
        !clockify.test(key + text) &&
        (/\bTags\b/.test(text) || (/tag/i.test(key) && /\bTag\b/.test(text))),
    )
    expect(offenders).toEqual([])
    expect(de.stats.byTag).toBe('Nach Label')
    expect(de.nav.workGroups).toBe('Projekte & Labels')
  })

  it('uses one word each for owner, team leader and user', () => {
    const offenders = all.filter(([, text]) => /Besitzer|Teamleiter\b|\bNutzer/.test(text))
    expect(offenders).toEqual([])
    expect(de.roles.owner).toBe('Owner')
  })

  it('labels the timer buttons with verbs', () => {
    expect(de.timer.start).toBe('Starten')
    expect(de.timer.stop).toBe('Stoppen')
  })
})
