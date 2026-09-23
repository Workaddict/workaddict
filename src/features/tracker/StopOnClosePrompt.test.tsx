import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { RunningTimer } from '../../domain/types'
import type { Session } from '../auth/session'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import type { PresenceSnapshot } from './presence'
import { recordTimerStart, readTimerDevice, setStopOnClose } from './stopOnClose'
import { StopOnClosePrompt } from './StopOnClosePrompt'

const alice = { login: 'alice', avatarUrl: null }
const github: Session = { mode: 'github', token: 'x', repo: 'team/time-data', branch: 'main' }
const HOUR = 3_600_000

function timer(start: number): RunningTimer {
  return {
    id: 't1',
    login: 'alice',
    start: new Date(start).toISOString(),
    description: 'Design review',
    projectId: null,
    tagIds: [],
  }
}

async function setup(opts: {
  presence: PresenceSnapshot
  startedHere?: boolean
  session?: Session
  running?: boolean
}) {
  const start = Date.now() - 10 * HOUR
  const files: Record<string, unknown> = opts.running === false ? {} : { 'timers/alice.json': timer(start) }
  const adapter = createMemoryAdapter(alice, {
    store: new MemoryFileStore(files),
    collaborators: [alice],
    admins: ['alice'],
  })
  if (opts.startedHere !== false) recordTimerStart('t1')
  await renderWithSession(
    <StopOnClosePrompt presence={Promise.resolve(opts.presence)} />,
    adapter,
    undefined,
    opts.session ?? github,
  )
  await act(async () => {})
  return { adapter, start }
}

const leftHoursAgo = (h: number): PresenceSnapshot => ({
  lastAlive: Date.now() - h * HOUR,
  othersOpen: false,
})

describe('stop on page close', () => {
  afterEach(() => localStorage.clear())

  it('asks and stops at the time the page was closed', async () => {
    const presence = leftHoursAgo(2)
    const { adapter } = await setup({ presence })
    expect(await screen.findByRole('dialog', { name: 'Your timer is still running' })).toBeTruthy()
    expect(screen.getByText(/“Design review” was still running/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /^Stop at / }))
    await waitFor(async () => expect(await adapter.getTimer()).toBeNull())
    const [entry] = await adapter.listAllEntries()
    expect(entry?.end).toBe(new Date(presence.lastAlive!).toISOString())
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps running and does not ask again for this timer', async () => {
    const { adapter } = await setup({ presence: leftHoursAgo(2) })
    fireEvent.click(await screen.findByRole('button', { name: 'Keep running' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(await adapter.getTimer()).not.toBeNull()
    expect(readTimerDevice()).toEqual({ timerId: 't1', keep: true })
  })

  it('stops now', async () => {
    const presence = leftHoursAgo(2)
    const { adapter } = await setup({ presence })
    const before = Date.now()
    fireEvent.click(await screen.findByRole('button', { name: 'Stop now' }))
    await waitFor(async () => expect(await adapter.getTimer()).toBeNull())
    const [entry] = await adapter.listAllEntries()
    expect(new Date(entry!.end).getTime()).toBeGreaterThanOrEqual(before - 1000)
  })

  it('does not ask after a reload', async () => {
    await setup({ presence: { lastAlive: Date.now() - 5_000, othersOpen: false } })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('does not ask while another tab is open', async () => {
    await setup({ presence: { ...leftHoursAgo(1), othersOpen: true } })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('does not ask about a timer started on another device', async () => {
    await setup({ presence: leftHoursAgo(24), startedHere: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('does not ask when the setting is off', async () => {
    setStopOnClose(false)
    await setup({ presence: leftHoursAgo(1) })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('does not ask in demo mode or without a running timer', async () => {
    await setup({ presence: leftHoursAgo(1), session: { mode: 'demo' } })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('creates no second entry when the timer was stopped elsewhere meanwhile', async () => {
    const { adapter } = await setup({ presence: leftHoursAgo(2) })
    await screen.findByRole('dialog')
    await adapter.stopTimer()
    fireEvent.click(screen.getByRole('button', { name: /^Stop at / }))
    expect(await screen.findByText('This timer was already stopped on another device.')).toBeTruthy()
    expect(await adapter.listAllEntries()).toHaveLength(1)
  })
})
