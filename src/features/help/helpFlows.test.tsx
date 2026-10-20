import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Layout } from '../../app/Layout'
import { ConfirmProvider } from '../../components/Modal'
import { ToastProvider } from '../../components/Toasts'
import type { Member, TimeEntry } from '../../domain/types'
import { setHintLevel } from '../../hintLevel'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { fakeAuth } from '../../test/fakeAuth'
import { AuthContext } from '../auth/AuthContext'
import type { Session } from '../auth/session'
import SettingsPage from '../settings/SettingsPage'
import StatsPage from '../stats/StatsPage'
import { TrackerPage } from '../tracker/TrackerPage'
import WorkGroupsPage from '../workgroups/WorkGroupsPage'
import { resetChecklistForTests } from './checklistState'
import HelpPage from './HelpPage'
import { HelpOverlayProvider } from './HelpOverlayProvider'
import { initFirstVersion, NewDot, setVersionsForTests } from './newFeatures'
import { getWelcome, requestTourAfterSignIn, resetTourForTests, startTour } from './tourStore'
import { findTarget, stepsFor } from './tourSteps'

const alice: Member = { login: 'alice', avatarUrl: null } // owner → team leader
const bob: Member = { login: 'bob', avatarUrl: null } // worker
const carol: Member = { login: 'carol', avatarUrl: null } // editor
const github: Session = {
  mode: 'github',
  token: 'github_pat_x',
  repo: 'acme/time-data',
  branch: 'main',
}

function entry(login: string, daysAgo: number): TimeEntry {
  const start = new Date(Date.now() - daysAgo * 24 * 3600_000)
  return {
    id: `e-${login}-${daysAgo}`,
    login,
    start: start.toISOString(),
    end: new Date(start.getTime() + 3600_000).toISOString(),
    description: 'Work',
    projectId: null,
    tagIds: [],
    createdAt: start.toISOString(),
    updatedAt: start.toISOString(),
  }
}

function Where() {
  return <span data-testid="path">{useLocation().pathname}</span>
}

async function renderApp(
  me: Member,
  { path = '/', session = github, entries = [] as TimeEntry[], projects = false } = {},
) {
  const files: Record<string, unknown> = {}
  if (me === carol) files['roles.json'] = { roles: { carol: 'editor' } }
  for (const e of entries) {
    const key = `entries/${e.login}/${e.start.slice(0, 7)}.json`
    files[key] = [...((files[key] as TimeEntry[] | undefined) ?? []), e]
  }
  if (projects) {
    files['workspace.json'] = {
      projects: [{ id: 'p1', name: 'Website', color: '#4f46e5', archived: false }],
      tags: [],
    }
  }
  const store = new MemoryFileStore(files)
  const adapter = createMemoryAdapter(me, {
    store,
    collaborators: me === carol ? [alice, bob, carol] : [alice, bob],
    admins: ['alice'],
  })
  await adapter.init()
  const user = await adapter.getCurrentUser()
  const auth = fakeAuth({ status: 'ready', session, adapter, user })
  const writes = vi.spyOn(store, 'write')
  const writeMany = vi.spyOn(store, 'writeMany')
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthContext.Provider value={auth}>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter initialEntries={[path]}>
              <HelpOverlayProvider signedIn>
                <Where />
                <Routes>
                  <Route element={<Layout />}>
                    <Route index element={<TrackerPage />} />
                    <Route path="stats" element={<StatsPage />} />
                    <Route path="groups" element={<WorkGroupsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="help" element={<HelpPage />} />
                    <Route path="help/:topic" element={<HelpPage />} />
                  </Route>
                </Routes>
              </HelpOverlayProvider>
            </MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return { writes, writeMany }
}

function newDevice() {
  localStorage.removeItem('workaddict.tour')
  resetTourForTests()
}

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  setHintLevel('guided')
  localStorage.clear()
  resetChecklistForTests()
})

describe('help pages in the app', () => {
  it('shows a topic inside the app layout with related topics and feedback', async () => {
    await renderApp(alice, { path: '/help/roles' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Roles' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Team now' })).toHaveAttribute('href', '/help/team-now')

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fireEvent.click(screen.getByRole('button', { name: /No/ }))
    const ask = screen.getByRole('link', { name: /Ask a question on GitHub/ })
    expect(ask.getAttribute('href')).toContain('discussions/new')
    expect(ask.getAttribute('href')).toContain('title=Help%3A+Roles')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('shows the index with a notice for an unknown topic', async () => {
    await renderApp(alice, { path: '/help/does-not-exist' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Help' })).toBeInTheDocument()
    expect(screen.getByText(/Topic not found/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Roles/ })).toBeInTheDocument()
  })

  it('highlights a glossary term from its link', async () => {
    await renderApp(alice, { path: '/help/glossary?term=demo' })
    await screen.findByRole('heading', { level: 1, name: 'Glossary' })
    const demo = screen.getByText('Demo').closest('div')!
    expect(demo).toHaveAttribute('aria-current', 'true')
  })

  it('opens the topic from a "?" button', async () => {
    await renderApp(alice, { path: '/settings' })
    fireEvent.click(await screen.findByRole('link', { name: 'Help: Roles' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Roles' })).toBeInTheDocument()
  })
})

describe('help overlay', () => {
  it('opens with ? and returns focus on Escape', async () => {
    const user = userEvent.setup()
    await renderApp(alice)
    await screen.findByRole('heading', { name: 'Tracker' })
    const before = screen.getByRole('button', { name: 'Me' })
    before.focus()
    await user.keyboard('?')
    const dialog = await screen.findByRole('dialog', { name: 'Help' })
    await waitFor(() => expect(within(dialog).getByRole('searchbox')).toHaveFocus())
    expect(within(dialog).getByText('Open help')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Help' })).toBeNull()
    expect(before).toHaveFocus()
  })

  it('does not open while typing a question mark', async () => {
    const user = userEvent.setup()
    await renderApp(alice)
    const field = (await screen.findAllByRole('textbox', { name: 'What are you working on?' }))[0]!
    await user.type(field, 'why?')
    expect(field).toHaveValue('why?')
    expect(screen.queryByRole('dialog', { name: 'Help' })).toBeNull()
  })

  it('opens from the avatar menu and searches', async () => {
    const user = userEvent.setup()
    await renderApp(alice)
    await user.click(await screen.findByRole('button', { name: 'alice' }))
    await user.click(screen.getByRole('menuitem', { name: 'Help' }))
    const dialog = await screen.findByRole('dialog', { name: 'Help' })
    await user.type(within(dialog).getByRole('searchbox'), 'passphrase')
    expect(
      within(dialog).getByRole('link', { name: /Workspaces & passphrase/ }),
    ).toBeInTheDocument()
  })
})

describe('guided tour', () => {
  it('shows team steps to team leaders and moves between pages without writing', async () => {
    const user = userEvent.setup()
    const { writes, writeMany } = await renderApp(alice)
    await screen.findByRole('heading', { name: 'Tracker' })
    act(() => startTour())
    const bubble = await screen.findByRole('dialog', { name: 'Track your time' })
    expect(within(bubble).getByText('Step 1 of 11')).toBeInTheDocument()
    for (const next of ['Your entries', 'Me or everyone', 'Team now', 'Projects & tags']) {
      await user.click(screen.getByRole('button', { name: 'Next' }))
      await screen.findByRole('dialog', { name: next })
    }
    expect(screen.getByTestId('path')).toHaveTextContent('/groups')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('dialog', { name: 'Statistics' })
    expect(screen.getByTestId('path')).toHaveTextContent('/stats')
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await screen.findByRole('dialog', { name: 'Projects & tags' })
    expect(writes).not.toHaveBeenCalled()
    expect(writeMany).not.toHaveBeenCalled()
  })

  it('leaves out team steps for workers and ends with Escape', async () => {
    const user = userEvent.setup()
    await renderApp(bob)
    await screen.findByRole('heading', { name: 'Tracker' })
    act(() => startTour())
    const bubble = await screen.findByRole('dialog', { name: 'Track your time' })
    expect(within(bubble).getByText('Step 1 of 8')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Track your time' })).toBeNull()
    expect(getWelcome(false).status).toBe('done')
  })

  it.each([
    ['worker', bob],
    ['editor', carol],
    ['leader', alice],
  ] as const)('finds every step target for a %s', async (role, me) => {
    const steps = stepsFor(role)
    for (const route of new Set(steps.map((s) => s.route ?? '/'))) {
      cleanup()
      await renderApp(me, { path: route, entries: [entry(me.login, 0)] })
      const here = steps.filter((s) => (s.route ?? '/') === route || !s.route)
      for (const s of here) {
        await waitFor(() => expect(findTarget(s.target), s.target).not.toBeNull())
      }
    }
  })

  it('keeps the bubble inside a 375 px screen', async () => {
    vi.stubGlobal('innerWidth', 375)
    vi.stubGlobal('innerHeight', 667)
    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const hit = this.getAttribute('data-tour') === 'timer'
      return DOMRect.fromRect(hit ? { x: 300, y: 600, width: 60, height: 40 } : {})
    })
    const size = (v: number) =>
      function (this: HTMLElement) {
        return this.classList.contains('tour-bubble') ? v : 0
      }
    const w = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(size(340))
    const h = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(size(220))
    try {
      await renderApp(bob)
      await screen.findByRole('heading', { name: 'Tracker' })
      act(() => startTour())
      const bubble = await screen.findByRole('dialog', { name: 'Track your time' })
      const top = parseFloat(bubble.style.top)
      const left = parseFloat(bubble.style.left)
      expect(left).toBeGreaterThanOrEqual(0)
      expect(left + 340).toBeLessThanOrEqual(375)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(top + 220).toBeLessThanOrEqual(667)
    } finally {
      rect.mockRestore()
      w.mockRestore()
      h.mockRestore()
    }
  })

  it('restarts from Settings', async () => {
    const user = userEvent.setup()
    await renderApp(alice, { path: '/settings' })
    await user.click(await screen.findByRole('button', { name: 'Restart tour' }))
    expect(await screen.findByRole('dialog', { name: 'Track your time' })).toBeInTheDocument()
    expect(screen.getByTestId('path')).toHaveTextContent(/^\/$/)
  })
})

describe('welcome dialog', () => {
  it('greets a new member and remembers "No thanks"', async () => {
    newDevice()
    const user = userEvent.setup()
    await renderApp(bob)
    const dialog = await screen.findByRole('dialog', { name: 'Welcome to Workaddict' })
    await user.click(within(dialog).getByRole('button', { name: 'No thanks' }))
    expect(screen.queryByRole('dialog', { name: 'Welcome to Workaddict' })).toBeNull()
    expect(JSON.parse(localStorage.getItem('workaddict.tour')!).status).toBe('declined')
  })

  it('starts the tour', async () => {
    newDevice()
    const user = userEvent.setup()
    await renderApp(bob)
    await user.click(await screen.findByRole('button', { name: 'Start tour' }))
    expect(await screen.findByRole('dialog', { name: 'Track your time' })).toBeInTheDocument()
  })

  it('stops asking after "Later" twice', async () => {
    newDevice()
    const user = userEvent.setup()
    await renderApp(bob)
    await user.click(await screen.findByRole('button', { name: 'Later' }))
    expect(screen.queryByRole('dialog', { name: 'Welcome to Workaddict' })).toBeNull()
    // Next app load
    resetTourForTests()
    await user.click(await screen.findByRole('button', { name: 'Later' }))
    resetTourForTests()
    await act(async () => {})
    expect(screen.queryByRole('dialog', { name: 'Welcome to Workaddict' })).toBeNull()
    expect(getWelcome(false).status).toBe('declined')
  })

  it('turns on Expert mode for experienced users', async () => {
    newDevice()
    const user = userEvent.setup()
    await renderApp(bob)
    await user.click(await screen.findByRole('button', { name: 'I know my way around' }))
    expect(screen.queryByRole('dialog', { name: 'Welcome to Workaddict' })).toBeNull()
    expect(localStorage.getItem('workaddict.hintLevel')).toBe('expert')
  })

  it('does not greet members who used the app before the update', async () => {
    newDevice()
    await renderApp(bob, { entries: [entry('bob', 30)] })
    expect(await screen.findByText(/New: help pages and a guided tour/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Welcome to Workaddict' })).toBeNull()
    expect(getWelcome(false).existing).toBe(true)
  })

  it('keeps the demo separate from a real sign-in', async () => {
    newDevice()
    requestTourAfterSignIn()
    await renderApp(alice, { session: { mode: 'demo' } })
    expect(await screen.findByRole('dialog', { name: 'Track your time' })).toBeInTheDocument()
    expect(getWelcome(true).status).toBe('done')
    expect(getWelcome(false).status).toBe('new')
  })

  it('is not shown in Expert mode', async () => {
    newDevice()
    setHintLevel('expert')
    await renderApp(bob)
    await screen.findByRole('heading', { name: 'Tracker' })
    await act(async () => {})
    expect(screen.queryByRole('dialog', { name: 'Welcome to Workaddict' })).toBeNull()
  })
})

describe('first steps', () => {
  it('ticks itself off and is role-aware', async () => {
    await renderApp(alice, { entries: [entry('alice', 0)], projects: true })
    const card = await screen.findByRole('region', { name: 'First steps' })
    expect(within(card).getByText('2 of 4 done')).toBeInTheDocument()
    expect(within(card).getByText('Track your first time').closest('li')).toHaveClass('is-done')
    expect(within(card).getByText('Create a project').closest('li')).toHaveClass('is-done')
    expect(within(card).getByText('Invite your team')).toBeInTheDocument()
  })

  it('points workers to the help instead of creating projects', async () => {
    await renderApp(bob)
    const card = await screen.findByRole('region', { name: 'First steps' })
    expect(within(card).queryByText('Create a project')).toBeNull()
    expect(within(card).queryByText('Invite your team')).toBeNull()
    expect(
      within(card).getByRole('link', { name: /Editors and team leaders create projects/ }),
    ).toHaveAttribute('href', '/help/work-groups')
  })

  it('disappears when all required steps are done', async () => {
    await renderApp(bob, { entries: [entry('bob', 0)] })
    await screen.findByRole('heading', { name: 'Tracker' })
    await act(async () => {})
    expect(screen.queryByRole('region', { name: 'First steps' })).toBeNull()
  })

  it('can be hidden and shown again from Settings', async () => {
    const user = userEvent.setup()
    await renderApp(bob)
    await user.click(await screen.findByRole('button', { name: 'Hide first steps' }))
    expect(screen.queryByRole('region', { name: 'First steps' })).toBeNull()
    await user.click(screen.getAllByRole('link', { name: 'Settings' })[0]!)
    await user.click(await screen.findByRole('button', { name: 'Show tips again' }))
    expect(await screen.findByText('Tips will show again.')).toBeInTheDocument()
    await user.click(screen.getAllByRole('link', { name: 'Tracker' })[0]!)
    expect(await screen.findByRole('region', { name: 'First steps' })).toBeInTheDocument()
  })
})

describe('empty states', () => {
  it('offers the first timer on an empty tracker', async () => {
    const user = userEvent.setup()
    await renderApp(bob)
    await user.click(await screen.findByRole('button', { name: 'Start your first timer' }))
    expect(screen.getAllByRole('textbox', { name: 'What are you working on?' })[0]).toHaveFocus()
  })

  it('tells workers who creates projects, without a create action', async () => {
    await renderApp(bob, { path: '/groups' })
    expect((await screen.findAllByText(/Editors and team leaders create them\./)).length).toBe(2)
    expect(screen.queryByPlaceholderText(/New project/i)).toBeNull()
  })

  it('offers another period on empty statistics', async () => {
    const user = userEvent.setup()
    await renderApp(alice, { path: '/stats' })
    await user.click(await screen.findByRole('button', { name: 'Pick another period' }))
    expect(screen.getByRole('combobox', { name: 'Range' })).toHaveFocus()
  })
})

describe('Expert mode', () => {
  it('hides hints but keeps tips, help buttons and empty-state actions', async () => {
    const user = userEvent.setup()
    await renderApp(alice, { path: '/settings' })
    await user.click(await screen.findByRole('checkbox', { name: 'Expert mode' }))
    expect(screen.queryByRole('button', { name: 'Data repository' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Help: Roles' })).toBeInTheDocument()
    await user.click(screen.getAllByRole('link', { name: 'Tracker' })[0]!)
    await screen.findByRole('heading', { name: 'Tracker' })
    expect(screen.queryByRole('region', { name: 'First steps' })).toBeNull()
    expect(screen.queryByText('Start the timer or add an entry manually.')).toBeNull()
    expect(screen.getByRole('button', { name: 'Start your first timer' })).toBeInTheDocument()
    expect(localStorage.getItem('workaddict.hintLevel')).toBe('expert')
  })
})

describe('new feature markers', () => {
  afterEach(() => setVersionsForTests(__APP_VERSION__))

  it('shows no dot on a new device', () => {
    setVersionsForTests('1.1.0', '1.1.0')
    render(<NewDot feature="project-board" />)
    expect(screen.queryByRole('img', { name: 'New' })).toBeNull()
  })

  it('marks a feature added after the first visit until it is opened', () => {
    setVersionsForTests('1.0.0', '1.1.0')
    const { unmount } = render(
      <button type="button">
        Link board <NewDot feature="project-board" />
      </button>,
    )
    expect(screen.getByRole('img', { name: 'New' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('img', { name: 'New' })).toBeNull()
    unmount()
    render(<NewDot feature="project-board" />)
    expect(screen.queryByRole('img', { name: 'New' })).toBeNull()
    expect(JSON.parse(localStorage.getItem('workaddict.seenFeatures')!)).toEqual(['project-board'])
  })

  it('waits for the release that adds the feature', () => {
    setVersionsForTests('1.0.0', '1.0.0')
    render(<NewDot feature="project-board" />)
    expect(screen.queryByRole('img', { name: 'New' })).toBeNull()
  })

  it('is hidden in Expert mode', () => {
    setVersionsForTests('1.0.0', '1.1.0')
    setHintLevel('expert')
    render(<NewDot feature="project-board" />)
    expect(screen.queryByRole('img', { name: 'New' })).toBeNull()
  })
})

describe('first version', () => {
  afterEach(() => setVersionsForTests(__APP_VERSION__))

  it('treats a device with earlier Workaddict data as an earlier version', () => {
    localStorage.clear()
    localStorage.setItem('workaddict.lang', 'de')
    initFirstVersion()
    expect(localStorage.getItem('workaddict.firstVersion')).toBe('1.0.0')
  })

  it('records the current version on a new device', () => {
    localStorage.clear()
    initFirstVersion()
    expect(localStorage.getItem('workaddict.firstVersion')).toBe(__APP_VERSION__)
  })
})
