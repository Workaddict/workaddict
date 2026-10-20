import type { TopicId } from '../topics'

/** One piece of a help section: a paragraph, a list, numbered steps, a note or a link. */
export type HelpBlock =
  | string
  | { list: string[] }
  | { steps: string[] }
  | { note: string }
  | { link: string; label: string }

export interface HelpSection {
  heading: string
  blocks: HelpBlock[]
}

export interface HelpTopic {
  summary: string
  sections: HelpSection[]
  related: TopicId[]
  /** Extra words the search should find this topic by. */
  keywords: string[]
}

/** The written topics; `shortcuts` and `glossary` are built from data instead. */
export type WrittenTopicId = Exclude<TopicId, 'shortcuts' | 'glossary'>
export type HelpContent = Record<WrittenTopicId, HelpTopic>
