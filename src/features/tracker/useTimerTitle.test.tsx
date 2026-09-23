import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { RunningTimer } from '../../domain/types'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import { useTimerTitle } from './useTimerTitle'

const alice = { login: 'alice', avatarUrl: null }
const bob = { login: 'bob', avatarUrl: null }

function timer(login: string, msAgo: number): RunningTimer {
  const start = new Date(Date.now() - msAgo).toISOString()
  return { id: `t-${login}`, login, start, description: '', projectId: null, tagIds: [] }
}

function Probe() {
  useTimerTitle()
  return null
}

async function setup(timers: RunningTimer[]) {
  const files: Record<string, unknown> = {}
  for (const t of timers) files[`timers/${t.login}.json`] = t
  const adapter = createMemoryAdapter(alice, {
    store: new MemoryFileStore(files),
    collaborators: [alice, bob],
    admins: ['alice'],
  })
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = await renderWithSession(<Probe />, adapter, qc)
  return { adapter, view, qc }
}

describe('timer in the tab title', () => {
  afterEach(() => {
    document.title = 'Workaddict'
  })

  it('shows the elapsed time of the own running timer', async () => {
    document.title = 'Normal'
    await setup([timer('alice', (3600 + 23 * 60 + 45) * 1000)])
    await waitFor(() => expect(document.title).toMatch(/^▶ 1:23:4\d · Workaddict$/))
  })

  it('restores the title when the timer stops and on unmount', async () => {
    document.title = 'Normal'
    const { adapter, view, qc } = await setup([timer('alice', 60_000)])
    await waitFor(() => expect(document.title).toMatch(/^▶ /))

    await act(async () => {
      await adapter.stopTimer()
      await qc.invalidateQueries()
    })
    await waitFor(() => expect(document.title).toBe('Normal'))

    await adapter.startTimer({ description: '', projectId: null, tagIds: [] })
    await act(async () => {
      await qc.invalidateQueries()
    })
    await waitFor(() => expect(document.title).toMatch(/^▶ /))
    view.unmount()
    expect(document.title).toBe('Normal')
  })

  it("ignores another member's timer", async () => {
    document.title = 'Normal'
    await setup([timer('bob', 60_000)])
    await act(async () => {})
    expect(document.title).toBe('Normal')
  })
})
