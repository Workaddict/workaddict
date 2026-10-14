import { execFile } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { promisify } from 'node:util'
import { parseRepoInput } from '../../src/domain/issueRef'
import type { Project } from '../../src/domain/types'
import { endOfDay, format, fromDateKey } from '../../src/domain/zoned'

/*
 * Reads Claude Code's local session transcripts (`<config>/projects/<cwd>/<session>.jsonl`) and
 * turns them into activity blocks for one day. Nothing here writes or sends anything: the AI
 * decides what to log, and only the description it writes is ever saved.
 */

const MINUTE = 60_000
/** Time after the last message of a block that still counts (reading the last answer). */
const TAIL_MS = 5 * MINUTE
const MAX_PROMPTS = 3
const PROMPT_CHARS = 200

export interface ActivityBlock {
  start: string
  end: string
  minutes: number
  cwd: string
  branch: string | null
  repo: string | null
  /** `owner/repo#N` guessed from the branch name. */
  issueRef: string | null
  /** Active projects linked to `repo`; exactly one is the suggestion. */
  projectCandidates: { id: string; name: string }[]
  sessions: number
  /** First user prompts of the block (shortened), as material for a description. */
  prompts: string[]
  /** Indexes of blocks in other folders or branches running at the same time. */
  overlapsWith: number[]
}

export interface ActivityOptions {
  zone: string
  projects: Project[]
  gapMinutes?: number
  /** Claude Code's config folder; default `CLAUDE_CONFIG_DIR`, else `~/.claude`. */
  configDir?: string
  /** `owner/repo` of a working directory's `origin` remote, or null. */
  repoOf?: (cwd: string) => Promise<string | null>
}

interface Point {
  at: number
  session: string
  prompt: string | null
}

/** The user's own words in a transcript line, or null for tool results, commands and meta lines. */
function promptOf(line: Record<string, unknown>): string | null {
  if (line.type !== 'user' || line.isMeta || line.isSidechain) return null
  const message = line.message as { role?: unknown; content?: unknown } | undefined
  if (message?.role !== 'user') return null
  const content = message.content
  let text: string | null = null
  if (typeof content === 'string') text = content
  else if (Array.isArray(content)) {
    if (content.some((c) => (c as { type?: unknown })?.type === 'tool_result')) return null
    text = content
      .map((c) => {
        const item = c as { type?: unknown; text?: unknown }
        return item?.type === 'text' && typeof item.text === 'string' ? item.text : ''
      })
      .join(' ')
  }
  text = text?.replace(/\s+/g, ' ').trim() ?? null
  // Slash commands and hook output arrive as tagged text, not as something the user wrote.
  if (!text || text.startsWith('<')) return null
  return text.length > PROMPT_CHARS ? `${text.slice(0, PROMPT_CHARS - 1)}…` : text
}

export const gitOriginRepo = async (cwd: string): Promise<string | null> => {
  try {
    const { stdout } = await promisify(execFile)(
      'git',
      ['-C', cwd, 'remote', 'get-url', 'origin'],
      {
        timeout: 5_000,
      },
    )
    return parseRepoInput(stdout.trim())
  } catch {
    return null
  }
}

/** First standalone number in a branch name: `fix/42-login` → 42. */
export function issueNumberOf(branch: string | null): number | null {
  const m = branch ? /(?:^|[/_-])([1-9]\d{0,9})(?=[/_-]|$)/.exec(branch) : null
  return m ? Number(m[1]) : null
}

async function transcriptFiles(dir: string, since: number): Promise<string[]> {
  let folders: string[]
  try {
    folders = await readdir(dir)
  } catch {
    return []
  }
  const files: string[] = []
  for (const folder of folders) {
    let names: string[]
    try {
      names = await readdir(join(dir, folder))
    } catch {
      continue
    }
    for (const name of names) {
      if (!name.endsWith('.jsonl')) continue
      const path = join(dir, folder, name)
      try {
        // A file last written before the day cannot contain lines from it.
        if ((await stat(path)).mtimeMs >= since) files.push(path)
      } catch {
        // vanished meanwhile
      }
    }
  }
  return files
}

export async function claudeCodeActivity(
  date: string,
  opts: ActivityOptions,
): Promise<ActivityBlock[]> {
  const dayStart = fromDateKey(date, opts.zone)
  if (!dayStart) throw new Error(`"${date}" is not a date (expected yyyy-MM-dd)`)
  const from = dayStart.getTime()
  const to = endOfDay(dayStart, opts.zone).getTime()
  const gap = Math.max(1, opts.gapMinutes ?? 15) * MINUTE
  const configDir = opts.configDir ?? process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')

  // Points per (working directory, branch), from all sessions.
  const groups = new Map<string, { cwd: string; branch: string | null; points: Point[] }>()
  for (const file of await transcriptFiles(join(configDir, 'projects'), from)) {
    const lines = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity })
    try {
      for await (const raw of lines) {
        let line: Record<string, unknown>
        try {
          line = JSON.parse(raw) as Record<string, unknown>
        } catch {
          continue
        }
        if ((line.type !== 'user' && line.type !== 'assistant') || typeof line.cwd !== 'string') {
          continue
        }
        const at = typeof line.timestamp === 'string' ? Date.parse(line.timestamp) : NaN
        if (!(at >= from && at <= to)) continue
        const branch = typeof line.gitBranch === 'string' && line.gitBranch ? line.gitBranch : null
        const key = `${line.cwd}\u0000${branch ?? ''}`
        const g = groups.get(key) ?? { cwd: line.cwd, branch, points: [] }
        g.points.push({ at, session: String(line.sessionId ?? file), prompt: promptOf(line) })
        groups.set(key, g)
      }
    } catch {
      // unreadable file: skip the rest of it
    }
  }

  const repoOf = opts.repoOf ?? gitOriginRepo
  const repos = new Map<string, Promise<string | null>>()
  const raw: (Omit<ActivityBlock, 'start' | 'end' | 'overlapsWith'> & {
    from: number
    to: number
  })[] = []
  for (const g of groups.values()) {
    g.points.sort((a, b) => a.at - b.at)
    if (!repos.has(g.cwd)) repos.set(g.cwd, repoOf(g.cwd))
    const repo = await repos.get(g.cwd)!
    const issue = issueNumberOf(g.branch)
    const projectCandidates = repo
      ? opts.projects
          .filter(
            (p) => !p.archived && p.repos?.some((r) => r.toLowerCase() === repo.toLowerCase()),
          )
          .map((p) => ({ id: p.id, name: p.name }))
      : []
    let block: Point[] = []
    const flush = () => {
      if (!block.length) return
      const start = block[0]!.at
      const end = Math.min(block[block.length - 1]!.at + TAIL_MS, to)
      raw.push({
        from: start,
        to: end,
        minutes: Math.round((end - start) / MINUTE),
        cwd: g.cwd,
        branch: g.branch,
        repo,
        issueRef: repo && issue ? `${repo}#${issue}` : null,
        projectCandidates,
        sessions: new Set(block.map((p) => p.session)).size,
        prompts: block
          .map((p) => p.prompt)
          .filter((p): p is string => p !== null)
          .slice(0, MAX_PROMPTS),
      })
      block = []
    }
    for (const p of g.points) {
      if (block.length && p.at - block[block.length - 1]!.at >= gap) flush()
      block.push(p)
    }
    flush()
  }

  raw.sort((a, b) => a.from - b.from)
  const stamp = (ms: number) => format(ms, "yyyy-MM-dd'T'HH:mm:ssXXX", {}, opts.zone)
  return raw.map(({ from: start, to: end, ...rest }, i) => ({
    start: stamp(start),
    end: stamp(end),
    ...rest,
    overlapsWith: raw.flatMap((o, j) => (j !== i && o.from < end && start < o.to ? [j] : [])),
  }))
}
