import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import '../../i18n'
import { CopyText } from '../../components/CopyText'
import { FakeGitHub } from '../../storage/github/fakeGitHub'
import { AuthContext } from '../auth/AuthContext'
import { LoginPage } from '../auth/LoginPage'
import { JoinPage } from './JoinPage'
import { SetupPage } from './SetupPage'

function renderAt(path: string) {
  const login = vi.fn(async () => {})
  const auth = { state: { status: 'loggedOut' as const }, login, logout: async () => {} }
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="setup" element={<SetupPage />} />
            <Route path="join" element={<JoinPage />} />
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return { login }
}

function mockClipboard() {
  const writeText = vi.fn<(text: string) => Promise<void>>(async () => {})
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  return writeText
}

afterEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('CopyText', () => {
  it('copies the text and confirms', async () => {
    const writeText = mockClipboard()
    render(<CopyText text="hello" label="Copy it" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy it' }))
    await screen.findByRole('button', { name: 'Copied' })
    expect(writeText).toHaveBeenCalledWith('hello')
  })

  it('shows the text selected when the clipboard is unavailable', async () => {
    render(<CopyText text={'line 1\nline 2'} label="Copy it" multiline />)
    expect(screen.queryByRole('textbox')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Copy it' }))
    const field = await screen.findByRole('textbox', { name: 'Copy it' })
    expect(field).toHaveValue('line 1\nline 2')
    expect(field).toHaveAttribute('readonly')
    expect(screen.getByRole('status')).toHaveTextContent(/Ctrl\+C/)
  })
})

describe('start page', () => {
  it('opens the setup wizard from the hero, the sign-in card and the steps', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Set up a team' })).toHaveAttribute('href', '/setup')
    expect(screen.getByRole('link', { name: 'Set up a team step by step' })).toHaveAttribute(
      'href',
      '/setup',
    )
    const steps = screen.getByRole('region', { name: 'How it works' })
    expect(within(steps).getByRole('link', { name: 'Open the setup guide' })).toHaveAttribute(
      'href',
      '/setup',
    )
    expect(within(steps).getByText(/Got an invite link/)).toBeInTheDocument()
  })

  it('explains order, owner and approval in the token help', () => {
    renderAt('/')
    const help = screen.getByText('How do I get a token?').closest('details')!
    expect(
      within(help).getByText(/created before you had access will not work/),
    ).toBeInTheDocument()
    expect(within(help).getByText(/switch it from your own username/)).toBeInTheDocument()
    expect(within(help).getByText(/approve new tokens by default/)).toBeInTheDocument()
    expect(within(help).getByRole('link', { name: /Open the token form/ })).toHaveAttribute(
      'href',
      expect.stringContaining('name=Workaddict'),
    )
  })
})

describe('sign-in diagnosis', () => {
  let gh: FakeGitHub
  beforeEach(() => {
    gh = new FakeGitHub('my-team', 'time-data')
    gh.users = { github_pat_anna: 'anna', ghp_anna: 'anna' }
    gh.accounts = { ben: 'User' }
    vi.stubGlobal('fetch', gh.fetch)
  })

  function signIn(repo: string, token = 'github_pat_anna') {
    fireEvent.change(screen.getByLabelText('Data repository'), { target: { value: repo } })
    fireEvent.change(screen.getByLabelText('GitHub token'), { target: { value: token } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  }

  it('puts token approval first for an organization repo and offers a message for the owner', async () => {
    renderAt('/')
    signIn('my-team/other')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Your token cannot see the repository my-team/other.')
    const causes = within(alert).getAllByRole('listitem')
    expect(causes[0]).toHaveTextContent(/waiting for approval/)
    expect(within(causes[0]!).getByRole('link')).toHaveAttribute(
      'href',
      'https://github.com/organizations/my-team/settings/personal-access-token-requests',
    )
    expect(alert).toHaveTextContent(/created the token before you had access/)

    const writeText = mockClipboard()
    fireEvent.click(within(alert).getByRole('button', { name: 'Copy message for the owner' }))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    const message = writeText.mock.calls[0]![0]
    expect(message).toContain('My GitHub username: anna')
    expect(message).toContain('my-team/other')
    expect(message).not.toContain('github_pat_anna')
  })

  it('skips approval and resource owner for classic tokens', async () => {
    renderAt('/')
    signIn('my-team/other', 'ghp_anna')
    const alert = await screen.findByRole('alert')
    expect(alert).not.toHaveTextContent(/waiting for approval/)
    expect(alert).toHaveTextContent(/needs the “repo” scope/)
  })

  it('points out a misspelled owner', async () => {
    renderAt('/')
    signIn('my-tema/time-data')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('There is no GitHub account or organization named “my-tema”.')
    expect(within(alert).queryByRole('button', { name: 'Copy message for the owner' })).toBeNull()
  })

  it('explains that fine-grained tokens cannot reach another person’s repo', async () => {
    renderAt('/')
    signIn('ben/time-data')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/belongs to the personal account of ben/)
    expect(alert).toHaveTextContent(/move the repository into a free GitHub organization/)
  })

  it('names the user’s own repo', async () => {
    renderAt('/')
    signIn('anna/time-data')
    expect(await screen.findByRole('alert')).toHaveTextContent(/in your own account/)
  })

  it('explains both causes of read-only access', async () => {
    gh.push = false
    renderAt('/')
    signIn('my-team/time-data')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'You can read the repository my-team/time-data, but not write to it.',
    )
    expect(alert).toHaveTextContent(/Contents: Read-only/)
    expect(alert).toHaveTextContent(/your role on the repository is Read/)
    expect(
      within(alert).getByRole('button', { name: 'Copy message for the owner' }),
    ).toBeInTheDocument()
  })

  it('signs in and remembers that the repo belongs to an organization', async () => {
    const { login } = renderAt('/')
    signIn('my-team/time-data')
    await waitFor(() => expect(login).toHaveBeenCalled())
    expect(login.mock.calls[0]).toEqual([
      expect.objectContaining({
        mode: 'github',
        repo: 'my-team/time-data',
        ownerType: 'Organization',
      }),
      true,
    ])
  })
})

describe('setup wizard', () => {
  /** The wizard asks who it is for first; most of these tests cover the team path. */
  const openTeamWizard = () => {
    renderAt('/setup')
    fireEvent.click(screen.getByRole('button', { name: /A team/ }))
  }

  it('builds every link from the entered names', () => {
    openTeamWizard()
    expect(screen.getByText(/Enter a valid organization name first/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Create …/ })).toBeNull()

    fireEvent.change(screen.getByLabelText('Organization name'), { target: { value: 'my-team' } })
    expect(screen.queryByText(/Enter a valid organization name first/)).toBeNull()
    const repoLink = screen.getByRole('link', { name: /Create my-team\/time-data/ })
    expect(repoLink).toHaveAttribute(
      'href',
      expect.stringMatching(
        /^https:\/\/github\.com\/new\?owner=my-team&name=time-data&visibility=private/,
      ),
    )
    expect(screen.getByRole('link', { name: /Open member privileges/ })).toHaveAttribute(
      'href',
      'https://github.com/organizations/my-team/settings/member_privileges',
    )
    expect(screen.getByRole('link', { name: /Open the token policy/ })).toHaveAttribute(
      'href',
      'https://github.com/organizations/my-team/settings/personal-access-tokens',
    )
    expect(screen.getByRole('link', { name: /Open the token form/ })).toHaveAttribute(
      'href',
      expect.stringContaining('name=Workaddict'),
    )
    expect(screen.getByText(/Write applies to all repositories of my-team/)).toBeInTheDocument()
    expect(screen.getAllByText(/^On GitHub:/).length).toBeGreaterThanOrEqual(6)
    expect(screen.getByLabelText('Data repository')).toHaveValue('my-team/time-data')
  })

  it('rejects an invalid organization name', () => {
    openTeamWizard()
    fireEvent.change(screen.getByLabelText('Organization name'), { target: { value: 'my team' } })
    expect(screen.getByText(/Only letters, digits and single hyphens/)).toBeInTheDocument()
    expect(screen.getByText(/Enter a valid organization name first/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Open member privileges/ })).toBeNull()
  })

  it('keeps progress across a reload', () => {
    openTeamWizard()
    fireEvent.change(screen.getByLabelText('Organization name'), { target: { value: 'my-team' } })
    const boxes = screen.getAllByRole('checkbox', { name: 'Done' })
    fireEvent.click(boxes[0]!)
    fireEvent.click(boxes[1]!)
    fireEvent.click(boxes[2]!)
    expect(screen.getByText('3 of 7 done')).toBeInTheDocument()

    document.body.innerHTML = ''
    renderAt('/setup')
    expect(screen.getByLabelText('Organization name')).toHaveValue('my-team')
    const again = screen.getAllByRole('checkbox', { name: 'Done' })
    expect(again.slice(0, 3).every((b) => (b as HTMLInputElement).checked)).toBe(true)
    expect(screen.getByText('3 of 7 done')).toBeInTheDocument()
  })

  it('mentions approval in the invite only when the owner keeps it on', () => {
    openTeamWizard()
    fireEvent.change(screen.getByLabelText('Organization name'), { target: { value: 'my-team' } })
    const message = () =>
      screen.getByRole('textbox', { name: 'Copy message' }) as HTMLTextAreaElement

    fireEvent.click(screen.getByRole('radio', { name: /Turn approval off/ }))
    expect(message().value).not.toMatch(/approve/)
    expect(screen.queryByRole('link', { name: /Open pending requests/ })).toBeNull()

    fireEvent.click(screen.getByRole('radio', { name: /Keep approval on/ }))
    expect(message().value).toMatch(/approve/)
    expect(screen.getByRole('link', { name: /Open pending requests/ })).toHaveAttribute(
      'href',
      'https://github.com/organizations/my-team/settings/personal-access-token-requests',
    )
    expect((screen.getByRole('textbox', { name: 'Copy link' }) as HTMLInputElement).value).toMatch(
      /#\/join\?repo=my-team\/time-data$/,
    )
  })

  it('generates GitHub CLI commands for valid usernames only', () => {
    openTeamWizard()
    fireEvent.change(screen.getByLabelText('Organization name'), { target: { value: 'my-team' } })
    fireEvent.change(screen.getByLabelText(/GitHub usernames/), {
      target: { value: 'anna, ben; x' },
    })
    const commands = (screen.getByRole('textbox', { name: 'Copy commands' }) as HTMLTextAreaElement)
      .value
    expect(commands).toContain('gh api -X PUT orgs/my-team/memberships/anna -f role=member')
    expect(commands).not.toContain('ben')
    expect(screen.getByRole('alert')).toHaveTextContent('Not valid GitHub usernames: ben;')
  })

  it('skips the organization steps when the setup is for one person', () => {
    renderAt('/setup')
    fireEvent.click(screen.getByRole('button', { name: /Just me/ }))
    fireEvent.change(screen.getByLabelText('Your GitHub username'), {
      target: { value: 'my-name' },
    })

    // A private repository in your own account: nothing to share, approve or invite.
    expect(screen.getByText('0 of 2 done')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Create an organization/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /Open member privileges/ })).toBeNull()
    expect(screen.queryByRole('link', { name: /Open the token policy/ })).toBeNull()
    expect(screen.queryByRole('textbox', { name: 'Copy link' })).toBeNull()
    expect(screen.queryByLabelText('Organization name')).toBeNull()

    expect(screen.getByRole('link', { name: /Create my-name\/time-data/ })).toHaveAttribute(
      'href',
      expect.stringMatching(
        /^https:\/\/github\.com\/new\?owner=my-name&name=time-data&visibility=private/,
      ),
    )
    expect(screen.getByRole('link', { name: /Open the token form/ })).toHaveAttribute(
      'href',
      expect.stringContaining('name=Workaddict'),
    )
    expect(screen.getByLabelText('Data repository')).toHaveValue('my-name/time-data')
    expect(screen.getByText(/cannot be shared with fine-grained tokens/)).toBeInTheDocument()
  })

  it('lets the user switch between the solo and team paths', () => {
    renderAt('/setup')
    fireEvent.click(screen.getByRole('button', { name: /Just me/ }))
    expect(screen.getByLabelText('Your GitHub username')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    fireEvent.click(screen.getByRole('button', { name: /A team/ }))
    expect(screen.getByLabelText('Organization name')).toBeInTheDocument()
    expect(screen.getByText('0 of 7 done')).toBeInTheDocument()
  })
})

describe('join flow', () => {
  it('shows the repository and the invitation link', () => {
    renderAt('/join?repo=my-team/time-data')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Join my-team/time-data' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open the invitation/ })).toHaveAttribute(
      'href',
      'https://github.com/orgs/my-team/invitation',
    )
  })

  it('keeps the token step locked until the member can see the repository', () => {
    renderAt('/join?repo=my-team/time-data')
    expect(screen.queryByRole('link', { name: /Open the token form/ })).toBeNull()
    expect(screen.queryByLabelText('GitHub token')).toBeNull()
    expect(screen.getAllByText('Unlocks once you can see the repository.')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'I can see it' }))
    expect(screen.getByRole('link', { name: /Open the token form/ })).toHaveAttribute(
      'href',
      expect.stringContaining('name=Workaddict'),
    )
    expect(screen.getByText(/switch it from your own username to my-team/)).toBeInTheDocument()
    expect(screen.getByLabelText('Data repository')).toHaveValue('my-team/time-data')
    expect(screen.getByLabelText('Data repository')).toHaveAttribute('readonly')
    fireEvent.click(screen.getByRole('button', { name: 'Change repository' }))
    expect(screen.getByLabelText('Data repository')).not.toHaveAttribute('readonly')
  })

  it('sends a member without access to the owner instead of the token step', async () => {
    renderAt('/join?repo=my-team/time-data')
    fireEvent.click(screen.getByRole('button', { name: 'I get a 404 page' }))
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/Don’t create a token now/)
    expect(screen.queryByRole('link', { name: /Open the token form/ })).toBeNull()

    const writeText = mockClipboard()
    fireEvent.click(within(alert).getByRole('button', { name: 'Copy message for the owner' }))
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('my-team/time-data')),
    )

    fireEvent.click(within(alert).getByRole('button', { name: 'Check again' }))
    expect(screen.getByRole('button', { name: 'I can see it' })).toBeInTheDocument()
  })

  it('falls back to the start page for an invalid link', () => {
    renderAt('/join?repo=not%20a%20repo')
    expect(screen.getByText(/This invite link is invalid/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Free and open-source time tracking' }),
    ).toBeInTheDocument()
  })
})
