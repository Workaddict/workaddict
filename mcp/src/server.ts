import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { claudeCodeActivity, type ActivityOptions } from './activity'
import type { Session } from './connect'
import {
  addEntries,
  createProjects,
  getTimer,
  linkRepos,
  listEntries,
  listMembers,
  listProjects,
  listTags,
  toolErrorText,
  whoami,
} from './tools'

import pkg from '../package.json'

export const VERSION = pkg.version

/** Opens the session on first use, with the client name the MCP client sent at initialization. */
export type SessionFactory = (client: string) => Promise<Session>

const date = z.string().describe('Day as yyyy-MM-dd, in the team time zone')
const time = z
  .string()
  .describe(
    'ISO timestamp with offset (2026-10-14T09:30:00+02:00) or "yyyy-MM-dd HH:mm" in the team time zone',
  )

function result(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }
}

function failure(e: unknown) {
  return { content: [{ type: 'text' as const, text: toolErrorText(e) }], isError: true }
}

export function createServer(
  openSession: SessionFactory,
  activity: Partial<Pick<ActivityOptions, 'configDir' | 'repoOf'>> = {},
): McpServer {
  const server = new McpServer({ name: 'workaddict', version: VERSION })
  let session: Promise<Session> | null = null
  const getSession = () => {
    const client = server.server.getClientVersion()?.name?.trim() || 'mcp'
    session ??= openSession(client)
    // A failed sign-in is retried on the next call (e.g. after a network error).
    session.catch(() => (session = null))
    return session
  }
  // Check token and repository right away (the client name is known once initialized), so a
  // broken setup shows up in the client's server log before the first tool call.
  server.server.oninitialized = () => {
    getSession().catch((e: unknown) => console.error(`workaddict-mcp: ${toolErrorText(e)}`))
  }

  /** Runs a tool against the session; any failure becomes a readable tool error. */
  const run =
    <A>(fn: (s: Session, args: A) => Promise<unknown>) =>
    async (args: A) => {
      try {
        return result(await fn(await getSession(), args))
      } catch (e) {
        return failure(e)
      }
    }

  const read = { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
  const write = { readOnlyHint: false, destructiveHint: false, idempotentHint: false }

  server.registerTool(
    'whoami',
    {
      description:
        'Your GitHub login and Workaddict role, the team time zone, and whether AI entries are marked.',
      annotations: read,
    },
    run((s) => whoami(s)),
  )

  server.registerTool(
    'list_projects',
    {
      description: 'Projects with id, name, color, archived flag and linked GitHub repositories.',
      inputSchema: { includeArchived: z.boolean().optional() },
      annotations: read,
    },
    run((s, a: { includeArchived?: boolean }) => listProjects(s, a)),
  )

  server.registerTool(
    'list_tags',
    {
      description: 'Tags with id and name.',
      inputSchema: { includeArchived: z.boolean().optional() },
      annotations: read,
    },
    run((s, a: { includeArchived?: boolean }) => listTags(s, a)),
  )

  server.registerTool(
    'list_members',
    { description: 'GitHub logins of the team members.', annotations: read },
    run((s) => listMembers(s)),
  )

  server.registerTool(
    'list_entries',
    {
      description:
        'Time entries starting between two days (inclusive), optionally of one member. Times are shown in the team time zone.',
      inputSchema: { from: date, to: date, login: z.string().optional() },
      annotations: read,
    },
    run((s, a: { from: string; to: string; login?: string }) => listEntries(s, a)),
  )

  server.registerTool(
    'get_timer',
    { description: 'Your running timer, or null.', annotations: read },
    run((s) => getTimer(s)),
  )

  server.registerTool(
    'create_projects',
    {
      description:
        'Creates projects (optional palette color and linked GitHub repositories) and tags in one commit. Existing names are reported, not duplicated. Needs the editor or team leader role. Confirm the list with the user first.',
      inputSchema: {
        projects: z
          .array(
            z.object({
              name: z.string(),
              color: z.string().optional().describe('One of the palette colors, e.g. #4f46e5'),
              repos: z.array(z.string()).optional().describe('owner/repo or GitHub URLs'),
            }),
          )
          .max(50),
        tags: z.array(z.string()).max(50).optional(),
      },
      annotations: write,
    },
    run((s, a: Parameters<typeof createProjects>[1]) => createProjects(s, a)),
  )

  server.registerTool(
    'link_repos',
    {
      description:
        'Links GitHub repositories to a project, so "#42" resolves to an issue there. Needs the editor or team leader role.',
      inputSchema: { projectId: z.string(), repos: z.array(z.string()).min(1).max(20) },
      annotations: write,
    },
    run((s, a: { projectId: string; repos: string[] }) => linkRepos(s, a)),
  )

  server.registerTool(
    'add_entries',
    {
      description:
        'Adds time entries in one commit. Refuses entries that overlap time the member already tracked (returns the conflicts) unless allowOverlap is true. Always show the entries to the user and get confirmation before calling this.',
      inputSchema: {
        entries: z
          .array(
            z.object({
              start: time,
              end: time,
              description: z.string(),
              projectId: z.string().nullable().optional(),
              tagIds: z.array(z.string()).optional(),
              issueRef: z
                .string()
                .optional()
                .describe('owner/repo#42, an issue URL, or #42 (resolved through the project)'),
              login: z.string().optional().describe("Another member's login (editors only)"),
            }),
          )
          .min(1)
          .max(100),
        allowOverlap: z.boolean().optional(),
      },
      annotations: write,
    },
    run((s, a: Parameters<typeof addEntries>[1]) => addEntries(s, a)),
  )

  server.registerTool(
    'claude_code_activity',
    {
      description:
        "Reads this computer's Claude Code session transcripts (locally, nothing is sent or saved) and returns activity blocks for a day: start, end, repository, branch, an issue guess from the branch, project candidates, and the first prompts as material for a description. Use it to suggest entries, then ask the user before add_entries.",
      inputSchema: {
        date,
        gapMinutes: z
          .number()
          .int()
          .min(1)
          .max(240)
          .optional()
          .describe('A pause this long starts a new block (default 15)'),
      },
      annotations: { ...read, openWorldHint: false },
    },
    run(async (s, a: { date: string; gapMinutes?: number }) => {
      const [zone, ws] = await Promise.all([s.zone(), s.adapter.getWorkspace()])
      return claudeCodeActivity(a.date, {
        zone,
        projects: ws.projects,
        gapMinutes: a.gapMinutes,
        ...activity,
      })
    }),
  )

  return server
}
