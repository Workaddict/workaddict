export type StorageErrorKind =
  | 'auth' // token rejected / revoked
  | 'forbidden' // token lacks permission
  | 'notFound' // repo or resource missing / not visible
  | 'rateLimit' // GitHub API rate limit reached
  | 'offline' // no network
  | 'network' // other transport failure
  | 'conflict' // write conflict persisted after retries
  | 'schemaTooNew' // data written by a newer app version
  | 'readOnly' // write attempted in read-only mode
  | 'notOwner' // tried to modify another member's data
  | 'invalid' // validation failed
  | 'unknown'

export class StorageError extends Error {
  readonly kind: StorageErrorKind
  /** For rateLimit: when requests are possible again. */
  readonly resetAt?: Date
  readonly status?: number

  constructor(kind: StorageErrorKind, message?: string, opts?: { resetAt?: Date; status?: number }) {
    super(message ?? kind)
    this.name = 'StorageError'
    this.kind = kind
    this.resetAt = opts?.resetAt
    this.status = opts?.status
  }
}

export function isStorageError(e: unknown, kind?: StorageErrorKind): e is StorageError {
  return e instanceof StorageError && (kind === undefined || e.kind === kind)
}
