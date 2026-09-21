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
}

export interface RunningTimer {
  id: string
  login: string
  start: IsoString
  description: string
  projectId: string | null
  tagIds: string[]
}

export interface Project {
  id: string
  name: string
  color: string
  archived: boolean
}

export interface Tag {
  id: string
  name: string
  archived: boolean
}

export interface Workspace {
  projects: Project[]
  tags: Tag[]
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
