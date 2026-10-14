import { browserZone, isValidZone } from '../../src/domain/zoneNames'
import { SCHEMA_VERSION, type Access, type Member } from '../../src/domain/types'
import { RepoAdapter } from '../../src/storage/repoAdapter'
import type { BlobCache } from '../../src/storage/github/blobCache'
import { GitHubClient } from '../../src/storage/github/client'
import { checkLogin, GitHubIdentity, type LoginError } from '../../src/storage/github/githubAdapter'
import { GitHubFileStore } from '../../src/storage/github/githubStore'
import type { FileStore } from '../../src/storage/types'
import type { Config } from './config'

/** Everything a tool call needs: the signed-in adapter and who is using it. */
export interface Session {
  adapter: RepoAdapter
  me: Member
  access: Access
  /** Effective zone for clock times: the team zone, else this machine's zone. */
  zone(): Promise<string>
}

/** The process lives as long as the AI session, so a plain map is the whole cache. */
export function memoryBlobCache(): BlobCache {
  const blobs = new Map<string, string>()
  return {
    get: async (sha) => blobs.get(sha),
    set: async (sha, text) => void blobs.set(sha, text),
    clear: async () => blobs.clear(),
  }
}

/**
 * Node's fetch before v24 rejects the `cache` option the browser client sets; GitHub's API
 * needs no cache control from a server process anyway.
 */
export const nodeFetch: typeof fetch = (input, init) => {
  const rest = { ...init }
  delete rest.cache
  return fetch(input, rest)
}

const LOGIN_ERRORS: Record<LoginError, string> = {
  badRepoFormat: 'WORKADDICT_REPO must be owner/repo',
  invalidToken: 'GitHub rejected WORKADDICT_TOKEN (expired, revoked or mistyped)',
  ownerNotFound: 'The owner in WORKADDICT_REPO does not exist on GitHub',
  orgRepoNotAccessible:
    'The token cannot reach the organization repository: accept the invitation, check your write access, and make sure the token selects this repository (an organization owner may have to approve it)',
  ownRepoNotAccessible:
    'The token cannot reach the repository: check the name and that the token selects this repository',
  personalRepoNotAccessible:
    "The repository belongs to another person's account, which fine-grained tokens cannot reach",
  repoNotFound: 'The repository in WORKADDICT_REPO was not found',
  noPushAccess: 'You have no write access to the data repository',
  offline: 'GitHub cannot be reached (offline?)',
  rateLimit: 'GitHub rate limit reached, try again later',
  unknown: 'Signing in to GitHub failed',
}

export class ConnectError extends Error {}

/**
 * Signs in like the web app's sign-in check, then makes sure the repository is a Workaddict
 * data repository. Unlike the app it never initializes an empty repository.
 */
export async function connect(
  config: Config,
  client: string,
  opts: { fetchFn?: typeof fetch; cache?: BlobCache; store?: FileStore } = {},
): Promise<Session> {
  const fetchFn = opts.fetchFn ?? nodeFetch
  const check = await checkLogin(
    { token: config.token, repo: `${config.owner}/${config.repo}` },
    fetchFn,
  )
  if (!check.ok) throw new ConnectError(LOGIN_ERRORS[check.error])

  const github = new GitHubClient({ token: config.token, fetchFn })
  const store =
    opts.store ??
    new GitHubFileStore({
      client: github,
      owner: config.owner,
      repo: config.repo,
      branch: config.branch ?? check.repo.default_branch,
      cache: opts.cache ?? memoryBlobCache(),
    })
  const meta = await store.read<{ schemaVersion?: unknown }>('tracker.json')
  if (!meta) {
    throw new ConnectError(
      `${config.owner}/${config.repo} is not a Workaddict data repository (no tracker.json). Sign in to the web app once to set it up.`,
    )
  }
  const identity = new GitHubIdentity(github, config.owner, config.repo)
  const adapter = new RepoAdapter(store, identity, { client })
  // Data written by a newer app version: read it, but never write it.
  if (typeof meta.schemaVersion === 'number' && meta.schemaVersion > SCHEMA_VERSION) {
    adapter.readOnly = true
  }
  const [me, access] = await Promise.all([adapter.getCurrentUser(), adapter.getAccess()])
  return {
    adapter,
    me,
    access,
    zone: async () => {
      const team = (await adapter.getWorkspace()).timeZone
      return isValidZone(team) ? team : browserZone()
    },
  }
}
