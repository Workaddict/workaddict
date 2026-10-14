import { isNameTaken, newId } from '../../src/domain/ids'
import { parseIssueInput, parseRepoInput, MAX_PROJECT_REPOS } from '../../src/domain/issueRef'
import { nextProjectColor } from '../../src/domain/projectColor'
import { durationMs, localDateTime, MAX_ENTRY_MS } from '../../src/domain/time'
import {
  PROJECT_COLORS,
  type Project,
  type RunningTimer,
  type Tag,
  type TimeEntry,
  type Workspace,
} from '../../src/domain/types'
import { endOfDay, format, fromDateKey } from '../../src/domain/zoned'
import { isStorageError } from '../../src/storage/errors'
import type { Session } from './connect'

/** A tool failure the AI should see as is (no stack trace, no internals). */
export class ToolError extends Error {}

const MANAGE = 'Creating projects, tags or links needs the editor or team leader role'

/** Turns storage errors into messages an AI assistant can act on. */
export function toolErrorText(e: unknown): string {
  if (e instanceof ToolError) return e.message
  if (isStorageError(e, 'forbiddenRole')) return `Not allowed for your role: ${e.message}`
  if (isStorageError(e, 'readOnly')) {
    return 'The data repository was written by a newer Workaddict version; it is read-only here'
  }
  if (e instanceof Error && 'kind' in e) return `${String(e.kind)}: ${e.message}`
  return e instanceof Error ? e.message : String(e)
}

/** `2026-10-14T09:30:00+02:00`: an instant on the clock of the effective zone. */
function local(date: Date | string, zone: string): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX", {}, zone)
}

/**
 * Accepts an ISO timestamp with offset or `Z`, or a local `yyyy-MM-dd HH:mm` (also with `T`)
 * on the clock of the effective zone.
 */
export function parseTime(text: string, zone: string): Date {
  const input = text.trim()
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(input) && /^\d{4}-\d{2}-\d{2}T/.test(input)) {
    const d = new Date(input)
    if (!Number.isNaN(d.getTime())) return d
  }
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}:\d{2})(?::00)?$/.exec(input)
  const d = m ? localDateTime(m[1]!, m[2]!, zone) : null
  if (!d) {
    throw new ToolError(
      `"${text}" is not a time: use an ISO timestamp with offset or "yyyy-MM-dd HH:mm" in ${zone}`,
    )
  }
  return d
}

function day(key: string, zone: string): Date {
  const d = fromDateKey(key, zone)
  if (!d) throw new ToolError(`"${key}" is not a date (expected yyyy-MM-dd)`)
  return d
}

function projectView(p: Project) {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    archived: p.archived,
    repos: p.repos ?? [],
  }
}

function entryView(e: TimeEntry, ws: Workspace, zone: string) {
  return {
    id: e.id,
    login: e.login,
    start: local(e.start, zone),
    end: local(e.end, zone),
    minutes: Math.round(durationMs(e.start, e.end) / 60_000),
    description: e.description,
    project: e.projectId ? (ws.projects.find((p) => p.id === e.projectId)?.name ?? null) : null,
    projectId: e.projectId,
    tags: e.tagIds.map((id) => ws.tags.find((t) => t.id === id)?.name ?? id),
    ...(e.issueRef ? { issueRef: e.issueRef } : {}),
  }
}

function timerView(t: RunningTimer, zone: string) {
  return {
    id: t.id,
    start: local(t.start, zone),
    description: t.description,
    projectId: t.projectId,
    tagIds: t.tagIds,
    ...(t.issueRef ? { issueRef: t.issueRef } : {}),
  }
}

// ---- read tools --------------------------------------------------------------

export async function whoami(s: Session) {
  const ws = await s.adapter.getWorkspace()
  return {
    login: s.me.login,
    role: s.access.role,
    owner: s.access.owner,
    timeZone: await s.zone(),
    markAiEntries: ws.markAiEntries === true,
    readOnly: s.adapter.readOnly,
  }
}

export async function listProjects(s: Session, args: { includeArchived?: boolean }) {
  const ws = await s.adapter.getWorkspace()
  return ws.projects.filter((p) => args.includeArchived || !p.archived).map(projectView)
}

export async function listTags(s: Session, args: { includeArchived?: boolean }) {
  const ws = await s.adapter.getWorkspace()
  return ws.tags
    .filter((t) => args.includeArchived || !t.archived)
    .map((t) => ({ id: t.id, name: t.name, archived: t.archived }))
}

export async function listMembers(s: Session) {
  return (await s.adapter.listMembers()).map((m) => m.login)
}

export async function listEntries(s: Session, args: { from: string; to: string; login?: string }) {
  const zone = await s.zone()
  const from = day(args.from, zone)
  const to = endOfDay(day(args.to, zone), zone)
  if (to < from) throw new ToolError('"to" is before "from"')
  const [entries, ws] = await Promise.all([
    s.adapter.listEntries({ from, to }),
    s.adapter.getWorkspace(),
  ])
  return entries
    .filter((e) => !args.login || e.login === args.login)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((e) => entryView(e, ws, zone))
}

export async function getTimer(s: Session) {
  const timer = await s.adapter.getTimer()
  return timer ? timerView(timer, await s.zone()) : null
}

// ---- project setup -------------------------------------------------------------

export interface NewProject {
  name: string
  color?: string
  repos?: string[]
}

function cleanRepoInputs(inputs: string[] | undefined): { repos: string[]; invalid: string[] } {
  const repos: string[] = []
  const invalid: string[] = []
  for (const text of inputs ?? []) {
    const repo = parseRepoInput(text)
    if (!repo) invalid.push(text)
    else if (!repos.some((r) => r.toLowerCase() === repo.toLowerCase())) repos.push(repo)
  }
  return { repos, invalid }
}

/** Creates projects (with colors and linked repositories) and tags in one commit. */
export async function createProjects(
  s: Session,
  args: { projects: NewProject[]; tags?: string[] },
) {
  if (!s.access.role || s.access.role === 'worker') throw new ToolError(MANAGE)
  const prepared = args.projects.map((p) => ({
    id: newId(),
    input: p,
    ...cleanRepoInputs(p.repos),
  }))
  const tagIds = new Map((args.tags ?? []).map((name) => [name, newId()]))
  let report!: {
    created: { id: string; name: string; color: string; repos: string[] }[]
    createdTags: { id: string; name: string }[]
    refused: { name: string; reason: string }[]
  }
  const names = [...args.projects.map((p) => p.name), ...(args.tags ?? [])].join(', ')

  // Re-run on write conflicts: the report always describes the version that was saved.
  await s.adapter.updateWorkspace((ws) => {
    report = { created: [], createdTags: [], refused: [] }
    let next = ws
    for (const p of prepared) {
      const name = p.input.name.trim()
      if (!name) {
        report.refused.push({ name: p.input.name, reason: 'name is empty' })
        continue
      }
      if (isNameTaken(next.projects, name)) {
        report.refused.push({ name, reason: 'name already exists' })
        continue
      }
      const color =
        p.input.color && (PROJECT_COLORS as readonly string[]).includes(p.input.color.toLowerCase())
          ? p.input.color.toLowerCase()
          : nextProjectColor(next)
      const repos = p.repos.slice(0, MAX_PROJECT_REPOS)
      const project: Project = {
        id: p.id,
        name,
        color,
        archived: false,
        ...(repos.length ? { repos } : {}),
      }
      next = { ...next, projects: [...next.projects, project] }
      report.created.push({ id: p.id, name, color, repos })
      for (const bad of p.invalid) {
        report.refused.push({ name: `${name}: ${bad}`, reason: 'not a GitHub repository' })
      }
    }
    for (const [raw, id] of tagIds) {
      const name = raw.trim()
      if (!name || isNameTaken(next.tags, name)) {
        report.refused.push({ name: raw, reason: name ? 'tag already exists' : 'name is empty' })
        continue
      }
      const tag: Tag = { id, name, archived: false }
      next = { ...next, tags: [...next.tags, tag] }
      report.createdTags.push({ id, name })
    }
    return next
  }, `add ${names}`)
  return report
}

/** Adds repositories to a project's linked repositories. */
export async function linkRepos(s: Session, args: { projectId: string; repos: string[] }) {
  if (!s.access.role || s.access.role === 'worker') throw new ToolError(MANAGE)
  const { repos, invalid } = cleanRepoInputs(args.repos)
  if (invalid.length) throw new ToolError(`Not GitHub repositories: ${invalid.join(', ')}`)
  const ws = await s.adapter.getWorkspace()
  const project = ws.projects.find((p) => p.id === args.projectId)
  if (!project) throw new ToolError(`No project with id ${args.projectId}`)
  const saved = await s.adapter.updateWorkspace(
    (cur) => ({
      ...cur,
      projects: cur.projects.map((p) => {
        if (p.id !== args.projectId) return p
        const merged = [...(p.repos ?? [])]
        for (const r of repos) {
          if (!merged.some((m) => m.toLowerCase() === r.toLowerCase())) merged.push(r)
        }
        return { ...p, repos: merged.slice(0, MAX_PROJECT_REPOS) }
      }),
    }),
    `link ${repos.join(', ')} to project "${project.name}"`,
  )
  return projectView(saved.projects.find((p) => p.id === args.projectId)!)
}

// ---- logging -----------------------------------------------------------------

export interface NewEntry {
  start: string
  end: string
  description: string
  projectId?: string | null
  tagIds?: string[]
  issueRef?: string
  login?: string
}

interface Conflict {
  entry: number
  with: { id?: string; start: string; end: string; description: string }
}

function overlaps(a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean {
  return a.start < b.end && b.start < a.end
}

/**
 * Adds entries in one commit. Overlaps with tracked time (or among the new entries) of the same
 * member are refused unless `allowOverlap` is set, since AI suggestions often repeat time that
 * was already tracked in the app.
 */
export async function addEntries(
  s: Session,
  args: { entries: NewEntry[]; allowOverlap?: boolean },
) {
  if (args.entries.length === 0) throw new ToolError('No entries given')
  const zone = await s.zone()
  const ws = await s.adapter.getWorkspace()
  const now = new Date().toISOString()

  const prepared = args.entries.map((input, i) => {
    const at = `entry ${i + 1}`
    const start = parseTime(input.start, zone)
    const end = parseTime(input.end, zone)
    if (end <= start) throw new ToolError(`${at}: end must be after start`)
    if (end.getTime() - start.getTime() > MAX_ENTRY_MS) {
      throw new ToolError(`${at}: an entry can be at most 24 hours long`)
    }
    const projectId = input.projectId ?? null
    const project = projectId ? ws.projects.find((p) => p.id === projectId) : undefined
    if (projectId && !project) throw new ToolError(`${at}: no project with id ${projectId}`)
    for (const id of input.tagIds ?? []) {
      if (!ws.tags.some((t) => t.id === id)) throw new ToolError(`${at}: no tag with id ${id}`)
    }
    let issueRef: string | undefined
    if (input.issueRef?.trim()) {
      const r = parseIssueInput(input.issueRef, project)
      if (!r.ok) {
        throw new ToolError(
          r.reason === 'ambiguousRepo'
            ? `${at}: "${input.issueRef}" needs owner/repo#number (the project has no single linked repository)`
            : `${at}: "${input.issueRef}" is not an issue reference`,
        )
      }
      issueRef = r.ref ?? undefined
    }
    const entry: TimeEntry = {
      id: newId(),
      login: input.login?.trim() || s.me.login,
      start: start.toISOString(),
      end: end.toISOString(),
      description: input.description.trim(),
      projectId,
      tagIds: input.tagIds ?? [],
      createdAt: now,
      updatedAt: now,
      ...(issueRef ? { issueRef } : {}),
    }
    return { entry, start, end }
  })

  if (!args.allowOverlap) {
    const from = new Date(Math.min(...prepared.map((p) => p.start.getTime())) - MAX_ENTRY_MS)
    const to = new Date(Math.max(...prepared.map((p) => p.end.getTime())))
    const existing = (await s.adapter.listEntries({ from, to })).map((e) => ({
      e,
      start: new Date(e.start),
      end: new Date(e.end),
    }))
    const conflicts: Conflict[] = []
    prepared.forEach((p, i) => {
      for (const x of existing) {
        if (x.e.login === p.entry.login && overlaps(p, x)) {
          conflicts.push({
            entry: i + 1,
            with: {
              id: x.e.id,
              start: local(x.start, zone),
              end: local(x.end, zone),
              description: x.e.description,
            },
          })
        }
      }
      prepared.forEach((q, j) => {
        if (j > i && q.entry.login === p.entry.login && overlaps(p, q)) {
          conflicts.push({
            entry: i + 1,
            with: {
              start: local(q.start, zone),
              end: local(q.end, zone),
              description: `new entry ${j + 1}: ${q.entry.description}`,
            },
          })
        }
      })
    })
    if (conflicts.length) {
      return {
        saved: [],
        conflicts,
        note: 'Nothing was saved because entries overlap. Adjust the times, or pass allowOverlap: true.',
      }
    }
  }

  const saved = await s.adapter.saveEntries(prepared.map((p) => p.entry))
  return { saved: saved.map((e) => entryView(e, ws, zone)), conflicts: [] }
}
