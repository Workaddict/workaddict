import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { addDays, format, setHours, startOfDay } from 'date-fns'
import { describe, expect, it, vi } from 'vitest'
import type { Member, RunningTimer } from '../../domain/types'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import { TeamNow } from './TeamNow'
import { TrackerPage } from './TrackerPage'

const alice = { login: 'alice', avatarUrl: null } // owner → team leader
const bob = { login: 'bob', avatarUrl: null }
const carol = { login: 'carol', avatarUrl: null }

function timer(login: string, start: Date, description: string): RunningTimer {
  return { id: `t-${login}`, login, start: start.toISOString(), description, projectId: null, tagIds: [] }
}

function setup(me: Member, timers: RunningTimer[]) {
  const files: Record<string, unknown> = {}
  for (const t of timers) files[`timers/${t.login}.json`] = t
  const store = new MemoryFileStore(files)
  const adapter = createMemoryAdapter(me, {
    store,
    collaborators: [alice, bob, carol],
    admins: ['alice'],
  })
  return { adapter }
}

describe('team now block', () => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )

  it('is hidden from workers', async () => {
    const { adapter } = setup(bob, [timer('carol', new Date(Date.now() - 60_000), 'Review')])
    await renderWithSession(<TrackerPage />, adapter)
    await screen.findByRole('heading', { name: 'Tracker' })
    await act(async () => {})
    expect(screen.queryByRole('heading', { name: 'Team now' })).toBeNull()
  })

  it('is shown to team leaders on the tracker page', async () => {
    const { adapter } = setup(alice, [])
    await renderWithSession(<TrackerPage />, adapter)
    expect(await screen.findByRole('heading', { name: 'Team now' })).toBeTruthy()
  })

  it('lists running members first, longest first, then idle members, without me', async () => {
    const { adapter } = setup(alice, [
      timer('bob', new Date(Date.now() - 10 * 60_000), 'Short task'),
      timer('carol', new Date(Date.now() - 60 * 60_000), 'Long task'),
    ])
    await renderWithSession(<TeamNow />, adapter)
    await screen.findByText('Long task')
    const logins = [...document.querySelectorAll('.team-login')].map((n) => n.textContent)
    expect(logins).toEqual(['carol', 'bob'])
    expect(screen.getByText('2 tracking')).toBeTruthy()
  })

  it('stops a member timer at the chosen end and attributes the entry', async () => {
    const start = new Date(Date.now() - 42 * 60_000)
    const { adapter } = setup(alice, [timer('bob', start, 'Review PR')])
    await renderWithSession(<TeamNow />, adapter)
    fireEvent.click(await screen.findByRole('button', { name: "Stop bob's timer" }))
    const dialog = screen.getByRole('dialog')
    const setEnd = (d: Date) => {
      fireEvent.change(within(dialog).getByLabelText('Date'), {
        target: { value: format(d, 'yyyy-MM-dd') },
      })
      fireEvent.change(within(dialog).getByLabelText('End'), { target: { value: format(d, 'HH:mm') } })
    }

    setEnd(new Date(start.getTime() - 60 * 60_000))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Stop' }))
    expect(within(dialog).getByRole('alert').textContent).toMatch(/after the start/)

    setEnd(new Date(start.getTime() + 30 * 60_000))
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Stop' }))
    })
    await waitFor(async () => expect(await adapter.listAllEntries()).toHaveLength(1))
    const [entry] = await adapter.listAllEntries()
    expect(entry).toMatchObject({ login: 'bob', description: 'Review PR', stoppedBy: 'alice' })
    expect(await adapter.listTimers()).toEqual([])
  })

  it('suggests start + 8h for a timer forgotten since yesterday', async () => {
    const start = setHours(addDays(startOfDay(new Date()), -1), 9)
    const { adapter } = setup(alice, [timer('carol', start, 'Support')])
    await renderWithSession(<TeamNow />, adapter)
    expect(await screen.findByText('Running for a long time')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: "Stop carol's timer" }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Was it forgotten/)).toBeTruthy()
    expect((within(dialog).getByLabelText('Date') as HTMLInputElement).value).toBe(
      format(start, 'yyyy-MM-dd'),
    )
    expect((within(dialog).getByLabelText('End') as HTMLInputElement).value).toBe('17:00')
  })
})
