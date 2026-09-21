/**
 * Behavioral contract every StorageAdapter must satisfy.
 * `setup` returns two adapters sharing one data store: alice is an owner (repository admin),
 * bob a member without an assigned role.
 */
import { SCHEMA_VERSION, type TimeEntry } from '../domain/types'
import { isStorageError } from './errors'
import type { StorageAdapter } from './types'

export type ContractSetup = () => Promise<{
  alice: StorageAdapter
  bob: StorageAdapter
  /** Adapter over a store whose tracker.json has a newer schema version. */
  newerSchema: () => Promise<StorageAdapter>
}>

function entry(login: string, start: string, end: string, extra?: Partial<TimeEntry>): TimeEntry {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    login,
    start,
    end,
    description: 'Work',
    projectId: null,
    tagIds: [],
    createdAt: now,
    updatedAt: now,
    ...extra,
  }
}

const SEPT = { from: new Date('2026-09-01T00:00:00Z'), to: new Date('2026-09-30T23:59:59Z') }

export function runAdapterContract(name: string, setup: ContractSetup) {
  describe(`StorageAdapter contract: ${name}`, () => {
    let alice: StorageAdapter
    let bob: StorageAdapter
    let newerSchema: () => Promise<StorageAdapter>

    beforeEach(async () => {
      ;({ alice, bob, newerSchema } = await setup())
      await alice.init()
      await bob.init()
    })

    it('initializes an empty store with an empty workspace', async () => {
      expect(await alice.getWorkspace()).toEqual({ projects: [], tags: [] })
      expect(alice.readOnly).toBe(false)
    })

    it('opens read-only when the schema version is newer', async () => {
      const a = await newerSchema()
      await a.init()
      expect(a.readOnly).toBe(true)
      await expect(a.startTimer({ description: '', projectId: null, tagIds: [] })).rejects.toSatisfy(
        (e: unknown) => isStorageError(e, 'readOnly'),
      )
    })

    it('saves and lists entries of all members within a range', async () => {
      await alice.saveEntry(entry('alice', '2026-09-21T08:00:00Z', '2026-09-21T10:00:00Z'))
      await bob.saveEntry(entry('bob', '2026-09-22T08:00:00Z', '2026-09-22T09:00:00Z'))
      await alice.saveEntry(entry('alice', '2026-10-01T08:00:00Z', '2026-10-01T09:00:00Z'))

      const sept = await alice.listEntries(SEPT)
      expect(sept.map((e) => e.login).sort()).toEqual(['alice', 'bob'])
      expect(await bob.listAllEntries()).toHaveLength(3)
    })

    it('stores an entry spanning months only in its start month', async () => {
      await alice.saveEntry(entry('alice', '2026-09-30T22:00:00Z', '2026-10-01T01:00:00Z'))
      expect(await alice.listEntries(SEPT)).toHaveLength(1)
      const oct = { from: new Date('2026-10-01T02:00:00Z'), to: new Date('2026-10-31T00:00:00Z') }
      expect(await alice.listEntries(oct)).toHaveLength(0)
    })

    it('updates an entry and moves it between months', async () => {
      const e = await alice.saveEntry(entry('alice', '2026-09-21T08:00:00Z', '2026-09-21T10:00:00Z'))
      await alice.saveEntry(
        { ...e, start: '2026-08-10T08:00:00Z', end: '2026-08-10T09:00:00Z', description: 'Moved' },
        e.start,
      )
      const all = await alice.listAllEntries()
      expect(all).toHaveLength(1)
      expect(all[0]).toMatchObject({ id: e.id, description: 'Moved', start: '2026-08-10T08:00:00Z' })
    })

    it('deletes own entries', async () => {
      const e = await alice.saveEntry(entry('alice', '2026-09-21T08:00:00Z', '2026-09-21T10:00:00Z'))
      await alice.deleteEntry(e)
      expect(await alice.listAllEntries()).toHaveLength(0)
    })

    it("refuses a worker's changes to another member's entries", async () => {
      const e = await alice.saveEntry(entry('alice', '2026-09-21T08:00:00Z', '2026-09-21T10:00:00Z'))
      await expect(bob.deleteEntry(e)).rejects.toSatisfy((x: unknown) =>
        isStorageError(x, 'forbiddenRole'),
      )
      await expect(bob.saveEntry({ ...e, description: 'x' }, e.start)).rejects.toSatisfy(
        (x: unknown) => isStorageError(x, 'forbiddenRole'),
      )
      expect((await alice.listAllEntries())[0]).toMatchObject({ description: 'Work' })
    })

    it("lets an editor change another member's entry in that member's file", async () => {
      await alice.setRole('bob', 'editor')
      const e = await alice.saveEntry(entry('alice', '2026-09-21T08:00:00Z', '2026-09-21T10:00:00Z'))
      await bob.saveEntry({ ...e, description: 'Edited', start: '2026-08-21T08:00:00Z', end: '2026-08-21T09:00:00Z' }, e.start)
      const all = await alice.listAllEntries()
      expect(all).toHaveLength(1)
      expect(all[0]).toMatchObject({ login: 'alice', description: 'Edited' })
      await bob.deleteEntry(all[0]!)
      expect(await alice.listAllEntries()).toHaveLength(0)
    })

    it('rejects entries that end before they start', async () => {
      await expect(
        alice.saveEntry(entry('alice', '2026-09-21T10:00:00Z', '2026-09-21T09:00:00Z')),
      ).rejects.toSatisfy((x: unknown) => isStorageError(x, 'invalid'))
    })

    it('starts, updates and stops a timer, creating an entry', async () => {
      const { timer } = await alice.startTimer(
        { description: 'Timer', projectId: 'p1', tagIds: ['t1'] },
        new Date('2026-09-21T09:00:00Z'),
      )
      expect(await alice.getTimer()).toEqual(timer)
      expect(await bob.listTimers()).toEqual([timer])

      await alice.updateTimer({ description: 'Renamed' })
      const e = await alice.stopTimer(new Date('2026-09-21T10:30:00Z'))
      expect(e).toMatchObject({
        id: timer.id,
        description: 'Renamed',
        projectId: 'p1',
        tagIds: ['t1'],
        start: '2026-09-21T09:00:00.000Z',
        end: '2026-09-21T10:30:00.000Z',
      })
      expect(await alice.getTimer()).toBeNull()
      expect(await alice.listEntries(SEPT)).toHaveLength(1)
    })

    it('stopping when already stopped returns null and creates no duplicate', async () => {
      await alice.startTimer({ description: '', projectId: null, tagIds: [] })
      await alice.stopTimer()
      expect(await alice.stopTimer()).toBeNull()
      expect(await alice.listAllEntries()).toHaveLength(1)
    })

    it('starting while running stops the current timer first', async () => {
      const first = await alice.startTimer(
        { description: 'A', projectId: null, tagIds: [] },
        new Date('2026-09-21T09:00:00Z'),
      )
      const second = await alice.startTimer(
        { description: 'B', projectId: null, tagIds: [] },
        new Date('2026-09-21T10:00:00Z'),
      )
      expect(second.stopped).toMatchObject({ id: first.timer.id, end: '2026-09-21T10:00:00.000Z' })
      expect((await alice.getTimer())?.description).toBe('B')
    })

    it('discards a timer without creating an entry', async () => {
      await alice.startTimer({ description: '', projectId: null, tagIds: [] })
      await alice.discardTimer()
      expect(await alice.getTimer()).toBeNull()
      expect(await alice.listAllEntries()).toHaveLength(0)
    })

    describe("other members' timers", () => {
      const running = (a: StorageAdapter, at = '2026-09-21T09:00:00Z') =>
        a.startTimer({ description: 'Support', projectId: 'p1', tagIds: ['t1'] }, new Date(at))

      it("lets a team leader stop a member's timer into that member's entries", async () => {
        const { timer } = await running(bob)
        const e = await alice.stopTimer(new Date('2026-09-21T10:30:00Z'), {
          login: 'bob',
          timerId: timer.id,
        })
        expect(e).toMatchObject({
          id: timer.id,
          login: 'bob',
          start: '2026-09-21T09:00:00.000Z',
          end: '2026-09-21T10:30:00.000Z',
          description: 'Support',
          projectId: 'p1',
          tagIds: ['t1'],
          stoppedBy: 'alice',
        })
        expect(await bob.getTimer()).toBeNull()
        expect(await bob.listAllEntries()).toEqual([e])
      })

      it('lets an editor discard a member timer', async () => {
        await alice.setRole('bob', 'editor')
        const { timer } = await running(alice)
        expect(await bob.discardTimer({ login: 'alice', timerId: timer.id })).toBe(true)
        expect(await alice.getTimer()).toBeNull()
        expect(await alice.listAllEntries()).toHaveLength(0)
      })

      it("refuses a worker stopping or discarding another member's timer and writes nothing", async () => {
        const { timer } = await running(alice)
        const target = { login: 'alice', timerId: timer.id }
        for (const act of [
          () => bob.stopTimer(new Date(), target),
          () => bob.discardTimer(target),
        ]) {
          await expect(act()).rejects.toSatisfy((x: unknown) => isStorageError(x, 'forbiddenRole'))
        }
        expect(await alice.getTimer()).toEqual(timer)
        expect(await alice.listAllEntries()).toHaveLength(0)
      })

      it('leaves a newer timer running when the seen timer was replaced', async () => {
        const first = await running(bob)
        const second = await running(bob, '2026-09-21T10:00:00Z')
        const target = { login: 'bob', timerId: first.timer.id }
        expect(await alice.stopTimer(new Date('2026-09-21T11:00:00Z'), target)).toBeNull()
        expect(await alice.discardTimer(target)).toBe(false)
        expect(await bob.getTimer()).toEqual(second.timer)
        expect(await bob.listAllEntries()).toHaveLength(1) // the first timer, stopped by bob
      })

      it('creates exactly one entry when the owner and a team leader both stop', async () => {
        const { timer } = await running(bob)
        const byOwner = await bob.stopTimer(new Date('2026-09-21T10:00:00Z'))
        const byLeader = await alice.stopTimer(new Date('2026-09-21T10:05:00Z'), {
          login: 'bob',
          timerId: timer.id,
        })
        expect(byLeader).toBeNull()
        expect(await bob.listAllEntries()).toEqual([byOwner])
        expect(byOwner?.stoppedBy).toBeUndefined()
      })

      it('keeps stoppedBy when the entry is edited later', async () => {
        const { timer } = await running(bob)
        const e = await alice.stopTimer(new Date('2026-09-21T10:00:00Z'), {
          login: 'bob',
          timerId: timer.id,
        })
        await bob.saveEntry({ ...e!, description: 'Renamed' }, e!.start)
        expect((await bob.listAllEntries())[0]).toMatchObject({
          description: 'Renamed',
          stoppedBy: 'alice',
        })
      })
    })

    it('keeps workspace changes from several members', async () => {
      await alice.setRole('bob', 'editor')
      await alice.updateWorkspace(
        (ws) => ({ ...ws, projects: [...ws.projects, { id: 'p1', name: 'A', color: '#000', archived: false }] }),
        'add project A',
      )
      await bob.updateWorkspace(
        (ws) => ({ ...ws, projects: [...ws.projects, { id: 'p2', name: 'B', color: '#000', archived: false }] }),
        'add project B',
      )
      expect((await alice.getWorkspace()).projects.map((p) => p.name)).toEqual(['A', 'B'])
    })

    it('lists members including the current user', async () => {
      const logins = (await alice.listMembers()).map((m) => m.login)
      expect(logins).toContain('alice')
    })

    it('exports a complete backup', async () => {
      await alice.saveEntry(entry('alice', '2026-09-21T08:00:00Z', '2026-09-21T10:00:00Z'))
      await bob.saveEntry(entry('bob', '2025-01-02T08:00:00Z', '2025-01-02T10:00:00Z'))
      const backup = await alice.exportBackup()
      expect(backup.format).toBe('workaddict-backup')
      expect(backup.schemaVersion).toBe(SCHEMA_VERSION)
      expect(backup.entries.map((e) => e.login)).toEqual(['bob', 'alice'])
      expect(backup.workspace).toEqual({ projects: [], tags: [] })
    })

    describe('roles', () => {
      it('treats the owner as team leader and others as workers without roles.json', async () => {
        expect(await alice.getAccess()).toEqual({ login: 'alice', role: 'leader', owner: true })
        expect(await bob.getAccess()).toEqual({ login: 'bob', role: 'worker', owner: false })
        const team = await bob.listRoles()
        expect(team.configured).toBe(false)
        expect(team.members.find((m) => m.login === 'alice')).toMatchObject({ role: 'leader', owner: true })
      })

      it('lets the owner assign roles and names member, role, and owner in the commit', async () => {
        await alice.setRole('bob', 'editor')
        expect(await bob.getAccess()).toMatchObject({ role: 'editor', owner: false })
        const team = await alice.listRoles()
        expect(team.configured).toBe(true)
        expect(team.members.find((m) => m.login === 'bob')).toMatchObject({ role: 'editor' })
      })

      it('refuses role changes by non-owners, even team leaders', async () => {
        await alice.setRole('bob', 'leader')
        await expect(bob.setRole('bob', 'worker')).rejects.toSatisfy((x: unknown) =>
          isStorageError(x, 'forbiddenRole'),
        )
        expect(await bob.getAccess()).toMatchObject({ role: 'leader' })
      })

      it('never demotes an owner', async () => {
        await expect(alice.setRole('alice', 'worker')).rejects.toSatisfy((x: unknown) =>
          isStorageError(x, 'invalid'),
        )
        expect(await alice.getAccess()).toMatchObject({ role: 'leader', owner: true })
      })

      it('refuses workspace changes by workers and writes nothing', async () => {
        await expect(
          bob.updateWorkspace(
            (ws) => ({ ...ws, tags: [{ id: 't', name: 'x', archived: false }] }),
            'add tag x',
          ),
        ).rejects.toSatisfy((x: unknown) => isStorageError(x, 'forbiddenRole'))
        expect((await alice.getWorkspace()).tags).toEqual([])
      })
    })

    describe('import', () => {
      const data = () => ({
        workspace: {
          projects: [{ id: 'p1', name: 'Website', color: '#000', archived: false }],
          tags: [{ id: 't1', name: 'meeting', archived: true }],
        },
        entries: [
          entry('alice', '2025-10-01T08:00:00Z', '2025-10-01T09:00:00Z', { projectId: 'p1' }),
          entry('alice', '2025-11-30T23:30:00Z', '2025-12-01T00:30:00Z', { tagIds: ['t1'] }),
          entry('bob', '2025-10-15T08:00:00Z', '2025-10-15T10:00:00Z'),
          entry('clockify.jane-doe', '2025-11-02T08:00:00Z', '2025-11-02T09:00:00Z'),
        ],
      })

      it('reports an initialized store as empty, and not after an entry was saved', async () => {
        expect(await alice.isEmpty()).toBe(true)
        await bob.saveEntry(entry('bob', '2026-09-21T08:00:00Z', '2026-09-21T10:00:00Z'))
        expect(await alice.isEmpty()).toBe(false)
      })

      it('treats a store whose entries were all deleted as empty', async () => {
        const e = await bob.saveEntry(entry('bob', '2026-09-21T08:00:00Z', '2026-09-21T10:00:00Z'))
        await bob.deleteEntry(e)
        expect(await alice.isEmpty()).toBe(true)
        await alice.importData(data(), 'test import')
        expect(await alice.listAllEntries()).toHaveLength(4)
      })

      it('imports a workspace and entries of several members into an empty store', async () => {
        await alice.importData(data(), 'test import')
        expect(await bob.getWorkspace()).toEqual(data().workspace)
        const all = await bob.listAllEntries()
        expect(all.map((e) => e.login).sort()).toEqual(['alice', 'alice', 'bob', 'clockify.jane-doe'])
        expect(await alice.isEmpty()).toBe(false)
        const oct = { from: new Date('2025-10-01T00:00:00Z'), to: new Date('2025-10-31T23:59:59Z') }
        expect(await alice.listEntries(oct)).toHaveLength(2)
      })

      it('lets only editors and team leaders change imported entries of other members', async () => {
        await alice.importData(data(), 'test import')
        const jane = (await bob.listAllEntries()).find((e) => e.login === 'clockify.jane-doe')!
        await expect(bob.saveEntry({ ...jane, description: 'x' }, jane.start)).rejects.toSatisfy(
          (x: unknown) => isStorageError(x, 'forbiddenRole'),
        )
        await alice.saveEntry({ ...jane, description: 'fixed' }, jane.start)
        const after = (await bob.listAllEntries()).find((e) => e.id === jane.id)
        expect(after).toMatchObject({ login: 'clockify.jane-doe', description: 'fixed' })
      })

      it('refuses the import for non-leaders', async () => {
        await alice.setRole('bob', 'editor')
        await expect(bob.importData(data(), 'test import')).rejects.toSatisfy((x: unknown) =>
          isStorageError(x, 'forbiddenRole'),
        )
        expect(await alice.isEmpty()).toBe(true)
        await alice.setRole('bob', 'leader')
        await bob.importData(data(), 'test import')
        expect(await alice.listAllEntries()).toHaveLength(4)
      })

      it('refuses to import when the workspace has a project', async () => {
        await alice.updateWorkspace(
          (ws) => ({ ...ws, projects: [{ id: 'x', name: 'X', color: '#000', archived: false }] }),
          'add X',
        )
        await expect(alice.importData(data(), 'test import')).rejects.toSatisfy((x: unknown) =>
          isStorageError(x, 'notEmpty'),
        )
        expect(await alice.listAllEntries()).toHaveLength(0)
        expect((await alice.getWorkspace()).projects.map((p) => p.name)).toEqual(['X'])
      })

      it('replaces existing entries, projects, and tags when overwriting, keeping timers', async () => {
        await alice.updateWorkspace(
          (ws) => ({ ...ws, projects: [{ id: 'x', name: 'X', color: '#000', archived: false }] }),
          'add X',
        )
        await bob.saveEntry(entry('bob', '2026-09-21T08:00:00Z', '2026-09-21T10:00:00Z', { description: 'old' }))
        const { timer } = await bob.startTimer({ description: 'running', projectId: null, tagIds: [] })

        await alice.importData(data(), 'test import', { overwrite: true })

        expect(await alice.getWorkspace()).toEqual(data().workspace)
        const all = await alice.listAllEntries()
        expect(all).toHaveLength(4)
        expect(all.some((e) => e.description === 'old')).toBe(false)
        expect(await alice.listTimers()).toEqual([timer])
      })

      describe('reassigning entries', () => {
        it("moves all of a former member's entries to a real member", async () => {
          await alice.importData(data(), 'test import')
          const own = await bob.saveEntry(entry('bob', '2025-11-05T08:00:00Z', '2025-11-05T09:00:00Z'))

          expect(await alice.reassignEntries('clockify.jane-doe', 'bob')).toBe(1)

          const all = await bob.listAllEntries()
          expect(all.some((e) => e.login === 'clockify.jane-doe')).toBe(false)
          const bobs = all.filter((e) => e.login === 'bob')
          expect(bobs.map((e) => e.start).sort()).toEqual([
            '2025-10-15T08:00:00Z',
            '2025-11-02T08:00:00Z',
            own.start,
          ])
        })

        it('moves only entries before the cutoff', async () => {
          await alice.importData(data(), 'test import')
          await bob.saveEntry(entry('bob', '2026-09-21T08:00:00Z', '2026-09-21T09:00:00Z', { description: 'after import' }))

          const moved = await alice.reassignEntries('bob', 'clockify.jane-doe', {
            before: new Date('2026-01-01T00:00:00Z'),
          })

          expect(moved).toBe(1)
          const all = await alice.listAllEntries()
          expect(all.filter((e) => e.login === 'bob').map((e) => e.description)).toEqual(['after import'])
          expect(all.filter((e) => e.login === 'clockify.jane-doe')).toHaveLength(2)
        })

        it('keeps the entry ids and returns 0 when nothing matches', async () => {
          await alice.importData(data(), 'test import')
          const jane = (await alice.listAllEntries()).find((e) => e.login === 'clockify.jane-doe')!
          await alice.reassignEntries('clockify.jane-doe', 'alice')
          expect((await alice.listAllEntries()).find((e) => e.id === jane.id)?.login).toBe('alice')
          expect(await alice.reassignEntries('clockify.jane-doe', 'alice')).toBe(0)
        })

        it('refuses non-leaders and equal members', async () => {
          await alice.importData(data(), 'test import')
          await alice.setRole('bob', 'editor')
          await expect(bob.reassignEntries('clockify.jane-doe', 'bob')).rejects.toSatisfy(
            (x: unknown) => isStorageError(x, 'forbiddenRole'),
          )
          await expect(alice.reassignEntries('bob', 'bob')).rejects.toSatisfy((x: unknown) =>
            isStorageError(x, 'invalid'),
          )
          expect((await alice.listAllEntries()).filter((e) => e.login === 'clockify.jane-doe')).toHaveLength(1)
        })
      })

      it('refuses to import when read-only', async () => {
        const a = await newerSchema()
        await a.init()
        await expect(a.importData(data(), 'test import')).rejects.toSatisfy((x: unknown) =>
          isStorageError(x, 'readOnly'),
        )
      })
    })
  })
}
