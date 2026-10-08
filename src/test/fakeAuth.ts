import type { AuthContextValue, AuthState } from '../features/auth/AuthContext'

/** An auth context for component tests: every action is a no-op unless overridden. */
export function fakeAuth(
  state: AuthState,
  overrides: Partial<Omit<AuthContextValue, 'state'>> = {},
): AuthContextValue {
  const noop = async () => {}
  return {
    state,
    login: noop,
    logout: noop,
    switchProfile: noop,
    lock: noop,
    removeProfile: noop,
    forgetAll: noop,
    saveCurrentAsProfile: noop,
    ...overrides,
  }
}
