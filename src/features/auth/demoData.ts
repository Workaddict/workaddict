import { addDays, setHours, setMinutes, startOfDay } from 'date-fns'
import { monthKey } from '../../domain/month'
import { SCHEMA_VERSION, type TimeEntry, type Workspace } from '../../domain/types'
import { createMemoryAdapter, MemoryFileStore, StorageError } from '../../storage'

const workspace: Workspace = {
  projects: [
    { id: 'p-web', name: 'Website', color: '#4f46e5', archived: false },
    { id: 'p-app', name: 'Mobile app', color: '#14b8a6', archived: false },
    { id: 'p-int', name: 'Internal', color: '#f97316', archived: false },
  ],
  tags: [
    { id: 't-meet', name: 'meeting', archived: false },
    { id: 't-dev', name: 'development', archived: false },
    { id: 't-bug', name: 'bugfix', archived: false },
  ],
}

const templates: [string, string | null, string[]][] = [
  ['Landing page redesign', 'p-web', ['t-dev']],
  ['Weekly planning', 'p-int', ['t-meet']],
  ['Fix login redirect', 'p-app', ['t-bug', 't-dev']],
  ['Push notifications', 'p-app', ['t-dev']],
  ['Client call', 'p-web', ['t-meet']],
  ['Code review', null, []],
]

/** Deterministic sample data for the last three weeks (two members). */
function sampleEntries(): TimeEntry[] {
  const entries: TimeEntry[] = []
  const today = startOfDay(new Date())
  let n = 0
  for (let d = 20; d >= 0; d--) {
    const day = addDays(today, -d)
    if (day.getDay() === 0 || day.getDay() === 6) continue
    for (const login of ['you', 'sam']) {
      let hour = login === 'you' ? 8 : 9
      for (let k = 0; k < 3; k++) {
        const [description, projectId, tagIds] = templates[(n + k) % templates.length]!
        const minutes = 45 + ((n * 37 + k * 53) % 150)
        const start = setMinutes(setHours(day, hour), (n * 15) % 60)
        const end = new Date(start.getTime() + minutes * 60_000)
        if (d === 0 && end > new Date()) break
        entries.push({
          id: `demo-${n}-${k}`,
          login,
          start: start.toISOString(),
          end: end.toISOString(),
          description,
          projectId,
          tagIds,
          createdAt: start.toISOString(),
          updatedAt: start.toISOString(),
        })
        hour += Math.ceil(minutes / 60) + 1
      }
      n++
    }
  }
  return entries
}

/** localStorage key that makes demo writes fail (dev only), to exercise rollback paths. */
export const DEMO_FAIL_KEY = 'workaddict.demoFailWrites'

/** Demo store with GitHub-like write latency; in dev, writes can be forced to fail. */
class DemoFileStore extends MemoryFileStore {
  async write<T>(path: string, fn: (current: T | null) => T): Promise<T> {
    await new Promise((r) => setTimeout(r, 400))
    if (import.meta.env.DEV && localStorage.getItem(DEMO_FAIL_KEY) === '1') {
      throw new StorageError('offline')
    }
    return super.write(path, fn)
  }
}

export function createDemoAdapter() {
  const files: Record<string, unknown> = {
    'tracker.json': { schemaVersion: SCHEMA_VERSION, createdAt: new Date().toISOString() },
    'workspace.json': workspace,
  }
  for (const e of sampleEntries()) {
    const path = `entries/${e.login}/${monthKey(e.start)}.json`
    ;((files[path] ??= []) as TimeEntry[]).push(e)
  }
  return createMemoryAdapter(
    { login: 'you', avatarUrl: null },
    {
      store: new DemoFileStore(files),
      collaborators: [
        { login: 'you', avatarUrl: null },
        { login: 'sam', avatarUrl: null },
      ],
    },
  )
}
