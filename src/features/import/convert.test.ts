import { PROJECT_COLORS } from '../../domain/types'
import type { ClockifyTimeEntry } from './clockify/client'
import type { ClockifyRaw } from './clockify/fetcher'
import {
  convertClockify,
  formerMemberLogins,
  nearestProjectColor,
  slugify,
  type UserMapping,
} from './convert'

const NOW = new Date('2026-09-21T12:00:00Z')

function entry(userId: string, start: string, end: string | null, extra?: Partial<ClockifyTimeEntry>) {
  return { id: crypto.randomUUID(), userId, timeInterval: { start, end }, ...extra }
}

function raw(partial: Partial<ClockifyRaw>): ClockifyRaw {
  return {
    users: [{ id: 'u1', name: 'Alice', email: 'alice@x' }],
    projects: [],
    tags: [],
    entries: {},
    noAccess: [],
    ...partial,
  }
}

const alice: Record<string, UserMapping> = { u1: { kind: 'login', login: 'alice' } }

describe('convertClockify', () => {
  it('converts an archived project with the nearest palette color', () => {
    const { workspace } = convertClockify(
      raw({ projects: [{ id: 'cp', name: 'Website', color: '#03A9F4', archived: true }] }),
      alice,
      NOW,
    )
    expect(workspace.projects).toEqual([
      { id: expect.any(String), name: 'Website', color: '#0ea5e9', archived: true },
    ])
  })

  it('disambiguates equal project names with the client name, then a number', () => {
    const { workspace } = convertClockify(
      raw({
        projects: [
          { id: 'a', name: 'Website', clientName: 'Acme' },
          { id: 'b', name: 'Website', clientName: 'Globex' },
          { id: 'c', name: 'Internal' },
          { id: 'd', name: 'internal' },
        ],
      }),
      alice,
      NOW,
    )
    expect(workspace.projects.map((p) => p.name)).toEqual([
      'Website (Acme)',
      'Website (Globex)',
      'Internal',
      'internal 2',
    ])
  })

  it('converts tags with their archived flag', () => {
    const { workspace } = convertClockify(
      raw({ tags: [{ id: 't', name: 'meeting', archived: true }] }),
      alice,
      NOW,
    )
    expect(workspace.tags).toEqual([{ id: expect.any(String), name: 'meeting', archived: true }])
  })

  it('converts a completed entry with UTC times, project, and tags', () => {
    const { workspace, entries } = convertClockify(
      raw({
        projects: [{ id: 'cp', name: 'Website' }],
        tags: [{ id: 'ct', name: 'meeting' }],
        entries: {
          u1: [
            entry('u1', '2026-07-25T08:00:00Z', '2026-07-25T10:00:00Z', {
              description: 'Planning',
              projectId: 'cp',
              tagIds: ['ct'],
            }),
          ],
        },
      }),
      alice,
      NOW,
    )
    expect(entries).toEqual([
      {
        id: expect.any(String),
        login: 'alice',
        start: '2026-07-25T08:00:00.000Z',
        end: '2026-07-25T10:00:00.000Z',
        description: 'Planning',
        projectId: workspace.projects[0]!.id,
        tagIds: [workspace.tags[0]!.id],
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      },
    ])
  })

  it('skips running timers and entries without a positive duration', () => {
    const { entries, report } = convertClockify(
      raw({
        entries: {
          u1: [
            entry('u1', '2026-07-25T08:00:00Z', null),
            entry('u1', '2026-07-25T10:00:00Z', '2026-07-25T10:00:00Z'),
            entry('u1', '2026-07-25T10:00:00Z', '2026-07-25T09:00:00Z'),
            entry('u1', '2026-07-25T10:00:00Z', '2026-07-25T11:00:00Z'),
          ],
        },
      }),
      alice,
      NOW,
    )
    expect(entries).toHaveLength(1)
    expect(report.skippedRunning).toBe(1)
    expect(report.skippedInvalid).toBe(2)
  })

  it('drops unknown project and tag references and counts task/billable info', () => {
    const { entries, report } = convertClockify(
      raw({
        entries: {
          u1: [
            entry('u1', '2026-07-25T08:00:00Z', '2026-07-25T09:00:00Z', {
              projectId: 'gone',
              tagIds: ['gone'],
              taskId: 'task',
              billable: true,
            }),
          ],
        },
      }),
      alice,
      NOW,
    )
    expect(entries[0]).toMatchObject({ projectId: null, tagIds: [] })
    expect(report).toMatchObject({ unknownProjectRefs: 1, droppedTagRefs: 1, withTask: 1, billable: 1 })
  })

  it('imports former members under a pseudo-login and ignores skipped users', () => {
    const { entries, report } = convertClockify(
      raw({
        users: [
          { id: 'u1', name: 'Alice', email: 'a@x' },
          { id: 'u2', name: 'Jane Doe', email: 'j@x' },
          { id: 'u3', name: 'Tom', email: 't@x' },
          { id: 'u4', name: 'Nora', email: 'n@x' },
        ],
        entries: {
          u1: [entry('u1', '2026-07-25T08:00:00Z', '2026-07-25T09:00:00Z')],
          u2: [entry('u2', '2026-07-25T08:00:00Z', '2026-07-25T10:00:00Z')],
          u3: [entry('u3', '2026-07-25T08:00:00Z', '2026-07-25T10:00:00Z')],
        },
        noAccess: ['u4'],
      }),
      { u1: alice.u1!, u2: { kind: 'former' }, u3: { kind: 'skip' }, u4: { kind: 'login', login: 'nora' } },
      NOW,
    )
    expect(entries.map((e) => e.login).sort()).toEqual(['alice', 'clockify.jane-doe'])
    expect(report.byLogin).toEqual({
      alice: { entries: 1, ms: 3_600_000 },
      'clockify.jane-doe': { entries: 1, ms: 7_200_000 },
    })
    expect(report.skippedUsers).toEqual(['Tom'])
    expect(report.noAccessUsers).toEqual(['Nora'])
  })

  it('sums hours per project, largest first', () => {
    const { report } = convertClockify(
      raw({
        projects: [{ id: 'cp', name: 'Website' }],
        entries: {
          u1: [
            entry('u1', '2026-07-25T08:00:00Z', '2026-07-25T09:00:00Z'),
            entry('u1', '2026-07-25T09:00:00Z', '2026-07-25T12:00:00Z', { projectId: 'cp' }),
          ],
        },
      }),
      alice,
      NOW,
    )
    expect(report.msByProject.map((p) => [p.name, p.ms])).toEqual([
      ['Website', 3 * 3_600_000],
      [null, 3_600_000],
    ])
  })
})

describe('former member logins', () => {
  it('slugifies names to lowercase ASCII with hyphens', () => {
    expect(slugify('  Jürgen Müller-Weiß ')).toBe('jurgen-muller-weiss')
    expect(slugify('李')).toBe('')
  })

  it('de-duplicates equal names and never yields an empty slug', () => {
    const logins = formerMemberLogins([
      { id: 'a', name: 'Jane Doe' },
      { id: 'b', name: 'jane doe' },
      { id: 'c', name: '李' },
    ])
    expect([...logins.values()]).toEqual(['clockify.jane-doe', 'clockify.jane-doe-2', 'clockify.user'])
  })
})

describe('nearestProjectColor', () => {
  it('falls back to the first palette color for invalid input', () => {
    expect(nearestProjectColor(undefined)).toBe(PROJECT_COLORS[0])
    expect(nearestProjectColor('nope')).toBe(PROJECT_COLORS[0])
  })

  it('returns palette colors unchanged', () => {
    for (const c of PROJECT_COLORS) expect(nearestProjectColor(c)).toBe(c)
  })
})
