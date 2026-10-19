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

export type IssueParse =
  | { ok: true; ref: string | null }
  | { ok: false; reason: 'format' | 'noRepo' | 'unknownRepo' | 'ambiguousRepo' }

/**
 * Normalizes user input to `owner/repo#number`. Empty input means "no link" (`ref: null`).
 * A short `#42` resolves to the project's first (default) linked repository; `api#42` to the
 * linked repository named `api`.
 */
export function parseIssueInput(
  text: string,
  project: Pick<Project, 'repos'> | null | undefined,
): IssueParse {
  const input = text.trim()
  if (!input) return { ok: true, ref: null }
  if (isIssueRef(input)) return { ok: true, ref: input }
  const url = ISSUE_URL.exec(input)
  if (url) {
    const ref = `${url[1]}/${url[2]!.replace(/\.git$/i, '')}#${url[3]}`
    return isIssueRef(ref) ? { ok: true, ref } : { ok: false, reason: 'format' }
  }
  const repos = project?.repos ?? []
  const short = SHORT.exec(input)
  if (short) {
    return repos.length
      ? { ok: true, ref: `${repos[0]}#${short[1]}` }
      : { ok: false, reason: 'noRepo' }
  }
  const named = NAMED.exec(input)
  if (named) {
    const name = named[1]!.toLowerCase()
    const matches = repos.filter((r) => r.slice(r.indexOf('/') + 1).toLowerCase() === name)
    if (matches.length > 1) return { ok: false, reason: 'ambiguousRepo' }
    return matches.length
      ? { ok: true, ref: `${matches[0]}#${named[2]}` }
      : { ok: false, reason: repos.length ? 'unknownRepo' : 'noRepo' }
  }
  return { ok: false, reason: 'format' }
}

/** Normalizes `owner/repo` or a GitHub repository URL (HTTPS or SSH) to `owner/repo`; null if it is neither. */
export function parseRepoInput(text: string): string | null {
  const input = text.trim()
  if (isRepoRef(input)) return input
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
