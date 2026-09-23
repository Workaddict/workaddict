import type { Member } from '../../domain/types'
import { isStorageError, StorageError } from '../errors'
import { RepoAdapter } from '../repoAdapter'
import type { Collaborator, Identity } from '../types'
import { createBlobCache, type BlobCache } from './blobCache'
import { GitHubClient } from './client'
import { GitHubFileStore } from './githubStore'

interface GitHubUser {
  login: string
  avatar_url: string
}

export type GitHubOwnerType = 'User' | 'Organization'

interface GitHubAccount {
  login: string
  type: GitHubOwnerType | string
}

export interface GitHubRepoInfo {
  full_name: string
  owner?: GitHubAccount
  default_branch: string
  private: boolean
  permissions?: { push?: boolean; pull?: boolean; admin?: boolean }
}

/** How long a fetched admin permission is reused before asking GitHub again. */
const ADMIN_TTL_MS = 60_000

export class GitHubIdentity implements Identity {
  private admin: { value: boolean; at: number } | null = null
  private login: string | null = null

  constructor(
    private readonly client: GitHubClient,
    private readonly owner: string,
    private readonly repo: string,
    private readonly now: () => number = Date.now,
  ) {}

  private get base() {
    return `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}`
  }

  async getCurrentUser(): Promise<Member> {
    const u = await this.client.get<GitHubUser>('/user')
    return { login: u.login, avatarUrl: u.avatar_url }
  }

  private async myLogin(): Promise<string> {
    this.login ??= (await this.getCurrentUser()).login
    return this.login
  }

  async listCollaborators(): Promise<Collaborator[] | null> {
    try {
      const users = await this.client.get<GitHubCollaborator[]>(
        `${this.base}/collaborators?per_page=100`,
      )
      return users.map((u) => ({
        login: u.login,
        avatarUrl: u.avatar_url,
        admin: isAdminOf(this.owner, u.login, u.permissions, u.role_name),
      }))
    } catch (e) {
      if (isStorageError(e, 'forbidden') || isStorageError(e, 'notFound')) return null
      throw e
    }
  }

  async isAdmin(): Promise<boolean> {
    if (this.admin && this.now() - this.admin.at < ADMIN_TTL_MS) return this.admin.value
    const [login, repo] = await Promise.all([
      this.myLogin(),
      this.client.get<GitHubRepoInfo>(this.base),
    ])
    const value = isAdminOf(this.owner, login, repo.permissions)
    this.admin = { value, at: this.now() }
    return value
  }
}

interface GitHubCollaborator extends GitHubUser {
  permissions?: GitHubRepoInfo['permissions']
  role_name?: string
}

/**
 * Owner = admin permission on the repository. The account owning a personal repository is
 * always its admin, which also covers responses that omit the permissions object.
 */
function isAdminOf(
  repoOwner: string,
  login: string,
  permissions?: GitHubRepoInfo['permissions'],
  roleName?: string,
): boolean {
  return (
    permissions?.admin === true ||
    roleName === 'admin' ||
    repoOwner.toLowerCase() === login.toLowerCase()
  )
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

/**
 * Why a repository can't be reached with a valid token, found by looking up the owner account:
 * - `ownerNotFound`: no account with that name (typo)
 * - `orgRepoNotAccessible`: organization repo (invitation, write access, token owner or approval)
 * - `ownRepoNotAccessible`: the token user's own account (repo name or token repo selection)
 * - `personalRepoNotAccessible`: another person's account (collaborator invitation; fine-grained
 *   tokens can't reach it at all)
 * - `repoNotFound`: the owner lookup failed too
 */
export type RepoAccessError =
  | 'ownerNotFound'
  | 'orgRepoNotAccessible'
  | 'ownRepoNotAccessible'
  | 'personalRepoNotAccessible'
  | 'repoNotFound'

export type LoginError =
  | 'badRepoFormat'
  | 'invalidToken'
  | RepoAccessError
  | 'noPushAccess'
  | 'offline'
  | 'rateLimit'
  | 'unknown'

export type LoginCheck =
  | {
      ok: true
      user: Member
      repo: GitHubRepoInfo
      ownerType?: GitHubOwnerType
      scopes: string[] | null
    }
  | {
      ok: false
      error: LoginError
      resetAt?: Date
      /** The token's user, once the token was accepted. */
      user?: Member
      /** The repository owner's account type, when known. */
      ownerType?: GitHubOwnerType
    }

function ownerTypeOf(account: GitHubAccount | undefined): GitHubOwnerType | undefined {
  return account?.type === 'Organization' || account?.type === 'User' ? account.type : undefined
}

/** Looks up the owner of a repository the token can't reach, to tell the user why. */
async function diagnoseRepoAccess(
  client: GitHubClient,
  owner: string,
  login: string,
): Promise<{ error: RepoAccessError; ownerType?: GitHubOwnerType }> {
  try {
    const account = await client.get<GitHubAccount>(`/users/${encodeURIComponent(owner)}`)
    const ownerType = ownerTypeOf(account)
    if (ownerType === 'Organization') return { error: 'orgRepoNotAccessible', ownerType }
    if (ownerType === 'User') {
      const own = account.login.toLowerCase() === login.toLowerCase()
      return { error: own ? 'ownRepoNotAccessible' : 'personalRepoNotAccessible', ownerType }
    }
  } catch (e) {
    if (isStorageError(e, 'notFound')) return { error: 'ownerNotFound' }
  }
  return { error: 'repoNotFound' }
}

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
    const user = { login: u.login, avatarUrl: u.avatar_url }
    let repo: GitHubRepoInfo
    try {
      repo = await client.get<GitHubRepoInfo>(
        `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`,
      )
    } catch (e) {
      if (isStorageError(e, 'notFound') || isStorageError(e, 'forbidden')) {
        return { ok: false, user, ...(await diagnoseRepoAccess(client, parsed.owner, u.login)) }
      }
      throw e
    }
    const ownerType = ownerTypeOf(repo.owner)
    if (!repo.permissions?.push) return { ok: false, error: 'noPushAccess', user, ownerType }
    return { ok: true, user, repo, ownerType, scopes: client.scopes }
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
  maxConcurrentReads?: number
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
    maxConcurrentReads: opts.maxConcurrentReads,
    sleep: opts.sleep,
  })
  return new RepoAdapter(store, new GitHubIdentity(client, opts.owner, opts.repo))
}
