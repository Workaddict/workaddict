import { newId } from '../domain/ids'
import { accessFor, can, isRole, type Action } from '../domain/permissions'
import { monthKey, monthKeysInRange } from '../domain/month'
import { durationMs, formatHM } from '../domain/time'
import {
  EMPTY_WORKSPACE,
  SCHEMA_VERSION,
  type Access,
  type BackupFile,
  type DateRange,
  type Member,
  type Role,
  type RunningTimer,
  type TimeEntry,
  type TrackerMeta,
  type Workspace,
} from '../domain/types'
import { isStorageError, StorageError } from './errors'
import type {
  DataProblem,
  FileStore,
  Identity,
  ImportData,
  StorageAdapter,
  TeamRoles,
  TimerFields,
  TimerPatch,
  TimerTarget,
} from './types'
import {
  entriesCodec,
  isLogin,
  metaCodec,
  ownerOfPath,
  rolesCodec,
  timerCodec,
  workspaceCodec,
  type Codec,
} from './validate'

export const PATHS = {
  meta: 'tracker.json',
  workspace: 'workspace.json',
  roles: 'roles.json',
  entries: (login: string, month: string) => `entries/${login}/${month}.json`,
  timer: (login: string) => `timers/${login}.json`,
}

const ENTRY_PATH = /^entries\/([^/]+)\/(\d{4}-\d{2})\.json$/
const TIMER_PATH = /^timers\/([^/]+)\.json$/

/** Entry or timer files whose owner login is valid; anything else in the repository is ignored. */
function isEntryPath(path: string): boolean {
  return ENTRY_PATH.test(path) && isLogin(ownerOfPath(path))
}
function isTimerPath(path: string): boolean {
  return TIMER_PATH.test(path) && isLogin(ownerOfPath(path))
}

/** "2026-09-01" in local time. */
function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

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
  private readonly problems = new Map<string, DataProblem>()

  constructor(
    private readonly store: FileStore,
    private readonly identity: Identity,
  ) {}

  dataProblems(): DataProblem[] {
    return [...this.problems.values()].sort((a, b) => a.path.localeCompare(b.path))
  }

  /**
   * Reads and validates one data file (repository content is untrusted: any member with push
   * access can write anything). Invalid content never throws; it is recorded as a data problem
   * and only the valid part is returned.
   */
  private async readFile<T, R>(
    path: string,
    codec: Codec<T, R>,
    snapshot?: Map<string, string>,
  ): Promise<T | null> {
    const files = snapshot ?? (await this.store.listFiles())
    const version = files.get(path)
    if (version === undefined) {
      this.problems.delete(path)
      return null
    }
    let raw: unknown
    try {
      raw = await this.store.read<unknown>(path, files)
    } catch (e) {
      if (!isStorageError(e, 'corruptData')) throw e
      raw = undefined // invalid JSON or too large: decodes as unreadable
    }
    const d = codec.decode(raw, path)
    if (d.unreadable || d.issues > 0) {
      this.problems.set(path, { path, version, kind: d.unreadable ? 'unreadable' : 'records' })
    } else {
      this.problems.delete(path)
    }
    return d.value
  }

  /**
   * Conflict-safe write of one data file through its codec: `fn` sees only the valid content,
   * and records that failed validation are written back unchanged. An unreadable file is
   * never overwritten.
   */
  private async writeFile<T, R>(
    path: string,
    codec: Codec<T, R>,
    fn: (current: T | null) => T,
    message: string,
  ): Promise<T> {
    let result!: T
    await this.store.write<unknown>(
      path,
      (raw) => {
        if (raw === null) return (result = fn(null))
        const d = codec.decode(raw, path)
        if (d.unreadable) throw new StorageError('corruptData', `${path} cannot be read`, { path })
        result = fn(d.value)
        return codec.encode(result, d.rest)
      },
      message,
    )
    return result
  }

  async init(): Promise<void> {
    const meta = await this.readFile(PATHS.meta, metaCodec)
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
    return (await this.team()).members
  }

  /**
   * Members with the known owners. Without the collaborator list, members come from the data
   * files and `roles.json`, and only the current user's owner status is known.
   */
  private async team(): Promise<{
    members: Member[]
    owners: Set<string>
    roles: Record<string, Role>
    configured: boolean
  }> {
    const [me, admin, collaborators, files] = await Promise.all([
      this.getCurrentUser(),
      this.identity.isAdmin(),
      this.identity.listCollaborators(),
      this.store.listFiles(),
    ])
    const rolesFile = await this.readFile(PATHS.roles, rolesCodec, files)
    const roles = rolesFile?.roles ?? {}
    const members = new Map<string, Member>()
    const owners = new Set<string>()
    if (collaborators) {
      for (const { admin: isAdmin, ...m } of collaborators) {
        members.set(m.login, m)
        if (isAdmin) owners.add(m.login)
      }
    } else {
      const logins = [...files.keys()]
        .filter((p) => isEntryPath(p) || isTimerPath(p))
        .map((p) => ownerOfPath(p))
      for (const login of [...logins, ...Object.keys(roles)]) {
        if (login && !members.has(login)) members.set(login, { login, avatarUrl: null })
      }
    }
    members.set(me.login, me)
    if (admin) owners.add(me.login)
    else owners.delete(me.login)
    return {
      members: [...members.values()].sort((a, b) => a.login.localeCompare(b.login)),
      owners,
      roles,
      configured: rolesFile !== null,
    }
  }

  // ---- roles ---------------------------------------------------------------

  async getAccess(): Promise<Access> {
    const [me, admin, rolesFile] = await Promise.all([
      this.getCurrentUser(),
      this.identity.isAdmin(),
      this.readFile(PATHS.roles, rolesCodec),
    ])
    return accessFor(me.login, rolesFile?.roles ?? {}, new Set(admin ? [me.login] : []))
  }

  async listRoles(): Promise<TeamRoles> {
    const { members, owners, roles, configured } = await this.team()
    return {
      members: members.map((m) => ({ ...m, ...accessFor(m.login, roles, owners) })),
      configured,
    }
  }

  async setRole(login: string, role: Role): Promise<void> {
    const me = await this.assertCan('assignRoles')
    if (!isRole(role)) throw new StorageError('invalid', `Unknown role ${String(role)}`)
    if (!isLogin(login)) throw new StorageError('invalid', `Invalid login ${login}`)
    if ((await this.team()).owners.has(login)) {
      throw new StorageError('invalid', 'The role of an owner cannot be changed')
    }
    await this.writeFile(
      PATHS.roles,
      rolesCodec,
      (cur) => ({ roles: { ...cur?.roles, [login]: role } }),
      `role: set ${login} to ${role} (${me.login})`,
    )
  }

  // ---- entries -------------------------------------------------------------

  async listEntries(range: DateRange): Promise<TimeEntry[]> {
    const months = new Set(monthKeysInRange(range.from, range.to))
    const files = await this.store.listFiles()
    const paths = [...files.keys()].filter((p) => {
      const m = ENTRY_PATH.exec(p)
      return m !== null && isEntryPath(p) && months.has(m[2]!)
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
    const paths = [...files.keys()].filter(isEntryPath)
    return this.readEntryFiles(paths, files)
  }

  private async readEntryFiles(paths: string[], files: Map<string, string>): Promise<TimeEntry[]> {
    const contents = await Promise.all(paths.map((p) => this.readFile(p, entriesCodec, files)))
    return dedupe(contents.flatMap((f) => f ?? []))
  }

  async saveEntry(entry: TimeEntry, previousStart?: string): Promise<TimeEntry> {
    const actor = await this.entryActor(entry.login)
    if (durationMs(entry.start, entry.end) <= 0) {
      throw new StorageError('invalid', 'Entry must end after it starts')
    }
    const saved: TimeEntry = { ...entry, updatedAt: new Date().toISOString() }
    const path = PATHS.entries(saved.login, monthKey(saved.start))
    const isUpdate = previousStart !== undefined
    const verb = isUpdate ? 'update' : 'add'
    await this.writeFile(
      path,
      entriesCodec,
      (cur) => [...(cur ?? []).filter((e) => e.id !== saved.id), saved],
      `entry: ${verb} ${formatHM(durationMs(saved.start, saved.end))} ${quote(saved.description)}${actor}`,
    )
    // Moved to another month: remove the old copy after the new one is safely written.
    if (isUpdate && monthKey(previousStart) !== monthKey(saved.start)) {
      await this.writeFile(
        PATHS.entries(saved.login, monthKey(previousStart)),
        entriesCodec,
        (cur) => (cur ?? []).filter((e) => e.id !== saved.id),
        `entry: move ${quote(saved.description)} to ${monthKey(saved.start)}${actor}`,
      )
    }
    return saved
  }

  async deleteEntry(entry: TimeEntry): Promise<void> {
    const actor = await this.entryActor(entry.login)
    await this.writeFile(
      PATHS.entries(entry.login, monthKey(entry.start)),
      entriesCodec,
      (cur) => (cur ?? []).filter((e) => e.id !== entry.id),
      `entry: delete ${quote(entry.description)}${actor}`,
    )
  }

  /**
   * Checks that the current user may change entries of `owner` and returns the commit message
   * suffix: " (alice)" for own entries, " for bob (alice)" for another member's.
   */
  private async entryActor(owner: string): Promise<string> {
    const me = await this.assertWritable()
    if (owner === me.login) return ` (${me.login})`
    await this.assertCan('editOthersEntries')
    return ` for ${owner} (${me.login})`
  }

  // ---- timers --------------------------------------------------------------

  async getTimer(): Promise<RunningTimer | null> {
    const me = await this.getCurrentUser()
    return this.readFile(PATHS.timer(me.login), timerCodec)
  }

  async listTimers(): Promise<RunningTimer[]> {
    const files = await this.store.listFiles()
    const paths = [...files.keys()].filter(isTimerPath)
    const timers = await Promise.all(paths.map((p) => this.readFile(p, timerCodec, files)))
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
    await this.writeFile(
      PATHS.timer(me.login),
      timerCodec,
      () => timer,
      `timer: start ${quote(timer.description)} (${me.login})`,
    )
    return { timer, stopped }
  }

  async updateTimer(patch: TimerPatch): Promise<RunningTimer | null> {
    const me = await this.assertWritable()
    return this.writeFile(
      PATHS.timer(me.login),
      timerCodec,
      (cur) => (cur ? { ...cur, ...patch } : null),
      `timer: update (${me.login})`,
    )
  }

  /**
   * Idempotent stop: (1) write the entry using the timer id, (2) clear the timer.
   * If (2) failed previously, a retry finds the entry already present and only clears.
   */
  async stopTimer(end: Date = new Date(), target?: TimerTarget): Promise<TimeEntry | null> {
    const { login, by } = await this.timerActor(target)
    this.store.invalidate()
    const timer = await this.readFile(PATHS.timer(login), timerCodec)
    if (!timer || (target && timer.id !== target.timerId)) return null

    const startMs = new Date(timer.start).getTime()
    const endIso = new Date(Math.max(end.getTime(), startMs + 1000)).toISOString()
    const nowIso = new Date().toISOString()
    const entry: TimeEntry = {
      id: timer.id,
      login,
      start: timer.start,
      end: endIso,
      description: timer.description,
      projectId: timer.projectId,
      tagIds: timer.tagIds,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...(by ? { stoppedBy: by } : {}),
    }
    const suffix = by ? ` (${login}, by ${by})` : ` (${login})`
    let saved = entry
    await this.writeFile(
      PATHS.entries(login, monthKey(entry.start)),
      entriesCodec,
      (cur) => {
        const existing = (cur ?? []).find((e) => e.id === entry.id)
        if (existing) {
          saved = existing
          return cur ?? []
        }
        return [...(cur ?? []), entry]
      },
      `timer: stop ${formatHM(durationMs(entry.start, entry.end))} ${quote(entry.description)}${suffix}`,
    )
    await this.writeFile(
      PATHS.timer(login),
      timerCodec,
      // Only clear the timer we stopped, never a newer one started elsewhere meanwhile.
      (cur) => (cur && cur.id !== timer.id ? cur : null),
      `timer: clear${suffix}`,
    )
    return saved
  }

  async discardTimer(target?: TimerTarget): Promise<boolean> {
    const { login, by } = await this.timerActor(target)
    let cleared = false
    await this.writeFile(
      PATHS.timer(login),
      timerCodec,
      (cur) => {
        cleared = cur !== null && (!target || cur.id === target.timerId)
        return cleared ? null : cur
      },
      `timer: discard${by ? ` (${login}, by ${by})` : ` (${login})`}`,
    )
    return cleared
  }

  /**
   * Whose timer a stop or discard acts on. Another member's timer needs `stopOthersTimer`;
   * `by` is then the acting member.
   */
  private async timerActor(target?: TimerTarget): Promise<{ login: string; by: string | null }> {
    const me = await this.assertWritable()
    if (!target || target.login === me.login) return { login: me.login, by: null }
    await this.assertCan('stopOthersTimer')
    return { login: target.login, by: me.login }
  }

  // ---- workspace -----------------------------------------------------------

  async getWorkspace(): Promise<Workspace> {
    return (await this.readFile(PATHS.workspace, workspaceCodec)) ?? EMPTY_WORKSPACE
  }

  async updateWorkspace(fn: (ws: Workspace) => Workspace, summary: string): Promise<Workspace> {
    const me = await this.assertCan('manageWorkspace')
    return this.writeFile(
      PATHS.workspace,
      workspaceCodec,
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
    const ws = await this.readFile(PATHS.workspace, workspaceCodec, files)
    if (ws && (ws.projects.length > 0 || ws.tags.length > 0)) return false
    const paths = [...files.keys()].filter(isEntryPath)
    return (await this.readEntryFiles(paths, files)).length === 0
  }

  async importData(
    data: ImportData,
    summary: string,
    opts?: { overwrite?: boolean },
  ): Promise<void> {
    const me = await this.assertCan('import')
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

  async reassignEntries(from: string, to: string, opts?: { before?: Date }): Promise<number> {
    const me = await this.assertCan('reassignEntries')
    if (!isLogin(from) || !isLogin(to) || from === to) {
      throw new StorageError('invalid', 'Choose two different members')
    }
    const moves = (e: TimeEntry) =>
      !opts?.before || new Date(e.start).getTime() < opts.before.getTime()

    this.store.invalidate()
    const snapshot = await this.store.listFiles()
    const sources = [...snapshot.keys()].filter((p) => ENTRY_PATH.exec(p)?.[1] === from)
    const files = new Map<string, unknown>()
    const deletes: string[] = []
    const touched = [...sources]
    const now = new Date().toISOString()
    let count = 0
    // Invalid records stay where they are, untouched; an unreadable file aborts the move.
    const readEntries = async (path: string) => {
      const raw = await this.store.read<unknown>(path, snapshot)
      const d = entriesCodec.decode(raw ?? [], path)
      if (d.unreadable) throw new StorageError('corruptData', `${path} cannot be read`, { path })
      return d
    }
    for (const path of sources) {
      const source = await readEntries(path)
      const moving = source.value.filter(moves)
      if (moving.length === 0) continue
      count += moving.length
      const staying = source.value.filter((e) => !moves(e))
      if (staying.length > 0 || source.rest.length > 0) {
        files.set(path, entriesCodec.encode(staying, source.rest))
      } else deletes.push(path)

      const target = PATHS.entries(to, ENTRY_PATH.exec(path)![2]!)
      touched.push(target)
      const ids = new Set(moving.map((e) => e.id))
      const existing = await readEntries(target)
      files.set(
        target,
        entriesCodec.encode(
          [
            ...existing.value.filter((e) => !ids.has(e.id)),
            ...moving.map((e) => ({ ...e, login: to, updatedAt: now })),
          ],
          existing.rest,
        ),
      )
    }
    if (count === 0) return 0

    const cutoff = opts?.before ? ` before ${localDate(opts.before)}` : ''
    await this.store.writeMany(
      files,
      `reassign: ${count} ${count === 1 ? 'entry' : 'entries'} from ${from} to ${to}${cutoff} (${me.login})`,
      async () => {
        // The file contents above were computed once; abort instead of overwriting newer data.
        this.store.invalidate()
        const current = await this.store.listFiles()
        if (touched.some((p) => current.get(p) !== snapshot.get(p))) {
          throw new StorageError('conflict', 'Entries changed during the reassignment')
        }
        return deletes
      },
    )
    return count
  }

  /** Own timers and entries need no role. */
  private async assertWritable(): Promise<Member> {
    if (this.readOnly) throw new StorageError('readOnly')
    return this.getCurrentUser()
  }

  private async assertCan(action: Action): Promise<Member> {
    const me = await this.assertWritable()
    if (!can(await this.getAccess(), action)) {
      throw new StorageError('forbiddenRole', `Your role does not allow: ${action}`)
    }
    return me
  }
}
