import { useSyncExternalStore } from 'react'

// One shared 1-second ticker for every running clock on the page.
const listeners = new Set<() => void>()
let now = Date.now()
let interval: ReturnType<typeof setInterval> | undefined

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!interval) {
    now = Date.now()
    interval = setInterval(() => {
      now = Date.now()
      listeners.forEach((l) => l())
    }, 1000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(interval)
      interval = undefined
    }
  }
}

const noop = () => () => {}

/** Current time, updating every second while `active`. */
export function useNow(active = true): number {
  return useSyncExternalStore(active ? subscribe : noop, () => (active ? now : 0))
}
