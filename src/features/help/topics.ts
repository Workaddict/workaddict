// Help topic and glossary ids. Titles and glossary texts are in the main i18n files (`help.*`);
// the topic pages themselves are in `content/` and load with the help page.

export const TOPIC_IDS = [
  'tracking',
  'token',
  'workspaces',
  'roles',
  'work-groups',
  'team-now',
  'issue-links',
  'connect-ai',
  'export',
  'clockify-import',
  'time-zone',
  'shortcuts',
  'glossary',
] as const
export type TopicId = (typeof TOPIC_IDS)[number]

export function isTopicId(id: string | undefined): id is TopicId {
  return (TOPIC_IDS as readonly string[]).includes(id ?? '')
}

/** Glossary terms and the topic their "Learn more" link opens (the glossary when none fits). */
export const GLOSSARY = {
  'data-repo': 'token',
  token: 'token',
  workspace: 'workspaces',
  passphrase: 'workspaces',
  demo: 'glossary',
  role: 'roles',
  owner: 'roles',
  leader: 'roles',
  editor: 'roles',
  worker: 'roles',
  project: 'work-groups',
  tag: 'work-groups',
  'team-now': 'team-now',
  'issue-link': 'issue-links',
  'project-board': 'issue-links',
  mcp: 'connect-ai',
  backup: 'export',
  'time-zone': 'time-zone',
} as const satisfies Record<string, TopicId>
export type TermId = keyof typeof GLOSSARY
export const TERM_IDS = Object.keys(GLOSSARY) as TermId[]

/** Path of a help topic, or of a glossary term when `term` is given. */
export function helpPath(topic: TopicId, term?: string): string {
  return term && topic === 'glossary' ? `/help/glossary?term=${term}` : `/help/${topic}`
}

/** Where a glossary term's "Learn more" goes. */
export function termPath(id: TermId): string {
  return helpPath(GLOSSARY[id], id)
}

/** Keyboard shortcuts, shown in the help overlay and on the shortcuts page. */
export const SHORTCUTS = [
  { keys: ['?'], id: 'help' },
  { keys: ['Esc'], id: 'close' },
  { keys: ['Enter'], id: 'save' },
  { keys: ['Esc'], id: 'cancel' },
  { keys: ['Tab', 'Shift+Tab'], id: 'move' },
] as const
