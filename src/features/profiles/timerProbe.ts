import { useEffect, useState } from 'react'
import { isStorageError } from '../../storage'
import { decodeBase64 } from '../../storage/github/base64'
import { GitHubClient } from '../../storage/github/client'
import { parseRepo } from '../../storage'
import { tokenOf, type VaultData } from './vault'

/**
 * "Timer running" marks in the profile switcher (design D12): one contents GET of
 * `timers/<login>.json` per other profile, without opening a full adapter. At most 4 requests run
 * at once and answers are reused for 60 s. Errors show no mark.
 */

const TTL_MS = 60_000
const PARALLEL = 4
const cache = new Map<string, { at: number; running: boolean }>()

export function clearTimerProbeCache() {
  cache.clear()
}

interface ProbeTarget {
  token: string
  repo: string
  branch: string
  login: string
}

export async function hasRunningTimer(
  target: ProbeTarget,
  fetchFn?: typeof fetch,
  now = Date.now(),
): Promise<boolean> {
  const id = `${target.repo.toLowerCase()}|${target.login.toLowerCase()}|${target.token}`
  const hit = cache.get(id)
  if (hit && now - hit.at < TTL_MS) return hit.running
  const parsed = parseRepo(target.repo)
  if (!parsed) return false
  const client = new GitHubClient({ token: target.token, fetchFn })
  let running = false
  try {
    const file = await client.get<{ content?: string }>(
      `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/contents/timers/${encodeURIComponent(target.login)}.json?ref=${encodeURIComponent(target.branch)}`,
    )
    const value = file.content ? (JSON.parse(decodeBase64(file.content)) as unknown) : null
    running =
      !!value &&
      typeof value === 'object' &&
      typeof (value as { start?: unknown }).start === 'string'
  } catch (e) {
    if (!isStorageError(e, 'notFound')) throw e
  }
  cache.set(id, { at: now, running })
  return running
}

/** Profile ids with a running timer of the token's user, checked `PARALLEL` at a time. */
export async function probeTimers(
  data: VaultData,
  profileIds: string[],
  fetchFn?: typeof fetch,
): Promise<Set<string>> {
  const targets = profileIds.flatMap((id) => {
    const profile = data.profiles.find((p) => p.id === id)
    const token = profile && tokenOf(data, profile)
    if (!profile || !token || token.rejected) return []
    return [
      { id, token: token.token, repo: profile.repo, branch: profile.branch, login: token.login },
    ]
  })
  const running = new Set<string>()
  let next = 0
  const worker = async () => {
    while (next < targets.length) {
      const target = targets[next++]!
      try {
        if (await hasRunningTimer(target, fetchFn)) running.add(target.id)
      } catch {
        // no mark
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(PARALLEL, targets.length) }, worker))
  return running
}

/** Checks the given profiles whenever `active` turns true (the menu opens). */
export function useRunningTimers(
  data: VaultData | null,
  profileIds: string[],
  active: boolean,
): Set<string> {
  const [running, setRunning] = useState<Set<string>>(() => new Set())
  const key = profileIds.join(',')
  useEffect(() => {
    if (!active || !data || !key) return
    let cancelled = false
    void probeTimers(data, key.split(',')).then((r) => !cancelled && setRunning(r))
    return () => {
      cancelled = true
    }
  }, [active, data, key])
  return running
}
