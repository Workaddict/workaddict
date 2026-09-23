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

const KEY = 'workaddict.session'

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

/** Remembered sessions live in localStorage, others only for this tab in sessionStorage. */
export function loadSession(): Session | null {
  return (
    parse(safe(() => sessionStorage.getItem(KEY), null)) ??
    parse(safe(() => localStorage.getItem(KEY), null))
  )
}

/** Whether a "Remember me" session is stored in this browser. */
export function hasRememberedSession(): boolean {
  return parse(safe(() => localStorage.getItem(KEY), null)) !== null
}

export function saveSession(session: Session, remember: boolean) {
  clearSession()
  const raw = JSON.stringify(session)
  safe(() => (remember ? localStorage : sessionStorage).setItem(KEY, raw), undefined)
}

export function clearSession() {
  safe(() => localStorage.removeItem(KEY), undefined)
  safe(() => sessionStorage.removeItem(KEY), undefined)
}
