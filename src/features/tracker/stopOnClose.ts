import { useSyncExternalStore } from 'react'
import type { RunningTimer } from '../../domain/types'

/**
 * "Stop timer when I close the page": device-local state. The stop itself happens on the next
 * open (a closing page cannot finish the GitHub writes), after asking the user.
 */

const SETTING_KEY = 'workaddict.stopOnClose'
const DEVICE_KEY = 'workaddict.timerDevice'
/**
 * After a reload or back/forward, only a gap longer than this counts as "left". A page opened anew
 * (new tab, typed address, bookmark) with no other Workaddict page open counts as left at once.
 */
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

/** The key for a session's timer record: its data repository, or `demo`. */
export function timerDeviceKey(
  session: { mode: 'demo' } | { mode: 'github'; repo: string },
): string {
  return session.mode === 'github' ? session.repo : 'demo'
}

/** Per data repository (lowercase), so timers in two profiles don't overwrite each other. */
type TimerDevices = Record<string, TimerDevice>

function parseDevice(v: unknown): TimerDevice | null {
  const d = v as Partial<TimerDevice> | null
  return d && typeof d.timerId === 'string' ? { timerId: d.timerId, keep: d.keep === true } : null
}

function readDevices(): TimerDevices | null {
  const raw = read(DEVICE_KEY)
  if (!raw) return {}
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== 'object') return {}
    // The single-object form of earlier versions; it belongs to the first repository asking.
    if (typeof (v as Partial<TimerDevice>).timerId === 'string') return null
    const out: TimerDevices = {}
    for (const [repo, d] of Object.entries(v as Record<string, unknown>)) {
      const device = parseDevice(d)
      if (device) out[repo] = device
    }
    return out
  } catch {
    return {}
  }
}

function writeDevice(repo: string, device: TimerDevice) {
  const devices = readDevices() ?? {}
  write(DEVICE_KEY, JSON.stringify({ ...devices, [repo.toLowerCase()]: device }))
}

export function readTimerDevice(repo: string): TimerDevice | null {
  const key = repo.toLowerCase()
  const devices = readDevices()
  if (devices) return devices[key] ?? null
  // Migrate the legacy record to this repository.
  let legacy: TimerDevice | null = null
  try {
    legacy = parseDevice(JSON.parse(read(DEVICE_KEY) ?? 'null'))
  } catch {
    // unreadable
  }
  write(DEVICE_KEY, legacy ? JSON.stringify({ [key]: legacy }) : null)
  return legacy
}

/** Remembers that this device started the timer, so only this device asks about it. */
export function recordTimerStart(repo: string, timerId: string) {
  writeDevice(repo, { timerId, keep: false })
}

export function keepTimerRunning(repo: string, timerId: string) {
  writeDevice(repo, { timerId, keep: true })
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
  /** This page was loaded by a reload or back/forward. */
  reloaded: boolean
  now: number
}

/** Returns the time the device was left when the user should be asked, else null. */
export function closedTimerSince(i: CloseCheckInput): number | null {
  if (!i.enabled || i.demo || i.readOnly || !i.timer || i.timer.id === 'pending') return null
  if (!i.device || i.device.keep || i.device.timerId !== i.timer.id) return null
  if (i.othersOpen || i.lastAlive === null) return null
  if (i.reloaded && i.now - i.lastAlive <= CLOSED_AFTER_MS) return null
  return Math.max(i.lastAlive, new Date(i.timer.start).getTime())
}
