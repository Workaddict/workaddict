import { ClockifyClient, fetchAllPages, isClockifyError, newPagedList, PAGE_SIZE } from './client'

const KEY = 'secret-key-123'

function clientWith(handler: (url: URL, init?: RequestInit) => Response | Promise<Response>) {
  const calls: { url: URL; init?: RequestInit }[] = []
  const client = new ClockifyClient({
    apiKey: KEY,
    fetchFn: async (input, init) => {
      const url = new URL(String(input))
      calls.push({ url, init })
      return handler(url, init)
    },
  })
  return { client, calls }
}

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers })

describe('ClockifyClient', () => {
  it('sends the key as X-Api-Key to the default host and counts requests', async () => {
    const { client, calls } = clientWith(() => json({ id: 'u1', name: 'A', email: 'a@x' }))
    await client.getUser()
    expect(calls[0]!.url.toString()).toBe('https://api.clockify.me/api/v1/user')
    expect(new Headers(calls[0]!.init?.headers).get('X-Api-Key')).toBe(KEY)
    expect(client.requestCount).toBe(1)
  })

  it('uses the regional host', async () => {
    const calls: string[] = []
    const client = new ClockifyClient({
      apiKey: KEY,
      region: 'euc1',
      fetchFn: async (input) => {
        calls.push(String(input))
        return json([])
      },
    })
    await client.listWorkspaces()
    expect(calls[0]).toBe('https://euc1.clockify.me/api/v1/workspaces')
  })

  it('requests users including deactivated ones with a large page size', async () => {
    const { client, calls } = clientWith(() => json([]))
    await client.listUsers('ws1', 1)
    const q = calls[0]!.url.searchParams
    expect(q.get('status')).toBe('ALL')
    expect(q.get('page-size')).toBe(String(PAGE_SIZE))
  })

  it.each([
    [401, 'invalidKey'],
    [403, 'forbidden'],
    [429, 'rateLimit'],
    [500, 'unknown'],
  ] as const)('maps %i to %s without exposing the key', async (status, kind) => {
    const { client } = clientWith(() => json({ message: `bad key ${KEY}` }, status))
    const err = await client.getUser().catch((e: unknown) => e)
    expect(isClockifyError(err, kind)).toBe(true)
    expect(String(err)).not.toContain(KEY)
    expect((err as Error).message).not.toContain(KEY)
  })

  it('reads the reset time from Retry-After', async () => {
    const { client } = clientWith(() => json({}, 429, { 'Retry-After': '120' }))
    const err = await client.getUser().catch((e: unknown) => e)
    const resetAt = (err as { resetAt: Date }).resetAt.getTime()
    expect(resetAt - Date.now()).toBeGreaterThan(110_000)
  })

  it('treats a "too many requests" message as a rate limit', async () => {
    const { client } = clientWith(() => json({ message: 'Too many requests', code: 1000 }, 400))
    expect(isClockifyError(await client.getUser().catch((e: unknown) => e), 'rateLimit')).toBe(true)
  })

  it('maps transport failures to network', async () => {
    const { client } = clientWith(() => {
      throw new TypeError('Failed to fetch')
    })
    expect(isClockifyError(await client.getUser().catch((e: unknown) => e), 'network')).toBe(true)
  })
})

describe('fetchAllPages', () => {
  it('requests the next page only while pages are full', async () => {
    const pages: number[] = []
    const state = newPagedList<number>()
    await fetchAllPages(state, async (p) => {
      pages.push(p)
      return p < 3 ? Array(PAGE_SIZE).fill(p) : [3]
    })
    expect(pages).toEqual([1, 2, 3])
    expect(state.items).toHaveLength(2 * PAGE_SIZE + 1)
  })

  it('stops after a single short page', async () => {
    const pages: number[] = []
    await fetchAllPages(newPagedList(), async (p) => (pages.push(p), []))
    expect(pages).toEqual([1])
  })

  it('resumes with the page that failed', async () => {
    const state = newPagedList<number>()
    let fail = true
    const pages: number[] = []
    const fetchPage = async (p: number) => {
      pages.push(p)
      if (p === 2 && fail) {
        fail = false
        throw new Error('limit')
      }
      return p === 1 ? Array(PAGE_SIZE).fill(1) : [2]
    }
    await expect(fetchAllPages(state, fetchPage)).rejects.toThrow('limit')
    await fetchAllPages(state, fetchPage)
    expect(pages).toEqual([1, 2, 2])
    expect(state.items).toHaveLength(PAGE_SIZE + 1)
  })
})
