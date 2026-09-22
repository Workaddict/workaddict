import { decodeBase64, encodeBase64 } from './base64'

/**
 * Minimal in-memory GitHub REST API for tests: user, repo, collaborators, trees, blobs, contents,
 * and the Git Data write path (ref → commit → tree → commit → ref update).
 */
export class FakeGitHub {
  files = new Map<string, { sha: string; text: string }>()
  blobs = new Map<string, string>()
  users: Record<string, string> = {} // token → login
  collaboratorsForbidden = false
  push = true
  /** Logins with admin permission on the repository (owners). */
  admins = new Set<string>()
  log: string[] = []
  /** Called before a PUT is applied; may mutate the repo to simulate a concurrent write. */
  beforePut: ((path: string) => void) | null = null
  /** Called before a ref update is applied; may commit to simulate a concurrent write. */
  beforeRefUpdate: (() => void) | null = null
  /** Number of commits on the branch (every contents PUT, putRaw, and ref update). */
  commits = 0
  head = 'c0'
  /** Delay before a blob response, so tests can observe how many blob requests overlap. */
  blobDelayMs = 0
  blobsInFlight = 0
  /** Highest number of blob requests in flight at the same time. */
  peakBlobsInFlight = 0
  private trees = new Map<string, { path: string; content?: string; sha?: null }[]>()
  private pendingCommits = new Map<string, { tree: string; parent: string; message: string }>()
  messages: string[] = []
  private n = 0

  constructor(
    readonly owner = 'team',
    readonly repo = 'data',
  ) {}

  putRaw(path: string, text: string) {
    const sha = `sha${++this.n}`
    this.files.set(path, { sha, text })
    this.blobs.set(sha, text)
    this.head = `c${++this.n}`
    this.commits++
  }

  json(path: string): unknown {
    const f = this.files.get(path)
    return f ? JSON.parse(f.text) : undefined
  }

  count(prefix: string) {
    return this.log.filter((l) => l.startsWith(prefix)).length
  }

  fetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input))
    const method = init?.method ?? 'GET'
    const headers = new Headers(init?.headers)
    const token = headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const login = this.users[token]
    const path = decodeURIComponent(url.pathname)
    this.log.push(`${method} ${path}`)
    const res = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

    if (!login) return res(401, { message: 'Bad credentials' })
    const base = `/repos/${this.owner}/${this.repo}`

    if (path === '/user') return res(200, { login, avatar_url: `https://avatars/${login}` })
    if (path === base) {
      return res(200, {
        full_name: `${this.owner}/${this.repo}`,
        default_branch: 'main',
        private: true,
        permissions: { push: this.push, pull: true, admin: this.admins.has(login) },
      })
    }
    if (!path.startsWith(base)) return res(404, { message: 'Not Found' })
    const sub = path.slice(base.length)

    if (sub === '/collaborators') {
      if (this.collaboratorsForbidden) return res(403, { message: 'Must have push access' })
      return res(
        200,
        Object.values(this.users).map((l) => ({
          login: l,
          avatar_url: `https://avatars/${l}`,
          permissions: { push: true, pull: true, admin: this.admins.has(l) },
          role_name: this.admins.has(l) ? 'admin' : 'write',
        })),
      )
    }
    // The fake keeps no history: a tree by branch name or by commit SHA lists the current files.
    if (sub.startsWith('/git/trees/') && method === 'GET') {
      if (this.files.size === 0) return res(409, { message: 'Git Repository is empty.' })
      return res(200, {
        truncated: false,
        tree: [...this.files].map(([p, f]) => ({ path: p, type: 'blob', sha: f.sha })),
      })
    }
    if (sub.startsWith('/git/blobs/')) {
      this.peakBlobsInFlight = Math.max(this.peakBlobsInFlight, ++this.blobsInFlight)
      try {
        if (this.blobDelayMs > 0) await new Promise((r) => setTimeout(r, this.blobDelayMs))
      } finally {
        this.blobsInFlight--
      }
      const text = this.blobs.get(sub.slice('/git/blobs/'.length))
      if (text === undefined) return res(404, { message: 'Not Found' })
      return res(200, { content: encodeBase64(text), encoding: 'base64' })
    }
    if (sub === '/git/ref/heads/main' && method === 'GET') {
      if (this.files.size === 0) return res(409, { message: 'Git Repository is empty.' })
      return res(200, { object: { sha: this.head } })
    }
    if (sub.startsWith('/git/commits/') && method === 'GET') {
      const sha = sub.slice('/git/commits/'.length)
      return res(200, { sha, tree: { sha: `tree-of-${sha}` } })
    }
    if (sub === '/git/trees' && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as {
        tree: { path: string; content?: string; sha?: null }[]
      }
      const sha = `tree${++this.n}`
      this.trees.set(sha, body.tree)
      return res(201, { sha })
    }
    if (sub === '/git/commits' && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as { tree: string; parents: string[]; message: string }
      const sha = `commit${++this.n}`
      this.pendingCommits.set(sha, { tree: body.tree, parent: body.parents[0]!, message: body.message })
      return res(201, { sha })
    }
    if (sub === '/git/refs/heads/main' && method === 'PATCH') {
      this.beforeRefUpdate?.()
      const body = JSON.parse(String(init?.body)) as { sha: string; force?: boolean }
      const commit = this.pendingCommits.get(body.sha)
      if (!commit) return res(422, { message: 'Object does not exist' })
      if (commit.parent !== this.head && !body.force) {
        return res(422, { message: 'Update is not a fast forward' })
      }
      for (const f of this.trees.get(commit.tree) ?? []) {
        if (f.sha === null) {
          this.files.delete(f.path)
          continue
        }
        if (f.content === undefined) continue
        const blobSha = `sha${++this.n}`
        this.files.set(f.path, { sha: blobSha, text: f.content })
        this.blobs.set(blobSha, f.content)
      }
      this.head = body.sha
      this.commits++
      this.messages.push(commit.message)
      return res(200, { object: { sha: body.sha } })
    }
    if (sub.startsWith('/contents/') && method === 'PUT') {
      const filePath = sub.slice('/contents/'.length)
      this.beforePut?.(filePath)
      const body = JSON.parse(String(init?.body)) as { content: string; sha?: string }
      const existing = this.files.get(filePath)
      if (existing && !body.sha) return res(422, { message: '"sha" wasn\'t supplied.' })
      if (existing && body.sha !== existing.sha) return res(409, { message: 'does not match' })
      if (!existing && body.sha) return res(409, { message: 'does not match' })
      this.putRaw(filePath, decodeBase64(body.content))
      return res(existing ? 200 : 201, { content: { sha: this.files.get(filePath)!.sha } })
    }
    return res(404, { message: 'Not Found' })
  }
}
