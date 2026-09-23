import { useSyncExternalStore } from 'react'
import type { TimeFormat } from './domain/time'

/** Clock format per device: 24-hour by default, 12-hour (AM/PM) on request. */
const KEY = 'workaddict.timeFormat'
const listeners = new Set<() => void>()

function read(): TimeFormat {
  try {
    return localStorage.getItem(KEY) === '12h' ? '12h' : '24h'
  } catch {
    return '24h'
  }
}

let current: TimeFormat = read()

export function getTimeFormat(): TimeFormat {
  return current
}

export function setTimeFormat(f: TimeFormat) {
  current = f
  try {
    if (f === '24h') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, f)
  } catch {
    // storage unavailable: choice lasts for this session only
  }
  listeners.forEach((l) => l())
}

export function useTimeFormat(): TimeFormat {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
}

/**
 * Text input attributes for a clock time. A native `type="time"` input follows the browser's
 * locale, not the app's 24h/12h setting, so times are typed as text and parsed leniently.
 */
export function timeInputAttrs(f: TimeFormat) {
  return {
    type: 'text',
    autoComplete: 'off',
    spellCheck: false,
    // 24h needs only digits and a separator; 12h also needs "am"/"pm".
    inputMode: f === '12h' ? 'text' : 'decimal',
    placeholder: f === '12h' ? '9:00 AM' : '09:00',
  } as const
}
