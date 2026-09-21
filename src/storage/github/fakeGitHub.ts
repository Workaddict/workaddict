import { decodeBase64, encodeBase64 } from './base64'

/** Minimal in-memory GitHub REST API for tests: user, repo, collaborators, trees, blobs, contents. */
export class FakeGitHub {
  files = new Map<string, { sha: string; text: string }>()
  blobs = new Map<string, string>()
  users: Record<string, string> = {} // token → login
  collaboratorsForbidden = false
  push = true
  log: string[] = []
  /** Called before a PUT is applied; may mutate the repo to simulate a concurrent write. */
  beforePut: ((path: string) => void) | null = null
  private n = 0

  constructor(
    readonly owner = 'team',
    readonly repo = 'data',
  ) {}

  putRaw(path: string, text: string) {
    const sha = `sha${++this.n}`
    this.files.set(path, { sha, text })
    this.blobs.set(sha, text)
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
        permissions: { push: this.push, pull: true },
      })
    }
    if (!path.startsWith(base)) return res(404, { message: 'Not Found' })
    const sub = path.slice(base.length)

    if (sub === '/collaborators') {
      if (this.collaboratorsForbidden) return res(403, { message: 'Must have push access' })
      return res(
        200,
        Object.values(this.users).map((l) => ({ login: l, avatar_url: `https://avatars/${l}` })),
      )
    }
    if (sub === '/git/trees/main') {
      if (this.files.size === 0) return res(409, { message: 'Git Repository is empty.' })
      return res(200, {
        truncated: false,
        tree: [...this.files].map(([p, f]) => ({ path: p, type: 'blob', sha: f.sha })),
      })
    }
    if (sub.startsWith('/git/blobs/')) {
      const text = this.blobs.get(sub.slice('/git/blobs/'.length))
      if (text === undefined) return res(404, { message: 'Not Found' })
      return res(200, { content: encodeBase64(text), encoding: 'base64' })
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
