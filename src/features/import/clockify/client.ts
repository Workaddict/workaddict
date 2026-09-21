/**
 * Read-only Clockify REST API v1 client, called directly from the browser (CORS allowed).
 * The API key is only ever sent in the X-Api-Key header to a clockify.me host; it never
 * appears in errors, logs, or URLs.
 */

export const CLOCKIFY_REGIONS = [
  { id: 'global', baseUrl: 'https://api.clockify.me/api/v1' },
  { id: 'euc1', baseUrl: 'https://euc1.clockify.me/api/v1' },
  { id: 'use2', baseUrl: 'https://use2.clockify.me/api/v1' },
  { id: 'euw2', baseUrl: 'https://euw2.clockify.me/api/v1' },
  { id: 'apse2', baseUrl: 'https://apse2.clockify.me/api/v1' },
] as const
export type ClockifyRegion = (typeof CLOCKIFY_REGIONS)[number]['id']

/** Items per list request; a further page is requested only when a page comes back full. */
export const PAGE_SIZE = 1000

export interface ClockifyUser {
  id: string
  name: string
  email: string
  status?: string
}

export interface ClockifyWorkspace {
  id: string
  name: string
}

export interface ClockifyProject {
  id: string
  name: string
  color?: string | null
  archived?: boolean
  clientName?: string | null
}

export interface ClockifyTag {
  id: string
  name: string
  archived?: boolean
}

export interface ClockifyTimeEntry {
  id: string
  description?: string | null
  projectId?: string | null
  tagIds?: string[] | null
  taskId?: string | null
  billable?: boolean
  userId: string
  timeInterval: { start: string; end?: string | null }
}

export type ClockifyErrorKind = 'invalidKey' | 'forbidden' | 'rateLimit' | 'network' | 'unknown'

export class ClockifyError extends Error {
  readonly kind: ClockifyErrorKind
  readonly resetAt?: Date
  readonly status?: number

  constructor(kind: ClockifyErrorKind, opts?: { resetAt?: Date; status?: number }) {
    // Deliberately no response text: the message must never be able to carry the key.
    super(`Clockify: ${kind}${opts?.status ? ` (${opts.status})` : ''}`)
    this.name = 'ClockifyError'
    this.kind = kind
    this.resetAt = opts?.resetAt
    this.status = opts?.status
  }
}

export function isClockifyError(e: unknown, kind?: ClockifyErrorKind): e is ClockifyError {
  return e instanceof ClockifyError && (kind === undefined || e.kind === kind)
}

export interface ClockifyClientOptions {
  apiKey: string
  region?: ClockifyRegion
  fetchFn?: typeof fetch
}

export class ClockifyClient {
  /** Number of HTTP requests sent so far (shown in the wizard; Free plan: 30/hour). */
  requestCount = 0
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch

  constructor(opts: ClockifyClientOptions) {
    this.apiKey = opts.apiKey.trim()
    this.baseUrl = (CLOCKIFY_REGIONS.find((r) => r.id === opts.region) ?? CLOCKIFY_REGIONS[0]).baseUrl
    this.fetchFn = opts.fetchFn ?? ((...args) => fetch(...args))
  }

  private async get<T>(path: string, query?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, String(v))
    this.requestCount++
    let res: Response
    try {
      res = await this.fetchFn(url.toString(), {
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: { 'X-Api-Key': this.apiKey, Accept: 'application/json' },
      })
    } catch {
      throw new ClockifyError('network')
    }
    if (res.ok) return (await res.json()) as T
    throw await toClockifyError(res)
  }

  getUser() {
    return this.get<ClockifyUser & { activeWorkspace?: string }>('/user')
  }

  listWorkspaces() {
    return this.get<ClockifyWorkspace[]>('/workspaces')
  }

  /** One page of workspace users, including deactivated ones. */
  listUsers(ws: string, page: number) {
    return this.get<ClockifyUser[]>(`/workspaces/${enc(ws)}/users`, {
      status: 'ALL',
      page,
      'page-size': PAGE_SIZE,
    })
  }

  listProjects(ws: string, page: number) {
    return this.get<ClockifyProject[]>(`/workspaces/${enc(ws)}/projects`, {
      page,
      'page-size': PAGE_SIZE,
    })
  }

  listTags(ws: string, page: number) {
    return this.get<ClockifyTag[]>(`/workspaces/${enc(ws)}/tags`, { page, 'page-size': PAGE_SIZE })
  }

  listTimeEntries(ws: string, userId: string, page: number) {
    return this.get<ClockifyTimeEntry[]>(`/workspaces/${enc(ws)}/user/${enc(userId)}/time-entries`, {
      page,
      'page-size': PAGE_SIZE,
    })
  }
}

const enc = encodeURIComponent

/** Resumable pagination state of one list. */
export interface PagedList<T> {
  items: T[]
  nextPage: number
  done: boolean
}

export function newPagedList<T>(): PagedList<T> {
  return { items: [], nextPage: 1, done: false }
}

/**
 * Fetches the remaining pages of a list into `state`. Progress is kept in `state` when a
 * request fails, so calling it again continues with the page that failed.
 */
export async function fetchAllPages<T>(
  state: PagedList<T>,
  fetchPage: (page: number) => Promise<T[]>,
  onPage?: () => void,
): Promise<T[]> {
  while (!state.done) {
    const items = await fetchPage(state.nextPage)
    state.items.push(...items)
    state.nextPage++
    state.done = items.length < PAGE_SIZE
    onPage?.()
  }
  return state.items
}

const RATE_LIMIT_TEXT = /too many requests|rate limit|limit (?:reached|exceeded)/i

async function toClockifyError(res: Response): Promise<ClockifyError> {
  const status = res.status
  let text = ''
  try {
    text = await res.text()
  } catch {
    // no body
  }
  if (status === 429 || RATE_LIMIT_TEXT.test(text)) {
    return new ClockifyError('rateLimit', { status, resetAt: parseRetryAfter(res.headers.get('retry-after')) })
  }
  if (status === 401) return new ClockifyError('invalidKey', { status })
  if (status === 403) return new ClockifyError('forbidden', { status })
  return new ClockifyError('unknown', { status })
}

function parseRetryAfter(value: string | null): Date | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return new Date(Date.now() + seconds * 1000)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}
