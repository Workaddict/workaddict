import { useSyncExternalStore } from 'react'

// Per-device flags of the first steps checklist. Everything else it shows comes from the data.
const DISMISSED_KEY = 'workaddict.checklistDismissed'
const AI_KEY = 'workaddict.connectAiOpened'
const listeners = new Set<() => void>()

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function write(key: string, on: boolean) {
  try {
    if (on) localStorage.setItem(key, '1')
    else localStorage.removeItem(key)
  } catch {
    // storage unavailable: lasts for this page view only
  }
}

let state = { dismissed: read(DISMISSED_KEY), aiOpened: read(AI_KEY) }

function set(next: Partial<typeof state>) {
  state = { ...state, ...next }
  write(DISMISSED_KEY, state.dismissed)
  write(AI_KEY, state.aiOpened)
  listeners.forEach((l) => l())
}

export function useChecklistState() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

export const dismissChecklist = () => set({ dismissed: true })
export const showChecklistAgain = () => set({ dismissed: false })
/** The Connect AI page was opened on this device: the optional step counts as done. */
export function markConnectAiOpened() {
  if (!state.aiOpened) set({ aiOpened: true })
}

/** Test helper. */
export function resetChecklistForTests() {
  state = { dismissed: read(DISMISSED_KEY), aiOpened: read(AI_KEY) }
}
