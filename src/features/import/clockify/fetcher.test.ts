import { ClockifyClient } from './client'
import { ClockifyFetcher } from './fetcher'

const users = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'].map((id) => ({ id, name: id, email: `${id}@x` }))

/** Fake Clockify API: `limitAfter` requests succeed, then 429 until `reset()`. */
function fakeApi(opts: { limitAfter?: number; forbidden?: string[] } = {}) {
  const log: string[] = []
  let allowed = opts.limitAfter ?? Infinity
  const fetchFn: typeof fetch = async (input) => {
    const url = new URL(String(input))
    if (allowed <= 0) return new Response('{"message":"Too many requests"}', { status: 429 })
    allowed--
    log.push(url.pathname)
    const entryUser = /\/user\/([^/]+)\/time-entries$/.exec(url.pathname)?.[1]
    if (entryUser && opts.forbidden?.includes(entryUser)) {
      return new Response('{}', { status: 403 })
    }
    let body: unknown = []
    if (url.pathname.endsWith('/users')) body = users
    if (entryUser) {
      body = [
        {
          id: `${entryUser}-e`,
          userId: entryUser,
          timeInterval: { start: '2026-01-01T08:00:00Z', end: '2026-01-01T09:00:00Z' },
        },
      ]
    }
    return new Response(JSON.stringify(body), { status: 200 })
  }
  return { log, fetchFn, reset: () => (allowed = Infinity) }
}

describe('ClockifyFetcher', () => {
  it('fetches metadata and the entries of selected users with one request each', async () => {
    const api = fakeApi()
    const client = new ClockifyClient({ apiKey: 'k', fetchFn: api.fetchFn })
    const f = new ClockifyFetcher(client, 'ws')
    await f.run()
    expect(f.metaDone).toBe(true)
    f.selectUsers(['u1', 'u2'])
    await f.run()
    expect(client.requestCount).toBe(5)
    expect(Object.keys(f.result().entries)).toEqual(['u1', 'u2'])
  })

  it('stops at the rate limit and resumes without re-fetching completed users', async () => {
    const api = fakeApi({ limitAfter: 6 }) // 3 meta + 3 users
    const client = new ClockifyClient({ apiKey: 'k', fetchFn: api.fetchFn })
    const f = new ClockifyFetcher(client, 'ws')
    f.selectUsers(users.map((u) => u.id))
    await expect(f.run()).rejects.toMatchObject({ kind: 'rateLimit' })
    expect([...f.progress.values()].map((p) => p.status)).toEqual([
      'done',
      'done',
      'done',
      'pending',
      'pending',
      'pending',
    ])

    api.reset()
    api.log.length = 0
    await f.run()
    expect(api.log).toEqual([
      '/api/v1/workspaces/ws/user/u4/time-entries',
      '/api/v1/workspaces/ws/user/u5/time-entries',
      '/api/v1/workspaces/ws/user/u6/time-entries',
    ])
    expect(f.entriesDone).toBe(true)
    expect(Object.keys(f.result().entries)).toHaveLength(6)
  })

  it('marks a forbidden user as "no access" and continues with the others', async () => {
    const api = fakeApi({ forbidden: ['u2'] })
    const f = new ClockifyFetcher(new ClockifyClient({ apiKey: 'k', fetchFn: api.fetchFn }), 'ws')
    f.selectUsers(['u1', 'u2', 'u3'])
    await f.run()
    const raw = f.result()
    expect(raw.noAccess).toEqual(['u2'])
    expect(Object.keys(raw.entries)).toEqual(['u1', 'u3'])
  })
})
