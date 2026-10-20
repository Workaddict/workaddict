import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { APP_VERSION } from '../../app/about'
import { useIsExpert } from '../../hintLevel'
import { useI18n } from '../../i18n'

/**
 * Features that get a "New" dot, with the app version that added them. A dot shows only on
 * devices that first opened the app in an earlier version, so new users see none.
 */
export const NEW_FEATURES = {
  'project-board': '1.1.0',
  'help-guide': '1.1.0',
} as const
export type FeatureId = keyof typeof NEW_FEATURES

const FIRST_KEY = 'workaddict.firstVersion'
const SEEN_KEY = 'workaddict.seenFeatures'
/** Devices that used the app before versions were recorded. */
const UNRECORDED = '1.0.0'

/** -1, 0 or 1, comparing dotted version numbers. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d) return Math.sign(d)
  }
  return 0
}

let appVersion = APP_VERSION
let firstVersion = APP_VERSION
let seen = new Set<string>()
const listeners = new Set<() => void>()

/**
 * Records the version in which this device first opened the app. Call once at startup, before
 * anything else writes to storage: other Workaddict keys mean the app was used before.
 */
export function initFirstVersion() {
  try {
    let v = localStorage.getItem(FIRST_KEY)
    if (!v) {
      const usedBefore = Object.keys(localStorage).some((k) => k.startsWith('workaddict.'))
      v = usedBefore ? UNRECORDED : APP_VERSION
      localStorage.setItem(FIRST_KEY, v)
    }
    firstVersion = v
    seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[])
  } catch {
    // storage unavailable: no dots
    firstVersion = APP_VERSION
  }
}

export function isNew(id: FeatureId): boolean {
  const since = NEW_FEATURES[id]
  return (
    !seen.has(id) &&
    compareVersions(since, firstVersion) > 0 &&
    compareVersions(since, appVersion) <= 0
  )
}

export function markSeen(id: FeatureId) {
  if (seen.has(id)) return
  seen = new Set(seen).add(id)
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))
  } catch {
    // storage unavailable: seen for this page view only
  }
  listeners.forEach((l) => l())
}

/**
 * A small "New" dot. It counts as seen once the user clicks or focuses its surrounding control
 * (`interact`) or once it was on screen (`view`, for headings); a dot seen on screen stays until
 * the next page view, so the user notices it.
 */
export function NewDot({
  feature,
  seenOn = 'interact',
}: {
  feature: FeatureId
  seenOn?: 'interact' | 'view'
}) {
  const { t } = useI18n()
  const expert = useIsExpert()
  const ref = useRef<HTMLSpanElement>(null)
  const fresh = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => isNew(feature),
  )
  // Keep showing a dot seen on screen until the next page view.
  const [shown] = useState(fresh)
  const visible = !expert && (seenOn === 'view' ? shown : fresh)

  useEffect(() => {
    const el = ref.current
    if (!el || !fresh) return
    if (seenOn === 'view') {
      if (typeof IntersectionObserver === 'undefined') return
      const obs = new IntersectionObserver((items) => {
        if (items.some((i) => i.isIntersecting)) markSeen(feature)
      })
      obs.observe(el)
      return () => obs.disconnect()
    }
    const parent = el.parentElement
    const seenNow = () => markSeen(feature)
    parent?.addEventListener('click', seenNow)
    parent?.addEventListener('focusin', seenNow)
    return () => {
      parent?.removeEventListener('click', seenNow)
      parent?.removeEventListener('focusin', seenNow)
    }
  }, [feature, fresh, seenOn, visible])

  if (!visible) return null
  return <span ref={ref} className="new-dot" role="img" aria-label={t('help.new')} />
}

/** Test helper: the first and current app version, and the features already seen. */
export function setVersionsForTests(first: string, app = APP_VERSION, seenIds: string[] = []) {
  firstVersion = first
  appVersion = app
  seen = new Set(seenIds)
  listeners.forEach((l) => l())
}
