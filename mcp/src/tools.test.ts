// @vitest-environment node
import { FakeGitHub } from '../../src/storage/github/fakeGitHub'
import type { TimeEntry } from '../../src/domain/types'
import { connect, ConnectError, type Session } from './connect'
import {
  addEntries,
  createProjects,
  linkRepos,
  listEntries,
  listProjects,
  parseTime,
  toolErrorText,
  whoami,
  ToolError,
} from './tools'

const web = { id: 'p1', name: 'Website', color: '#4f46e5', archived: false, repos: ['acme/web'] }

function fake() {
  const gh = new FakeGitHub()
  gh.users = { 'tok-a': 'alice', 'tok-b': 'bob' }
  gh.admins.add('alice')
  gh.putRaw('tracker.json', JSON.stringify({ schemaVersion: 1, createdAt: '2026-01-01T00:00:00Z' }))
  gh.putRaw(
    'workspace.json',
    JSON.stringify({
      projects: [web],
      tags: [{ id: 't1', name: 'dev', archived: false }],
      timeZone: 'Europe/Vienna',
    }),
  )
  return gh
}

function open(gh: FakeGitHub, token = 'tok-a'): Promise<Session> {
  return connect({ token, owner: gh.owner, repo: gh.repo }, 'claude-code', { fetchFn: gh.fetch })
}

function stored(gh: FakeGitHub, login: string, month: string): TimeEntry[] {
  return (gh.json(`entries/${login}/${month}.json`) as TimeEntry[] | undefined) ?? []
}

async function failure(p: Promise<unknown>): Promise<string> {
  try {
    await p
  } catch (e) {
    return toolErrorText(e)
  }
  throw new Error('expected a failure')
}

describe('connect', () => {
  it('signs in and reports login, role and team zone', async () => {
    const s = await open(fake())
    expect(await whoami(s)).toEqual({
      login: 'alice',
      role: 'leader',
      owner: true,
      timeZone: 'Europe/Vienna',
      markAiEntries: false,
      readOnly: false,
    })
  })

  it('refuses a repository without tracker.json and never initializes it', async () => {
    const gh = new FakeGitHub()
    gh.users = { 'tok-a': 'alice' }
    gh.putRaw('README.md', 'hi')
    await expect(open(gh)).rejects.toThrow(/not a Workaddict data repository/)
    expect(gh.files.has('tracker.json')).toBe(false)
  })

  it('explains a rejected token without echoing it', async () => {
    const e = await open(fake(), 'tok-wrong').catch((x: unknown) => x)
    expect(e).toBeInstanceOf(ConnectError)
    expect((e as Error).message).toMatch(/rejected WORKADDICT_TOKEN/)
    expect((e as Error).message).not.toContain('tok-wrong')
  })

  it('opens data from a newer app version read-only', async () => {
    const gh = fake()
    gh.putRaw('tracker.json', JSON.stringify({ schemaVersion: 99, createdAt: '' }))
    const s = await open(gh)
    expect(s.adapter.readOnly).toBe(true)
    expect(
      await failure(
        addEntries(s, {
          entries: [{ start: '2026-10-14 09:00', end: '2026-10-14 10:00', description: 'x' }],
        }),
      ),
    ).toMatch(/read-only/)
  })
})

describe('parseTime', () => {
  it('reads ISO with offset and local times in the zone', () => {
    expect(parseTime('2026-10-14T09:30:00+02:00', 'UTC').toISOString()).toBe(
      '2026-10-14T07:30:00.000Z',
    )
    expect(parseTime('2026-10-14 09:30', 'Europe/Vienna').toISOString()).toBe(
      '2026-10-14T07:30:00.000Z',
    )
    expect(parseTime('2026-10-14T09:30', 'Europe/Vienna').toISOString()).toBe(
      '2026-10-14T07:30:00.000Z',
    )
    expect(() => parseTime('tomorrow', 'UTC')).toThrow(ToolError)
  })
})

describe('list_entries', () => {
  it('uses day boundaries of the team zone and shows times with offset', async () => {
    const gh = fake()
    const s = await open(gh)
    await addEntries(s, {
      entries: [
        // 23:30 Vienna on the 13th is 21:30Z: not part of the 14th.
        { start: '2026-10-13 23:00', end: '2026-10-13 23:30', description: 'late' },
        { start: '2026-10-14 00:30', end: '2026-10-14 01:00', description: 'early' },
      ],
    })
    const day = await listEntries(s, { from: '2026-10-14', to: '2026-10-14' })
    expect(day.map((e) => [e.description, e.start, e.minutes])).toEqual([
      ['early', '2026-10-14T00:30:00+02:00', 30],
    ])
  })
})

describe('create_projects', () => {
  it('creates projects and tags in one commit, with free colors, and reports duplicates', async () => {
    const gh = fake()
    const s = await open(gh)
    const commits = gh.commits
    const r = await createProjects(s, {
      projects: [
        { name: 'Huber', repos: ['https://github.com/acme/huber-shop', 'not a repo'] },
        { name: 'website' },
      ],
      tags: ['support', 'DEV'],
    })
    expect(gh.commits).toBe(commits + 1)
    expect(r.created).toEqual([
      { id: expect.any(String), name: 'Huber', color: '#0ea5e9', repos: ['acme/huber-shop'] },
    ])
    expect(r.createdTags.map((t) => t.name)).toEqual(['support'])
    expect(r.refused).toEqual([
      { name: 'Huber: not a repo', reason: 'not a GitHub repository' },
      { name: 'website', reason: 'name already exists' },
      { name: 'DEV', reason: 'tag already exists' },
    ])
    expect((await listProjects(s, {})).map((p) => p.name)).toEqual(['Website', 'Huber'])
    expect(gh.messages.at(-1)).toMatch(
      /^workspace: add Huber, website, support, DEV \(alice\) \(via claude-code\)$/,
    )
  })

  it('refuses workers and writes nothing', async () => {
    const gh = fake()
    const s = await open(gh, 'tok-b')
    const commits = gh.commits
    expect(await failure(createProjects(s, { projects: [{ name: 'X' }] }))).toMatch(
      /editor or team leader/,
    )
    expect(gh.commits).toBe(commits)
  })

  it('links more repositories to a project', async () => {
    const s = await open(fake())
    const p = await linkRepos(s, {
      projectId: 'p1',
      repos: ['git@github.com:acme/api.git', 'acme/WEB'],
    })
    expect(p.repos).toEqual(['acme/web', 'acme/api'])
  })
})

describe('add_entries', () => {
  it('adds several entries in one commit, resolving #42 through the project', async () => {
    const gh = fake()
    const s = await open(gh)
    const commits = gh.commits
    const r = await addEntries(s, {
      entries: [
        {
          start: '2026-10-14 09:00',
          end: '2026-10-14 10:30',
          description: 'Login bug',
          projectId: 'p1',
          issueRef: '#42',
          tagIds: ['t1'],
        },
        { start: '2026-10-14 11:00', end: '2026-10-14 12:00', description: 'Review' },
        {
          start: '2026-10-14T13:00:00+02:00',
          end: '2026-10-14T14:00:00+02:00',
          description: 'Call',
        },
      ],
    })
    expect(r.conflicts).toEqual([])
    expect(gh.commits).toBe(commits + 1)
    expect(r.saved.map((e) => e.minutes)).toEqual([90, 60, 60])
    const files = stored(gh, 'alice', '2026-10')
    expect(files).toHaveLength(3)
    expect(files[0]).toMatchObject({ issueRef: 'acme/web#42', projectId: 'p1', tagIds: ['t1'] })
    expect(files[0]).not.toHaveProperty('addedVia') // marking is off by default
    expect(gh.messages.at(-1)).toMatch(/\(via claude-code\)$/)
  })

  it('refuses overlaps with tracked time and among new entries, saving nothing', async () => {
    const gh = fake()
    const s = await open(gh)
    await addEntries(s, {
      entries: [{ start: '2026-10-14 09:00', end: '2026-10-14 10:00', description: 'App' }],
    })
    const commits = gh.commits
    const r = await addEntries(s, {
      entries: [
        { start: '2026-10-14 09:30', end: '2026-10-14 11:00', description: 'AI' },
        { start: '2026-10-14 10:30', end: '2026-10-14 11:30', description: 'AI 2' },
      ],
    })
    expect(gh.commits).toBe(commits)
    expect(r.saved).toEqual([])
    expect(r.conflicts).toEqual([
      {
        entry: 1,
        with: expect.objectContaining({ description: 'App', start: '2026-10-14T09:00:00+02:00' }),
      },
      { entry: 1, with: expect.objectContaining({ description: 'new entry 2: AI 2' }) },
    ])

    const forced = await addEntries(s, {
      entries: [{ start: '2026-10-14 09:30', end: '2026-10-14 11:00', description: 'AI' }],
      allowOverlap: true,
    })
    expect(forced.saved).toHaveLength(1)
  })

  it("does not count another member's time as an overlap", async () => {
    const gh = fake()
    const s = await open(gh)
    await addEntries(s, {
      entries: [
        { start: '2026-10-14 09:00', end: '2026-10-14 10:00', description: 'x', login: 'bob' },
      ],
    })
    const r = await addEntries(s, {
      entries: [{ start: '2026-10-14 09:00', end: '2026-10-14 10:00', description: 'y' }],
    })
    expect(r.saved).toHaveLength(1)
  })

  it("refuses a worker's entry for another member and writes nothing", async () => {
    const gh = fake()
    const s = await open(gh, 'tok-b')
    const commits = gh.commits
    const msg = await failure(
      addEntries(s, {
        entries: [
          { start: '2026-10-14 09:00', end: '2026-10-14 10:00', description: 'x', login: 'alice' },
        ],
      }),
    )
    expect(msg).toMatch(/Not allowed/)
    expect(gh.commits).toBe(commits)
  })

  it('rejects invalid input before writing', async () => {
    const gh = fake()
    const s = await open(gh)
    const commits = gh.commits
    const at = (extra: object) =>
      failure(
        addEntries(s, {
          entries: [
            { start: '2026-10-14 10:00', end: '2026-10-14 11:00', description: 'x', ...extra },
          ],
        }),
      )
    expect(await at({ end: '2026-10-14 09:00' })).toMatch(/end must be after start/)
    expect(await at({ projectId: 'nope' })).toMatch(/no project with id nope/)
    expect(await at({ tagIds: ['nope'] })).toMatch(/no tag with id nope/)
    expect(await at({ issueRef: '#42' })).toMatch(/needs owner\/repo#number/)
    expect(await at({ issueRef: 'fix it' })).toMatch(/not an issue reference/)
    expect(gh.commits).toBe(commits)
  })

  it('records the assistant when the team marks AI entries', async () => {
    const gh = fake()
    const s = await open(gh)
    await s.adapter.setMarkAiEntries(true)
    await addEntries(s, {
      entries: [{ start: '2026-10-14 09:00', end: '2026-10-14 10:00', description: 'x' }],
    })
    expect(stored(gh, 'alice', '2026-10')[0]?.addedVia).toBe('claude-code')
  })
})
