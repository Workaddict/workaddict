import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RunningTimer } from '../../domain/types'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import { setTimeFormat } from '../../timeFormat'
import { readTimerDevice } from './stopOnClose'
import { TimerBar } from './TimerBar'

const alice = { login: 'alice', avatarUrl: null }
const at = (h: number, m = 0) => new Date(2026, 8, 23, h, m)

async function setup(start: Date) {
  const timer: RunningTimer = {
    id: 't1',
    login: 'alice',
    start: start.toISOString(),
    description: 'Design review',
    projectId: null,
    tagIds: [],
  }
  const adapter = createMemoryAdapter(alice, {
    store: new MemoryFileStore({ 'timers/alice.json': timer }),
    collaborators: [alice],
    admins: ['alice'],
  })
  await renderWithSession(<TimerBar />, adapter)
  return { adapter }
}

async function editStart(value: string, key: 'Enter' | 'Escape' = 'Enter') {
  fireEvent.click(await screen.findByRole('button', { name: 'Edit start time' }))
  const input = screen.getByLabelText('Edit start time')
  fireEvent.change(input, { target: { value } })
  await act(async () => {
    fireEvent.keyDown(input, { key })
  })
  return input
}

describe('editing the start of a running timer', () => {
  afterEach(() => {
    vi.useRealTimers()
    setTimeFormat('24h')
  })

  it('saves a new start time', async () => {
    vi.useFakeTimers({ now: at(10), toFake: ['Date'] })
    const { adapter } = await setup(at(9, 12))
    expect(await screen.findByText('09:12')).toBeTruthy()
    await editStart('08:45')
    await waitFor(async () =>
      expect((await adapter.getTimer())?.start).toBe(at(8, 45).toISOString()),
    )
  })

  it('shows and accepts 12-hour times when chosen', async () => {
    setTimeFormat('12h')
    vi.useFakeTimers({ now: at(10), toFake: ['Date'] })
    const { adapter } = await setup(at(9, 12))
    fireEvent.click(await screen.findByRole('button', { name: 'Edit start time' }))
    expect((screen.getByLabelText('Edit start time') as HTMLInputElement).value).toBe('9:12 AM')
    fireEvent.keyDown(screen.getByLabelText('Edit start time'), { key: 'Escape' })
    await editStart('8:45 am')
    await waitFor(async () =>
      expect((await adapter.getTimer())?.start).toBe(at(8, 45).toISOString()),
    )
  })

  it('cancels with Escape', async () => {
    vi.useFakeTimers({ now: at(10), toFake: ['Date'] })
    const { adapter } = await setup(at(9, 12))
    await editStart('08:45', 'Escape')
    expect((await adapter.getTimer())?.start).toBe(at(9, 12).toISOString())
  })

  it('rejects a start in the future and keeps the typed value', async () => {
    vi.useFakeTimers({ now: at(10), toFake: ['Date'] })
    const { adapter } = await setup(at(9, 12))
    const input = await editStart('10:30')
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'The start cannot be in the future.',
    )
    expect((input as HTMLInputElement).value).toBe('10:30')
    expect((await adapter.getTimer())?.start).toBe(at(9, 12).toISOString())
  })
})

describe('starting a timer', () => {
  it('remembers that this device started it', async () => {
    localStorage.clear()
    const adapter = createMemoryAdapter(alice, {
      store: new MemoryFileStore(),
      collaborators: [alice],
      admins: ['alice'],
    })
    await renderWithSession(<TimerBar />, adapter)
    fireEvent.click(await screen.findByRole('button', { name: 'Start' }))
    await waitFor(async () => expect(await adapter.getTimer()).not.toBeNull())
    const timer = await adapter.getTimer()
    await waitFor(() => expect(readTimerDevice()).toEqual({ timerId: timer!.id, keep: false }))
    localStorage.clear()
  })
})
