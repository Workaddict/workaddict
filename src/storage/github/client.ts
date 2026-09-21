import { StorageError } from '../errors'

export const GITHUB_API = 'https://api.github.com'

export interface GitHubClientOptions {
  token: string
  fetchFn?: typeof fetch
}

/** Thin authenticated wrapper around the GitHub REST API with error mapping. */
export class GitHubClient {
  private readonly token: string
  private readonly fetchFn: typeof fetch

  constructor(opts: GitHubClientOptions) {
    this.token = opts.token
    this.fetchFn = opts.fetchFn ?? ((...args) => fetch(...args))
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response
    try {
      res = await this.fetchFn(`${GITHUB_API}${path}`, {
        method,
        // GitHub sends max-age=60 on GETs; we always need the latest state.
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch (e) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false
      throw new StorageError(offline ? 'offline' : 'network', String(e))
    }
    if (res.ok) {
      return (res.status === 204 ? undefined : await res.json()) as T
    }
    throw await toStorageError(res)
  }

  get<T>(path: string) {
    return this.request<T>('GET', path)
  }
}

async function toStorageError(res: Response): Promise<StorageError> {
  let message = `${res.status}`
  try {
    const data = (await res.json()) as { message?: string }
    if (data.message) message = data.message
  } catch {
    // body is not JSON
  }
  const status = res.status
  const remaining = res.headers.get('x-ratelimit-remaining')
  const retryAfter = res.headers.get('retry-after')
  if ((status === 403 || status === 429) && (remaining === '0' || retryAfter)) {
    const reset = res.headers.get('x-ratelimit-reset')
    const resetAt = retryAfter
      ? new Date(Date.now() + Number(retryAfter) * 1000)
      : reset
        ? new Date(Number(reset) * 1000)
        : undefined
    return new StorageError('rateLimit', message, { resetAt, status })
  }
  switch (status) {
    case 401:
      return new StorageError('auth', message, { status })
    case 403:
      return new StorageError('forbidden', message, { status })
    case 404:
      return new StorageError('notFound', message, { status })
    case 409:
    case 422:
      return new StorageError('conflict', message, { status })
    default:
      return new StorageError('unknown', message, { status })
  }
}
