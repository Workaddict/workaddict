import { useSyncExternalStore } from 'react'
import type { RunningTimer } from '../../domain/types'

/**
 * "Stop timer when I close the page": device-local state. The stop itself happens on the next
 * open (a closing page cannot finish the GitHub writes), after asking the user.
 */

const SETTING_KEY = 'workaddict.stopOnClose'
const DEVICE_KEY = 'workaddict.timerDevice'
/** Closed for longer than this counts as "left"; shorter gaps are reloads and navigation. */
export const CLOSED_AFTER_MS = 2 * 60_000

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // storage unavailable: the feature silently does nothing
  }
}

// ---- setting (on by default) ------------------------------------------------

const listeners = new Set<() => void>()

export function getStopOnClose(): boolean {
  return read(SETTING_KEY) !== '0'
}

export function setStopOnClose(on: boolean) {
  write(SETTING_KEY, on ? null : '0')
  listeners.forEach((l) => l())
}

export function useStopOnClose(): boolean {
  return useSyncExternalStore((cb) => {
    listeners.add(cb)
    return () => listeners.delete(cb)
  }, getStopOnClose)
}

// ---- timer started on this device ------------------------------------------

interface TimerDevice {
  timerId: string
  /** The user chose "Keep running" for this timer. */
  keep: boolean
}

export function readTimerDevice(): TimerDevice | null {
  const raw = read(DEVICE_KEY)
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Partial<TimerDevice>
    return typeof v.timerId === 'string' ? { timerId: v.timerId, keep: v.keep === true } : null
  } catch {
    return null
  }
}

/** Remembers that this device started the timer, so only this device asks about it. */
export function recordTimerStart(timerId: string) {
  write(DEVICE_KEY, JSON.stringify({ timerId, keep: false } satisfies TimerDevice))
}

export function keepTimerRunning(timerId: string) {
  write(DEVICE_KEY, JSON.stringify({ timerId, keep: true } satisfies TimerDevice))
}

// ---- decision ----------------------------------------------------------------

export interface CloseCheckInput {
  enabled: boolean
  demo: boolean
  readOnly: boolean
  timer: RunningTimer | null
  device: TimerDevice | null
  /** Last time a Workaddict page was alive on this device, before this page loaded. */
  lastAlive: number | null
  /** Another Workaddict page on this device was still open when this one loaded. */
  othersOpen: boolean
  now: number
}

/** Returns the time the device was left when the user should be asked, else null. */
export function closedTimerSince(i: CloseCheckInput): number | null {
  if (!i.enabled || i.demo || i.readOnly || !i.timer || i.timer.id === 'pending') return null
  if (!i.device || i.device.keep || i.device.timerId !== i.timer.id) return null
  if (i.othersOpen || i.lastAlive === null) return null
  if (i.now - i.lastAlive <= CLOSED_AFTER_MS) return null
  return Math.max(i.lastAlive, new Date(i.timer.start).getTime())
}
