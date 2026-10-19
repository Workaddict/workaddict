import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TimeEntry } from '../../domain/types'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import { keys } from '../data/hooks'
import WorkGroupsPage from './WorkGroupsPage'

const alice = { login: 'alice', avatarUrl: null }

function entry(i: number, projectId: string | null): TimeEntry {
  const start = new Date(2025, i % 12, 10, 9)
  return {
    id: String(i),
    login: 'alice',
    start: start.toISOString(),
    end: new Date(start.getTime() + 3_600_000).toISOString(),
    description: '',
    projectId,
    tagIds: [],
    createdAt: '',
    updatedAt: '',
  }
}

/** Workspace with project "Acme" used by 12 one-hour entries, spread over 12 monthly files. */
async function setup() {
  const store = new MemoryFileStore()
  const adapter = createMemoryAdapter(alice, { store, admins: ['alice'] })
  await adapter.init()
  await adapter.importData(
    {
      workspace: {
        projects: [{ id: 'p', name: 'Acme', color: '#2563eb', archived: false }],
        tags: [],
      },
      entries: Array.from({ length: 12 }, (_, i) => entry(i, 'p')),
    },
    'test',
  )
  const reads = vi.spyOn(store, 'read')
  const entryReads = () => reads.mock.calls.filter(([path]) => path.startsWith('entries/')).length
  return { adapter, entryReads }
}

const row = () => screen.getByText('Acme').closest('.wg-row') as HTMLElement

describe('WorkGroupsPage', () => {
  it('reads no entry files on open and loads totals on request', async () => {
    const { adapter, entryReads } = await setup()
    await renderWithSession(<WorkGroupsPage />, adapter)

    await screen.findByText('Acme')
    expect(within(row()).queryByText('12:00')).toBeNull()
    expect(entryReads()).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: 'Show total hours' }))
    expect(await within(row()).findByText('12:00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show total hours' })).toBeNull()
  })

  it('shows totals right away when all entries are already cached', async () => {
    const { adapter } = await setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(keys.entriesAll, await adapter.listAllEntries())
    await renderWithSession(<WorkGroupsPage />, adapter, queryClient)

    await screen.findByText('Acme')
    expect(within(row()).getByText('12:00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show total hours' })).toBeNull()
  })

  it('states the real entry count when deleting before totals were loaded', async () => {
    const { adapter } = await setup()
    await renderWithSession(<WorkGroupsPage />, adapter)

    await screen.findByText('Acme')
    fireEvent.click(within(row()).getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText(/It is used by 12 entries/)).toBeInTheDocument()
  })

  it('still allows deleting when the entry count cannot be loaded', async () => {
    const { adapter } = await setup()
    vi.spyOn(adapter, 'listAllEntries').mockRejectedValue(new Error('offline'))
    await renderWithSession(<WorkGroupsPage />, adapter)

    await screen.findByText('Acme')
    fireEvent.click(within(row()).getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText(/could not be determined/)).toBeInTheDocument()

    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(async () => expect((await adapter.getWorkspace()).projects).toHaveLength(0))
  })
})

describe('linked repositories', () => {
  async function render(login = 'alice') {
    const store = new MemoryFileStore()
    const owner = createMemoryAdapter(alice, { store, admins: ['alice'] })
    await owner.init()
    await owner.updateWorkspace(
      (ws) => ({
        ...ws,
        projects: [
          { id: 'p', name: 'Acme', color: '#2563eb', archived: false, repos: ['acme/web'] },
        ],
      }),
      'seed',
    )
    const me = { login, avatarUrl: null }
    const adapter = createMemoryAdapter(me, {
      store,
      admins: ['alice'],
      collaborators: [alice, me],
    })
    await renderWithSession(<WorkGroupsPage />, adapter)
    return { adapter }
  }

  const repos = async () =>
    (await screen.findByLabelText('GitHub board and repositories of Acme')) as HTMLElement

  it('links a repository given as URL and refuses a duplicate', async () => {
    const { adapter } = await render()
    fireEvent.click(
      within(await repos()).getByRole('button', { name: '+ Board or another repository' }),
    )
    const input = screen.getByLabelText('Link GitHub board or repository')
    fireEvent.change(input, { target: { value: 'https://github.com/acme/api.git' } })
    fireEvent.submit(input)
    await waitFor(async () =>
      expect((await adapter.getWorkspace()).projects[0]?.repos).toEqual(['acme/web', 'acme/api']),
    )

    fireEvent.click(
      within(await repos()).getByRole('button', { name: '+ Board or another repository' }),
    )
    fireEvent.change(screen.getByLabelText('Link GitHub board or repository'), {
      target: { value: 'Acme/Web' },
    })
    fireEvent.submit(screen.getByLabelText('Link GitHub board or repository'))
    expect(await screen.findByText('Repository already linked')).toBeTruthy()
  })

  it('makes another repository the default for #42', async () => {
    const { adapter } = await render()
    fireEvent.click(
      within(await repos()).getByRole('button', { name: '+ Board or another repository' }),
    )
    fireEvent.change(screen.getByLabelText('Link GitHub board or repository'), {
      target: { value: 'acme/api' },
    })
    fireEvent.submit(screen.getByLabelText('Link GitHub board or repository'))
    fireEvent.click(await within(await repos()).findByRole('button', { name: 'Make default' }))
    await waitFor(async () =>
      expect((await adapter.getWorkspace()).projects[0]?.repos).toEqual(['acme/api', 'acme/web']),
    )
  })

  it('unlinks a repository', async () => {
    const { adapter } = await render()
    fireEvent.click(within(await repos()).getByRole('button', { name: 'Unlink acme/web' }))
    await waitFor(async () => expect((await adapter.getWorkspace()).projects[0]?.repos).toEqual([]))
  })

  it('shows linked repositories read-only to workers', async () => {
    await render('bob')
    const list = await repos()
    expect(within(list).getByRole('link', { name: /acme\/web/ })).toBeTruthy()
    expect(within(list).queryByRole('button')).toBeNull()
  })

  it('links a board from its URL, then offers only another repository', async () => {
    const { adapter } = await render()
    fireEvent.click(
      within(await repos()).getByRole('button', { name: '+ Board or another repository' }),
    )
    const input = screen.getByLabelText('Link GitHub board or repository')
    fireEvent.change(input, {
      target: { value: 'https://github.com/orgs/Team-Wels/projects/1/views/1?pane=issue&itemId=5' },
    })
    fireEvent.submit(input)
    await waitFor(async () =>
      expect((await adapter.getWorkspace()).projects[0]?.board).toBe('orgs/Team-Wels/projects/1'),
    )
    const list = await repos()
    expect(
      within(list)
        .getByRole('link', { name: /Board 1 of Team-Wels/ })
        .getAttribute('href'),
    ).toBe('https://github.com/orgs/Team-Wels/projects/1')
    expect(within(list).getByRole('button', { name: '+ Repository' })).toBeTruthy()

    fireEvent.click(within(list).getByRole('button', { name: 'Unlink board' }))
    await waitFor(async () =>
      expect((await adapter.getWorkspace()).projects[0]).not.toHaveProperty('board'),
    )
  })

  it('explains card links for a board without repositories', async () => {
    const { adapter } = await render()
    fireEvent.click(within(await repos()).getByRole('button', { name: 'Unlink acme/web' }))
    fireEvent.click(
      await within(await repos()).findByRole('button', {
        name: '+ Link GitHub board or repository',
      }),
    )
    const input = screen.getByLabelText('Link GitHub board or repository')
    fireEvent.change(input, { target: { value: 'https://github.com/orgs/acme/projects/3' } })
    fireEvent.submit(input)
    expect(await screen.findByText(/Paste the link of a card on the board/)).toBeTruthy()
    expect((await adapter.getWorkspace()).projects[0]?.repos).toEqual([])
  })
})
