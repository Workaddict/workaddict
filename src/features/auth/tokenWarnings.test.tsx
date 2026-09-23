import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '../../i18n'
import { ConfirmProvider } from '../../components/Modal'
import { ToastProvider } from '../../components/Toasts'
import { createMemoryAdapter } from '../../storage'
import SettingsPage from '../settings/SettingsPage'
import { AuthContext, type AuthState } from './AuthContext'
import { LoginPage } from './LoginPage'
import { tokenKind, type Session } from './session'

const CLASSIC_WARNING = /This is a classic token/

function renderWith(state: AuthState, ui: React.ReactNode) {
  const auth = { state, login: async () => {}, logout: async () => {} }
  return render(
    <QueryClientProvider client={new QueryClient()}>
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

describe('tokenKind', () => {
  it('tells classic and fine-grained tokens apart', () => {
    expect(tokenKind('ghp_abc')).toBe('classic')
    expect(tokenKind('  ghp_abc ')).toBe('classic')
    expect(tokenKind('github_pat_abc')).toBe('fineGrained')
    expect(tokenKind('gho_abc')).toBe('other')
  })
})

describe('login page token warnings', () => {
  const typeToken = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText('github_pat_…'), { target: { value } })

  it('warns while a classic token is entered, without blocking sign-in', () => {
    renderWith({ status: 'loggedOut' }, <LoginPage />)
    expect(screen.queryByText(CLASSIC_WARNING)).toBeNull()
    typeToken('ghp_123')
    const warning = screen.getByText(CLASSIC_WARNING)
    expect(within(warning).getByRole('link')).toHaveAttribute(
      'href',
      expect.stringMatching(
        /^https:\/\/github\.com\/settings\/personal-access-tokens\/new\?.*name=Workaddict/,
      ),
    )
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('shows no warning for a fine-grained token', () => {
    renderWith({ status: 'loggedOut' }, <LoginPage />)
    typeToken('github_pat_123')
    expect(screen.queryByText(CLASSIC_WARNING)).toBeNull()
  })

  it('explains that "Remember me" is for personal devices', () => {
    renderWith({ status: 'loggedOut' }, <LoginPage />)
    expect(screen.getByText(/Use it only on your own device/)).toBeInTheDocument()
  })
})

describe('settings token warning', () => {
  const me = { login: 'alice', avatarUrl: null }

  async function renderSettings(session: Session) {
    const adapter = createMemoryAdapter(me, { collaborators: [me], admins: ['alice'] })
    await adapter.init()
    renderWith({ status: 'ready', session, adapter, user: me }, <SettingsPage />)
    await screen.findByText('alice')
  }

  const github = (token: string, scopes?: string[]): Session => ({
    mode: 'github',
    token,
    repo: 'team/data',
    branch: 'main',
    ...(scopes ? { scopes } : {}),
  })

  it('warns about a classic token and its repo scope', async () => {
    await renderSettings(github('ghp_123', ['repo', 'read:org']))
    expect(screen.getByText(/signed in with a classic token/)).toBeInTheDocument()
    expect(screen.getByText(/all private repositories of your account/)).toBeInTheDocument()
  })

  it('omits the repo-scope sentence when GitHub did not report it', async () => {
    await renderSettings(github('ghp_123', ['public_repo']))
    expect(screen.getByText(/signed in with a classic token/)).toBeInTheDocument()
    expect(screen.queryByText(/all private repositories/)).toBeNull()
  })

  it('shows nothing for a fine-grained token', async () => {
    await renderSettings(github('github_pat_123'))
    expect(screen.queryByText(/classic token/)).toBeNull()
  })
})
