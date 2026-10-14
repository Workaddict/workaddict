// @vitest-environment node
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { FakeGitHub } from '../../src/storage/github/fakeGitHub'
import { readConfig } from './config'
import { connect, ConnectError } from './connect'
import { createServer, type SessionFactory } from './server'

function fake() {
  const gh = new FakeGitHub()
  gh.users = { 'tok-a': 'alice' }
  gh.admins.add('alice')
  gh.putRaw('tracker.json', JSON.stringify({ schemaVersion: 1, createdAt: '' }))
  gh.putRaw('workspace.json', JSON.stringify({ projects: [], tags: [], timeZone: 'UTC' }))
  return gh
}

async function clientFor(open: SessionFactory, name = 'claude-code') {
  const server = createServer(open, { configDir: '/nonexistent' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await server.connect(a)
  const client = new Client({ name, version: '1.0.0' })
  await client.connect(b)
  return client
}

const text = (r: unknown): string => (r as { content: { text: string }[] }).content[0]?.text ?? ''

describe('MCP server', () => {
  it('offers the read and write tools, and nothing destructive', async () => {
    const client = await clientFor(async () => {
      throw new Error('unused')
    })
    const names = (await client.listTools()).tools.map((t) => t.name).sort()
    expect(names).toEqual([
      'add_entries',
      'claude_code_activity',
      'create_projects',
      'get_timer',
      'link_repos',
      'list_entries',
      'list_members',
      'list_projects',
      'list_tags',
      'whoami',
    ])
    expect(names.join(' ')).not.toMatch(/delete|remove|archive|role|zone|discard|stop/)
  })

  it('signs in with the client name it was initialized with and names it in commits', async () => {
    const gh = fake()
    let seen = ''
    const client = await clientFor((name) => {
      seen = name
      return connect({ token: 'tok-a', owner: gh.owner, repo: gh.repo }, name, {
        fetchFn: gh.fetch,
      })
    })
    const who = await client.callTool({ name: 'whoami', arguments: {} })
    expect(JSON.parse(text(who))).toMatchObject({ login: 'alice', role: 'leader' })
    expect(seen).toBe('claude-code')

    const added = await client.callTool({
      name: 'add_entries',
      arguments: {
        entries: [{ start: '2026-10-14 09:00', end: '2026-10-14 10:00', description: 'Work' }],
      },
    })
    expect(added.isError).toBeFalsy()
    expect(gh.messages.at(-1)).toMatch(/\(via claude-code\)$/)
  })

  it('reports a configuration error on every tool call', async () => {
    const config = await readConfig({})
    expect(config).toEqual({ ok: false, error: 'WORKADDICT_REPO is not set (expected owner/repo)' })
    const client = await clientFor(async () => {
      throw new ConnectError(config.ok ? '' : config.error)
    })
    for (const name of ['whoami', 'list_projects']) {
      const r = await client.callTool({ name, arguments: {} })
      expect(r.isError).toBe(true)
      expect(text(r)).toBe('WORKADDICT_REPO is not set (expected owner/repo)')
    }
  })

  it('returns tool errors as text without stack traces', async () => {
    const gh = fake()
    const client = await clientFor((name) =>
      connect({ token: 'tok-a', owner: gh.owner, repo: gh.repo }, name, { fetchFn: gh.fetch }),
    )
    const r = await client.callTool({
      name: 'add_entries',
      arguments: { entries: [{ start: 'soon', end: 'later', description: 'x' }] },
    })
    expect(r.isError).toBe(true)
    expect(text(r)).toMatch(/^"soon" is not a time/)
    expect(text(r)).not.toMatch(/at .*\.ts/)
  })
})

describe('readConfig', () => {
  it('reads token, repository and branch', async () => {
    expect(
      await readConfig({
        WORKADDICT_TOKEN: ' t ',
        WORKADDICT_REPO: 'acme/data',
        WORKADDICT_BRANCH: 'dev',
      }),
    ).toEqual({ ok: true, config: { token: 't', owner: 'acme', repo: 'data', branch: 'dev' } })
  })

  it('uses the gh token only on opt-in', async () => {
    const gh = async () => 'gh-token'
    expect((await readConfig({ WORKADDICT_REPO: 'acme/data' }, gh)).ok).toBe(false)
    expect(await readConfig({ WORKADDICT_REPO: 'acme/data', WORKADDICT_USE_GH: '1' }, gh)).toEqual({
      ok: true,
      config: { token: 'gh-token', owner: 'acme', repo: 'data' },
    })
  })

  it('rejects a malformed repository', async () => {
    expect(
      await readConfig({ WORKADDICT_TOKEN: 't', WORKADDICT_REPO: 'https://github.com/acme/data' }),
    ).toEqual({
      ok: false,
      error: 'WORKADDICT_REPO must be owner/repo, not "https://github.com/acme/data"',
    })
  })
})
