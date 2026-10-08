import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ConfirmProvider } from '../components/Modal'
import { ToastProvider } from '../components/Toasts'
import { AuthContext, type AuthContextValue, type ReadyState } from '../features/auth/AuthContext'
import type { Session } from '../features/auth/session'
import type { StorageAdapter } from '../storage'
import { fakeAuth } from './fakeAuth'

/** Renders UI behind the login guard with a ready session over `adapter`. */
export async function renderWithSession(
  ui: ReactNode,
  adapter: StorageAdapter,
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  session: Session = { mode: 'demo' },
  extra: Pick<ReadyState, 'profileId' | 'legacy'> = {},
  actions: Partial<Omit<AuthContextValue, 'state'>> = {},
) {
  await adapter.init()
  const user = await adapter.getCurrentUser()
  const auth = fakeAuth({ status: 'ready', session, adapter, user, ...extra }, actions)
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter>{ui}</MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}
