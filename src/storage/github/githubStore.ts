import { isStorageError, StorageError } from '../errors'
import type { FileStore } from '../types'
import { decodeBase64, encodeBase64 } from './base64'
import type { BlobCache } from './blobCache'
import type { GitHubClient } from './client'

interface TreeResponse {
  tree: { path: string; type: string; sha: string }[]
  truncated: boolean
}

interface BlobResponse {
  content: string
  encoding: string
}

interface PutResponse {
  content: { sha: string }
}

interface RefResponse {
  object: { sha: string }
}

interface CommitResponse {
  sha: string
  tree: { sha: string }
}

/** Git blob SHA-1 of a text, as GitHub computes it ("blob <bytes>\0<content>"). */
export async function gitBlobSha(text: string): Promise<string> {
  const body = new TextEncoder().encode(text)
  const header = new TextEncoder().encode(`blob ${body.length}\0`)
  const bytes = new Uint8Array(header.length + body.length)
  bytes.set(header)
  bytes.set(body, header.length)
  const digest = await crypto.subtle.digest('SHA-1', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const MAX_WRITE_RETRIES = 3

export interface GitHubFileStoreOptions {
  client: GitHubClient
  owner: string
  repo: string
  branch: string
  cache: BlobCache
  /** How long a fetched tree snapshot is reused (dedupes the burst of reads in one refresh). */
  treeTtlMs?: number
  sleep?: (ms: number) => Promise<void>
}

/**
 * FileStore backed by a GitHub repository.
 * Reads: one recursive tree call lists every file with its blob SHA; contents are fetched
 * per SHA and cached, so unchanged files are never downloaded twice.
 * Writes: Contents API with the current SHA; conflicts are retried with re-applied changes.
 */
export class GitHubFileStore implements FileStore {
  private tree: Promise<Map<string, string>> | null = null
  private treeFetchedAt = 0
  private readonly base: string
  private readonly treeTtlMs: number
  private readonly sleep: (ms: number) => Promise<void>

  constructor(private readonly opts: GitHubFileStoreOptions) {
    this.base = `/repos/${encodeURIComponent(opts.owner)}/${encodeURIComponent(opts.repo)}`
    this.treeTtlMs = opts.treeTtlMs ?? 2000
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)))
  }

  invalidate(): void {
    this.tree = null
  }

  listFiles(): Promise<Map<string, string>> {
    if (!this.tree || Date.now() - this.treeFetchedAt >= this.treeTtlMs) {
      this.treeFetchedAt = Date.now()
      const pending = this.fetchTree()
      this.tree = pending
      pending.catch(() => {
        if (this.tree === pending) this.tree = null
      })
    }
    return this.tree
  }

  private async fetchTree(): Promise<Map<string, string>> {
    try {
      const res = await this.opts.client.get<TreeResponse>(
        `${this.base}/git/trees/${encodeURIComponent(this.opts.branch)}?recursive=1`,
      )
      return new Map(res.tree.filter((t) => t.type === 'blob').map((t) => [t.path, t.sha]))
    } catch (e) {
      // An empty repository (409) or a missing branch (404) simply has no files yet.
      if (isStorageError(e, 'conflict') || isStorageError(e, 'notFound')) return new Map()
      throw e
    }
  }

  private async readText(sha: string): Promise<string> {
    const cached = await this.opts.cache.get(sha)
    if (cached !== undefined) return cached
    const blob = await this.opts.client.get<BlobResponse>(`${this.base}/git/blobs/${sha}`)
    const text = blob.encoding === 'base64' ? decodeBase64(blob.content) : blob.content
    await this.opts.cache.set(sha, text)
    return text
  }

  async read<T>(path: string, snapshot?: Map<string, string>): Promise<T | null> {
    const sha = (snapshot ?? (await this.listFiles())).get(path)
    if (!sha) return null
    return JSON.parse(await this.readText(sha)) as T
  }

  async write<T>(path: string, fn: (current: T | null) => T, message: string): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const files = await this.listFiles()
      const sha = files.get(path)
      const currentText = sha ? await this.readText(sha) : null
      const next = fn(currentText === null ? null : (JSON.parse(currentText) as T))
      const nextText = `${JSON.stringify(next, null, 2)}\n`
      if (currentText === nextText) return next // nothing changed: skip an empty commit

      try {
        const res = await this.opts.client.request<PutResponse>(
          'PUT',
          `${this.base}/contents/${path.split('/').map(encodeURIComponent).join('/')}`,
          { message, content: encodeBase64(nextText), ...(sha ? { sha } : {}) },
        )
        files.set(path, res.content.sha)
        await this.opts.cache.set(res.content.sha, nextText)
        return next
      } catch (e) {
        if (!isStorageError(e, 'conflict')) throw e
        this.invalidate()
        if (attempt >= MAX_WRITE_RETRIES) {
          throw new StorageError('conflict', `Could not save ${path} after ${attempt + 1} attempts`)
        }
        await this.sleep((attempt + 1) * 250 + Math.random() * 250)
      }
    }
  }

  /**
   * One commit via the Git Data API (ref → commit → tree → commit → ref), i.e. a constant
   * number of requests. The ref update is never forced, so a concurrent commit makes it fail
   * (422) and the whole write is re-prepared and retried.
   */
  async writeMany(
    files: Map<string, unknown>,
    message: string,
    prepare?: () => Promise<string[] | void>,
  ): Promise<void> {
    const texts = [...files].map(([path, data]) => ({
      path,
      text: `${JSON.stringify(data, null, 2)}\n`,
    }))
    const branch = encodeURIComponent(this.opts.branch)
    for (let attempt = 0; ; attempt++) {
      const deletes = ((await prepare?.()) ?? []).filter((p) => !files.has(p))
      const ref = await this.opts.client.get<RefResponse>(`${this.base}/git/ref/heads/${branch}`)
      const parent = await this.opts.client.get<CommitResponse>(
        `${this.base}/git/commits/${ref.object.sha}`,
      )
      const tree = await this.opts.client.request<{ sha: string }>('POST', `${this.base}/git/trees`, {
        base_tree: parent.tree.sha,
        tree: [
          ...texts.map((f) => ({ path: f.path, mode: '100644', type: 'blob', content: f.text })),
          // sha: null removes the file from the base tree
          ...deletes.map((path) => ({ path, mode: '100644', type: 'blob', sha: null })),
        ],
      })
      const commit = await this.opts.client.request<{ sha: string }>(
        'POST',
        `${this.base}/git/commits`,
        { message, tree: tree.sha, parents: [ref.object.sha] },
      )
      try {
        await this.opts.client.request('PATCH', `${this.base}/git/refs/heads/${branch}`, {
          sha: commit.sha,
          force: false,
        })
      } catch (e) {
        if (!isStorageError(e, 'conflict')) throw e
        this.invalidate()
        if (attempt >= MAX_WRITE_RETRIES) {
          throw new StorageError('conflict', `Could not commit after ${attempt + 1} attempts`)
        }
        await this.sleep((attempt + 1) * 250 + Math.random() * 250)
        continue
      }
      this.invalidate()
      // Seed the content-addressed cache so the next read does not download what we just wrote.
      await Promise.all(texts.map(async (f) => this.opts.cache.set(await gitBlobSha(f.text), f.text)))
      return
    }
  }
}
