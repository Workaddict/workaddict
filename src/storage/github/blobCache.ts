import { clear, createStore, get, set, type UseStore } from 'idb-keyval'

/**
 * Content-addressed cache: blob SHA → file text. A SHA always maps to the same content,
 * so entries never go stale. Falls back to memory if IndexedDB is unavailable.
 */
export interface BlobCache {
  get(sha: string): Promise<string | undefined>
  set(sha: string, text: string): Promise<void>
  clear(): Promise<void>
}

let idbStore: UseStore | null = null
function store(): UseStore {
  idbStore ??= createStore('workaddict-cache', 'blobs')
  return idbStore
}

export function createBlobCache(): BlobCache {
  const memory = new Map<string, string>()
  return {
    async get(sha) {
      const hit = memory.get(sha)
      if (hit !== undefined) return hit
      try {
        const v = await get<string>(sha, store())
        if (v !== undefined) memory.set(sha, v)
        return v
      } catch {
        return undefined
      }
    },
    async set(sha, text) {
      memory.set(sha, text)
      try {
        await set(sha, text, store())
      } catch {
        // IndexedDB unavailable (private mode etc.): memory cache only
      }
    },
    async clear() {
      memory.clear()
      try {
        await clear(store())
      } catch {
        // ignore
      }
    },
  }
}

/** Removes all cached repository data from this browser (used on logout). */
export async function clearBlobCache(): Promise<void> {
  try {
    await clear(store())
  } catch {
    // ignore
  }
}
