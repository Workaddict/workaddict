import { parseRepo } from '../../storage'

/** GitHub user and organization logins: letters, digits and single hyphens, not at the ends. */
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/
/** Repository names as GitHub stores them. */
const REPO = /^[A-Za-z0-9._-]{1,100}$/

export function isLogin(value: string): boolean {
  return LOGIN.test(value)
}

export function isRepoName(value: string): boolean {
  return REPO.test(value) && value !== '.' && value !== '..'
}

/**
 * Splits a list of usernames typed by the owner (commas, spaces or new lines, with or without a
 * leading `@`). Duplicates are removed; anything that is not a valid login is reported as invalid
 * and never ends up in a generated command.
 */
export function parseUsernames(input: string): { valid: string[]; invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []
  for (const raw of input.split(/[\s,]+/)) {
    if (!raw) continue
    const name = raw.startsWith('@') ? raw.slice(1) : raw
    if (!isLogin(name)) invalid.push(raw)
    else if (!valid.some((v) => v.toLowerCase() === name.toLowerCase())) valid.push(name)
  }
  return { valid, invalid }
}

/** Reads `?repo=owner/name` from an invite link; null when it is missing or malformed. */
export function joinTarget(value: string | null): { owner: string; repo: string } | null {
  const parsed = value ? parseRepo(value) : null
  return parsed && isLogin(parsed.owner) && isRepoName(parsed.repo) ? parsed : null
}
