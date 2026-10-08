import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Member } from '../../domain/types'
import {
  clearBlobCache,
  createBlobCache,
  createGitHubAdapter,
  isStorageError,
  parseRepo,
  type StorageAdapter,
} from '../../storage'
import {
  emptyVault,
  mostRecentProfile,
  removeProfile as removeFromVault,
  replaceToken,
  saveProfile,
  setRejected,
  tokenOf,
  touchProfile,
  type NewToken,
  type VaultData,
  type VaultProfile,
} from '../profiles/vault'
import { getVault, type UnlockMode } from '../profiles/vaultStore'
import { VAULT_KEY } from '../profiles/vaultSync'
import { onAuthExpired } from './authEvents'
import { createDemoAdapter } from './demoData'
import {
  clearLegacySession,
  clearTabSession,
  getActiveProfile,
  loadLegacySession,
  loadTabSession,
  saveTabSession,
  setActiveProfile,
  tokenKind,
  type Session,
} from './session'
import { signInAttempt } from './signInAttempt'

export type LogoutReason = 'sessionExpired' | 'unreachable' | 'tokenRejected'

export type AuthState =
  | { status: 'loading' }
  | { status: 'loggedOut'; reason?: LogoutReason }
  | {
      status: 'ready'
      session: Session
      adapter: StorageAdapter
      user: Member
      /** Set for a saved profile; missing for tab-only, legacy and demo sessions. */
      profileId?: string
      /** A plaintext session remembered by an earlier version (design D10). */
      legacy?: boolean
    }

export type ReadyState = Extract<AuthState, { status: 'ready' }>

/** Passphrase and unlock mode for a vault created together with the first profile. */
export interface NewVault {
  passphrase: string
  mode: UnlockMode
}

export interface SaveAsProfile {
  /** GitHub login of the token's user, from the sign-in check. */
  login: string
  /** Replace the token of this profile instead of adding one (design D9). */
  replaceProfileId?: string
  /** No vault yet: create it with this passphrase. */
  newVault?: NewVault
}

export interface AuthContextValue {
  state: AuthState
  /**
   * Opens a session; credentials must already be validated (see checkLogin). With `save`, the
   * session becomes a profile in the vault, otherwise it lasts for this tab only.
   */
  login(session: Session, save: SaveAsProfile | false): Promise<void>
  /** Ends a tab-only, legacy or demo session. */
  logout(reason?: 'sessionExpired'): Promise<void>
  /** Opens a saved profile in this tab; throws when it cannot be opened. */
  switchProfile(id: string): Promise<void>
  /** Locks the vault in every tab. */
  lock(): Promise<void>
  removeProfile(id: string): Promise<void>
  /** Removes the vault, the stored key, plaintext and tab sessions and cached data. */
  forgetAll(): Promise<void>
  /** Saves the current tab-only or legacy session as a profile; deletes the plaintext session. */
  saveCurrentAsProfile(newVault?: NewVault): Promise<void>
}

/** Exported for tests, which provide a ready session directly. */
export const AuthContext = createContext<AuthContextValue | null>(null)

/** Repository content is kept on disk (IndexedDB) only when the key is too (design D7). */
function createAdapter(session: Session, persist: boolean): StorageAdapter {
  if (session.mode === 'demo') return createDemoAdapter()
  const repo = parseRepo(session.repo)!
  return createGitHubAdapter({
    token: session.token,
    ...repo,
    branch: session.branch,
    cache: createBlobCache({ persist }),
  })
}

async function open(session: Session, persist: boolean): Promise<ReadyState> {
  const adapter = createAdapter(session, persist)
  await adapter.init()
  const user = await adapter.getCurrentUser()
  return { status: 'ready', session, adapter, user }
}

function profileSession(data: VaultData, profile: VaultProfile): Session | null {
  const token = tokenOf(data, profile)
  if (!token) return null
  return {
    mode: 'github',
    token: token.token,
    repo: profile.repo,
    branch: profile.branch,
    ...(token.scopes ? { scopes: token.scopes } : {}),
    ...(profile.ownerType ? { ownerType: profile.ownerType } : {}),
  }
}

/** The vault entry for a checked token. Classic tokens belong to their user, not the repo owner. */
function tokenEntry(session: Extract<Session, { mode: 'github' }>, login: string): NewToken {
  const kind = tokenKind(session.token)
  return {
    token: session.token,
    owner: kind === 'classic' ? login : parseRepo(session.repo)!.owner,
    login,
    kind,
    ...(session.scopes ? { scopes: session.scopes } : {}),
  }
}

function hasStoredSession(): boolean {
  try {
    return !!(loadTabSession() ?? loadLegacySession() ?? localStorage.getItem(VAULT_KEY))
  } catch {
    return false
  }
}

const vaultPersists = () => getVault().getSnapshot().mode === 'stay'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const vault = getVault()
  const [state, setStateRaw] = useState<AuthState>(() =>
    hasStoredSession() ? { status: 'loading' } : { status: 'loggedOut' },
  )
  // Vault events arrive outside React; they need the current state.
  const stateRef = useRef(state)
  const setState = useCallback((s: AuthState) => {
    stateRef.current = s
    setStateRaw(s)
  }, [])

  const signOutTab = useCallback(
    (reason?: LogoutReason) => {
      setActiveProfile(null)
      signInAttempt.clear()
      queryClient.clear()
      setState({ status: 'loggedOut', reason })
    },
    [queryClient, setState],
  )

  /**
   * Opens a profile. When GitHub rejects its token, the token is marked "Token rejected" in the
   * vault and the error is rethrown (design D9).
   */
  const openProfile = useCallback(
    async (profile: VaultProfile) => {
      const data = vault.getSnapshot().data
      const session = data && profileSession(data, profile)
      if (!session || session.mode !== 'github') throw new Error('Profile not found')
      let next: ReadyState
      try {
        next = await open(session, vaultPersists())
      } catch (e) {
        if (isStorageError(e, 'auth')) {
          await vault.update((d) => setRejected(d, session.token, true)).catch(() => {})
        }
        throw e
      }
      queryClient.clear()
      clearTabSession()
      setActiveProfile(profile.id)
      setState({ ...next, profileId: profile.id })
      void vault.update((d) => touchProfile(d, profile.id)).catch(() => {})
    },
    [vault, queryClient, setState],
  )

  /** Startup or a failed open: what the start page should show. */
  const openFailed = useCallback(
    (e: unknown) => {
      if (isStorageError(e, 'auth')) signOutTab('tokenRejected')
      else if (isStorageError(e, 'notFound')) signOutTab('sessionExpired')
      else setState({ status: 'loggedOut', reason: 'unreachable' })
    },
    [signOutTab, setState],
  )

  // Restore a session on startup: tab session → active profile → most recent profile → legacy
  // plaintext session → signed out (design D5).
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const tab = loadTabSession()
      await vault.init()
      const snap = vault.getSnapshot()
      const legacy = snap.status === 'none' ? loadLegacySession() : null
      // Without a stored key nothing may stay on disk, e.g. from a closed tab.
      if (!(snap.status !== 'none' && snap.mode === 'stay') && !legacy) void clearBlobCache()
      if (cancelled) return

      if (tab) {
        try {
          const next = await open(tab, false)
          if (!cancelled) setState(next)
        } catch (e) {
          if (cancelled) return
          if (isStorageError(e, 'auth') || isStorageError(e, 'notFound')) {
            clearTabSession()
            signOutTab('sessionExpired')
          } else setState({ status: 'loggedOut', reason: 'unreachable' })
        }
        return
      }

      if (snap.status === 'unlocked' && snap.data) {
        const active = getActiveProfile()
        const profile =
          snap.data.profiles.find((p) => p.id === active) ?? mostRecentProfile(snap.data)
        if (!profile) return setState({ status: 'loggedOut' })
        try {
          await openProfile(profile)
        } catch (e) {
          if (!cancelled) openFailed(e)
        }
        return
      }

      if (legacy) {
        try {
          const next = await open(legacy, true)
          if (!cancelled) setState({ ...next, legacy: true })
        } catch (e) {
          if (cancelled) return
          if (isStorageError(e, 'auth') || isStorageError(e, 'notFound')) {
            clearLegacySession()
            void clearBlobCache()
            signOutTab('sessionExpired')
          } else setState({ status: 'loggedOut', reason: 'unreachable' })
        }
        return
      }

      setState({ status: 'loggedOut' })
    })()
    return () => {
      cancelled = true
    }
  }, [vault, openProfile, openFailed, signOutTab, setState])

  // Lock, forget and profile changes from this or another tab.
  useEffect(
    () =>
      vault.onEvent((event) => {
        const s = stateRef.current
        const profileId = s.status === 'ready' ? s.profileId : undefined
        if (event === 'forgotten') {
          clearTabSession()
          if (s.status !== 'loggedOut') signOutTab()
          return
        }
        if (!profileId || s.status !== 'ready') return
        if (event === 'locked') {
          signOutTab()
          // The active profile is kept, so unlocking returns to it.
          setActiveProfile(profileId)
          return
        }
        if (event === 'changed') {
          const data = vault.getSnapshot().data
          const profile = data?.profiles.find((p) => p.id === profileId)
          if (!data || !profile) return signOutTab()
          // Token replaced in another tab: reopen with the new one.
          const session = profileSession(data, profile)
          if (session?.mode === 'github' && s.session.mode === 'github') {
            if (session.token !== s.session.token || session.branch !== s.session.branch) {
              void openProfile(profile).catch(() => {})
            }
          }
        }
      }),
    [vault, openProfile, signOutTab],
  )

  const logout = useCallback(
    async (reason?: 'sessionExpired') => {
      const s = stateRef.current
      clearTabSession()
      if (s.status === 'ready' && s.legacy) clearLegacySession()
      signOutTab(reason)
      if (!vaultPersists() || vault.getSnapshot().status === 'none') await clearBlobCache()
    },
    [vault, signOutTab],
  )

  // GitHub rejected the token during use.
  useEffect(
    () =>
      onAuthExpired(() => {
        const s = stateRef.current
        if (s.status !== 'ready') return
        if (s.profileId && s.session.mode === 'github') {
          const token = s.session.token
          signOutTab('tokenRejected')
          void vault.update((d) => setRejected(d, token, true)).catch(() => {})
        } else {
          void logout('sessionExpired')
        }
      }),
    [vault, logout, signOutTab],
  )

  const login = useCallback(
    async (session: Session, save: SaveAsProfile | false) => {
      if (session.mode === 'demo' || !save) {
        const next = await open(session, false)
        if (session.mode === 'github') saveTabSession(session)
        setActiveProfile(null)
        queryClient.clear()
        setState(next)
        return
      }
      const mode = save.newVault?.mode ?? vault.getSnapshot().mode
      const next = await open(session, mode === 'stay')
      const token = tokenEntry(session, save.login)
      let profileId = save.replaceProfileId ?? ''
      const apply = (d: VaultData): VaultData => {
        if (save.replaceProfileId) return replaceToken(d, save.replaceProfileId, token)
        const [data, id] = saveProfile(
          d,
          { repo: session.repo, branch: session.branch, ownerType: session.ownerType },
          token,
        )
        profileId = id
        return data
      }
      if (save.newVault) await vault.create(save.newVault.passphrase, mode, apply(emptyVault()))
      else await vault.update(apply)
      clearTabSession()
      setActiveProfile(profileId)
      signInAttempt.clear()
      queryClient.clear()
      setState({ ...next, profileId })
    },
    [vault, queryClient, setState],
  )

  const switchProfile = useCallback(
    async (id: string) => {
      const profile = vault.getSnapshot().data?.profiles.find((p) => p.id === id)
      if (!profile) throw new Error('Profile not found')
      try {
        await openProfile(profile)
      } catch (e) {
        // The token is now marked rejected; a tab without a session shows the picker.
        if (stateRef.current.status !== 'ready') openFailed(e)
        throw e
      }
    },
    [vault, openProfile, openFailed],
  )

  const lock = useCallback(async () => {
    const persisted = vaultPersists()
    await vault.lock()
    if (persisted) await clearBlobCache()
  }, [vault])

  const removeProfile = useCallback(
    async (id: string) => {
      const data = await vault.update((d) => removeFromVault(d, id))
      const s = stateRef.current
      if (s.status !== 'ready' || s.profileId !== id) return
      const next = mostRecentProfile(data)
      if (!next) return signOutTab()
      try {
        await openProfile(next)
      } catch {
        signOutTab()
      }
    },
    [vault, openProfile, signOutTab],
  )

  const forgetAll = useCallback(async () => {
    clearTabSession()
    clearLegacySession()
    await vault.forget()
    await clearBlobCache()
  }, [vault])

  const saveCurrentAsProfile = useCallback(
    async (newVault?: NewVault) => {
      const s = stateRef.current
      if (s.status !== 'ready' || s.session.mode !== 'github' || s.profileId) return
      const session = s.session
      const token = tokenEntry(session, s.user.login)
      let profileId = ''
      const apply = (d: VaultData): VaultData => {
        const [data, id] = saveProfile(
          d,
          { repo: session.repo, branch: session.branch, ownerType: session.ownerType },
          token,
        )
        profileId = id
        return data
      }
      if (newVault) await vault.create(newVault.passphrase, newVault.mode, apply(emptyVault()))
      else await vault.update(apply)
      clearTabSession()
      if (s.legacy) clearLegacySession()
      setActiveProfile(profileId)
      setState({ ...s, profileId, legacy: false })
    },
    [vault, setState],
  )

  const value = useMemo(
    () => ({
      state,
      login,
      logout,
      switchProfile,
      lock,
      removeProfile,
      forgetAll,
      saveCurrentAsProfile,
    }),
    [state, login, logout, switchProfile, lock, removeProfile, forgetAll, saveCurrentAsProfile],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
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
