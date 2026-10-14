import { vi } from 'vitest'
import type { Member, TimeEntry } from '../domain/types'
import { isStorageError } from './errors'
import { createMemoryAdapter, MemoryFileStore } from './memoryStore'

const alice: Member = { login: 'alice', avatarUrl: null }
const bob: Member = { login: 'bob', avatarUrl: null }

function entry(login: string, extra?: Partial<TimeEntry>): TimeEntry {
  return {
    id: crypto.randomUUID(),
    login,
    start: '2026-09-21T08:00:00Z',
    end: '2026-09-21T09:00:00Z',
    description: 'Work',
    projectId: null,
    tagIds: [],
    createdAt: '',
    updatedAt: '',
    ...extra,
  }
}

async function setup() {
  const store = new MemoryFileStore()
  const opts = { store, collaborators: [alice, bob], admins: ['alice'] }
  const app = createMemoryAdapter(alice, opts)
  await app.init()
  const ai = createMemoryAdapter(alice, { ...opts, client: 'claude-code' })
  return { store, app, ai, opts }
}

describe('AI entry marking', () => {
  it('records no client while marking is off (the default)', async () => {
    const { ai } = await setup()
    const saved = await ai.saveEntry(entry('alice'))
    expect(saved).not.toHaveProperty('addedVia')
    const [bulk] = await ai.saveEntries([entry('alice')])
    expect(bulk).not.toHaveProperty('addedVia')
  })

  it('records the client on new entries while marking is on, and keeps it on edits', async () => {
    const { app, ai } = await setup()
    await app.setMarkAiEntries(true)
    expect((await app.getWorkspace()).markAiEntries).toBe(true)

    const saved = await ai.saveEntry(entry('alice'))
    expect(saved.addedVia).toBe('claude-code')
    const [bulk] = await ai.saveEntries([entry('bob')])
    expect(bulk).toMatchObject({ addedVia: 'claude-code', addedBy: 'alice' })

    // Edited in the app, also after marking was turned off: the marker stays.
    await app.setMarkAiEntries(false)
    const edited = await app.saveEntry({ ...saved, description: 'Edited' }, saved.start)
    expect(edited.addedVia).toBe('claude-code')
  })

  it('ignores addedVia sent by a client', async () => {
    const { app } = await setup()
    await app.setMarkAiEntries(true)
    const saved = await app.saveEntry(entry('alice', { addedVia: 'fake' }))
    expect(saved).not.toHaveProperty('addedVia')
  })

  it('ends every commit message with the client name', async () => {
    const { store, app, opts } = await setup()
    await app.setMarkAiEntries(true)
    const write = vi.spyOn(store, 'write')
    const writeMany = vi.spyOn(store, 'writeMany')
    const ai = createMemoryAdapter(alice, { ...opts, client: 'claude-code' })
    await ai.saveEntry(entry('alice', { description: 'Fix' }))
    await ai.saveEntries([entry('alice'), entry('bob')])
    expect((write.mock.calls.at(-1) as unknown[] | undefined)?.[2]).toMatch(
      / \(alice\) \(via claude-code\)$/,
    )
    expect(writeMany.mock.calls.at(-1)?.[1]).toMatch(/\(via claude-code\)$/)
  })

  it('lets only team leaders change the setting, and keeps it through workspace updates', async () => {
    const { app, opts } = await setup()
    await app.setRole('bob', 'editor')
    const editor = createMemoryAdapter(bob, opts)
    await expect(editor.setMarkAiEntries(true)).rejects.toSatisfy((e) =>
      isStorageError(e, 'forbiddenRole'),
    )
    await app.setMarkAiEntries(true)
    await editor.updateWorkspace(
      (ws) => ({ ...ws, markAiEntries: false, projects: [] }),
      'try to turn marking off',
    )
    expect((await app.getWorkspace()).markAiEntries).toBe(true)
  })
})
