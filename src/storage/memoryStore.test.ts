import { runAdapterContract } from './contract'
import { createMemoryAdapter, MemoryFileStore } from './memoryStore'

runAdapterContract('memory', async () => {
  const store = new MemoryFileStore()
  return {
    alice: createMemoryAdapter({ login: 'alice', avatarUrl: null }, { store }),
    bob: createMemoryAdapter({ login: 'bob', avatarUrl: null }, { store }),
    newerSchema: async () =>
      createMemoryAdapter(
        { login: 'alice', avatarUrl: null },
        { store: new MemoryFileStore({ 'tracker.json': { schemaVersion: 999, createdAt: '' } }) },
      ),
  }
})

describe('members fallback', () => {
  it('derives members from data files when collaborators are unavailable', async () => {
    const store = new MemoryFileStore({ 'entries/carol/2026-09.json': [], 'timers/dave.json': null })
    const a = createMemoryAdapter({ login: 'alice', avatarUrl: null }, { store, collaborators: null })
    expect((await a.listMembers()).map((m) => m.login)).toEqual(['alice', 'carol', 'dave'])
  })

  it('uses collaborators when available', async () => {
    const a = createMemoryAdapter(
      { login: 'alice', avatarUrl: null },
      { collaborators: [{ login: 'zoe', avatarUrl: 'x' }] },
    )
    expect((await a.listMembers()).map((m) => m.login)).toEqual(['alice', 'zoe'])
  })
})
