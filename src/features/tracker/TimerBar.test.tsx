import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
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
    await waitFor(() =>
      expect(readTimerDevice('demo')).toEqual({ timerId: timer!.id, keep: false }),
    )
    localStorage.clear()
  })
})

describe('switching between timer and manual mode', () => {
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  const desc = () => screen.getByLabelText('What are you working on?') as HTMLInputElement
  const tab = (name: 'Timer' | 'Manual') => fireEvent.click(screen.getByRole('button', { name }))

  async function setupIdle() {
    const adapter = createMemoryAdapter(alice, {
      store: new MemoryFileStore(),
      collaborators: [alice],
      admins: ['alice'],
    })
    await renderWithSession(<TimerBar />, adapter)
    return { adapter }
  }

  async function switchToManual() {
    tab('Manual')
    await waitFor(() => expect(desc().value).toBe('Design review'))
  }

  async function stopAndSave() {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop & save' }))
    })
  }

  it('keeps the description from timer to manual and back, but not manual times', async () => {
    localStorage.clear()
    await setupIdle()
    fireEvent.change(desc(), { target: { value: 'Review' } })
    tab('Manual')
    expect(desc().value).toBe('Review')
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '13:00' } })
    tab('Timer')
    expect(desc().value).toBe('Review')
    tab('Manual')
    expect((screen.getByLabelText('Start') as HTMLInputElement).value).toBe('')
  })

  it('clears the draft after starting the timer', async () => {
    localStorage.clear()
    const { adapter } = await setupIdle()
    fireEvent.change(desc(), { target: { value: 'Review' } })
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    await waitFor(async () => expect((await adapter.getTimer())?.description).toBe('Review'))
    const stop = await screen.findByRole('button', { name: 'Stop' })
    await waitFor(() => expect(stop).not.toBeDisabled())
    fireEvent.click(stop)
    await screen.findByRole('button', { name: 'Start' })
    expect(desc().value).toBe('')
    tab('Manual')
    expect(desc().value).toBe('')
  })

  it('clears the draft after adding a manual entry', async () => {
    localStorage.clear()
    const { adapter } = await setupIdle()
    tab('Manual')
    fireEvent.change(desc(), { target: { value: 'Review' } })
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '13:00' } })
    fireEvent.change(screen.getByLabelText('End'), { target: { value: '14:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    await waitFor(() => expect(desc().value).toBe(''))
    expect(await adapter.listAllEntries()).toHaveLength(1)
    tab('Timer')
    expect(desc().value).toBe('')
  })

  it('stops a running timer with corrected times', async () => {
    vi.useFakeTimers({ now: at(10, 40), toFake: ['Date'] })
    const { adapter } = await setup(at(9))
    await switchToManual()
    expect((screen.getByLabelText('Start') as HTMLInputElement).value).toBe('09:00')
    expect((screen.getByLabelText('End') as HTMLInputElement).value).toBe('10:40')
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '08:50' } })
    fireEvent.change(screen.getByLabelText('End'), { target: { value: '10:30' } })
    await stopAndSave()
    await waitFor(async () => expect(await adapter.getTimer()).toBeNull())
    const entries = await adapter.listAllEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      description: 'Design review',
      start: at(8, 50).toISOString(),
      end: at(10, 30).toISOString(),
    })
  })

  it('ends the entry when manual mode was opened', async () => {
    vi.useFakeTimers({ now: at(10, 40), toFake: ['Date'] })
    const { adapter } = await setup(at(9))
    await switchToManual()
    vi.setSystemTime(at(10, 45))
    await stopAndSave()
    await waitFor(async () => expect(await adapter.getTimer()).toBeNull())
    const [entry] = await adapter.listAllEntries()
    expect(entry).toMatchObject({ start: at(9).toISOString(), end: at(10, 40).toISOString() })
  })

  it('keeps the timer running with edited fields when leaving manual mode', async () => {
    vi.useFakeTimers({ now: at(10, 40), toFake: ['Date'] })
    const { adapter } = await setup(at(9))
    await switchToManual()
    fireEvent.change(desc(), { target: { value: 'Planning' } })
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '08:00' } })
    tab('Timer')
    await waitFor(async () => expect((await adapter.getTimer())?.description).toBe('Planning'))
    expect((await adapter.getTimer())?.start).toBe(at(9).toISOString())
    expect(await adapter.listAllEntries()).toHaveLength(0)
  })

  it('refuses invalid times and leaves the timer unchanged', async () => {
    vi.useFakeTimers({ now: at(10, 40), toFake: ['Date'] })
    const { adapter } = await setup(at(9))
    await switchToManual()
    fireEvent.click(screen.getByRole('button', { name: 'Enter duration instead' }))
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '25:00' } })
    await stopAndSave()
    expect(
      screen.getByText('The duration must be more than 0 and at most 24 hours.'),
    ).toBeInTheDocument()
    expect((await adapter.getTimer())?.start).toBe(at(9).toISOString())
    expect(await adapter.listAllEntries()).toHaveLength(0)
  })

  it('saves nothing when the timer was stopped elsewhere', async () => {
    vi.useFakeTimers({ now: at(10, 40), toFake: ['Date'] })
    const { adapter } = await setup(at(9))
    await switchToManual()
    await adapter.stopTimer(at(10))
    await stopAndSave()
    expect(
      await screen.findByText('This timer was already stopped on another device.'),
    ).toBeInTheDocument()
    const entries = await adapter.listAllEntries()
    expect(entries).toHaveLength(1)
    expect(entries[0]?.end).toBe(at(10).toISOString())
  })
})

describe('manual entries for other members', () => {
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  const bob = { login: 'bob', avatarUrl: null }
  const desc = () => screen.getByLabelText('What are you working on?') as HTMLInputElement
  const picker = () => screen.getByLabelText('For') as HTMLSelectElement

  async function setupAs(user: typeof alice, timer?: RunningTimer) {
    const adapter = createMemoryAdapter(user, {
      store: new MemoryFileStore(timer ? { [`timers/${timer.login}.json`]: timer } : {}),
      collaborators: [alice, bob],
      admins: ['alice'],
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await renderWithSession(<TimerBar />, adapter, queryClient)
    fireEvent.click(screen.getByRole('button', { name: 'Manual' }))
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    return { adapter }
  }

  async function addFor(login: string, start: string, end: string) {
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: start } })
    fireEvent.change(screen.getByLabelText('End'), { target: { value: end } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: `Add entry for ${login}` }))
    })
  }

  it('shows no member picker to workers', async () => {
    await setupAs(bob)
    expect(screen.queryByLabelText('For')).toBeNull()
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument()
  })

  it('adds an entry for the chosen member and keeps the choice for the next one', async () => {
    const { adapter } = await setupAs(alice)
    await waitFor(() => expect(picker()).toBeInTheDocument())
    fireEvent.change(picker(), { target: { value: 'bob' } })
    fireEvent.change(desc(), { target: { value: 'Client call' } })
    await addFor('bob', '09:00', '11:30')
    expect(await screen.findByText('Entry added for bob.')).toBeInTheDocument()
    const [entry] = await adapter.listAllEntries()
    expect(entry).toMatchObject({ login: 'bob', addedBy: 'alice', description: 'Client call' })
    expect(picker().value).toBe('bob')
    expect(desc().value).toBe('')
  })

  it("leaves the user's own running timer alone", async () => {
    vi.useFakeTimers({ now: at(10, 40), toFake: ['Date'] })
    const timer: RunningTimer = {
      id: 't1',
      login: 'alice',
      start: at(9).toISOString(),
      description: 'Design review',
      projectId: null,
      tagIds: [],
    }
    const { adapter } = await setupAs(alice, timer)
    await waitFor(() => expect(desc().value).toBe('Design review'))
    fireEvent.change(picker(), { target: { value: 'bob' } })
    expect(desc().value).toBe('')
    expect((screen.getByLabelText('Start') as HTMLInputElement).value).toBe('')
    await addFor('bob', '08:00', '09:00')
    await screen.findByText('Entry added for bob.')
    expect((await adapter.listAllEntries())[0]).toMatchObject({ login: 'bob' })
    expect(await adapter.getTimer()).toEqual(timer)

    fireEvent.change(picker(), { target: { value: 'alice' } })
    await waitFor(() => expect(desc().value).toBe('Design review'))
    expect(screen.getByRole('button', { name: 'Stop & save' })).toBeInTheDocument()
  })
})

describe('remembered choices', () => {
  afterEach(() => localStorage.clear())

  it('opens in manual mode with the duration input after a reload', async () => {
    const adapter = createMemoryAdapter(alice, {
      store: new MemoryFileStore(),
      collaborators: [alice],
      admins: ['alice'],
    })
    const first = await renderWithSession(<TimerBar />, adapter)
    fireEvent.click(screen.getByRole('button', { name: 'Manual' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enter duration instead' }))
    first.unmount()

    await renderWithSession(<TimerBar />, adapter)
    expect(screen.getByRole('button', { name: 'Manual' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Enter end time instead' })).toBeInTheDocument()
  })
})
