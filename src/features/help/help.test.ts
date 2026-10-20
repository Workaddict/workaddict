import { describe, expect, it } from 'vitest'
import i18n from '../../i18n'
import de from '../../i18n/de'
import en from '../../i18n/en'
import deContent from './content/de'
import enContent from './content/en'
import type { HelpBlock } from './content/types'
import { searchHelp } from './search'
import { GLOSSARY, TERM_IDS, TOPIC_IDS } from './topics'
import helpDe from '../../i18n/help.de'
import helpEn from '../../i18n/help.en'

// Every source file, to check the ids the code uses against the help content.
const sources = import.meta.glob('/src/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function blockText(b: HelpBlock): string[] {
  if (typeof b === 'string') return [b]
  if ('list' in b) return b.list
  if ('steps' in b) return b.steps
  if ('note' in b) return [b.note]
  return [b.label]
}

describe('help content', () => {
  it('has the same topics and sections in both languages', () => {
    expect(Object.keys(deContent).sort()).toEqual(Object.keys(enContent).sort())
    for (const id of Object.keys(enContent) as (keyof typeof enContent)[]) {
      const a = enContent[id]
      const b = deContent[id]
      expect(b.sections.length, id).toBe(a.sections.length)
      expect(b.related, id).toEqual(a.related)
      a.sections.forEach((s, i) =>
        expect(b.sections[i]!.blocks.length, `${id} ${s.heading}`).toBe(s.blocks.length),
      )
    }
  })

  it('links only to existing topics', () => {
    for (const c of [enContent, deContent]) {
      for (const topic of Object.values(c)) {
        for (const r of topic.related) expect(TOPIC_IDS).toContain(r)
      }
    }
    for (const topic of Object.values(GLOSSARY)) expect(TOPIC_IDS).toContain(topic)
  })

  it('names every topic and glossary term in both languages', () => {
    for (const id of TOPIC_IDS) {
      expect(en.help.topics[id]).toBeTruthy()
      expect(de.help.topics[id]).toBeTruthy()
    }
    expect(Object.keys(en.help.glossary.terms).sort()).toEqual([...TERM_IDS].sort())
    expect(Object.keys(de.help.glossary.terms).sort()).toEqual([...TERM_IDS].sort())
  })

  it('uses only ids that exist', () => {
    const used = (re: RegExp) =>
      Object.entries(sources)
        .filter(([path]) => !path.includes('.test.'))
        .flatMap(([, src]) => [...src.matchAll(re)].map((m) => m[1]!))
    for (const id of used(/<HelpButton[^>]*topic="([^"]+)"/g)) expect(TOPIC_IDS).toContain(id)
    for (const id of used(/<WhatIs[^>]*topic="([^"]+)"/g)) expect(TOPIC_IDS).toContain(id)
    for (const id of used(/<Term id="([^"]+)"/g)) expect(TERM_IDS).toContain(id)
    expect(used(/<HelpButton[^>]*topic="([^"]+)"/g).length).toBeGreaterThan(8)
  })

  it('uses the German terms of the app', () => {
    const texts = Object.values(deContent).flatMap((t) => [
      t.summary,
      ...t.sections.flatMap((s) => [s.heading, ...s.blocks.flatMap(blockText)]),
    ])
    const offenders = texts.filter(
      (s) =>
        // Singular "Tag" is also a calendar day ("für deinen Tag"), so only the plural counts.
        (/\bTags\b/.test(s) && !/Clockify/.test(s)) || /Besitzer|Teamleiter\b|\bNutzer/.test(s),
    )
    expect(offenders).toEqual([])
  })
})

/** Every string in a nested value. */
function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v]
  if (Array.isArray(v)) return v.flatMap(strings)
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings)
  return []
}

describe('help markup', () => {
  const texts = strings([enContent, deContent, helpEn, helpDe])

  it('holds plain text only, no HTML (Trusted Types)', () => {
    expect(texts.length).toBeGreaterThan(200)
    expect(texts.filter((s) => /<\/?[a-z][^>]*>|&[a-z]+;/i.test(s))).toEqual([])
    const offenders = Object.entries(sources)
      .filter(([path]) => path.includes('/features/help/') || path.includes('InfoTip'))
      .filter(([, src]) => /dangerouslySetInnerHTML|\.innerHTML\s*=/.test(src))
      .map(([path]) => path)
    expect(offenders).toEqual([])
  })

  it('has no German word too long for a 320 px screen', () => {
    // About 26 characters fit in the text column of a 320 px phone.
    const long = strings([deContent, helpDe])
      .flatMap((s) => s.split(/\s+/))
      .filter((w) => w.length > 26 && !w.includes(':') && !w.startsWith('{{'))
    expect(long).toEqual([])
  })
})

describe('help search', () => {
  const t = i18n.getFixedT('de')
  it('finds topics and terms ignoring case and accents', () => {
    const results = searchHelp('passwort', 'de', t)
    expect(results.map((r) => r.title)).toContain('Arbeitsbereiche & Passphrase')
    expect(searchHelp('zeitzone', 'de', t).some((r) => r.kind === 'term')).toBe(true)
    expect(searchHelp('ÜBER NACHT', 'de', i18n.getFixedT('de'))[0]?.id).toBe('tracking')
  })

  it('finds the glossary term "Passphrase"', () => {
    expect(searchHelp('passphrase', 'de', t)).toContainEqual(
      expect.objectContaining({ kind: 'term', id: 'passphrase', title: 'Passphrase' }),
    )
  })

  it('returns nothing for an empty query', () => {
    expect(searchHelp('  ', 'en', i18n.getFixedT('en'))).toEqual([])
  })
})

describe('icon buttons', () => {
  it('use tips instead of native title attributes', () => {
    const offenders = Object.entries(sources)
      .filter(([path]) => !path.includes('.test.'))
      .flatMap(([path, src]) =>
        [...src.matchAll(/<button\b[^>]*?\btitle=/gs)]
          // The workspace chip shows its name and reveals the full name in its title.
          .filter((m) => !m[0].includes('project-chip-btn'))
          .map(() => path),
      )
    expect(offenders).toEqual([])
  })
})
