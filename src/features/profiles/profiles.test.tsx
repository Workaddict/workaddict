import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../app/App'
import { ConfirmProvider } from '../../components/Modal'
import { ToastProvider } from '../../components/Toasts'
import '../../i18n'
import { FakeGitHub } from '../../storage/github/fakeGitHub'
import { AuthProvider } from '../auth/AuthContext'
import { signInAttempt } from '../auth/signInAttempt'
import { encodeBase64 } from '../../storage/github/base64'
import { TEST_ITERATIONS } from './testVault'
import { clearTimerProbeCache, probeTimers } from './timerProbe'
import {
  emptyVault,
  saveProfile,
  setRejected,
  tokenOf,
  type NewToken,
  type VaultBlob,
  type VaultData,
} from './vault'
import { createVaultStore, getVault, resetVaultForTests, type VaultStore } from './vaultStore'
import { browserEnv, VAULT_KEY } from './vaultSync'

const PASS = 'correct horse battery'
const ACME = 'github_pat_acme'
const GLOBEX = 'github_pat_globex'
const acmeToken: NewToken = { token: ACME, owner: 'acme', login: 'anna', kind: 'fineGrained' }
const globexToken: NewToken = { token: GLOBEX, owner: 'globex', login: 'anna', kind: 'fineGrained' }

let repos: FakeGitHub[]

/** One fake GitHub per repository; `/user` and owner lookups go to the first. */
function routeFetch(): typeof fetch {
  return async (input, init) => {
    const path = new URL(String(input)).pathname
    const m = /^\/repos\/([^/]+)\/([^/]+)/.exec(path)
    const gh = m
      ? repos.find(
          (g) =>
            g.owner.toLowerCase() === m[1]!.toLowerCase() &&
            g.repo.toLowerCase() === decodeURIComponent(m[2]!).toLowerCase(),
        )
      : repos[0]
    if (!gh) {
      return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 })
    }
    return gh.fetch(input, init)
  }
}

function setUsers(users: Record<string, string>) {
  for (const gh of repos) gh.users = { ...users }
}

function newStore(): VaultStore {
  const store = createVaultStore(browserEnv(), { iterations: TEST_ITERATIONS })
  resetVaultForTests(store)
  return store
}

function sample(): VaultData {
  let [data] = saveProfile(emptyVault(), { repo: 'acme/time-data', branch: 'main' }, acmeToken, 1)
  ;[data] = saveProfile(data, { repo: 'globex/hours', branch: 'main' }, globexToken, 2)
  return data
}

function renderApp(path = '/') {
  window.location.hash = `#${path}`
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const clear = vi.spyOn(queryClient, 'clear')
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { queryClient, clear }
}

const avatar = () => screen.findByRole('button', { name: 'anna' }, { timeout: 3000 })

async function openMenu() {
  fireEvent.click(await avatar())
  return screen.getByRole('menu')
}

async function currentRepo() {
  const menu = await openMenu()
  const label = menu.querySelector('.menu-label')!.textContent
  fireEvent.click(await avatar())
  return label
}

beforeEach(() => {
  repos = [
    new FakeGitHub('acme', 'time-data'),
    new FakeGitHub('acme', 'other-data'),
    new FakeGitHub('globex', 'hours'),
  ]
  setUsers({ [ACME]: 'anna', [GLOBEX]: 'anna' })
  vi.stubGlobal('fetch', routeFetch())
})

afterEach(async () => {
  await getVault().forget()
  vi.unstubAllGlobals()
  localStorage.clear()
  sessionStorage.clear()
  signInAttempt.clear()
  clearTimerProbeCache()
  window.location.hash = ''
})

describe('profile sessions', () => {
  it('opens the most recently used profile and switches with one click', async () => {
    const store = newStore()
    await store.create(PASS, 'ask', sample())
    const { clear } = renderApp()
    expect(await currentRepo()).toContain('globex/hours')
    const chip = () => document.querySelector('.header .project-chip')!
    expect(chip()).toHaveTextContent('globex/hours')
    expect(chip()).not.toHaveClass('is-switched')

    const menu = await openMenu()
    expect(within(menu).getByRole('menuitemradio', { name: /globex\/hours/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(within(menu).getByRole('menuitem', { name: 'Lock' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: /Add workspace/ })).toBeInTheDocument()
    clear.mockClear()
    fireEvent.click(within(menu).getByRole('menuitemradio', { name: /acme\/time-data/ }))
    await waitFor(async () => expect(await currentRepo()).toContain('acme/time-data'))
    expect(chip()).toHaveTextContent('acme/time-data')
    expect(chip()).toHaveClass('is-switched')
    expect(clear).toHaveBeenCalled()
    expect(sessionStorage.getItem('workaddict.activeProfile')).toBe(
      store.getSnapshot().data!.profiles.find((p) => p.repo === 'acme/time-data')!.id,
    )
  })

  it('opens the switcher from the workspace pill and renames a workspace', async () => {
    const store = newStore()
    await store.create(PASS, 'ask', sample())
    renderApp('/settings')
    const pill = await screen.findByRole('button', {
      name: 'Workspace: globex/hours. Switch workspace',
    })
    fireEvent.click(pill)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(pill)
    expect(screen.queryByRole('menu')).toBeNull()

    fireEvent.click(await screen.findByRole('button', { name: 'Rename: globex/hours' }))
    fireEvent.change(screen.getByLabelText('Workspace name'), {
      target: { value: 'Globex client' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(
      await screen.findByRole('button', { name: 'Workspace: Globex client. Switch workspace' }),
    ).toBeInTheDocument()
    expect(store.getSnapshot().data!.profiles.find((p) => p.repo === 'globex/hours')!.label).toBe(
      'Globex client',
    )
    expect(localStorage.getItem(VAULT_KEY)).not.toContain('Globex client')
  })

  it('marks a rejected token and shows the profile picker', async () => {
    const store = newStore()
    await store.create(PASS, 'ask', sample())
    setUsers({ [ACME]: 'anna' })
    renderApp()
    expect(await screen.findByRole('heading', { name: 'Choose a workspace' })).toBeInTheDocument()
    expect(screen.getByText(/GitHub rejected the saved token/)).toBeInTheDocument()
    const rejected = screen.getByRole('link', { name: /globex\/hours.*Token rejected/ })
    expect(rejected).toHaveAttribute('href', '#/fix?e=invalidToken&repo=globex/hours&from=profile')
    const data = store.getSnapshot().data!
    expect(data.tokens.find((t) => t.token === GLOBEX)?.rejected).toBe(true)
    expect(localStorage.getItem(VAULT_KEY)).not.toContain(GLOBEX)
  })

  it('keeps tokens out of plaintext storage', async () => {
    const store = newStore()
    await store.create(PASS, 'ask', sample())
    renderApp()
    await avatar()
    const everything = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })
    for (const secret of [ACME, GLOBEX, 'acme/time-data', 'globex/hours']) {
      expect(everything).not.toContain(secret)
    }
  })
})

describe('start page', () => {
  it('asks for the passphrase without showing repository names', async () => {
    const store = newStore()
    await store.create(PASS, 'ask', sample())
    await store.lock()
    renderApp()
    expect(
      await screen.findByRole('heading', { name: 'Unlock your workspaces' }),
    ).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/acme|globex/)

    fireEvent.change(screen.getByLabelText('Passphrase'), { target: { value: 'wrong one!!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong passphrase')
    expect(store.getSnapshot().status).toBe('locked')

    fireEvent.change(screen.getByLabelText('Passphrase'), { target: { value: PASS } })
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))
    expect(await currentRepo()).toContain('globex/hours')
  })

  it('locks from the menu', async () => {
    const store = newStore()
    await store.create(PASS, 'ask', sample())
    renderApp()
    const menu = await openMenu()
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Lock' }))
    expect(
      await screen.findByRole('heading', { name: 'Unlock your workspaces' }),
    ).toBeInTheDocument()
    expect(store.getSnapshot().status).toBe('locked')
  })

  it('resets after a forgotten passphrase', async () => {
    const store = newStore()
    await store.create(PASS, 'stay', sample())
    await store.lock()
    renderApp()
    fireEvent.click(await screen.findByRole('button', { name: 'Forgot passphrase?' }))
    expect(screen.getByText(/Nothing changes on GitHub/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset workspaces' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reset workspaces' }))
    expect(
      await screen.findByRole('heading', { name: 'Already set up? Sign in' }),
    ).toBeInTheDocument()
    expect(localStorage.getItem(VAULT_KEY)).toBeNull()
  })

  it('signs in without saving from the unlock screen', async () => {
    const store = newStore()
    await store.create(PASS, 'ask', sample())
    await store.lock()
    renderApp()
    fireEvent.click(await screen.findByRole('button', { name: 'Sign in without saving' }))
    expect(screen.getByLabelText('Save as a workspace on this device')).not.toBeChecked()
  })
})

describe('adding a project', () => {
  async function signedInToAcme() {
    const store = newStore()
    const [data] = saveProfile(emptyVault(), { repo: 'acme/time-data', branch: 'main' }, acmeToken)
    await store.create(PASS, 'ask', data)
    renderApp()
    await avatar()
    return store
  }

  async function goToAdd(repo: string) {
    const menu = await openMenu()
    fireEvent.click(within(menu).getByRole('menuitem', { name: /Add workspace/ }))
    fireEvent.change(await screen.findByLabelText('Data repository'), { target: { value: repo } })
  }

  it('reuses the token of the same owner', async () => {
    const store = await signedInToAcme()
    await goToAdd('acme/other-data')
    expect(screen.getByLabelText('Use your token for acme')).toBeChecked()
    expect(screen.queryByLabelText('GitHub token')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Add workspace' }))
    await waitFor(async () => expect(await currentRepo()).toContain('acme/other-data'))
    const data = store.getSnapshot().data!
    expect(data.tokens).toHaveLength(1)
    expect(data.profiles.map((p) => p.repo).sort()).toEqual(['acme/other-data', 'acme/time-data'])
  })

  it('asks for a new token for another organization', async () => {
    await signedInToAcme()
    await goToAdd('globex/hours')
    expect(screen.queryByLabelText('Use your token for acme')).toBeNull()
    fireEvent.change(screen.getByLabelText('GitHub token'), { target: { value: GLOBEX } })
    fireEvent.click(screen.getByRole('button', { name: 'Add workspace' }))
    await waitFor(async () => expect(await currentRepo()).toContain('globex/hours'))
  })

  it('shows the fix page while staying signed in', async () => {
    await signedInToAcme()
    await goToAdd('globex/hours')
    fireEvent.change(screen.getByLabelText('GitHub token'), { target: { value: 'github_pat_bad' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add workspace' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: /GitHub rejected this token/ }),
    ).toBeInTheDocument()
    expect(window.location.hash).toBe('#/fix?e=invalidToken&repo=globex/hours&from=add')
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: 'Change token or repository' }))
    expect(await screen.findByLabelText('Data repository')).toHaveValue('globex/hours')
    fireEvent.click(screen.getByRole('link', { name: '← Back' }))
    expect(await currentRepo()).toContain('acme/time-data')
  })

  it('opens an existing profile instead of adding it twice', async () => {
    await signedInToAcme()
    await goToAdd('ACME/time-data')
    expect(screen.getByText('You already have a workspace for acme/time-data.')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Replace token for this workspace' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add workspace' })).toBeDisabled()
  })
})

describe('replacing a rejected token', () => {
  it('repairs every profile that used it', async () => {
    const store = newStore()
    let [data] = saveProfile(emptyVault(), { repo: 'acme/time-data', branch: 'main' }, acmeToken, 2)
    ;[data] = saveProfile(data, { repo: 'acme/other-data', branch: 'main' }, acmeToken, 1)
    await store.create(PASS, 'ask', setRejected(data, ACME, true))
    setUsers({ github_pat_new: 'anna' })
    renderApp()

    fireEvent.click(await screen.findByRole('link', { name: /acme\/time-data.*Token rejected/ }))
    fireEvent.click(await screen.findByRole('link', { name: 'Replace token for this workspace' }))
    expect(await screen.findByLabelText('Data repository')).toHaveAttribute('readonly')
    fireEvent.change(screen.getByLabelText('GitHub token'), { target: { value: 'github_pat_new' } })
    fireEvent.click(screen.getByRole('button', { name: 'Replace token' }))

    await waitFor(async () => expect(await currentRepo()).toContain('acme/time-data'))
    const after = store.getSnapshot().data!
    expect(after.tokens).toEqual([expect.objectContaining({ token: 'github_pat_new' })])
    expect(after.profiles.every((p) => !tokenOf(after, p)?.rejected)).toBe(true)
  })
})

describe('switcher marks', () => {
  it('marks profiles with a rejected token in the menu', async () => {
    const store = newStore()
    let [data] = saveProfile(emptyVault(), { repo: 'acme/time-data', branch: 'main' }, acmeToken, 2)
    ;[data] = saveProfile(data, { repo: 'globex/hours', branch: 'main' }, globexToken, 1)
    await store.create(PASS, 'ask', setRejected(data, GLOBEX, true))
    renderApp()
    const menu = await openMenu()
    expect(
      within(menu).getByRole('menuitem', { name: /globex\/hours.*Token rejected/ }),
    ).toBeInTheDocument()
  })

  it('finds a running timer in another profile, at most 4 requests at a time', async () => {
    let data = emptyVault()
    for (let i = 0; i < 6; i++) {
      ;[data] = saveProfile(data, { repo: `acme/repo${i}`, branch: 'main' }, acmeToken)
    }
    let inFlight = 0
    let peak = 0
    const fetchFn: typeof fetch = async (input) => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await new Promise((r) => setTimeout(r, 5))
      inFlight--
      const url = String(input)
      if (url.includes('/repos/acme/repo2/contents/timers/anna.json')) {
        const timer = { id: 't1', login: 'anna', start: '2026-10-07T08:00:00Z' }
        return new Response(JSON.stringify({ content: encodeBase64(JSON.stringify(timer)) }))
      }
      if (url.includes('repo3')) return new Response('{}', { status: 500 })
      return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 })
    }
    const ids = data.profiles.map((p) => p.id)
    const running = await probeTimers(data, ids, fetchFn)
    expect([...running]).toEqual([data.profiles[2]!.id])
    expect(peak).toBeLessThanOrEqual(4)
  })
})

describe('export, import and migration', () => {
  async function exportedFile(data = sample(), passphrase = PASS) {
    const other = createVaultStore(
      { ...browserEnv(), channel: null, storage: memoryStorage() },
      { iterations: TEST_ITERATIONS },
    )
    await other.create(passphrase, 'ask', data)
    const blob = other.exportBlob()!
    other.dispose()
    return new File([JSON.stringify(blob)], 'workaddict-workspaces-2026-10-07.json', {
      type: 'application/json',
    })
  }

  function chooseFile(file: File) {
    const input = document.querySelector<HTMLInputElement>('input[type=file]')!
    fireEvent.change(input, { target: { files: [file] } })
  }

  it('imports on a new device and opens the most recent profile', async () => {
    newStore()
    const file = await exportedFile()
    renderApp()
    fireEvent.click(await screen.findByRole('button', { name: 'Import workspaces' }))
    chooseFile(file)
    fireEvent.change(await screen.findByLabelText('Passphrase of the file'), {
      target: { value: PASS },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(await within(dialog).findByLabelText(/Stay unlocked on this device/))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Import workspaces' }))
    expect(await currentRepo()).toContain('globex/hours')
    expect(getVault().getSnapshot().mode).toBe('stay')
  })

  it('refuses a wrong file passphrase and leaves the vault unchanged', async () => {
    const store = newStore()
    const [local] = saveProfile(emptyVault(), { repo: 'acme/time-data', branch: 'main' }, acmeToken)
    await store.create(PASS, 'ask', local)
    const file = await exportedFile(sample(), 'another passphrase')
    renderApp('/settings')
    fireEvent.click(await screen.findByRole('button', { name: 'Import workspaces' }))
    chooseFile(file)
    fireEvent.change(await screen.findByLabelText('Passphrase of the file'), {
      target: { value: PASS },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong passphrase for this file')
    const data = store.getSnapshot().data!
    expect(data.profiles.map((p) => p.repo)).toEqual(['acme/time-data'])
    expect(data.tokens.map((t) => t.token)).toEqual([ACME])
  })

  it('merges by repository and asks about a different token', async () => {
    const store = newStore()
    const [local] = saveProfile(emptyVault(), { repo: 'acme/time-data', branch: 'main' }, acmeToken)
    await store.create(PASS, 'ask', local)
    let [imported] = saveProfile(
      emptyVault(),
      { repo: 'acme/time-data', branch: 'main' },
      {
        ...acmeToken,
        token: 'github_pat_acme2',
      },
    )
    ;[imported] = saveProfile(imported, { repo: 'globex/hours', branch: 'main' }, globexToken)
    const file = await exportedFile(imported, 'file passphrase')
    renderApp('/settings')
    fireEvent.click(await screen.findByRole('button', { name: 'Import workspaces' }))
    chooseFile(file)
    fireEvent.change(await screen.findByLabelText('Passphrase of the file'), {
      target: { value: 'file passphrase' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(
      await screen.findByText('acme/time-data has a different token in the file'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Use the imported token'))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Import workspaces' }),
    )
    await waitFor(() => expect(store.getSnapshot().data!.profiles).toHaveLength(2))
    const data = store.getSnapshot().data!
    expect(data.tokens.map((t) => t.token).sort()).toEqual(['github_pat_acme2', GLOBEX])
    expect(await store.verify(PASS)).toBe(true)
  })

  it('exports the encrypted vault after the passphrase is re-entered', async () => {
    const store = newStore()
    await store.create(PASS, 'ask', sample())
    const created: Blob[] = []
    URL.createObjectURL = (b: Blob) => (created.push(b), 'blob:x')
    URL.revokeObjectURL = () => {}
    renderApp('/settings')
    fireEvent.click(await screen.findByRole('button', { name: 'Export workspaces' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(/useless/)
    fireEvent.change(within(dialog).getByLabelText('Passphrase'), { target: { value: PASS } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Export workspaces' }))
    await waitFor(() => expect(created).toHaveLength(1))
    const text = await created[0]!.text()
    const blob = JSON.parse(text) as VaultBlob
    expect(blob.rev).toBeUndefined()
    expect(text).not.toMatch(/acme|globex|github_pat/)
  })

  it('migrates a plaintext session and deletes it', async () => {
    newStore()
    localStorage.setItem(
      'workaddict.session',
      JSON.stringify({ mode: 'github', token: ACME, repo: 'acme/time-data', branch: 'main' }),
    )
    renderApp()
    await avatar()
    fireEvent.click(
      screen.getByRole('button', { name: 'Protect with a passphrase and enable workspaces' }),
    )
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('New passphrase'), { target: { value: PASS } })
    fireEvent.change(within(dialog).getByLabelText('Repeat the passphrase'), {
      target: { value: PASS },
    })
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', {
          name: 'Protect with a passphrase and enable workspaces',
        }),
      )
    })
    await waitFor(() => expect(localStorage.getItem('workaddict.session')).toBeNull())
    expect(
      getVault()
        .getSnapshot()
        .data!.profiles.map((p) => p.repo),
    ).toEqual(['acme/time-data'])
    expect(await currentRepo()).toContain('acme/time-data')
    const menu = await openMenu()
    expect(within(menu).getByRole('menuitem', { name: 'Lock' })).toBeInTheDocument()
  })
})

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    get: (k: string) => map.get(k) ?? null,
    set: (k: string, v: string) => void map.set(k, v),
    remove: (k: string) => void map.delete(k),
  }
}
