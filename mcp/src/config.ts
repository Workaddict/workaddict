import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { parseRepo } from '../../src/storage/github/githubAdapter'

export interface Config {
  token: string
  owner: string
  repo: string
  /** Branch from `WORKADDICT_BRANCH`; otherwise the repository's default branch is used. */
  branch?: string
}

export type ConfigResult = { ok: true; config: Config } | { ok: false; error: string }

/** Reads the token from `gh auth token`, or null when gh is missing or not signed in. */
export type GhToken = () => Promise<string | null>

export const ghAuthToken: GhToken = async () => {
  try {
    const { stdout } = await promisify(execFile)('gh', ['auth', 'token'], { timeout: 10_000 })
    return stdout.trim() || null
  } catch {
    return null
  }
}

/**
 * Configuration from the environment the MCP client starts the server with. The gh CLI token is
 * only used on explicit opt-in, because it usually reaches every repository of the user.
 */
export async function readConfig(
  env: Record<string, string | undefined>,
  ghToken: GhToken = ghAuthToken,
): Promise<ConfigResult> {
  const repoText = env.WORKADDICT_REPO?.trim()
  if (!repoText) return { ok: false, error: 'WORKADDICT_REPO is not set (expected owner/repo)' }
  const repo = parseRepo(repoText)
  if (!repo) return { ok: false, error: `WORKADDICT_REPO must be owner/repo, not "${repoText}"` }

  let token = env.WORKADDICT_TOKEN?.trim()
  if (!token && env.WORKADDICT_USE_GH === '1') token = (await ghToken()) ?? undefined
  if (!token) {
    return {
      ok: false,
      error:
        env.WORKADDICT_USE_GH === '1'
          ? 'WORKADDICT_TOKEN is not set and `gh auth token` returned no token'
          : 'WORKADDICT_TOKEN is not set (a fine-grained token with Contents read/write on the data repository)',
    }
  }
  const branch = env.WORKADDICT_BRANCH?.trim() || undefined
  return { ok: true, config: { token, ...repo, ...(branch ? { branch } : {}) } }
}
