import { runAdapterContract } from '../contract'
import { isStorageError } from '../errors'
import type { BlobCache } from './blobCache'
import { GitHubClient } from './client'
import { FakeGitHub } from './fakeGitHub'
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

  it('rejects read-only access', async () => {
    const gh = fake()
    gh.push = false
    expect(await checkLogin({ token: 'tok-a', repo: 'team/data' }, gh.fetch)).toMatchObject({
      ok: false,
      error: 'noPushAccess',
    })
  })
})
