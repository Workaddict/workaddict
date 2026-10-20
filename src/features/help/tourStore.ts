import { useSyncExternalStore } from 'react'

/**
 * Tour and welcome state. Whether the tour is running lives in memory; what the user chose in
 * the welcome dialog is remembered per device (`workaddict.tour`). The demo keeps its own
 * in-memory choice, so trying the demo does not affect the welcome dialog of a real sign-in.
 */

export type WelcomeStatus = 'new' | 'later' | 'done' | 'declined'
export interface WelcomeState {
  status: WelcomeStatus
  /** How often "Later" was chosen; the second time counts as "No thanks". */
  laterCount: number
  /** Marked as an existing user when the update arrived: no welcome dialog, no checklist. */
  existing?: boolean
  /** "Later" was chosen in this page view: don't ask again until the next app load. */
  askedThisLoad?: boolean
}

const KEY = 'workaddict.tour'
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function readStored(): WelcomeState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const v = JSON.parse(raw) as Partial<WelcomeState>
      if (v.status && ['new', 'later', 'done', 'declined'].includes(v.status))
        return { status: v.status, laterCount: Number(v.laterCount) || 0, existing: !!v.existing }
    }
  } catch {
    // storage unavailable or damaged: treat as a new device
  }
  return { status: 'new', laterCount: 0 }
}

let real: WelcomeState = readStored()
let demo: WelcomeState = { status: 'new', laterCount: 0 }

function save() {
  try {
    const { status, laterCount, existing } = real
    localStorage.setItem(KEY, JSON.stringify({ status, laterCount, existing }))
  } catch {
    // storage unavailable: the choice lasts for this page view only
  }
}

export function getWelcome(isDemo: boolean): WelcomeState {
  return isDemo ? demo : real
}

export function setWelcome(isDemo: boolean, next: WelcomeState) {
  if (isDemo) demo = next
  else {
    real = next
    save()
  }
  emit()
}

export function useWelcome(isDemo: boolean): WelcomeState {
  return useSyncExternalStore(subscribe, () => getWelcome(isDemo))
}

/**
 * "Show tips again": the welcome dialog appears on the next app load (as after "Later", which
 * skips the existing-user check) and the checklist is no longer hidden for existing users.
 */
export function resetWelcome() {
  real = { status: 'later', laterCount: 0, askedThisLoad: true }
  save()
  emit()
}

// ---- running tour -------------------------------------------------------------

export interface TourRun {
  running: boolean
  index: number
}
let run: TourRun = { running: false, index: 0 }
/** Set by "Demo with tour" before the demo session exists; the demo layout starts the tour. */
let pendingStart = false

export function startTour() {
  run = { running: true, index: 0 }
  emit()
}

export function setTourIndex(index: number) {
  run = { ...run, index }
  emit()
}

export function endTour() {
  run = { running: false, index: 0 }
  emit()
}

export function useTourRun(): TourRun {
  return useSyncExternalStore(subscribe, () => run)
}

export function requestTourAfterSignIn() {
  pendingStart = true
}

/** True once after "Demo with tour": the layout starts the tour on mount. */
export function takePendingTour(): boolean {
  const v = pendingStart
  pendingStart = false
  return v
}

/** Test helper: forget everything. */
export function resetTourForTests() {
  real = readStored()
  demo = { status: 'new', laterCount: 0 }
  run = { running: false, index: 0 }
  pendingStart = false
  emit()
}
