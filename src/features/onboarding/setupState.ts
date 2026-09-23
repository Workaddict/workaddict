import { useEffect, useState } from 'react'
import { DEFAULT_REPO_NAME } from './githubLinks'

/** Steps of the team setup: an organization, shared access and invitations. */
export const TEAM_STEPS = ['org', 'repo', 'base', 'approval', 'invite', 'token', 'share'] as const

/**
 * Steps of the solo setup. One person tracking their own time needs no organization: a
 * fine-grained token works on a private repository in their own account, so there is no base
 * permission, no token approval policy and nobody to invite.
 */
export const SOLO_STEPS = ['repo', 'token'] as const

/** Every step name the wizard knows, used when reading saved progress. */
export const SETUP_STEPS = TEAM_STEPS
export type SetupStep = (typeof TEAM_STEPS)[number]

/** Whether the data repository belongs to an organization (a team) or to one person. */
export type SetupMode = 'team' | 'solo'

export function stepsFor(mode: SetupMode): readonly SetupStep[] {
  return mode === 'solo' ? SOLO_STEPS : TEAM_STEPS
}

export interface SetupState {
  /** `null` until the user has said whether they set this up for a team or for themselves. */
  mode: SetupMode | null
  /** The organization (team mode) or the user's own GitHub login (solo mode). */
  org: string
  repo: string
  done: SetupStep[]
  /** The owner's choice for fine-grained token approval, once made. Team mode only. */
  approval: 'off' | 'on' | null
}

const KEY = 'workaddict.setup'

export function emptySetup(): SetupState {
  return { mode: null, org: '', repo: DEFAULT_REPO_NAME, done: [], approval: null }
}

/** Reads the saved wizard progress; anything unexpected falls back to a fresh start. */
export function loadSetup(): SetupState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptySetup()
    const v = JSON.parse(raw) as Partial<SetupState>
    const org = typeof v.org === 'string' ? v.org : ''
    return {
      // Progress saved before solo mode existed was always a team setup.
      mode: v.mode === 'solo' || v.mode === 'team' ? v.mode : org !== '' ? 'team' : null,
      org,
      repo: typeof v.repo === 'string' ? v.repo : DEFAULT_REPO_NAME,
      done: Array.isArray(v.done)
        ? SETUP_STEPS.filter((s) => (v.done as unknown[]).includes(s))
        : [],
      approval: v.approval === 'on' || v.approval === 'off' ? v.approval : null,
    }
  } catch {
    return emptySetup()
  }
}

export function saveSetup(state: SetupState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage unavailable: progress lasts for this page view only
  }
}

/** Wizard progress that survives trips to GitHub and page reloads (when storage is available). */
export function useSetupState() {
  const [state, setState] = useState(loadSetup)
  useEffect(() => saveSetup(state), [state])
  return [state, setState] as const
}
