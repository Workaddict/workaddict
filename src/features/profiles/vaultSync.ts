import { createStore, del, get, set, type UseStore } from 'idb-keyval'

/**
 * Browser services the vault store relies on (design D3, D4), behind one interface so tests can
 * connect two simulated tabs.
 */

export const VAULT_KEY = 'workaddict.vault'
export const CHANNEL_NAME = 'workaddict-vault'
export const WRITE_LOCK = 'workaddict-vault-write'
/** How long a new tab waits for an unlocked tab to hand over the key. */
export const KEY_WAIT_MS = 300

export type VaultMessage =
  | { type: 'key-request' }
  | { type: 'key'; key: CryptoKey }
  | { type: 'locked' }
  | { type: 'changed'; rev: number }
  /** "Forget all profiles": every tab signs out, including tab-only sessions. */
  | { type: 'forget' }

export interface VaultEnv {
  storage: {
    get(key: string): string | null
    set(key: string, value: string): void
    remove(key: string): void
  }
  /** The "Stay unlocked" key in IndexedDB (`workaddict-keys`). */
  keys: {
    get(): Promise<CryptoKey | undefined>
    set(key: CryptoKey): Promise<void>
    remove(): Promise<void>
  }
  /** Null without BroadcastChannel; then each tab unlocks on its own. */
  channel: {
    post(msg: VaultMessage): void
    subscribe(fn: (msg: VaultMessage) => void): () => void
  } | null
  /** Changes of a `localStorage` key made in other tabs. */
  onStorage(key: string, fn: () => void): () => void
  /** Runs `fn` under the cross-tab write lock; without Web Locks, directly (last write wins). */
  withLock<T>(fn: () => Promise<T>): Promise<T>
  wait(ms: number): Promise<void>
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

let keyStore: UseStore | null = null
function keys(): UseStore {
  keyStore ??= createStore('workaddict-keys', 'vault')
  return keyStore
}
const KEY_ID = 'key'

function browserChannel(): VaultEnv['channel'] {
  if (typeof BroadcastChannel === 'undefined') return null
  let ch: BroadcastChannel | null = null
  const listeners = new Set<(msg: VaultMessage) => void>()
  const channel = () => {
    if (!ch) {
      ch = new BroadcastChannel(CHANNEL_NAME)
      // Node (tests) keeps the process alive for an open channel.
      ;(ch as unknown as { unref?: () => void }).unref?.()
      ch.onmessage = (e: MessageEvent<VaultMessage>) => listeners.forEach((l) => l(e.data))
    }
    return ch
  }
  return {
    post: (msg) => safe(() => channel().postMessage(msg), undefined),
    subscribe(fn) {
      channel()
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

export function browserEnv(): VaultEnv {
  return {
    storage: {
      get: (key) => safe(() => localStorage.getItem(key), null),
      set: (key, value) => safe(() => localStorage.setItem(key, value), undefined),
      remove: (key) => safe(() => localStorage.removeItem(key), undefined),
    },
    keys: {
      get: async () => {
        try {
          return await get<CryptoKey>(KEY_ID, keys())
        } catch {
          return undefined
        }
      },
      set: async (key) => {
        try {
          await set(KEY_ID, key, keys())
        } catch {
          // IndexedDB unavailable: the vault stays unlocked for open tabs only
        }
      },
      remove: async () => {
        try {
          await del(KEY_ID, keys())
        } catch {
          // ignore
        }
      },
    },
    channel: browserChannel(),
    onStorage(key, fn) {
      const handler = (e: StorageEvent) => (e.key === key || e.key === null) && fn()
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
    withLock(fn) {
      const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
      return locks ? locks.request(WRITE_LOCK, fn) : fn()
    },
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }
}
