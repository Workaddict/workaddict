import { newId } from '../domain/ids'
import { monthKey, monthKeysInRange } from '../domain/month'
import { durationMs, formatHM } from '../domain/time'
import {
  EMPTY_WORKSPACE,
  SCHEMA_VERSION,
  type BackupFile,
  type DateRange,
  type Member,
  type RunningTimer,
  type TimeEntry,
  type TrackerMeta,
  type Workspace,
} from '../domain/types'
import { StorageError } from './errors'
import type {
  FileStore,
  Identity,
  ImportData,
  StorageAdapter,
  TimerFields,
  TimerPatch,
} from './types'

export const PATHS = {
  meta: 'tracker.json',
  workspace: 'workspace.json',
  entries: (login: string, month: string) => `entries/${login}/${month}.json`,
  timer: (login: string) => `timers/${login}.json`,
}

const ENTRY_PATH = /^entries\/([^/]+)\/(\d{4}-\d{2})\.json$/
const TIMER_PATH = /^timers\/([^/]+)\.json$/

function quote(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ')
  return t ? `"${t.length > 60 ? `${t.slice(0, 57)}...` : t}"` : '(no description)'
}

/** Keeps one version per id, preferring the most recently updated (covers a month move in progress). */
function dedupe(entries: TimeEntry[]): TimeEntry[] {
  const byId = new Map<string, TimeEntry>()
  for (const e of entries) {
    const prev = byId.get(e.id)
    if (!prev || prev.updatedAt < e.updatedAt) byId.set(e.id, e)
  }
  return [...byId.values()]
}

/**
 * Storage adapter implementing the data layout on top of any FileStore
 * (GitHub repository in production, in-memory for tests and the demo).
 */
export class RepoAdapter implements StorageAdapter {
  readOnly = false
  private me: Member | null = null

  constructor(
    private readonly store: FileStore,
    private readonly identity: Identity,
  ) {}

  async init(): Promise<void> {
    const meta = await this.store.read<TrackerMeta>(PATHS.meta)
    if (meta && meta.schemaVersion > SCHEMA_VERSION) {
      this.readOnly = true
      return
    }
    if (!meta) {
      await this.store.write<TrackerMeta>(
        PATHS.meta,
        (cur) => cur ?? { schemaVersion: SCHEMA_VERSION, createdAt: new Date().toISOString() },
        'init: create tracker.json',
      )
    }
    if (!(await this.store.listFiles()).has(PATHS.workspace)) {
      await this.store.write<Workspace>(
        PATHS.workspace,
        (cur) => cur ?? EMPTY_WORKSPACE,
        'init: create workspace.json',
      )
    }
  }

  async getCurrentUser(): Promise<Member> {
    this.me ??= await this.identity.getCurrentUser()
    return this.me
  }

  async listMembers(): Promise<Member[]> {
    const me = await this.getCurrentUser()
    const collaborators = await this.identity.listCollaborators()
    const members = new Map<string, Member>()
    if (collaborators) {
      for (const m of collaborators) members.set(m.login, m)
    } else {
      for (const path of (await this.store.listFiles()).keys()) {
        const login = ENTRY_PATH.exec(path)?.[1] ?? TIMER_PATH.exec(path)?.[1]
        if (login && !members.has(login)) members.set(login, { login, avatarUrl: null })
      }
    }
    members.set(me.login, me)
    return [...members.values()].sort((a, b) => a.login.localeCompare(b.login))
  }

  // ---- entries -------------------------------------------------------------

  async listEntries(range: DateRange): Promise<TimeEntry[]> {
    const months = new Set(monthKeysInRange(range.from, range.to))
    const files = await this.store.listFiles()
    const paths = [...files.keys()].filter((p) => {
      const m = ENTRY_PATH.exec(p)
      return m !== null && months.has(m[2]!)
    })
    const from = range.from.getTime()
    const to = range.to.getTime()
    return (await this.readEntryFiles(paths, files)).filter((e) => {
      const t = new Date(e.start).getTime()
      return t >= from && t <= to
    })
  }

  async listAllEntries(): Promise<TimeEntry[]> {
    const files = await this.store.listFiles()
    const paths = [...files.keys()].filter((p) => ENTRY_PATH.test(p))
    return this.readEntryFiles(paths, files)
  }

  private async readEntryFiles(paths: string[], files: Map<string, string>): Promise<TimeEntry[]> {
    const contents = await Promise.all(paths.map((p) => this.store.read<TimeEntry[]>(p, files)))
    return dedupe(contents.flatMap((f) => f ?? []))
  }

  async saveEntry(entry: TimeEntry, previousStart?: string): Promise<TimeEntry> {
    const me = await this.assertWritable(entry.login)
    if (durationMs(entry.start, entry.end) <= 0) {
      throw new StorageError('invalid', 'Entry must end after it starts')
    }
    const saved: TimeEntry = { ...entry, updatedAt: new Date().toISOString() }
    const path = PATHS.entries(me.login, monthKey(saved.start))
    const isUpdate = previousStart !== undefined
    const verb = isUpdate ? 'update' : 'add'
    await this.store.write<TimeEntry[]>(
      path,
      (cur) => [...(cur ?? []).filter((e) => e.id !== saved.id), saved],
      `entry: ${verb} ${formatHM(durationMs(saved.start, saved.end))} ${quote(saved.description)} (${me.login})`,
    )
    // Moved to another month: remove the old copy after the new one is safely written.
    if (isUpdate && monthKey(previousStart) !== monthKey(saved.start)) {
      await this.store.write<TimeEntry[]>(
        PATHS.entries(me.login, monthKey(previousStart)),
        (cur) => (cur ?? []).filter((e) => e.id !== saved.id),
        `entry: move ${quote(saved.description)} to ${monthKey(saved.start)} (${me.login})`,
      )
    }
    return saved
  }

  async deleteEntry(entry: TimeEntry): Promise<void> {
    const me = await this.assertWritable(entry.login)
    await this.store.write<TimeEntry[]>(
      PATHS.entries(me.login, monthKey(entry.start)),
      (cur) => (cur ?? []).filter((e) => e.id !== entry.id),
      `entry: delete ${quote(entry.description)} (${me.login})`,
    )
  }

  // ---- timers --------------------------------------------------------------

  async getTimer(): Promise<RunningTimer | null> {
    const me = await this.getCurrentUser()
    return this.store.read<RunningTimer | null>(PATHS.timer(me.login))
  }

  async listTimers(): Promise<RunningTimer[]> {
    const files = await this.store.listFiles()
    const paths = [...files.keys()].filter((p) => TIMER_PATH.test(p))
    const timers = await Promise.all(paths.map((p) => this.store.read<RunningTimer | null>(p, files)))
    return timers.filter((t): t is RunningTimer => t !== null)
  }

  async startTimer(
    fields: TimerFields,
    now: Date = new Date(),
  ): Promise<{ timer: RunningTimer; stopped: TimeEntry | null }> {
    const me = await this.assertWritable()
    const stopped = await this.stopTimer(now)
    const timer: RunningTimer = {
      id: newId(),
      login: me.login,
      start: now.toISOString(),
      description: fields.description,
      projectId: fields.projectId,
      tagIds: fields.tagIds,
    }
    await this.store.write<RunningTimer | null>(
      PATHS.timer(me.login),
      () => timer,
      `timer: start ${quote(timer.description)} (${me.login})`,
    )
    return { timer, stopped }
  }

  async updateTimer(patch: TimerPatch): Promise<RunningTimer | null> {
    const me = await this.assertWritable()
    return this.store.write<RunningTimer | null>(
      PATHS.timer(me.login),
      (cur) => (cur ? { ...cur, ...patch } : null),
      `timer: update (${me.login})`,
    )
  }

  /**
   * Idempotent stop: (1) write the entry using the timer id, (2) clear the timer.
   * If (2) failed previously, a retry finds the entry already present and only clears.
   */
  async stopTimer(end: Date = new Date()): Promise<TimeEntry | null> {
    const me = await this.assertWritable()
    this.store.invalidate()
    const timer = await this.store.read<RunningTimer | null>(PATHS.timer(me.login))
    if (!timer) return null

    const startMs = new Date(timer.start).getTime()
    const endIso = new Date(Math.max(end.getTime(), startMs + 1000)).toISOString()
    const nowIso = new Date().toISOString()
    const entry: TimeEntry = {
      id: timer.id,
      login: me.login,
      start: timer.start,
      end: endIso,
      description: timer.description,
      projectId: timer.projectId,
      tagIds: timer.tagIds,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    let saved = entry
    await this.store.write<TimeEntry[]>(
      PATHS.entries(me.login, monthKey(entry.start)),
      (cur) => {
        const existing = (cur ?? []).find((e) => e.id === entry.id)
        if (existing) {
          saved = existing
          return cur ?? []
        }
        return [...(cur ?? []), entry]
      },
      `timer: stop ${formatHM(durationMs(entry.start, entry.end))} ${quote(entry.description)} (${me.login})`,
    )
    await this.store.write<RunningTimer | null>(
      PATHS.timer(me.login),
      // Only clear the timer we stopped, never a newer one started elsewhere meanwhile.
      (cur) => (cur && cur.id !== timer.id ? cur : null),
      `timer: clear (${me.login})`,
    )
    return saved
  }

  async discardTimer(): Promise<void> {
    const me = await this.assertWritable()
    await this.store.write<RunningTimer | null>(
      PATHS.timer(me.login),
      () => null,
      `timer: discard (${me.login})`,
    )
  }

  // ---- workspace -----------------------------------------------------------

  async getWorkspace(): Promise<Workspace> {
    return (await this.store.read<Workspace>(PATHS.workspace)) ?? EMPTY_WORKSPACE
  }

  async updateWorkspace(fn: (ws: Workspace) => Workspace, summary: string): Promise<Workspace> {
    const me = await this.assertWritable()
    return this.store.write<Workspace>(
      PATHS.workspace,
      (cur) => fn(cur ?? EMPTY_WORKSPACE),
      `workspace: ${summary} (${me.login})`,
    )
  }

  // ---- backup --------------------------------------------------------------

  async exportBackup(): Promise<BackupFile> {
    const [workspace, members, entries] = await Promise.all([
      this.getWorkspace(),
      this.listMembers(),
      this.listAllEntries(),
    ])
    return {
      format: 'workaddict-backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      workspace,
      members,
      entries: entries.sort((a, b) => a.start.localeCompare(b.start)),
    }
  }

  // ---- import --------------------------------------------------------------

  async isEmpty(): Promise<boolean> {
    // Counts real entries: deleting all entries leaves empty month files ("[]") behind.
    const files = await this.store.listFiles()
    const ws = await this.store.read<Workspace>(PATHS.workspace, files)
    if (ws && (ws.projects.length > 0 || ws.tags.length > 0)) return false
    const paths = [...files.keys()].filter((p) => ENTRY_PATH.test(p))
    return (await this.readEntryFiles(paths, files)).length === 0
  }

  async importData(
    data: ImportData,
    summary: string,
    opts?: { overwrite?: boolean },
  ): Promise<void> {
    const me = await this.assertWritable()
    if (data.entries.some((e) => durationMs(e.start, e.end) <= 0)) {
      throw new StorageError('invalid', 'Entries must end after they start')
    }
    const files = new Map<string, unknown>([[PATHS.workspace, data.workspace]])
    const sorted = [...data.entries].sort((a, b) => a.start.localeCompare(b.start))
    for (const e of sorted) {
      const path = PATHS.entries(e.login, monthKey(e.start))
      const list = (files.get(path) as TimeEntry[] | undefined) ?? []
      list.push(e)
      files.set(path, list)
    }
    const verb = opts?.overwrite ? 'import (replace existing data)' : 'import'
    await this.store.writeMany(files, `${verb}: ${summary} (${me.login})`, async () => {
      // Re-checked on every attempt: someone may have written data meanwhile.
      this.store.invalidate()
      if (!opts?.overwrite) {
        if (!(await this.isEmpty())) throw new StorageError('notEmpty')
        return []
      }
      return [...(await this.store.listFiles()).keys()].filter((p) => ENTRY_PATH.test(p))
    })
  }

  private async assertWritable(ownerLogin?: string): Promise<Member> {
    if (this.readOnly) throw new StorageError('readOnly')
    const me = await this.getCurrentUser()
    if (ownerLogin !== undefined && ownerLogin !== me.login) {
      throw new StorageError('notOwner', 'Only your own entries can be changed')
    }
    return me
  }
}
