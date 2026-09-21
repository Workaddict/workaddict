import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TimeEntry } from '../../domain/types'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import { ReassignEntriesModal } from './ReassignEntries'

const alice = { login: 'alice', avatarUrl: null }
const bob = { login: 'bob', avatarUrl: null }

function entry(login: string, start: Date): TimeEntry {
  return {
    id: crypto.randomUUID(),
    login,
    start: start.toISOString(),
    end: new Date(start.getTime() + 3_600_000).toISOString(),
    description: '',
    projectId: null,
    tagIds: [],
    createdAt: '',
    updatedAt: '',
  }
}

describe('ReassignEntriesModal', () => {
  it("moves a former member's entries before the cutoff to a real member", async () => {
    const store = new MemoryFileStore()
    const adapter = createMemoryAdapter(alice, { store, collaborators: [alice, bob], admins: ['alice'] })
    await adapter.init()
    await adapter.importData(
      {
        workspace: { projects: [], tags: [] },
        entries: [
          entry('clockify.jane', new Date(2025, 9, 1, 9)),
          entry('clockify.jane', new Date(2025, 10, 1, 9)),
          entry('clockify.jane', new Date(2026, 8, 1, 9)),
        ],
      },
      'test',
    )
    let closed = false
    await renderWithSession(<ReassignEntriesModal onClose={() => (closed = true)} />, adapter)

    const from = await screen.findByRole('combobox', { name: 'Move entries of' })
    await screen.findByRole('option', { name: /clockify.jane \(former member\) \(3 entries\)/ })
    fireEvent.change(from, { target: { value: 'clockify.jane' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'To member' }), { target: { value: 'bob' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /Only entries that started before/ }))
    fireEvent.change(screen.getByLabelText('Before'), { target: { value: '2026-01-01' } })

    expect(screen.getByText(/2 entries \(2:00 h\) will move from clockify.jane/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Move 2 entries' }))

    await waitFor(() => expect(closed).toBe(true))
    const logins = (await adapter.listAllEntries()).map((e) => e.login).sort()
    expect(logins).toEqual(['bob', 'bob', 'clockify.jane'])
  })
})
