import { afterEach, describe, expect, it } from 'vitest'
import type { RunningTimer } from '../../domain/types'
import {
  closedTimerSince,
  getStopOnClose,
  keepTimerRunning,
  readTimerDevice,
  recordTimerStart,
  setStopOnClose,
  type CloseCheckInput,
} from './stopOnClose'

const START = new Date(2026, 8, 22, 9, 0).getTime()
const LEFT = new Date(2026, 8, 22, 17, 32).getTime()
const NOW = new Date(2026, 8, 23, 8, 0).getTime()
const timer: RunningTimer = {
  id: 't1',
  login: 'alice',
  start: new Date(START).toISOString(),
  description: '',
  projectId: null,
  tagIds: [],
}

function input(patch: Partial<CloseCheckInput> = {}): CloseCheckInput {
  return {
    enabled: true,
    demo: false,
    readOnly: false,
    timer,
    device: { timerId: 't1', keep: false },
    lastAlive: LEFT,
    othersOpen: false,
    now: NOW,
    ...patch,
  }
}

describe('closedTimerSince', () => {
  it('returns the time the device was left', () => {
    expect(closedTimerSince(input())).toBe(LEFT)
  })

  it('never returns a time before the timer start', () => {
    expect(closedTimerSince(input({ lastAlive: START - 60_000 }))).toBe(START)
  })

  it('does not ask after a reload (short gap)', () => {
    expect(closedTimerSince(input({ lastAlive: NOW - 60_000 }))).toBeNull()
  })

  it('does not ask while another page is open', () => {
    expect(closedTimerSince(input({ othersOpen: true }))).toBeNull()
  })

  it('does not ask about a timer started on another device', () => {
    expect(closedTimerSince(input({ device: { timerId: 'other', keep: false } }))).toBeNull()
    expect(closedTimerSince(input({ device: null }))).toBeNull()
  })

  it('does not ask again after "Keep running"', () => {
    expect(closedTimerSince(input({ device: { timerId: 't1', keep: true } }))).toBeNull()
  })

  it('does not ask when off, in demo mode, read-only, pending or without a timer', () => {
    expect(closedTimerSince(input({ enabled: false }))).toBeNull()
    expect(closedTimerSince(input({ demo: true }))).toBeNull()
    expect(closedTimerSince(input({ readOnly: true }))).toBeNull()
    expect(closedTimerSince(input({ timer: { ...timer, id: 'pending' } }))).toBeNull()
    expect(closedTimerSince(input({ timer: null }))).toBeNull()
    expect(closedTimerSince(input({ lastAlive: null }))).toBeNull()
  })
})

describe('device state', () => {
  afterEach(() => localStorage.clear())

  it('is on by default and remembers "off"', () => {
    expect(getStopOnClose()).toBe(true)
    setStopOnClose(false)
    expect(getStopOnClose()).toBe(false)
    setStopOnClose(true)
    expect(getStopOnClose()).toBe(true)
  })

  it('records the started timer and "Keep running"', () => {
    expect(readTimerDevice()).toBeNull()
    recordTimerStart('t1')
    expect(readTimerDevice()).toEqual({ timerId: 't1', keep: false })
    keepTimerRunning('t1')
    expect(readTimerDevice()).toEqual({ timerId: 't1', keep: true })
    recordTimerStart('t2')
    expect(readTimerDevice()).toEqual({ timerId: 't2', keep: false })
  })
})
