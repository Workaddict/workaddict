/**
 * Behavioral contract every StorageAdapter must satisfy.
 * `setup` returns two adapters (alice, bob) sharing one data store.
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

    it("refuses to modify another member's entries", async () => {
      const e = await bob.saveEntry(entry('bob', '2026-09-21T08:00:00Z', '2026-09-21T10:00:00Z'))
      await expect(alice.deleteEntry(e)).rejects.toSatisfy((x: unknown) =>
        isStorageError(x, 'notOwner'),
      )
      await expect(alice.saveEntry({ ...e, description: 'x' }, e.start)).rejects.toSatisfy(
        (x: unknown) => isStorageError(x, 'notOwner'),
      )
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

    it('keeps workspace changes from several members', async () => {
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

      it('imports a workspace and entries of several members into an empty store', async () => {
        await alice.importData(data(), 'test import')
        expect(await bob.getWorkspace()).toEqual(data().workspace)
        const all = await bob.listAllEntries()
        expect(all.map((e) => e.login).sort()).toEqual(['alice', 'alice', 'bob', 'clockify.jane-doe'])
        expect(await alice.isEmpty()).toBe(false)
        const oct = { from: new Date('2025-10-01T00:00:00Z'), to: new Date('2025-10-31T23:59:59Z') }
        expect(await alice.listEntries(oct)).toHaveLength(2)
      })

      it('leaves imported entries of other members read-only', async () => {
        await alice.importData(data(), 'test import')
        const bobs = (await alice.listAllEntries()).find((e) => e.login === 'bob')!
        await expect(alice.deleteEntry(bobs)).rejects.toSatisfy((x: unknown) =>
          isStorageError(x, 'notOwner'),
        )
        const jane = (await bob.listAllEntries()).find((e) => e.login === 'clockify.jane-doe')!
        await expect(bob.saveEntry({ ...jane, description: 'x' }, jane.start)).rejects.toSatisfy(
          (x: unknown) => isStorageError(x, 'notOwner'),
        )
      })

      it('refuses to import when the workspace has a project', async () => {
        await bob.updateWorkspace(
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
        await bob.updateWorkspace(
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
