import { isNameTaken, newId } from '../../domain/ids'
import { durationMs } from '../../domain/time'
import { PROJECT_COLORS, type Project, type Tag, type TimeEntry, type Workspace } from '../../domain/types'
import type { ClockifyRaw } from './clockify/fetcher'

/** What happens to a Clockify user's entries. */
export type UserMapping = { kind: 'login'; login: string } | { kind: 'former' } | { kind: 'skip' }

export interface ImportReport {
  projectCount: number
  tagCount: number
  /** Imported entries and tracked milliseconds per Workaddict login. */
  byLogin: Record<string, { entries: number; ms: number }>
  /** Tracked milliseconds per new project id (`null` = no project). */
  msByProject: { projectId: string | null; name: string | null; ms: number }[]
  skippedRunning: number
  skippedInvalid: number
  unknownProjectRefs: number
  droppedTagRefs: number
  withTask: number
  billable: number
  /** Clockify user names that were skipped or whose entries could not be read. */
  skippedUsers: string[]
  noAccessUsers: string[]
}

export interface ConvertResult {
  workspace: Workspace
  entries: TimeEntry[]
  report: ImportReport
}

/** URL-safe ASCII slug: lowercase, diacritics removed, other characters become hyphens. */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Pseudo-logins `clockify.<slug>` for users kept as former members. The dot cannot occur in a
 * GitHub login, so they never collide with real members. Equal names get numeric suffixes.
 */
export function formerMemberLogins(users: { id: string; name: string }[]): Map<string, string> {
  const result = new Map<string, string>()
  const used = new Set<string>()
  for (const u of users) {
    const base = `clockify.${slugify(u.name) || 'user'}`
    let login = base
    for (let n = 2; used.has(login); n++) login = `${base}-${n}`
    used.add(login)
    result.set(u.id, login)
  }
  return result
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]!
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

/** The project palette color closest to a Clockify color (RGB distance). */
export function nearestProjectColor(color: string | null | undefined): string {
  const rgb = color ? hexToRgb(color) : null
  if (!rgb) return PROJECT_COLORS[0]
  let best: string = PROJECT_COLORS[0]
  let bestDist = Infinity
  for (const c of PROJECT_COLORS) {
    const [r, g, b] = hexToRgb(c)!
    const d = (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  return best
}

/** Adds " 2", " 3", … until the name is not taken (case-insensitive). */
function uniqueName(items: { id: string; name: string }[], name: string): string {
  let candidate = name
  for (let n = 2; isNameTaken(items, candidate); n++) candidate = `${name} ${n}`
  return candidate
}

function nameKey(name: string) {
  return name.trim().toLocaleLowerCase()
}

/**
 * Converts fetched Clockify data to the Workaddict model. Pure except for fresh ids.
 * Clients, tasks, billable flags, rates, and running timers are not carried over.
 */
export function convertClockify(
  raw: ClockifyRaw,
  mapping: Record<string, UserMapping>,
  now: Date,
): ConvertResult {
  const nowIso = now.toISOString()

  // Projects: names must be unique; Clockify allows equal names under different clients.
  const nameCounts = new Map<string, number>()
  for (const p of raw.projects) nameCounts.set(nameKey(p.name), (nameCounts.get(nameKey(p.name)) ?? 0) + 1)
  const projects: Project[] = []
  const projectIds = new Map<string, string>()
  for (const p of raw.projects) {
    const name = p.name.trim() || 'Project'
    const withClient =
      (nameCounts.get(nameKey(p.name)) ?? 0) > 1 && p.clientName?.trim()
        ? `${name} (${p.clientName.trim()})`
        : name
    const project: Project = {
      id: newId(),
      name: uniqueName(projects, withClient),
      color: nearestProjectColor(p.color),
      archived: Boolean(p.archived),
    }
    projects.push(project)
    projectIds.set(p.id, project.id)
  }

  const tags: Tag[] = []
  const tagIds = new Map<string, string>()
  for (const t of raw.tags) {
    const tag: Tag = { id: newId(), name: uniqueName(tags, t.name.trim() || 'Tag'), archived: Boolean(t.archived) }
    tags.push(tag)
    tagIds.set(t.id, tag.id)
  }

  const formerUsers = raw.users.filter((u) => mapping[u.id]?.kind === 'former')
  const former = formerMemberLogins(formerUsers)
  const loginOf = (userId: string): string | null => {
    const m = mapping[userId]
    if (m?.kind === 'login') return m.login
    if (m?.kind === 'former') return former.get(userId) ?? null
    return null
  }

  const report: ImportReport = {
    projectCount: projects.length,
    tagCount: tags.length,
    byLogin: {},
    msByProject: [],
    skippedRunning: 0,
    skippedInvalid: 0,
    unknownProjectRefs: 0,
    droppedTagRefs: 0,
    withTask: 0,
    billable: 0,
    skippedUsers: raw.users.filter((u) => (mapping[u.id]?.kind ?? 'skip') === 'skip').map((u) => u.name),
    noAccessUsers: raw.users.filter((u) => raw.noAccess.includes(u.id)).map((u) => u.name),
  }
  const msByProject = new Map<string | null, number>()

  const entries: TimeEntry[] = []
  for (const [userId, list] of Object.entries(raw.entries)) {
    const login = loginOf(userId)
    if (!login) continue
    for (const c of list) {
      if (!c.timeInterval.end) {
        report.skippedRunning++
        continue
      }
      const start = new Date(c.timeInterval.start)
      const end = new Date(c.timeInterval.end)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || durationMs(start, end) <= 0) {
        report.skippedInvalid++
        continue
      }
      let projectId: string | null = null
      if (c.projectId) {
        projectId = projectIds.get(c.projectId) ?? null
        if (!projectId) report.unknownProjectRefs++
      }
      const mappedTags: string[] = []
      for (const id of c.tagIds ?? []) {
        const tagId = tagIds.get(id)
        if (tagId) mappedTags.push(tagId)
        else report.droppedTagRefs++
      }
      if (c.taskId) report.withTask++
      if (c.billable) report.billable++

      const ms = durationMs(start, end)
      const stats = (report.byLogin[login] ??= { entries: 0, ms: 0 })
      stats.entries++
      stats.ms += ms
      msByProject.set(projectId, (msByProject.get(projectId) ?? 0) + ms)

      entries.push({
        id: newId(),
        login,
        start: start.toISOString(),
        end: end.toISOString(),
        description: c.description ?? '',
        projectId,
        tagIds: mappedTags,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
    }
  }

  const projectName = new Map(projects.map((p) => [p.id, p.name]))
  report.msByProject = [...msByProject]
    .map(([projectId, ms]) => ({ projectId, name: projectId ? projectName.get(projectId)! : null, ms }))
    .sort((a, b) => b.ms - a.ms)

  return { workspace: { projects, tags }, entries, report }
}
