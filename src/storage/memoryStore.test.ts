import { runAdapterContract } from './contract'
import { createMemoryAdapter, MemoryFileStore } from './memoryStore'

runAdapterContract('memory', async () => {
  const store = new MemoryFileStore()
  const alice = { login: 'alice', avatarUrl: null }
  const bob = { login: 'bob', avatarUrl: null }
  const team = { store, collaborators: [alice, bob], admins: ['alice'] }
  return {
    alice: createMemoryAdapter(alice, team),
    bob: createMemoryAdapter(bob, team),
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

  it('also includes logins from roles.json and knows only the own owner status', async () => {
    const store = new MemoryFileStore({ 'roles.json': { roles: { erin: 'editor' } } })
    const a = createMemoryAdapter({ login: 'alice', avatarUrl: null }, { store, admins: ['alice'] })
    const team = await a.listRoles()
    expect(team.members.map((m) => [m.login, m.role, m.owner])).toEqual([
      ['alice', 'leader', true],
      ['erin', 'editor', false],
    ])
  })

  it('uses collaborators when available', async () => {
    const a = createMemoryAdapter(
      { login: 'alice', avatarUrl: null },
      { collaborators: [{ login: 'zoe', avatarUrl: 'x' }] },
    )
    expect((await a.listMembers()).map((m) => m.login)).toEqual(['alice', 'zoe'])
  })
})

describe('memory import layout', () => {
  it('groups imported entries by login and UTC start month', async () => {
    const store = new MemoryFileStore()
    const a = createMemoryAdapter({ login: 'alice', avatarUrl: null }, { store, admins: ['alice'] })
    await a.init()
    const e = (login: string, start: string) => ({
      id: crypto.randomUUID(),
      login,
      start,
      end: new Date(new Date(start).getTime() + 3_600_000).toISOString(),
      description: '',
      projectId: null,
      tagIds: [],
      createdAt: '',
      updatedAt: '',
    })
    await a.importData(
      {
        workspace: { projects: [], tags: [] },
        entries: [e('alice', '2025-10-31T23:30:00Z'), e('bob', '2025-11-01T00:00:00Z')],
      },
      'x',
    )
    expect(Object.keys(store.dump()).sort()).toEqual([
      'entries/alice/2025-10.json',
      'entries/bob/2025-11.json',
      'tracker.json',
      'workspace.json',
    ])
  })
})
