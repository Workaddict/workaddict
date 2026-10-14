// @vitest-environment node
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Project } from '../../src/domain/types'
import { claudeCodeActivity, issueNumberOf } from './activity'

const ZONE = 'Europe/Vienna'
const web: Project = {
  id: 'p1',
  name: 'Website',
  color: '#4f46e5',
  archived: false,
  repos: ['acme/web'],
}

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'wa-activity-'))
})
afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

/** Vienna wall-clock time on 14 Oct 2026 (UTC+2) as an ISO timestamp. */
const at = (hhmm: string, day = 14) => {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(Date.UTC(2026, 9, day, h! - 2, m!)).toISOString()
}

function line(
  type: 'user' | 'assistant',
  time: string,
  extra: Record<string, unknown> = {},
): string {
  return JSON.stringify({
    type,
    timestamp: time,
    cwd: '/work/web',
    gitBranch: 'fix/42-login',
    sessionId: 's1',
    message:
      type === 'user' ? { role: 'user', content: 'do it' } : { role: 'assistant', content: [] },
    ...extra,
  })
}

async function transcript(name: string, lines: string[], folder = 'proj') {
  await mkdir(join(dir, 'projects', folder), { recursive: true })
  await writeFile(join(dir, 'projects', folder, `${name}.jsonl`), lines.join('\n') + '\n')
}

/** Message timestamps every `step` minutes from `from` to `to` (Vienna clock). */
function span(from: string, to: string, step = 5, extra: Record<string, unknown> = {}): string[] {
  const out: string[] = []
  for (let t = Date.parse(at(from)); t <= Date.parse(at(to)); t += step * 60_000) {
    out.push(line(out.length % 2 ? 'assistant' : 'user', new Date(t).toISOString(), extra))
  }
  return out
}

const run = (opts: { gapMinutes?: number; projects?: Project[] } = {}) =>
  claudeCodeActivity('2026-10-14', {
    zone: ZONE,
    projects: opts.projects ?? [web],
    gapMinutes: opts.gapMinutes,
    configDir: dir,
    repoOf: async (cwd) => (cwd === '/work/web' ? 'acme/web' : null),
  })

describe('claudeCodeActivity', () => {
  it('splits blocks at pauses and adds a 5-minute tail', async () => {
    await transcript('s1', [...span('09:10', '10:40'), ...span('11:20', '12:00')])
    const blocks = await run()
    expect(blocks.map((b) => [b.start, b.end, b.minutes])).toEqual([
      ['2026-10-14T09:10:00+02:00', '2026-10-14T10:45:00+02:00', 95],
      ['2026-10-14T11:20:00+02:00', '2026-10-14T12:05:00+02:00', 45],
    ])
  })

  it('maps repository, issue guess and project candidate', async () => {
    await transcript('s1', span('09:00', '09:30'))
    const [b] = await run()
    expect(b).toMatchObject({
      cwd: '/work/web',
      branch: 'fix/42-login',
      repo: 'acme/web',
      issueRef: 'acme/web#42',
      projectCandidates: [{ id: 'p1', name: 'Website' }],
      sessions: 1,
    })
  })

  it('merges parallel sessions in one folder and branch', async () => {
    await transcript('s1', span('09:00', '10:00'))
    await transcript('s2', span('09:30', '10:30', 5, { sessionId: 's2' }))
    const blocks = await run()
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({
      start: '2026-10-14T09:00:00+02:00',
      end: '2026-10-14T10:35:00+02:00',
      sessions: 2,
    })
  })

  it('keeps blocks in other folders separate and marks the overlap', async () => {
    await transcript('s1', span('09:00', '10:00'))
    await transcript(
      's2',
      span('09:30', '10:30', 5, { cwd: '/scratch', gitBranch: '', sessionId: 's2' }),
      'other',
    )
    const blocks = await run()
    expect(
      blocks.map((b) => [b.cwd, b.repo, b.issueRef, b.projectCandidates.length, b.overlapsWith]),
    ).toEqual([
      ['/work/web', 'acme/web', 'acme/web#42', 1, [1]],
      ['/scratch', null, null, 0, [0]],
    ])
  })

  it('uses the day of the zone, not of UTC', async () => {
    // 00:30 Vienna on the 14th is still the 13th in UTC; 23:50 on the 13th belongs to the 13th.
    await transcript('s1', [
      ...span('23:40', '23:50').map((l) => l.replace(/2026-10-14/, '2026-10-13')),
      ...span('00:30', '00:40'),
    ])
    const blocks = await run()
    expect(blocks.map((b) => b.start)).toEqual(['2026-10-14T00:30:00+02:00'])
  })

  it('keeps only the first three user prompts, shortened, and no assistant or tool content', async () => {
    const prompt = (text: unknown, time: string, extra: Record<string, unknown> = {}) =>
      line('user', at(time), { message: { role: 'user', content: text }, ...extra })
    await transcript('s1', [
      prompt('Fix the login bug', '09:00'),
      line('assistant', at('09:01'), {
        message: { role: 'assistant', content: [{ type: 'text', text: 'SECRET ANSWER' }] },
      }),
      prompt([{ type: 'tool_result', content: 'SECRET OUTPUT' }], '09:02'),
      prompt('<command-name>/clear</command-name>', '09:03'),
      prompt('meta', '09:04', { isMeta: true }),
      prompt('x'.repeat(300), '09:05'),
      prompt([{ type: 'text', text: 'Add   tests' }], '09:06'),
      prompt('fourth', '09:07'),
    ])
    const [b] = await run()
    expect(b!.prompts).toEqual(['Fix the login bug', `${'x'.repeat(199)}…`, 'Add tests'])
    expect(JSON.stringify(b)).not.toMatch(/SECRET/)
  })

  it('skips broken lines, other line types and old files', async () => {
    await transcript('s1', [
      'not json',
      JSON.stringify({ type: 'summary', timestamp: at('09:00') }),
      ...span('09:00', '09:10'),
    ])
    await transcript('old', span('09:00', '09:10', 5, { cwd: '/old' }), 'old')
    const old = join(dir, 'projects', 'old', 'old.jsonl')
    await utimes(old, new Date('2026-10-01'), new Date('2026-10-01'))
    const blocks = await run()
    expect(blocks.map((b) => b.cwd)).toEqual(['/work/web'])
  })

  it('returns nothing for a day without activity or a missing folder', async () => {
    expect(await run()).toEqual([])
    await transcript(
      's1',
      span('09:00', '09:10').map((l) => l.replace(/2026-10-14/g, '2026-10-12')),
    )
    expect(await run()).toEqual([])
  })
})

describe('issueNumberOf', () => {
  it.each([
    ['fix/42-login', 42],
    ['42-x', 42],
    ['feature/issue_7', 7],
    ['release/v2', null],
    ['main', null],
    ['fix/042', null],
    [null, null],
  ])('%s → %s', (branch, n) => {
    expect(issueNumberOf(branch)).toBe(n)
  })
})
