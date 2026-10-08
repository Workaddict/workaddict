export type Session =
  | {
      mode: 'github'
      token: string
      repo: string
      branch: string
      /** OAuth scopes GitHub reported at login (classic tokens only). */
      scopes?: string[]
      /** Whether the data repository belongs to an organization or a user (missing in old sessions). */
      ownerType?: 'User' | 'Organization'
    }
  | { mode: 'demo' }

export type TokenKind = 'classic' | 'fineGrained' | 'other'

/** Classic personal access tokens start with `ghp_`, fine-grained ones with `github_pat_`. */
export function tokenKind(token: string): TokenKind {
  const t = token.trim()
  if (t.startsWith('ghp_')) return 'classic'
  if (t.startsWith('github_pat_')) return 'fineGrained'
  return 'other'
}

/**
 * Tab-only sessions live in `sessionStorage`. Sessions remembered by earlier versions sit in
 * `localStorage` in plaintext; they are only read (and deleted after migration), never written.
 * Saved profiles live in the encrypted vault (`features/profiles`).
 */
const KEY = 'workaddict.session'
const ACTIVE_PROFILE_KEY = 'workaddict.activeProfile'

function parse(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as Session
    if (s.mode === 'demo') return s
    if (s.mode === 'github' && s.token && s.repo && s.branch) return s
  } catch {
    // corrupt value
  }
  return null
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export function loadTabSession(): Session | null {
  return parse(safe(() => sessionStorage.getItem(KEY), null))
}

export function saveTabSession(session: Session) {
  safe(() => sessionStorage.setItem(KEY, JSON.stringify(session)), undefined)
}

export function clearTabSession() {
  safe(() => sessionStorage.removeItem(KEY), undefined)
}

/** A plaintext "Remember me" session from an earlier version (design D10). */
export function loadLegacySession(): Session | null {
  return parse(safe(() => localStorage.getItem(KEY), null))
}

export function clearLegacySession() {
  safe(() => localStorage.removeItem(KEY), undefined)
}

/** The profile this tab shows; survives a reload of the tab, not a new tab. */
export function getActiveProfile(): string | null {
  return safe(() => sessionStorage.getItem(ACTIVE_PROFILE_KEY), null)
}

export function setActiveProfile(id: string | null) {
  safe(
    () =>
      id === null
        ? sessionStorage.removeItem(ACTIVE_PROFILE_KEY)
        : sessionStorage.setItem(ACTIVE_PROFILE_KEY, id),
    undefined,
  )
}
