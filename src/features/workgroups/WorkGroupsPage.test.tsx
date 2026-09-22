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
      workspace: { projects: [{ id: 'p', name: 'Acme', color: '#2563eb', archived: false }], tags: [] },
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
