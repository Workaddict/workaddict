export type Session =
  | { mode: 'github'; token: string; repo: string; branch: string }
  | { mode: 'demo' }

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

export function saveSession(session: Session, remember: boolean) {
  clearSession()
  const raw = JSON.stringify(session)
  safe(() => (remember ? localStorage : sessionStorage).setItem(KEY, raw), undefined)
}

export function clearSession() {
  safe(() => localStorage.removeItem(KEY), undefined)
  safe(() => sessionStorage.removeItem(KEY), undefined)
}
