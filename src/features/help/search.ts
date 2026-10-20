import type { TFunction } from 'i18next'
import type { Language } from '../../i18n'
import de from './content/de'
import en from './content/en'
import type { HelpContent, HelpTopic } from './content/types'
import { TERM_IDS, TOPIC_IDS, type TermId, type TopicId } from './topics'

export const CONTENT: Record<Language, HelpContent> = { en, de }

/** The written content of a topic, or undefined for the generated pages (glossary, shortcuts). */
export function topicContent(lang: Language, id: TopicId): HelpTopic | undefined {
  return (CONTENT[lang] as Partial<Record<TopicId, HelpTopic>>)[id]
}

export type HelpResult =
  | { kind: 'topic'; id: TopicId; title: string; text: string }
  | { kind: 'term'; id: TermId; title: string; text: string }

/** Lower case without accents, so "Passwort" finds "passwort" and "Zeitzone" finds "zeitzone". */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * Topics and glossary terms matching every word of the query, topics first. Titles, summaries,
 * keywords and section headings of topics are searched; glossary terms by name and explanation.
 */
export function searchHelp(query: string, lang: Language, t: TFunction): HelpResult[] {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const matches = (haystack: string) => {
    const h = normalize(haystack)
    return words.every((w) => h.includes(w))
  }

  const topics: HelpResult[] = TOPIC_IDS.flatMap((id) => {
    const title = t(`help.topics.${id}`)
    const c = topicContent(lang, id)
    const haystack = [
      title,
      c?.summary,
      ...(c?.keywords ?? []),
      ...(c?.sections.map((s) => s.heading) ?? []),
    ]
      .filter(Boolean)
      .join(' ')
    return matches(haystack) ? [{ kind: 'topic' as const, id, title, text: c?.summary ?? '' }] : []
  })
  const terms: HelpResult[] = TERM_IDS.flatMap((id) => {
    const title = t(`help.glossary.terms.${id}.term`)
    const text = t(`help.glossary.terms.${id}.short`)
    return matches(`${title} ${text}`) ? [{ kind: 'term' as const, id, title, text }] : []
  })
  return [...topics, ...terms]
}
