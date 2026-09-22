import { runAdapterContract } from '../contract'
import { isStorageError } from '../errors'
import type { BlobCache } from './blobCache'
import { GitHubClient } from './client'
import { FakeGitHub } from './fakeGitHub'
import { gitBlobSha } from './githubStore'
import { checkLogin, createGitHubAdapter } from './githubAdapter'

function memoryCache(): BlobCache {
  const m = new Map<string, string>()
  return {
    get: async (k) => m.get(k),
    set: async (k, v) => void m.set(k, v),
    clear: async () => m.clear(),
  }
}

function adapterFor(gh: FakeGitHub, token: string, opts?: { treeTtlMs?: number }) {
  return createGitHubAdapter({
    token,
    owner: gh.owner,
    repo: gh.repo,
    branch: 'main',
    fetchFn: gh.fetch,
    cache: memoryCache(),
    treeTtlMs: opts?.treeTtlMs ?? 0,
    sleep: async () => {},
  })
}

function fake() {
  const gh = new FakeGitHub()
  gh.users = { 'tok-a': 'alice', 'tok-b': 'bob' }
  gh.admins.add('alice')
  return gh
}

runAdapterContract('github (fake API)', async () => {
  const gh = fake()
  return {
    alice: adapterFor(gh, 'tok-a'),
    bob: adapterFor(gh, 'tok-b'),
    newerSchema: async () => {
      const other = fake()
      other.putRaw('tracker.json', JSON.stringify({ schemaVersion: 999, createdAt: '' }))
      return adapterFor(other, 'tok-a')
    },
  }
})

describe('GitHub adapter specifics', () => {
  it('initializes an empty repository', async () => {
    const gh = fake()
    await adapterFor(gh, 'tok-a').init()
    expect(gh.json('tracker.json')).toMatchObject({ schemaVersion: 1 })
    expect(gh.json('workspace.json')).toEqual({ projects: [], tags: [] })
  })

  it('refreshing unchanged data costs one tree request and no blob requests', async () => {
    const gh = fake()
    const a = adapterFor(gh, 'tok-a')
    await a.init()
    await a.startTimer({ description: 'x', projectId: null, tagIds: [] })
    await a.stopTimer()
    const range = { from: new Date(0), to: new Date(Date.now() + 86_400_000) }
    await a.listEntries(range) // warm cache
    gh.log = []
    await a.listEntries(range)
    expect(gh.count('GET /repos/team/data/git/trees')).toBe(1)
    expect(gh.count('GET /repos/team/data/git/blobs')).toBe(0)
  })

  it('fetches only the changed file after another member writes', async () => {
    const gh = fake()
    const a = adapterFor(gh, 'tok-a')
    const b = adapterFor(gh, 'tok-b')
    await a.init()
    const mk = (login: string, day: number) => ({
      id: crypto.randomUUID(),
      login,
      start: `2026-09-${day}T08:00:00Z`,
      end: `2026-09-${day}T09:00:00Z`,
      description: '',
      projectId: null,
      tagIds: [],
      createdAt: '',
      updatedAt: '',
    })
    await a.saveEntry(mk('alice', 10))
    await b.saveEntry(mk('bob', 11))
    const range = { from: new Date('2026-09-01'), to: new Date('2026-09-30') }
    expect(await a.listEntries(range)).toHaveLength(2)
    await b.saveEntry(mk('bob', 12))
    gh.log = []
    expect(await a.listEntries(range)).toHaveLength(3)
    expect(gh.count('GET /repos/team/data/git/blobs')).toBe(1)
  })

  it('writes descriptive commit messages', async () => {
    const gh = fake()
    const messages: string[] = []
    const orig = gh.fetch
    gh.fetch = async (input, init) => {
      if (init?.method === 'PUT') messages.push(JSON.parse(String(init.body)).message)
      return orig(input, init)
    }
    const a = adapterFor(gh, 'tok-a')
    await a.init()
    await a.saveEntry({
      id: '1',
      login: 'alice',
      start: '2026-09-21T08:00:00Z',
      end: '2026-09-21T10:00:00Z',
      description: 'Fix login',
      projectId: null,
      tagIds: [],
      createdAt: '',
      updatedAt: '',
    })
    expect(messages.at(-1)).toBe('entry: add 2:00 "Fix login" (alice)')

    await a.setRole('bob', 'editor')
    expect(messages.at(-1)).toBe('role: set bob to editor (alice)')

    const b = adapterFor(gh, 'tok-b')
    const alices = (await b.listAllEntries())[0]!
    await b.deleteEntry(alices)
    expect(messages.at(-1)).toBe('entry: delete "Fix login" for alice (bob)')
    expect(gh.json('roles.json')).toEqual({ roles: { bob: 'editor' } })

    const { timer } = await a.startTimer(
      { description: 'Support', projectId: null, tagIds: [] },
      new Date('2026-09-21T09:00:00Z'),
    )
    await b.stopTimer(new Date('2026-09-21T17:00:00Z'), { login: 'alice', timerId: timer.id })
    expect(messages.slice(-2)).toEqual([
      'timer: stop 8:00 "Support" (alice, by bob)',
      'timer: clear (alice, by bob)',
    ])
    const next = await a.startTimer({ description: '', projectId: null, tagIds: [] })
    await b.discardTimer({ login: 'alice', timerId: next.timer.id })
    expect(messages.at(-1)).toBe('timer: discard (alice, by bob)')
  })

  it("treats a personal repository's owner as admin even without a permissions object", async () => {
    const gh = new FakeGitHub('carol', 'data')
    gh.users = { 'tok-c': 'carol', 'tok-b': 'bob' }
    const orig = gh.fetch
    gh.fetch = async (input, init) => {
      const res = await orig(input, init)
      if (new URL(String(input)).pathname !== '/repos/carol/data') return res
      const body = (await res.json()) as Record<string, unknown>
      delete body.permissions
      return new Response(JSON.stringify(body), { status: 200 })
    }
    expect(await adapterFor(gh, 'tok-c').getAccess()).toEqual({ login: 'carol', role: 'leader', owner: true })
    expect(await adapterFor(gh, 'tok-b').getAccess()).toMatchObject({ role: 'worker', owner: false })
  })

  it('marks collaborators with admin permission as owners', async () => {
    const gh = fake()
    const team = await adapterFor(gh, 'tok-b').listRoles()
    expect(team.members.map((m) => [m.login, m.role, m.owner])).toEqual([
      ['alice', 'leader', true],
      ['bob', 'worker', false],
    ])
  })

  it('reuses the admin permission instead of asking GitHub on every write', async () => {
    const gh = fake()
    const a = adapterFor(gh, 'tok-a')
    await a.init()
    for (const name of ['A', 'B', 'C']) {
      await a.updateWorkspace(
        (ws) => ({ ...ws, tags: [...ws.tags, { id: name, name, archived: false }] }),
        `add ${name}`,
      )
    }
    expect(gh.log.filter((l) => l === 'GET /repos/team/data')).toHaveLength(1)
  })

  it('re-applies changes after a concurrent write (conflict retry)', async () => {
    const gh = fake()
    const a = adapterFor(gh, 'tok-a')
    await a.init()
    let injected = false
    gh.beforePut = (path) => {
      if (path === 'workspace.json' && !injected) {
        injected = true
        gh.putRaw(
          'workspace.json',
          JSON.stringify({ projects: [{ id: 'b', name: 'B', color: '#000', archived: false }], tags: [] }),
        )
      }
    }
    await a.updateWorkspace(
      (ws) => ({ ...ws, projects: [...ws.projects, { id: 'a', name: 'A', color: '#000', archived: false }] }),
      'add A',
    )
    expect((gh.json('workspace.json') as { projects: { name: string }[] }).projects.map((p) => p.name)).toEqual(['B', 'A'])
  })

  it('gives up after repeated conflicts', async () => {
    const gh = fake()
    const a = adapterFor(gh, 'tok-a')
    await a.init()
    gh.beforePut = (path) => gh.putRaw(path, '{"projects":[],"tags":[]}\n')
    await expect(a.updateWorkspace((ws) => ws, 'noop')).resolves.toBeDefined() // unchanged → no write
    await expect(
      a.updateWorkspace((ws) => ({ ...ws, tags: [{ id: 't', name: 'T', archived: false }] }), 'add T'),
    ).rejects.toSatisfy((e: unknown) => isStorageError(e, 'conflict'))
  })

  it('falls back to data logins when collaborators are forbidden', async () => {
    const gh = fake()
    gh.collaboratorsForbidden = true
    gh.putRaw('entries/carol/2026-09.json', '[]')
    const logins = (await adapterFor(gh, 'tok-a').listMembers()).map((m) => m.login)
    expect(logins).toEqual(['alice', 'carol'])
  })

  it('handles UTF-8 content (umlauts, emoji)', async () => {
    const gh = fake()
    const a = adapterFor(gh, 'tok-a')
    await a.init()
    await a.updateWorkspace(
      (ws) => ({ ...ws, tags: [{ id: 't', name: 'Überstunden 🚀', archived: false }] }),
      'add tag',
    )
    expect((await adapterFor(gh, 'tok-b').getWorkspace()).tags[0]?.name).toBe('Überstunden 🚀')
  })
})

describe('GitHub multi-file write (import)', () => {
  const mk = (login: string, month: string) => ({
    id: crypto.randomUUID(),
    login,
    start: `${month}-10T08:00:00.000Z`,
    end: `${month}-10T09:00:00.000Z`,
    description: '',
    projectId: null,
    tagIds: [],
    createdAt: '',
    updatedAt: '',
  })
  const data = () => ({
    workspace: { projects: [{ id: 'p', name: 'P', color: '#000', archived: false }], tags: [] },
    entries: ['alice', 'bob'].flatMap((l) => [mk(l, '2025-10'), mk(l, '2025-11')]),
  })

  async function setup(wrap?: (orig: typeof fetch) => typeof fetch) {
    const gh = fake()
    if (wrap) gh.fetch = wrap(gh.fetch)
    const a = adapterFor(gh, 'tok-a')
    await a.init()
    gh.log = []
    return { gh, a }
  }

  it('writes all files in exactly one commit with a constant number of requests', async () => {
    const { gh, a } = await setup()
    const before = gh.commits
    const entries = Array.from({ length: 100 }, (_, i) => mk(`user${i}`, '2025-10'))
    await a.importData({ workspace: data().workspace, entries }, 'Clockify workspace "Acme"')
    expect(gh.commits - before).toBe(1)
    expect(gh.count('PUT')).toBe(0)
    expect(gh.count('POST /repos/team/data/git/trees')).toBe(1)
    expect(gh.count('PATCH /repos/team/data/git/refs/heads/main')).toBe(1)
    expect(gh.messages.at(-1)).toBe('import: Clockify workspace "Acme" (alice)')
    expect([...gh.files.keys()].filter((p) => p.startsWith('entries/'))).toHaveLength(100)
  })

  it('stores entries by login and month, pretty-printed', async () => {
    const { gh, a } = await setup()
    await a.importData(data(), 'x')
    for (const p of [
      'entries/alice/2025-10.json',
      'entries/alice/2025-11.json',
      'entries/bob/2025-10.json',
      'entries/bob/2025-11.json',
    ]) {
      expect(gh.json(p)).toHaveLength(1)
    }
    expect(gh.files.get('workspace.json')!.text).toMatch(/^\{\n {2}"projects"/)
  })

  it('serves imported files from the cache afterwards', async () => {
    const { gh, a } = await setup()
    await a.importData(data(), 'x')
    gh.log = []
    // The fake uses synthetic blob SHAs, so only the tree is compared here.
    expect(await a.listAllEntries()).toHaveLength(4)
    expect(gh.count('GET /repos/team/data/git/trees')).toBe(1)
  })

  it('retries after a concurrent commit and re-validates', async () => {
    const { gh, a } = await setup()
    let injected = false
    gh.beforeRefUpdate = () => {
      if (!injected) {
        injected = true
        gh.putRaw('timers/bob.json', 'null')
      }
    }
    await a.importData(data(), 'x')
    expect(gh.count('PATCH')).toBe(2)
    expect(gh.json('timers/bob.json')).toBeNull()
    expect(gh.json('entries/bob/2025-10.json')).toHaveLength(1)
  })

  it('reassigns entries in one commit and removes emptied files', async () => {
    const { gh, a } = await setup()
    await a.importData(data(), 'x')
    const before = gh.commits
    expect(await a.reassignEntries('bob', 'carol', { before: new Date(2025, 10, 1) })).toBe(1)
    expect(gh.commits - before).toBe(1)
    expect(gh.messages.at(-1)).toBe('reassign: 1 entry from bob to carol before 2025-11-01 (alice)')
    expect(gh.files.has('entries/bob/2025-10.json')).toBe(false)
    expect(gh.json('entries/carol/2025-10.json')).toMatchObject([{ login: 'carol' }])
    expect(gh.json('entries/bob/2025-11.json')).toMatchObject([{ login: 'bob' }])
  })

  it('aborts a reassignment when the affected entries change meanwhile', async () => {
    const { gh, a } = await setup()
    await a.importData(data(), 'x')
    gh.beforeRefUpdate = () => {
      gh.beforeRefUpdate = null
      gh.putRaw('entries/carol/2025-10.json', JSON.stringify([mk('carol', '2025-10')]))
    }
    await expect(a.reassignEntries('bob', 'carol')).rejects.toSatisfy((e: unknown) =>
      isStorageError(e, 'conflict'),
    )
    expect(gh.json('entries/carol/2025-10.json')).toHaveLength(1)
    expect(gh.files.has('entries/bob/2025-10.json')).toBe(true)
  })

  it('writes nothing when data appears during the import', async () => {
    const { gh, a } = await setup()
    gh.beforeRefUpdate = () => {
      gh.beforeRefUpdate = null
      gh.putRaw('entries/carol/2026-09.json', JSON.stringify([mk('carol', '2026-09')]))
    }
    await expect(a.importData(data(), 'x')).rejects.toSatisfy((e: unknown) =>
      isStorageError(e, 'notEmpty'),
    )
    expect(gh.files.has('entries/alice/2025-10.json')).toBe(false)
  })

  it('reports a conflict after repeated concurrent commits, never forcing', async () => {
    const forced: unknown[] = []
    const { gh, a } = await setup((orig) => async (input, init) => {
      if (init?.method === 'PATCH') forced.push(JSON.parse(String(init.body)).force)
      return orig(input, init)
    })
    gh.beforeRefUpdate = () => gh.putRaw('timers/bob.json', 'null')
    await expect(a.importData(data(), 'x')).rejects.toSatisfy((e: unknown) =>
      isStorageError(e, 'conflict'),
    )
    expect(forced).toEqual([false, false, false, false])
    expect(gh.json('workspace.json')).toEqual({ projects: [], tags: [] })
  })

  it('writes nothing when a request fails', async () => {
    const { gh, a } = await setup((orig) => async (input, init) => {
      if (init?.method === 'POST' && String(input).endsWith('/git/commits')) {
        throw new TypeError('Failed to fetch')
      }
      return orig(input, init)
    })
    await expect(a.importData(data(), 'x')).rejects.toSatisfy(
      (e: unknown) => isStorageError(e, 'network') || isStorageError(e, 'offline'),
    )
    expect([...gh.files.keys()].some((p) => p.startsWith('entries/'))).toBe(false)
  })

  it('deletes old entry files in the same single commit when overwriting', async () => {
    const { gh, a } = await setup()
    gh.putRaw('entries/carol/2024-01.json', '[]')
    gh.putRaw('entries/alice/2025-10.json', '[]')
    const before = gh.commits
    await a.importData(data(), 'x', { overwrite: true })
    expect(gh.commits - before).toBe(1)
    expect(gh.files.has('entries/carol/2024-01.json')).toBe(false)
    expect(gh.json('entries/alice/2025-10.json')).toHaveLength(1)
    expect(gh.messages.at(-1)).toBe('import (replace existing data): x (alice)')
  })

  it('computes git blob SHAs like git hash-object', async () => {
    expect(await gitBlobSha('hello\n')).toBe('ce013625030ba8dba906f756967f9e9ca394464a')
  })
})

describe('GitHubClient error mapping', () => {
  const clientWith = (res: Response | Error) =>
    new GitHubClient({
      token: 't',
      fetchFn: async () => {
        if (res instanceof Error) throw res
        return res
      },
    })

  it('maps rate limits with reset time', async () => {
    const reset = Math.floor(Date.now() / 1000) + 600
    const err = await clientWith(
      new Response('{"message":"API rate limit exceeded"}', {
        status: 403,
        headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(reset) },
      }),
    )
      .get('/x')
      .catch((e: unknown) => e)
    expect(isStorageError(err, 'rateLimit')).toBe(true)
    expect((err as { resetAt: Date }).resetAt.getTime()).toBe(reset * 1000)
  })

  it.each([
    [401, 'auth'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [422, 'conflict'],
    [500, 'unknown'],
  ] as const)('maps %i to %s', async (status, kind) => {
    const err = await clientWith(new Response('{}', { status }))
      .get('/x')
      .catch((e: unknown) => e)
    expect(isStorageError(err, kind)).toBe(true)
  })

  it('maps network failures', async () => {
    const err = await clientWith(new TypeError('Failed to fetch'))
      .get('/x')
      .catch((e: unknown) => e)
    expect(isStorageError(err, 'network') || isStorageError(err, 'offline')).toBe(true)
  })
})

describe('checkLogin', () => {
  it('accepts a valid token with push access', async () => {
    const gh = fake()
    const r = await checkLogin({ token: 'tok-a', repo: 'team/data' }, gh.fetch)
    expect(r).toMatchObject({ ok: true, user: { login: 'alice' } })
  })

  it.each([
    [{ token: 'nope', repo: 'team/data' }, 'invalidToken'],
    [{ token: 'tok-a', repo: 'team/other' }, 'repoNotFound'],
    [{ token: 'tok-a', repo: 'not a repo' }, 'badRepoFormat'],
  ])('rejects %o with %s', async (creds, error) => {
    expect(await checkLogin(creds, fake().fetch)).toMatchObject({ ok: false, error })
  })

  it('reports the OAuth scopes of classic tokens', async () => {
    const gh = fake()
    const withScopes: typeof fetch = async (input, init) => {
      const res = await gh.fetch(input, init)
      const headers = new Headers(res.headers)
      headers.set('X-OAuth-Scopes', 'repo, read:org')
      return new Response(res.body, { status: res.status, headers })
    }
    expect(await checkLogin({ token: 'tok-a', repo: 'team/data' }, withScopes)).toMatchObject({
      ok: true,
      scopes: ['repo', 'read:org'],
    })
    expect(await checkLogin({ token: 'tok-a', repo: 'team/data' }, fake().fetch)).toMatchObject({
      ok: true,
      scopes: null,
    })
  })

  it('rejects read-only access', async () => {
    const gh = fake()
    gh.push = false
    expect(await checkLogin({ token: 'tok-a', repo: 'team/data' }, gh.fetch)).toMatchObject({
      ok: false,
      error: 'noPushAccess',
    })
  })
})

describe('untrusted repository data', () => {
  const ENTRIES = 'entries/bob/2026-09.json'
  const SEPT = { from: new Date('2026-09-01T00:00:00Z'), to: new Date('2026-09-30T23:59:59Z') }
  const mk = (id: string, login = 'bob') => ({
    id,
    login,
    start: '2026-09-10T08:00:00.000Z',
    end: '2026-09-10T09:00:00.000Z',
    description: id,
    projectId: null,
    tagIds: [],
    createdAt: '',
    updatedAt: '',
  })

  async function setup() {
    const gh = fake()
    const a = adapterFor(gh, 'tok-a')
    const b = adapterFor(gh, 'tok-b')
    await a.init()
    return { gh, a, b }
  }

  it('hides a malformed record, reports it, and keeps it on the next write', async () => {
    const { gh, b } = await setup()
    const broken = { id: 'x', login: 'bob' }
    gh.putRaw(ENTRIES, JSON.stringify([mk('e1'), broken]))
    expect((await b.listEntries(SEPT)).map((e) => e.id)).toEqual(['e1'])
    expect(b.dataProblems()).toEqual([
      { path: ENTRIES, version: gh.files.get(ENTRIES)!.sha, kind: 'records' },
    ])

    await b.saveEntry(mk('e2'))
    expect(gh.json(ENTRIES)).toEqual([mk('e1'), expect.objectContaining({ id: 'e2' }), broken])
  })

  it('does not count an entry that claims another member', async () => {
    const { gh, a } = await setup()
    gh.putRaw(ENTRIES, JSON.stringify([mk('e1'), mk('fake', 'alice')]))
    const all = await a.listAllEntries()
    expect(all.map((e) => `${e.login}:${e.id}`)).toEqual(['bob:e1'])
  })

  it('reads an unreadable file as empty and refuses to write it', async () => {
    const { gh, b } = await setup()
    gh.putRaw(ENTRIES, JSON.stringify({ entries: 42 }))
    expect(await b.listEntries(SEPT)).toEqual([])
    expect(b.dataProblems()).toMatchObject([{ path: ENTRIES, kind: 'unreadable' }])
    await expect(b.saveEntry(mk('e2'))).rejects.toSatisfy(
      (e: unknown) => isStorageError(e, 'corruptData') && e.path === ENTRIES,
    )
    expect(gh.json(ENTRIES)).toEqual({ entries: 42 })
  })

  it('reads invalid JSON as unreadable instead of failing the whole read', async () => {
    const { gh, b } = await setup()
    gh.putRaw(ENTRIES, '[{"id": ')
    gh.putRaw('entries/alice/2026-09.json', JSON.stringify([mk('a1', 'alice')]))
    expect((await b.listEntries(SEPT)).map((e) => e.id)).toEqual(['a1'])
    expect(b.dataProblems()).toMatchObject([{ path: ENTRIES, kind: 'unreadable' }])
  })

  it('never downloads a file above the size limit', async () => {
    const { gh, b } = await setup()
    gh.putRaw(ENTRIES, JSON.stringify([{ pad: 'x'.repeat(2 * 1024 * 1024) }]))
    const sha = gh.files.get(ENTRIES)!.sha
    gh.log = []
    expect(await b.listEntries(SEPT)).toEqual([])
    expect(gh.count(`GET /repos/team/data/git/blobs/${sha}`)).toBe(0)
    expect(b.dataProblems()).toMatchObject([{ path: ENTRIES, kind: 'unreadable' }])
  })

  it('clears the problem once the file is fixed', async () => {
    const { gh, b } = await setup()
    gh.putRaw(ENTRIES, JSON.stringify([mk('e1'), 'junk']))
    await b.listEntries(SEPT)
    expect(b.dataProblems()).toHaveLength(1)
    gh.putRaw(ENTRIES, JSON.stringify([mk('e1')]))
    await b.listEntries(SEPT)
    expect(b.dataProblems()).toEqual([])
  })

  it('ignores files whose path has an invalid login', async () => {
    const { gh, a } = await setup()
    gh.collaboratorsForbidden = true
    gh.putRaw('entries/a b/2026-09.json', JSON.stringify([mk('e1', 'a b')]))
    gh.putRaw('timers/-x.json', 'null')
    expect((await a.listMembers()).map((m) => m.login)).toEqual(['alice'])
    expect(await a.listAllEntries()).toEqual([])
  })

  it('keeps invalid records in place when reassigning entries', async () => {
    const { gh, a } = await setup()
    const broken = { id: 'x' }
    const jane = 'entries/clockify.jane/2026-09.json'
    gh.putRaw(jane, JSON.stringify([mk('j1', 'clockify.jane'), broken]))
    expect(await a.reassignEntries('clockify.jane', 'bob')).toBe(1)
    expect(gh.json(jane)).toEqual([broken])
    expect(gh.json(ENTRIES)).toEqual([expect.objectContaining({ id: 'j1', login: 'bob' })])
  })
})
