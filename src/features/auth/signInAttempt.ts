import type { LoginCheck } from '../../storage'
import type { NewVault } from './AuthContext'

/**
 * Where a sign-in form sits: start page, last step of the setup wizard, the join flow, "Add
 * project", or replacing the token of a saved profile.
 */
export type SignInFrom = 'start' | 'setup' | 'join' | 'add' | 'profile'

export type LoginFailure = Extract<LoginCheck, { ok: false }>

export interface SignInAttempt {
  token: string
  repo: string
  /** "Save as a profile on this device". */
  save: boolean
  from: SignInFrom
  failure: LoginFailure
  /** The profile whose token is being replaced (`from: 'profile'`). */
  profileId?: string
  /** The token came from the vault ("Use your token for <owner>"). */
  reused?: boolean
  /** Passphrase and unlock mode for the vault created on success. */
  newVault?: NewVault
}

/**
 * The last failed sign-in, so the fix page can try again and the form can be refilled without
 * retyping the token. Kept in memory only: never in the URL or browser storage, gone on reload.
 */
let current: SignInAttempt | null = null

export const signInAttempt = {
  get: (): SignInAttempt | null => current,
  set(attempt: SignInAttempt) {
    current = attempt
  },
  clear() {
    current = null
  },
}
