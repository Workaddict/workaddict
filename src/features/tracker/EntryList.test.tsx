import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TimeEntry } from '../../domain/types'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore, type StorageAdapter } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import { EntryList } from './EntryList'

const alice = { login: 'alice', avatarUrl: null }
const bob = { login: 'bob', avatarUrl: null }

function entry(login: string, extra?: Partial<TimeEntry>): TimeEntry {
  return {
    id: `${login}-1`,
    login,
    start: new Date(2026, 8, 21, 9, 0).toISOString(),
    end: new Date(2026, 8, 21, 10, 0).toISOString(),
    description: 'Standup',
    projectId: null,
    tagIds: [],
    createdAt: '',
    updatedAt: '',
    ...extra,
  }
}

async function setup(me: typeof alice, entries: TimeEntry[]) {
  const store = new MemoryFileStore()
  const adapter = createMemoryAdapter(me, { store, collaborators: [alice, bob], admins: ['alice'] })
  await adapter.init()
  // Seed through an owner adapter so any login can be written.
  const owner = createMemoryAdapter(alice, { store, collaborators: [alice, bob], admins: ['alice'] })
  for (const e of entries) await owner.saveEntry(e)
  await renderWithSession(<EntryList entries={entries} showMember />, adapter)
  return { adapter }
}

async function stored(adapter: StorageAdapter) {
  return (await adapter.listAllEntries())[0]!
}

describe('inline entry editing', () => {
  it('saves a new description on Enter without opening a dialog', async () => {
    const { adapter } = await setup(bob, [entry('bob')])
    fireEvent.click(screen.getByRole('button', { name: 'Edit description' }))
    const input = screen.getByRole('textbox', { name: 'Edit description' })
    fireEvent.change(input, { target: { value: 'Review PR' } })
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' })
    })
    await waitFor(async () => expect((await stored(adapter)).description).toBe('Review PR'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('cancels with Escape and saves nothing', async () => {
    const { adapter } = await setup(bob, [entry('bob')])
    fireEvent.click(screen.getByRole('button', { name: 'Edit description' }))
    const input = screen.getByRole('textbox', { name: 'Edit description' })
    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    fireEvent.blur(input)
    expect(screen.getByRole('button', { name: 'Edit description' })).toHaveTextContent('Standup')
    expect((await stored(adapter)).description).toBe('Standup')
  })

  it('keeps edit mode with the typed value for an invalid duration', async () => {
    const { adapter } = await setup(bob, [entry('bob')])
    fireEvent.click(screen.getByRole('button', { name: 'Edit duration' }))
    const input = screen.getByRole('textbox', { name: 'Edit duration' })
    fireEvent.change(input, { target: { value: '25:00' } })
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' })
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(/at most 24 hours/)
    expect(screen.getByRole('textbox', { name: 'Edit duration' })).toHaveValue('25:00')
    expect((await stored(adapter)).end).toBe(entry('bob').end)
  })

  it('changes the end time by editing the duration', async () => {
    const { adapter } = await setup(bob, [entry('bob')])
    fireEvent.click(screen.getByRole('button', { name: 'Edit duration' }))
    const input = screen.getByRole('textbox', { name: 'Edit duration' })
    fireEvent.change(input, { target: { value: '2:15' } })
    await act(async () => {
      fireEvent.blur(input)
    })
    await waitFor(async () =>
      expect((await stored(adapter)).end).toBe(new Date(2026, 8, 21, 11, 15).toISOString()),
    )
  })

  it("shows another member's entry as plain text to a worker", async () => {
    await setup(bob, [entry('alice')])
    expect(screen.getByText('Standup')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit description' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull()
  })

  it("lets an owner edit another member's entry inline", async () => {
    const { adapter } = await setup(alice, [entry('bob')])
    fireEvent.click(await screen.findByRole('button', { name: 'Edit description' }))
    const input = screen.getByRole('textbox', { name: 'Edit description' })
    fireEvent.change(input, { target: { value: 'Fixed' } })
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' })
    })
    await waitFor(async () =>
      expect(await stored(adapter)).toMatchObject({ login: 'bob', description: 'Fixed' }),
    )
  })
})
