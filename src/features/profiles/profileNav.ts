import { useCallback } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getActiveProfile } from '../auth/session'
import { mostRecentProfile, tokenOf, type VaultProfile } from './vault'
import { getVault } from './vaultStore'

/** Opens this tab's last profile, or the most recently used one, after an unlock or import. */
export function useOpenRecentProfile() {
  const { switchProfile } = useAuth()
  return useCallback(async () => {
    const data = getVault().getSnapshot().data
    if (!data) return
    const active = getActiveProfile()
    const profile =
      data.profiles.find((p) => p.id === active && !tokenOf(data, p)?.rejected) ??
      mostRecentProfile(data)
    if (!profile) return
    // On failure the token is marked rejected and the picker shows it.
    await switchProfile(profile.id).catch(() => {})
  }, [switchProfile])
}

export function fixPathForProfile(profile: VaultProfile) {
  return `/fix?e=invalidToken&repo=${encodeURIComponent(profile.repo).replace(/%2F/gi, '/')}&from=profile`
}
