import { isStorageError } from '../../storage'

type Listener = () => void
const listeners = new Set<Listener>()

/** Called by the query/mutation caches for every failed request. */
export function reportError(error: unknown) {
  if (isStorageError(error, 'auth')) listeners.forEach((l) => l())
}

export function onAuthExpired(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
