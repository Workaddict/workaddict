import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startPresence, type PresenceEnv } from './presence'

class FakeLocks {
  held: { name: string }[] = []
  query = vi.fn(async () => ({ held: [...this.held] }))
  request = vi.fn(async (name: string, _o: { mode: 'shared' }, cb: () => Promise<unknown>) => {
    const entry = { name }
    this.held.push(entry)
    await cb()
    this.held = this.held.filter((l) => l !== entry)
  })
}

function env(locks: FakeLocks | null, storage = new Map<string, string>()) {
  const target = new EventTarget()
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState })
  const e: PresenceEnv = {
    storage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => void storage.set(k, v) },
    locks,
    target: target as unknown as Window,
    doc: doc as unknown as Document,
    now: Date.now,
  }
  return { e, storage, target, doc }
}

describe('presence', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2026, 8, 23, 8, 0) })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('snapshots the previous heartbeat before writing its own', async () => {
    const { e, storage } = env(null, new Map([['workaddict.lastAlive', '1000']]))
    const p = startPresence(e)
    expect(await p.snapshot).toEqual({ lastAlive: 1000, othersOpen: false })
    expect(storage.get('workaddict.lastAlive')).toBe(String(Date.now()))
    p.stop()
  })

  it('beats every 30 seconds, on pagehide and when hidden', async () => {
    const { e, storage, target, doc } = env(null)
    const p = startPresence(e)
    const t0 = Date.now()
    vi.advanceTimersByTime(30_000)
    expect(storage.get('workaddict.lastAlive')).toBe(String(t0 + 30_000))

    vi.setSystemTime(t0 + 40_000)
    target.dispatchEvent(new Event('pagehide'))
    expect(storage.get('workaddict.lastAlive')).toBe(String(t0 + 40_000))

    vi.setSystemTime(t0 + 45_000)
    doc.visibilityState = 'hidden'
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(storage.get('workaddict.lastAlive')).toBe(String(t0 + 45_000))
    p.stop()
  })

  it('reports another open page through the shared lock and holds its own', async () => {
    const locks = new FakeLocks()
    const first = startPresence(env(locks).e)
    expect((await first.snapshot).othersOpen).toBe(false)
    await vi.waitFor(() => expect(locks.held).toHaveLength(1))

    const second = startPresence(env(locks).e)
    expect((await second.snapshot).othersOpen).toBe(true)

    first.stop()
    second.stop()
    await vi.waitFor(() => expect(locks.held).toHaveLength(0))
    const third = startPresence(env(locks).e)
    expect((await third.snapshot).othersOpen).toBe(false)
    third.stop()
  })

  it('works without storage', async () => {
    const { e } = env(null)
    const p = startPresence({ ...e, storage: null })
    expect(await p.snapshot).toEqual({ lastAlive: null, othersOpen: false })
    p.stop()
  })
})
