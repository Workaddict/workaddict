/**
 * Tracks whether a Workaddict page is open on this device (design D2 of `timer-feedback`).
 *
 * Every page holds the shared Web Lock `workaddict-open` for its whole life, so a hidden, throttled
 * or frozen tab still counts as open. A heartbeat in localStorage records when a page was last
 * alive; that gives the close time. Both are read once, before this page adds its own.
 * The navigation type tells a reload (or back/forward) from opening the app again after closing it.
 */

const ALIVE_KEY = 'workaddict.lastAlive'
const LOCK = 'workaddict-open'
const BEAT_MS = 30_000

export interface PresenceSnapshot {
  lastAlive: number | null
  othersOpen: boolean
  /** This page was loaded by a reload or back/forward, not opened anew. */
  reloaded: boolean
}

interface LockLike {
  query(): Promise<{ held?: { name?: string }[] }>
  request(name: string, options: { mode: 'shared' }, cb: () => Promise<unknown>): Promise<unknown>
}

export interface PresenceEnv {
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  locks: LockLike | null
  target: Pick<Window, 'addEventListener' | 'removeEventListener'>
  doc: Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>
  now: () => number
  /** `PerformanceNavigationTiming.type` of this page, if known. */
  navigationType: string | undefined
}

/** Snapshots the previous state, then keeps this page's presence up. Returns the snapshot and a stop. */
export function startPresence(env: PresenceEnv): {
  snapshot: Promise<PresenceSnapshot>
  stop: () => void
} {
  let lastAlive: number | null = null
  try {
    const n = Number(env.storage?.getItem(ALIVE_KEY))
    lastAlive = Number.isFinite(n) && n > 0 ? n : null
  } catch {
    // storage unavailable
  }

  const reloaded = env.navigationType === 'reload' || env.navigationType === 'back_forward'

  let release: () => void = () => {}
  const snapshot = (async (): Promise<PresenceSnapshot> => {
    let othersOpen = false
    if (env.locks) {
      try {
        othersOpen = ((await env.locks.query()).held ?? []).some((l) => l.name === LOCK)
        const held = new Promise<void>((resolve) => (release = resolve))
        env.locks.request(LOCK, { mode: 'shared' }, () => held).catch(() => {})
      } catch {
        // Web Locks unavailable (e.g. insecure context): the heartbeat alone decides
      }
    }
    return { lastAlive, othersOpen, reloaded }
  })()

  const beat = () => {
    try {
      env.storage?.setItem(ALIVE_KEY, String(env.now()))
    } catch {
      // storage full or blocked
    }
  }
  const onVisibility = () => env.doc.visibilityState === 'hidden' && beat()
  beat()
  const timer = setInterval(beat, BEAT_MS)
  env.target.addEventListener('pagehide', beat)
  env.doc.addEventListener('visibilitychange', onVisibility)

  return {
    snapshot,
    stop: () => {
      clearInterval(timer)
      env.target.removeEventListener('pagehide', beat)
      env.doc.removeEventListener('visibilitychange', onVisibility)
      release()
    },
  }
}

let current: Promise<PresenceSnapshot> | null = null

/** Starts presence tracking once per page (from `main.tsx`). */
export function initPresence(): Promise<PresenceSnapshot> {
  current ??= startPresence({
    storage: (() => {
      try {
        return localStorage
      } catch {
        return null
      }
    })(),
    locks: 'locks' in navigator && navigator.locks ? navigator.locks : null,
    target: window,
    doc: document,
    now: Date.now,
    navigationType: (() => {
      try {
        return (
          performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
        )?.type
      } catch {
        return undefined
      }
    })(),
  }).snapshot
  return current
}

/** The state before this page loaded; `null` when tracking was never started (tests, demo). */
export function presenceSnapshot(): Promise<PresenceSnapshot> | null {
  return current
}
