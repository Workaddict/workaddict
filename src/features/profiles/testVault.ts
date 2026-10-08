import { createVaultStore, type VaultStore } from './vaultStore'
import type { VaultEnv, VaultMessage } from './vaultSync'

/** Cheap key derivation for tests; the format stores the count, so stores still interoperate. */
export const TEST_ITERATIONS = 1000

/**
 * One simulated device: shared localStorage, IndexedDB key, channel and write lock. Each `tab()` is
 * a vault store as one browser tab would have it.
 */
export function fakeDevice(opts: { channel?: boolean; locks?: boolean } = {}) {
  const storage = new Map<string, string>()
  let storedKey: CryptoKey | undefined
  const tabs: { deliver: (msg: VaultMessage) => void; storage: () => void }[] = []
  let queue: Promise<unknown> = Promise.resolve()

  function tab(): VaultStore {
    const self: { deliver: (msg: VaultMessage) => void; storage: () => void } = {
      deliver: () => {},
      storage: () => {},
    }
    tabs.push(self)
    const others = () => tabs.filter((t) => t !== self)
    const env: VaultEnv = {
      storage: {
        get: (k) => storage.get(k) ?? null,
        set: (k, v) => {
          storage.set(k, v)
          others().forEach((t) => t.storage())
        },
        remove: (k) => {
          storage.delete(k)
          others().forEach((t) => t.storage())
        },
      },
      keys: {
        get: async () => storedKey,
        set: async (k) => {
          storedKey = k
        },
        remove: async () => {
          storedKey = undefined
        },
      },
      channel:
        opts.channel === false
          ? null
          : {
              post: (msg) => others().forEach((t) => queueMicrotask(() => t.deliver(msg))),
              subscribe(fn) {
                self.deliver = fn
                return () => (self.deliver = () => {})
              },
            },
      onStorage(_key, fn) {
        self.storage = fn
        return () => (self.storage = () => {})
      },
      withLock(fn) {
        if (opts.locks === false) return fn()
        const run = queue.then(fn, fn)
        queue = run.catch(() => {})
        return run
      },
      wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    }
    return createVaultStore(env, { iterations: TEST_ITERATIONS })
  }

  return { tab, storage, storedKey: () => storedKey }
}

/** Resolves after pending channel messages and the decryptions they start. */
export async function settle() {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0))
}
