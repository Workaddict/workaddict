import type { TimeEntry } from '../domain/types'
import {
  entriesCodec,
  isHexColor,
  isIsoTimestamp,
  isLogin,
  metaCodec,
  rolesCodec,
  timerCodec,
  workspaceCodec,
} from './validate'

const PATH = 'entries/bob/2026-09.json'

function entry(extra?: Record<string, unknown>): TimeEntry {
  return {
    id: 'e1',
    login: 'bob',
    start: '2026-09-21T08:00:00Z',
    end: '2026-09-21T09:00:00Z',
    description: 'Work',
    projectId: null,
    tagIds: [],
    createdAt: '2026-09-21T09:00:00Z',
    updatedAt: '2026-09-21T09:00:00Z',
    ...extra,
  } as TimeEntry
}

describe('primitive checks', () => {
  it('accepts GitHub and Clockify pseudo-logins only', () => {
    expect(isLogin('alice')).toBe(true)
    expect(isLogin('clockify.jane-doe')).toBe(true)
    for (const bad of ['', '..', 'a b', 'a/b', '__proto__', '-x', 'x'.repeat(101), 42]) {
      expect(isLogin(bad)).toBe(false)
    }
  })

  it('checks ISO timestamps and hex colors', () => {
    expect(isIsoTimestamp('2026-09-21T08:00:00.000Z')).toBe(true)
    expect(isIsoTimestamp('yesterday')).toBe(false)
    expect(isIsoTimestamp('2026-13-45T99:00:00Z')).toBe(false)
    expect(isHexColor('#4f46e5')).toBe(true)
    expect(isHexColor('#000')).toBe(true)
    expect(isHexColor('red; background:url(x)')).toBe(false)
  })
})

describe('entriesCodec', () => {
  it('round-trips valid data unchanged', () => {
    const raw = [entry(), entry({ id: 'e2', stoppedBy: 'alice' })]
    const d = entriesCodec.decode(raw, PATH)
    expect(d).toMatchObject({ issues: 0, unreadable: false })
    expect(entriesCodec.encode(d.value, d.rest)).toEqual(raw)
  })

  it.each([
    ['missing start', { start: undefined }],
    ['unparseable end', { end: 'soon' }],
    ['end before start', { end: '2026-09-21T07:00:00Z' }],
    ['non-string description', { description: 42 }],
    ['bad projectId', { projectId: 7 }],
    ['bad tagIds', { tagIds: 'x' }],
    ['empty id', { id: '' }],
    ['login of another member', { login: 'alice' }],
    ['invalid stoppedBy', { stoppedBy: '../x' }],
  ])('rejects a record with %s', (_name, extra) => {
    const d = entriesCodec.decode([entry(), entry({ id: 'bad', ...extra })], PATH)
    expect(d.value.map((e) => e.id)).toEqual(['e1'])
    expect(d.issues).toBe(1)
  })

  it('writes invalid records back unchanged, after the valid ones and in order', () => {
    const bad1 = { nonsense: true }
    const bad2 = 'text'
    const d = entriesCodec.decode([bad1, entry(), bad2], PATH)
    const next = [...d.value, entry({ id: 'e2' })]
    expect(entriesCodec.encode(next, d.rest)).toEqual([entry(), entry({ id: 'e2' }), bad1, bad2])
  })

  it('reports a non-array root as unreadable', () => {
    expect(entriesCodec.decode({ entries: 42 }, PATH)).toMatchObject({ value: [], unreadable: true })
    expect(entriesCodec.decode(undefined, PATH)).toMatchObject({ unreadable: true })
  })
})

describe('timerCodec', () => {
  const timer = { id: 't1', login: 'bob', start: '2026-09-21T08:00:00Z', description: '', projectId: null, tagIds: [] }

  it('accepts null and a valid timer', () => {
    expect(timerCodec.decode(null, 'timers/bob.json')).toMatchObject({ value: null, issues: 0 })
    expect(timerCodec.decode(timer, 'timers/bob.json')).toMatchObject({ value: timer, issues: 0 })
  })

  it('treats an invalid or foreign timer as no timer', () => {
    expect(timerCodec.decode({ ...timer, start: 'x' }, 'timers/bob.json')).toMatchObject({ value: null, issues: 1 })
    expect(timerCodec.decode(timer, 'timers/alice.json')).toMatchObject({ value: null, issues: 1 })
  })
})

describe('workspaceCodec', () => {
  const project = { id: 'p1', name: 'Web', color: '#4f46e5', archived: false }
  const tag = { id: 't1', name: 'Urgent', archived: false }

  it('round-trips valid data unchanged, including unknown keys', () => {
    const raw = { projects: [project], tags: [tag], future: { x: 1 } }
    const d = workspaceCodec.decode(raw, 'workspace.json')
    expect(d.issues).toBe(0)
    expect(workspaceCodec.encode(d.value, d.rest)).toEqual(raw)
  })

  it('replaces an invalid color and keeps invalid records on write', () => {
    const badProject = { id: 'p2', name: 5 }
    const d = workspaceCodec.decode(
      { projects: [{ ...project, color: 'red; background:url(x)' }, badProject], tags: [tag, null] },
      'workspace.json',
    )
    expect(d.value.projects).toEqual([{ ...project, color: '#4f46e5' }])
    expect(d.value.tags).toEqual([tag])
    expect(d.issues).toBe(3)
    expect(workspaceCodec.encode(d.value, d.rest)).toEqual({
      projects: [{ ...project, color: '#4f46e5' }, badProject],
      tags: [tag, null],
    })
  })

  it('reports a wrong root shape as unreadable', () => {
    expect(workspaceCodec.decode([], 'workspace.json').unreadable).toBe(true)
    expect(workspaceCodec.decode({ projects: 'x' }, 'workspace.json').unreadable).toBe(true)
    expect(workspaceCodec.decode({}, 'workspace.json')).toMatchObject({ unreadable: false, issues: 0 })
  })
})

describe('rolesCodec', () => {
  it('keeps valid roles and passes invalid ones through', () => {
    const d = rolesCodec.decode({ roles: { bob: 'editor', carol: 'admin', 'a b': 'leader' } }, 'roles.json')
    expect(d.value).toEqual({ roles: { bob: 'editor' } })
    expect(d.issues).toBe(2)
    expect(rolesCodec.encode({ roles: { bob: 'editor', carol: 'worker' } }, d.rest)).toEqual({
      roles: { bob: 'editor', carol: 'worker', 'a b': 'leader' },
    })
  })
})

describe('metaCodec', () => {
  it('accepts a valid schema version', () => {
    const raw = { schemaVersion: 1, createdAt: '2026-01-01T00:00:00Z' }
    expect(metaCodec.decode(raw, 'tracker.json')).toMatchObject({ value: raw, unreadable: false })
  })

  it('treats an invalid file as a newer schema', () => {
    const d = metaCodec.decode({ schemaVersion: 'one' }, 'tracker.json')
    expect(d.unreadable).toBe(true)
    expect(d.value.schemaVersion).toBeGreaterThan(1000)
  })
})
