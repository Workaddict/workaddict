import { useSyncExternalStore } from 'react'

export type ThemePref = 'system' | 'light' | 'dark'
const KEY = 'workaddict.theme'
const listeners = new Set<() => void>()

function read(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

let current: ThemePref = read()

export function applyTheme(pref: ThemePref = current) {
  const root = document.documentElement
  if (pref === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', pref)
}

export function setTheme(pref: ThemePref) {
  current = pref
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {
    // storage unavailable
  }
  applyTheme(pref)
  listeners.forEach((l) => l())
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
}

export type ResolvedTheme = 'light' | 'dark'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function systemTheme(): ResolvedTheme {
  return typeof window !== 'undefined' && window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
}

/** The theme actually rendered: the explicit preference, or the OS setting for "system". */
export function resolveTheme(pref: ThemePref = current): ResolvedTheme {
  return pref === 'system' ? systemTheme() : pref
}

/** Switches to the opposite of the rendered theme and remembers it explicitly. */
export function toggleTheme() {
  setTheme(resolveTheme() === 'dark' ? 'light' : 'dark')
}

export function useResolvedTheme(): ResolvedTheme {
  const pref = useThemePref()
  const system = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia?.(DARK_QUERY)
      mq?.addEventListener('change', cb)
      return () => mq?.removeEventListener('change', cb)
    },
    systemTheme,
  )
  return pref === 'system' ? system : pref
}
