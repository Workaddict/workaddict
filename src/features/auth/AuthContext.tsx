import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Member } from '../../domain/types'
import {
  clearBlobCache,
  createGitHubAdapter,
  isStorageError,
  parseRepo,
  type StorageAdapter,
} from '../../storage'
import { onAuthExpired } from './authEvents'
import { createDemoAdapter } from './demoData'
import { clearSession, loadSession, saveSession, type Session } from './session'

export type LogoutReason = 'sessionExpired' | 'unreachable'

export type AuthState =
  | { status: 'loading' }
  | { status: 'loggedOut'; reason?: LogoutReason }
  | { status: 'ready'; session: Session; adapter: StorageAdapter; user: Member }

interface AuthContextValue {
  state: AuthState
  /** Opens a session; credentials must already be validated (see checkLogin). */
  login(session: Session, remember: boolean): Promise<void>
  logout(reason?: 'sessionExpired'): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function createAdapter(session: Session): StorageAdapter {
  if (session.mode === 'demo') return createDemoAdapter()
  const repo = parseRepo(session.repo)!
  return createGitHubAdapter({ token: session.token, ...repo, branch: session.branch })
}

async function open(session: Session): Promise<AuthState> {
  const adapter = createAdapter(session)
  await adapter.init()
  const user = await adapter.getCurrentUser()
  return { status: 'ready', session, adapter, user }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>(() =>
    loadSession() ? { status: 'loading' } : { status: 'loggedOut' },
  )

  const logout = useCallback(
    async (reason?: 'sessionExpired') => {
      clearSession()
      queryClient.clear()
      await clearBlobCache()
      setState({ status: 'loggedOut', reason })
    },
    [queryClient],
  )

  // Restore a stored session on startup.
  useEffect(() => {
    const session = loadSession()
    if (!session) return
    let cancelled = false
    open(session)
      .then((s) => !cancelled && setState(s))
      .catch((e: unknown) => {
        if (cancelled) return
        if (isStorageError(e, 'auth') || isStorageError(e, 'notFound')) {
          void logout('sessionExpired')
        } else {
          // Offline or transient error: keep credentials, let the user retry.
          setState({ status: 'loggedOut', reason: 'unreachable' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [logout])

  useEffect(() => onAuthExpired(() => void logout('sessionExpired')), [logout])

  const login = useCallback(async (session: Session, remember: boolean) => {
    const next = await open(session)
    if (session.mode === 'github') saveSession(session, remember)
    setState(next)
  }, [])

  return <AuthContext.Provider value={{ state, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}

/** Session data for pages behind the login guard. */
export function useSessionData() {
  const { state } = useAuth()
  if (state.status !== 'ready') throw new Error('useSessionData requires a ready session')
  return state
}
