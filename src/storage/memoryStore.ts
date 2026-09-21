import type { Member } from '../domain/types'
import { RepoAdapter } from './repoAdapter'
import type { FileStore, Identity } from './types'

/** In-memory FileStore: used by tests and the local demo mode. */
export class MemoryFileStore implements FileStore {
  private files = new Map<string, { json: string; version: number }>()
  private counter = 0

  constructor(initial?: Record<string, unknown>) {
    for (const [path, data] of Object.entries(initial ?? {})) this.put(path, data)
  }

  private put(path: string, data: unknown) {
    this.files.set(path, { json: JSON.stringify(data), version: ++this.counter })
  }

  async listFiles(): Promise<Map<string, string>> {
    return new Map([...this.files].map(([p, f]) => [p, String(f.version)]))
  }

  async read<T>(path: string): Promise<T | null> {
    const f = this.files.get(path)
    return f ? (JSON.parse(f.json) as T) : null
  }

  async write<T>(path: string, fn: (current: T | null) => T): Promise<T> {
    const next = fn(await this.read<T>(path))
    this.put(path, next)
    return JSON.parse(JSON.stringify(next)) as T
  }

  async writeMany(
    files: Map<string, unknown>,
    _message: string,
    prepare?: () => Promise<string[] | void>,
  ): Promise<void> {
    const deletes = (await prepare?.()) ?? []
    for (const path of deletes) this.files.delete(path)
    for (const [path, data] of files) this.put(path, data)
  }

  invalidate(): void {}

  /** Raw file contents, for tests and debugging. */
  dump(): Record<string, unknown> {
    return Object.fromEntries([...this.files].map(([p, f]) => [p, JSON.parse(f.json)]))
  }
}

export class StaticIdentity implements Identity {
  constructor(
    private readonly me: Member,
    private readonly collaborators: Member[] | null = null,
  ) {}
  async getCurrentUser() {
    return this.me
  }
  async listCollaborators() {
    return this.collaborators
  }
}

export function createMemoryAdapter(
  me: Member,
  opts?: { store?: MemoryFileStore; collaborators?: Member[] | null },
): RepoAdapter {
  return new RepoAdapter(
    opts?.store ?? new MemoryFileStore(),
    new StaticIdentity(me, opts?.collaborators ?? null),
  )
}
