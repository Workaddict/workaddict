import type { Member } from '../../domain/types'
import { isStorageError, StorageError } from '../errors'
import { RepoAdapter } from '../repoAdapter'
import type { Identity } from '../types'
import { createBlobCache, type BlobCache } from './blobCache'
import { GitHubClient } from './client'
import { GitHubFileStore } from './githubStore'

interface GitHubUser {
  login: string
  avatar_url: string
}

export interface GitHubRepoInfo {
  full_name: string
  default_branch: string
  private: boolean
  permissions?: { push?: boolean; pull?: boolean; admin?: boolean }
}

export class GitHubIdentity implements Identity {
  constructor(
    private readonly client: GitHubClient,
    private readonly owner: string,
    private readonly repo: string,
  ) {}

  async getCurrentUser(): Promise<Member> {
    const u = await this.client.get<GitHubUser>('/user')
    return { login: u.login, avatarUrl: u.avatar_url }
  }

  async listCollaborators(): Promise<Member[] | null> {
    try {
      const users = await this.client.get<GitHubUser[]>(
        `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/collaborators?per_page=100`,
      )
      return users.map((u) => ({ login: u.login, avatarUrl: u.avatar_url }))
    } catch (e) {
      if (isStorageError(e, 'forbidden') || isStorageError(e, 'notFound')) return null
      throw e
    }
  }
}

export interface GitHubCredentials {
  token: string
  /** "owner/name" */
  repo: string
}

export function parseRepo(full: string): { owner: string; repo: string } | null {
  const m = /^\s*([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)\s*$/.exec(full)
  return m ? { owner: m[1]!, repo: m[2]! } : null
}

export type LoginCheck =
  | { ok: true; user: Member; repo: GitHubRepoInfo }
  | { ok: false; error: 'badRepoFormat' | 'invalidToken' | 'repoNotFound' | 'noPushAccess' | 'offline' | 'rateLimit' | 'unknown'; resetAt?: Date }

/** Validates a token and repository before logging in. */
export async function checkLogin(
  creds: GitHubCredentials,
  fetchFn?: typeof fetch,
): Promise<LoginCheck> {
  const parsed = parseRepo(creds.repo)
  if (!parsed) return { ok: false, error: 'badRepoFormat' }
  const client = new GitHubClient({ token: creds.token.trim(), fetchFn })
  try {
    const u = await client.get<GitHubUser>('/user')
    let repo: GitHubRepoInfo
    try {
      repo = await client.get<GitHubRepoInfo>(
        `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
      )
    } catch (e) {
      if (isStorageError(e, 'notFound') || isStorageError(e, 'forbidden')) {
        return { ok: false, error: 'repoNotFound' }
      }
      throw e
    }
    if (!repo.permissions?.push) return { ok: false, error: 'noPushAccess' }
    return { ok: true, user: { login: u.login, avatarUrl: u.avatar_url }, repo }
  } catch (e) {
    if (e instanceof StorageError) {
      if (e.kind === 'auth') return { ok: false, error: 'invalidToken' }
      if (e.kind === 'offline' || e.kind === 'network') return { ok: false, error: 'offline' }
      if (e.kind === 'rateLimit') return { ok: false, error: 'rateLimit', resetAt: e.resetAt }
    }
    return { ok: false, error: 'unknown' }
  }
}

export interface CreateGitHubAdapterOptions {
  token: string
  owner: string
  repo: string
  branch: string
  fetchFn?: typeof fetch
  cache?: BlobCache
  treeTtlMs?: number
  sleep?: (ms: number) => Promise<void>
}

export function createGitHubAdapter(opts: CreateGitHubAdapterOptions): RepoAdapter {
  const client = new GitHubClient({ token: opts.token, fetchFn: opts.fetchFn })
  const store = new GitHubFileStore({
    client,
    owner: opts.owner,
    repo: opts.repo,
    branch: opts.branch,
    cache: opts.cache ?? createBlobCache(),
    treeTtlMs: opts.treeTtlMs,
    sleep: opts.sleep,
  })
  return new RepoAdapter(store, new GitHubIdentity(client, opts.owner, opts.repo))
}
