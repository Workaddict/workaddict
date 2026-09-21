import type {
  BackupFile,
  DateRange,
  Member,
  RunningTimer,
  TimeEntry,
  Workspace,
} from '../domain/types'

export type TimerFields = Pick<RunningTimer, 'description' | 'projectId' | 'tagIds'>
export type TimerPatch = Partial<TimerFields & Pick<RunningTimer, 'start'>>

/**
 * The only way the app reads or writes data. UI code must not talk to GitHub directly,
 * so a different backend can replace the implementation.
 */
export interface StorageAdapter {
  /** True when the data was written by a newer app version; all writes then fail. */
  readonly readOnly: boolean
  /** Prepares the data store (creates initial files, checks the schema version). */
  init(): Promise<void>

  getCurrentUser(): Promise<Member>
  listMembers(): Promise<Member[]>

  /** Entries of all members whose start lies within the range (inclusive). */
  listEntries(range: DateRange): Promise<TimeEntry[]>
  listAllEntries(): Promise<TimeEntry[]>
  /** Creates or updates an own entry. Pass the previously stored start when editing. */
  saveEntry(entry: TimeEntry, previousStart?: string): Promise<TimeEntry>
  deleteEntry(entry: TimeEntry): Promise<void>

  getTimer(): Promise<RunningTimer | null>
  listTimers(): Promise<RunningTimer[]>
  /** Starts a timer; a running timer is stopped first and returned as `stopped`. */
  startTimer(
    fields: TimerFields,
    now?: Date,
  ): Promise<{ timer: RunningTimer; stopped: TimeEntry | null }>
  updateTimer(patch: TimerPatch): Promise<RunningTimer | null>
  /** Stops the running timer. Returns null if no timer is running (e.g. stopped elsewhere). */
  stopTimer(end?: Date): Promise<TimeEntry | null>
  discardTimer(): Promise<void>

  getWorkspace(): Promise<Workspace>
  /** Applies a pure update function; it may be re-run on write conflicts. */
  updateWorkspace(fn: (ws: Workspace) => Workspace, summary: string): Promise<Workspace>

  exportBackup(): Promise<BackupFile>

  /** True while the repository has no entries, projects, or tags. */
  isEmpty(): Promise<boolean>
  /**
   * Bulk import in one commit. The only operation that may write entries of other logins.
   * Refuses with `notEmpty` if data exists, unless `overwrite` is set: then all existing
   * entries, projects, and tags are replaced (running timers are kept).
   */
  importData(data: ImportData, summary: string, opts?: { overwrite?: boolean }): Promise<void>
}

export interface ImportData {
  workspace: Workspace
  entries: TimeEntry[]
}

/** Minimal file-level store the repository adapter is built on. */
export interface FileStore {
  /** Snapshot of all file paths → content version (blob SHA). */
  listFiles(): Promise<Map<string, string>>
  /** Reads a file; pass a snapshot from listFiles() to read many files consistently. */
  read<T>(path: string, snapshot?: Map<string, string>): Promise<T | null>
  /**
   * Conflict-safe write: `fn` receives the current content (null if absent) and returns the
   * new content. It is re-applied to fresh content on conflicts, so it must be pure.
   */
  write<T>(path: string, fn: (current: T | null) => T, message: string): Promise<T>
  /**
   * Writes all files in one commit: either every change is applied or none. `prepare` runs
   * before each attempt (again after a concurrent commit); it may throw to abort and returns
   * the paths to delete in the same commit.
   */
  writeMany(
    files: Map<string, unknown>,
    message: string,
    prepare?: () => Promise<string[] | void>,
  ): Promise<void>
  /** Drops any cached snapshot so the next read sees the latest remote state. */
  invalidate(): void
}

export interface Identity {
  getCurrentUser(): Promise<Member>
  /** Team members, or null if they cannot be listed with the current credentials. */
  listCollaborators(): Promise<Member[] | null>
}
