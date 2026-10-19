/** All timestamps are ISO-8601 UTC strings. */
export type IsoString = string

export interface TimeEntry {
  id: string
  login: string
  start: IsoString
  end: IsoString
  description: string
  projectId: string | null
  tagIds: string[]
  createdAt: IsoString
  updatedAt: IsoString
  /** Login of the member who stopped the timer that created this entry, if not its owner. */
  stoppedBy?: string
  /** Login of the member who added this entry for its owner, if not the owner. Set by the storage layer. */
  addedBy?: string
  /** Linked GitHub issue or pull request as `owner/repo#number`. */
  issueRef?: string
  /** Client name of the AI assistant that created this entry, e.g. `claude-code`. Set by the storage layer. */
  addedVia?: string
}

export interface RunningTimer {
  id: string
  login: string
  start: IsoString
  description: string
  projectId: string | null
  tagIds: string[]
  /** Linked GitHub issue or pull request as `owner/repo#number`. */
  issueRef?: string
}

export interface Project {
  id: string
  name: string
  color: string
  archived: boolean
  /** Linked GitHub repositories as `owner/repo`; resolve short issue references like `#42`. */
  repos?: string[]
  /** Linked GitHub Projects board as `orgs/owner/projects/N` or `users/owner/projects/N`. */
  board?: string
}

export interface Tag {
  id: string
  name: string
  archived: boolean
}

export interface Workspace {
  projects: Project[]
  tags: Tag[]
  /** Team time zone (IANA name); absent: each browser's own zone is used. */
  timeZone?: string
  /** Record which AI assistant created an entry (`TimeEntry.addedVia`); absent means off. */
  markAiEntries?: boolean
}

export interface Member {
  login: string
  avatarUrl: string | null
}

export const ROLES = ['leader', 'editor', 'worker'] as const
export type Role = (typeof ROLES)[number]

/** Content of `roles.json`: role assignments by GitHub login. */
export interface RolesFile {
  roles: Record<string, Role>
}

/** A member's effective role. Owners (repository admins) are always team leaders. */
export interface Access {
  login: string
  role: Role
  owner: boolean
}

export interface TrackerMeta {
  schemaVersion: number
  createdAt: IsoString
}

export interface BackupFile {
  format: 'workaddict-backup'
  schemaVersion: number
  exportedAt: IsoString
  workspace: Workspace
  members: Member[]
  entries: TimeEntry[]
}

export interface DateRange {
  from: Date
  to: Date
}

export const SCHEMA_VERSION = 1

export const EMPTY_WORKSPACE: Workspace = { projects: [], tags: [] }

export const PROJECT_COLORS = [
  '#4f46e5',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#64748b',
  '#78716c',
] as const
