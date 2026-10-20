import { useSyncExternalStore } from 'react'

/**
 * How much help the app shows on this device. "guided" (default) shows glossary tips, the first
 * steps checklist, "New" markers and the welcome dialog; "expert" hides them. Icon-button tips,
 * "?" buttons and the help pages stay in both levels.
 */
export type HintLevel = 'guided' | 'expert'

const KEY = 'workaddict.hintLevel'
const listeners = new Set<() => void>()

function read(): HintLevel {
  try {
    return localStorage.getItem(KEY) === 'expert' ? 'expert' : 'guided'
  } catch {
    return 'guided'
  }
}

let current: HintLevel = read()

export function getHintLevel(): HintLevel {
  return current
}

export function setHintLevel(level: HintLevel) {
  current = level
  try {
    if (level === 'guided') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, level)
  } catch {
    // storage unavailable: choice lasts for this session only
  }
  listeners.forEach((l) => l())
}

export function useHintLevel(): HintLevel {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
}

/** True in Expert mode: hide the hints that only help newcomers. */
export function useIsExpert(): boolean {
  return useHintLevel() === 'expert'
}
