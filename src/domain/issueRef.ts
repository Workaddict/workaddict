import type { Project } from './types'

const OWNER = '[A-Za-z0-9-]{1,39}'
const REPO = '[A-Za-z0-9._-]{1,100}'
const NUMBER = '[1-9][0-9]{0,9}'

/** Stored issue reference: `owner/repo#number`. */
export const ISSUE_REF = new RegExp(`^${OWNER}/${REPO}#${NUMBER}$`)
const REPO_REF = new RegExp(`^${OWNER}/${REPO}$`)

const ISSUE_URL = new RegExp(
  `^https?://(?:www\\.)?github\\.com/(${OWNER})/(${REPO})/(?:issues|pull)/(${NUMBER})(?:[/?#].*)?$`,
  'i',
)
const REPO_URL = new RegExp(
  `^(?:https?://(?:www\\.)?github\\.com/|git@github\\.com:)(${OWNER})/(${REPO})(?:[/?#].*)?$`,
  'i',
)
/** A GitHub Projects board, `https://github.com/orgs/acme/projects/3` (or `/users/`), with any view or query. */
const BOARD_URL = new RegExp(
  `^https?://(?:www\\.)?github\\.com/(orgs|users)/(${OWNER})/projects/([1-9][0-9]{0,9})(?:[/?#].*)?$`,
  'i',
)
/** Stored board reference: `orgs/acme/projects/3` or `users/alice/projects/1`. */
const BOARD_REF = new RegExp(`^(?:orgs|users)/${OWNER}/projects/[1-9][0-9]{0,9}$`)
const SHORT = new RegExp(`^#?(${NUMBER})$`)
const NAMED = new RegExp(`^(${REPO})#(${NUMBER})$`)

/** Most repositories one project may link. */
export const MAX_PROJECT_REPOS = 20

function validRepo(repo: string): boolean {
  const name = repo.slice(repo.indexOf('/') + 1)
  return REPO_REF.test(repo) && name !== '.' && name !== '..'
}

export function isIssueRef(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    ISSUE_REF.test(value) &&
    validRepo(value.slice(0, value.indexOf('#')))
  )
}

export function isRepoRef(value: unknown): value is string {
  return typeof value === 'string' && validRepo(value)
}

/** Link target for an issue reference; GitHub redirects `/issues/N` to `/pull/N` for pull requests. */
export function issueUrl(ref: string): string {
  const hash = ref.indexOf('#')
  return `https://github.com/${ref.slice(0, hash)}/issues/${ref.slice(hash + 1)}`
}

export function isBoardRef(value: unknown): value is string {
  return typeof value === 'string' && BOARD_REF.test(value)
}

/** Link target for a board reference. */
export function boardUrl(ref: string): string {
  return `https://github.com/${ref}`
}

/** Normalizes a board URL to `orgs/owner/projects/N` (or `users/…`); null if it is none. */
export function parseBoardInput(text: string): string | null {
  const url = BOARD_URL.exec(text.trim())
  return url ? `${url[1]!.toLowerCase()}/${url[2]}/projects/${url[3]}` : null
}

/**
 * The issue behind a board card link: opening a card adds `issue=owner|repo|number`
 * to the board URL. Null for a board link without a card (or a draft card).
 */
function boardCardRef(input: string): string | null {
  const query = input.indexOf('?')
  if (query < 0) return null
  const issue = new URLSearchParams(input.slice(query + 1).split('#')[0]).get('issue')
  const parts = issue?.split('|') ?? []
  if (parts.length !== 3) return null
  const ref = `${parts[0]}/${parts[1]}#${parts[2]}`
  return isIssueRef(ref) ? ref : null
}

/** Repositories in first-seen order without case-insensitive duplicates. */
function uniqueRepos(repos: Iterable<string>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const repo of repos) {
    if (seen.has(repo.toLowerCase())) continue
    seen.add(repo.toLowerCase())
    out.push(repo)
  }
  return out
}

/** Repositories of the valid issue references, in first-seen order. */
export function reposOf(refs: Iterable<string | undefined>): string[] {
  const repos: string[] = []
  for (const ref of refs) if (isIssueRef(ref)) repos.push(ref.slice(0, ref.indexOf('#')))
  return uniqueRepos(repos)
}

export type IssueParse =
  | { ok: true; ref: string | null }
  | {
      ok: false
      reason: 'format' | 'noRepo' | 'boardNoRepo' | 'boardLink' | 'unknownRepo' | 'ambiguousRepo'
    }

/**
 * Normalizes user input to `owner/repo#number`. Empty input means "no link" (`ref: null`).
 * A board card link carries its issue. A short `#42` resolves to the project's first (default)
 * linked repository, or else to the repository of its most recent issue link (`usedRepos`,
 * newest first); `api#42` to the linked or used repository named `api`.
 */
export function parseIssueInput(
  text: string,
  project: Pick<Project, 'repos' | 'board'> | null | undefined,
  usedRepos: readonly string[] = [],
): IssueParse {
  const input = text.trim()
  if (!input) return { ok: true, ref: null }
  if (isIssueRef(input)) return { ok: true, ref: input }
  const url = ISSUE_URL.exec(input)
  if (url) {
    const ref = `${url[1]}/${url[2]!.replace(/\.git$/i, '')}#${url[3]}`
    return isIssueRef(ref) ? { ok: true, ref } : { ok: false, reason: 'format' }
  }
  if (BOARD_URL.test(input)) {
    const ref = boardCardRef(input)
    return ref ? { ok: true, ref } : { ok: false, reason: 'boardLink' }
  }
  const repos = uniqueRepos([...(project?.repos ?? []), ...usedRepos])
  const noRepo = project?.board ? 'boardNoRepo' : 'noRepo'
  const short = SHORT.exec(input)
  if (short) {
    return repos.length
      ? { ok: true, ref: `${repos[0]}#${short[1]}` }
      : { ok: false, reason: noRepo }
  }
  const named = NAMED.exec(input)
  if (named) {
    const name = named[1]!.toLowerCase()
    const matches = repos.filter((r) => r.slice(r.indexOf('/') + 1).toLowerCase() === name)
    if (matches.length > 1) return { ok: false, reason: 'ambiguousRepo' }
    return matches.length
      ? { ok: true, ref: `${matches[0]}#${named[2]}` }
      : { ok: false, reason: repos.length ? 'unknownRepo' : noRepo }
  }
  return { ok: false, reason: 'format' }
}

/** Normalizes `owner/repo` or a GitHub repository URL (HTTPS or SSH) to `owner/repo`; null if it is neither. */
export function parseRepoInput(text: string): string | null {
  const input = text.trim()
  if (isRepoRef(input)) return input
  if (BOARD_URL.test(input)) return null
  const url = REPO_URL.exec(input)
  if (!url) return null
  const repo = `${url[1]}/${url[2]!.replace(/\.git$/i, '')}`
  return isRepoRef(repo) ? repo : null
}

/** Valid repositories without case-insensitive duplicates, capped at {@link MAX_PROJECT_REPOS}. */
export function cleanRepos(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const repo of value) {
    if (!isRepoRef(repo) || seen.has(repo.toLowerCase())) continue
    seen.add(repo.toLowerCase())
    out.push(repo)
    if (out.length === MAX_PROJECT_REPOS) break
  }
  return out
}
