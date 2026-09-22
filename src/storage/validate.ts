import { isRole } from '../domain/permissions'
import {
  EMPTY_WORKSPACE,
  PROJECT_COLORS,
  type Project,
  type Role,
  type RolesFile,
  type RunningTimer,
  type Tag,
  type TimeEntry,
  type TrackerMeta,
  type Workspace,
} from '../domain/types'

/*
 * Every file in the data repository can be written by any member with push access, so its
 * content is untrusted input. Codecs split a file into what the app may use (`value`) and what
 * it must leave alone (`rest`), and put `rest` back unchanged when the app writes the file.
 */

export interface Decoded<T, R> {
  value: T
  rest: R
  /** Number of records that failed validation (kept in `rest`, not shown). */
  issues: number
  /** The file's root has the wrong shape: nothing in it can be used, and it must not be written. */
  unreadable: boolean
}

export interface Codec<T, R = unknown> {
  /** `path` is the file's repository path; some rules depend on it (the owner's login). */
  decode(raw: unknown, path: string): Decoded<T, R>
  encode(value: T, rest: R): unknown
}

/** GitHub logins and `clockify.<name>` pseudo-logins of former members. */
const LOGIN = /^[A-Za-z0-9][A-Za-z0-9.-]{0,99}$/
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}){1,2}$/
const ENTRY_PATH = /^entries\/([^/]+)\/\d{4}-\d{2}\.json$/
const TIMER_PATH = /^timers\/([^/]+)\.json$/

export function isLogin(value: unknown): value is string {
  return typeof value === 'string' && LOGIN.test(value)
}

export function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value))
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

/** Fields shared by entries and timers. */
function hasTrackedFields(v: Record<string, unknown>, login: string | null): boolean {
  return (
    isNonEmptyString(v.id) &&
    isLogin(v.login) &&
    (login === null || v.login === login) &&
    isIsoTimestamp(v.start) &&
    isString(v.description) &&
    (v.projectId === null || isString(v.projectId)) &&
    isStringArray(v.tagIds)
  )
}

export function isTimeEntry(value: unknown, login: string | null = null): value is TimeEntry {
  return (
    isObject(value) &&
    hasTrackedFields(value, login) &&
    isIsoTimestamp(value.end) &&
    Date.parse(value.end) >= Date.parse(value.start as string) &&
    // Bookkeeping only (compared as strings to pick the newest copy), so any string is accepted.
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    (value.stoppedBy === undefined || isLogin(value.stoppedBy))
  )
}

export function isRunningTimer(value: unknown, login: string | null = null): value is RunningTimer {
  return isObject(value) && hasTrackedFields(value, login)
}

/** The login a data file belongs to, from its path; null for other paths. */
export function ownerOfPath(path: string): string | null {
  return ENTRY_PATH.exec(path)?.[1] ?? TIMER_PATH.exec(path)?.[1] ?? null
}

function split<T>(items: unknown[], valid: (item: unknown) => item is T): { ok: T[]; bad: unknown[] } {
  const ok: T[] = []
  const bad: unknown[] = []
  for (const item of items) (valid(item) ? ok : bad).push(item)
  return { ok, bad }
}

// ---- entries/<login>/<YYYY-MM>.json ---------------------------------------

export const entriesCodec: Codec<TimeEntry[], unknown[]> = {
  decode(raw, path) {
    if (!Array.isArray(raw)) return { value: [], rest: [], issues: 0, unreadable: true }
    const login = ownerOfPath(path)
    const { ok, bad } = split(raw, (e): e is TimeEntry => isTimeEntry(e, login))
    return { value: ok, rest: bad, issues: bad.length, unreadable: false }
  },
  // Invalid records go after the valid ones, in their original order.
  encode: (value, rest) => [...value, ...rest],
}

// ---- timers/<login>.json ----------------------------------------------------

export const timerCodec: Codec<RunningTimer | null, null> = {
  decode(raw, path) {
    if (raw === null) return { value: null, rest: null, issues: 0, unreadable: false }
    const ok = isRunningTimer(raw, ownerOfPath(path))
    // An invalid timer counts as "no timer"; starting or stopping one replaces it.
    return { value: ok ? raw : null, rest: null, issues: ok ? 0 : 1, unreadable: false }
  },
  encode: (value) => value,
}

// ---- workspace.json ---------------------------------------------------------

interface WorkspaceRest {
  projects: unknown[]
  tags: unknown[]
  /** Unknown top-level keys, kept as they are. */
  other: Record<string, unknown>
}

function isProjectShape(v: unknown): v is Record<string, unknown> & { id: string; name: string } {
  return isObject(v) && isNonEmptyString(v.id) && isString(v.name) && typeof v.archived === 'boolean'
}

function isTag(v: unknown): v is Tag {
  return isObject(v) && isNonEmptyString(v.id) && isString(v.name) && typeof v.archived === 'boolean'
}

export const workspaceCodec: Codec<Workspace, WorkspaceRest> = {
  decode(raw) {
    const empty = { value: EMPTY_WORKSPACE, rest: { projects: [], tags: [], other: {} } }
    if (!isObject(raw)) return { ...empty, issues: 0, unreadable: true }
    const { projects = [], tags = [], ...other } = raw
    if (!Array.isArray(projects) || !Array.isArray(tags)) return { ...empty, issues: 0, unreadable: true }
    const p = split(projects, isProjectShape)
    const t = split(tags, isTag)
    // A bad color is harmless to replace (it is saved on the next workspace write).
    const fixed = p.ok.map(
      (x) => ({ ...x, color: isHexColor(x.color) ? x.color : PROJECT_COLORS[0] }) as Project,
    )
    const recolored = p.ok.filter((x) => !isHexColor(x.color)).length
    return {
      value: { projects: fixed, tags: t.ok },
      rest: { projects: p.bad, tags: t.bad, other },
      issues: p.bad.length + t.bad.length + recolored,
      unreadable: false,
    }
  },
  encode: (value, rest) => ({
    ...rest.other,
    projects: [...value.projects, ...rest.projects],
    tags: [...value.tags, ...rest.tags],
  }),
}

// ---- roles.json -------------------------------------------------------------

export const rolesCodec: Codec<RolesFile, Record<string, unknown>> = {
  decode(raw) {
    if (!isObject(raw)) return { value: { roles: {} }, rest: {}, issues: 0, unreadable: true }
    const map = isObject(raw.roles) ? raw.roles : {}
    const roles: Record<string, Role> = {}
    const rest: Record<string, unknown> = {}
    for (const [login, role] of Object.entries(map)) {
      if (isLogin(login) && isRole(role)) roles[login] = role
      else rest[login] = role
    }
    return { value: { roles }, rest, issues: Object.keys(rest).length, unreadable: false }
  },
  // A role assigned by the app replaces an invalid value for the same login.
  encode: (value, rest) => ({ roles: { ...rest, ...value.roles } }),
}

// ---- tracker.json -----------------------------------------------------------

export const metaCodec: Codec<TrackerMeta, null> = {
  decode(raw) {
    const ok =
      isObject(raw) &&
      Number.isInteger(raw.schemaVersion) &&
      (raw.schemaVersion as number) >= 1 &&
      isString(raw.createdAt)
    return ok
      ? { value: raw as unknown as TrackerMeta, rest: null, issues: 0, unreadable: false }
      : // Treated like data from a newer app version: read-only.
        { value: { schemaVersion: Number.MAX_SAFE_INTEGER, createdAt: '' }, rest: null, issues: 0, unreadable: true }
  },
  encode: (value) => value,
}
