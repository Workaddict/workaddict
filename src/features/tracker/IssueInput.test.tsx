import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { RunningTimer, TimeEntry } from '../../domain/types'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import { EntryList } from './EntryList'
import { TimerBar } from './TimerBar'

const alice = { login: 'alice', avatarUrl: null }
const web = { id: 'p1', name: 'Website', color: '#4f46e5', archived: false, repos: ['acme/web'] }

async function seeded(files: Record<string, unknown> = {}) {
  const store = new MemoryFileStore(files)
  const adapter = createMemoryAdapter(alice, { store, collaborators: [alice], admins: ['alice'] })
  await adapter.init()
  await adapter.updateWorkspace((ws) => ({ ...ws, projects: [web] }), 'seed')
  return adapter
}

function timer(extra?: Partial<RunningTimer>): RunningTimer {
  return {
    id: 't1',
    login: 'alice',
    start: new Date(Date.now() - 3600_000).toISOString(),
    description: 'Login bug',
    projectId: 'p1',
    tagIds: [],
    ...extra,
  }
}

const issueInput = () => screen.getByLabelText('Issue') as HTMLInputElement

async function blur(input: HTMLElement) {
  await act(async () => {
    fireEvent.blur(input)
  })
}

afterEach(() => localStorage.clear())

describe('issue field in the timer bar', () => {
  it('starts a timer with a pasted issue URL, normalized', async () => {
    const adapter = await seeded()
    await renderWithSession(<TimerBar />, adapter)
    fireEvent.change(issueInput(), { target: { value: 'https://github.com/acme/web/pull/17#x' } })
    await blur(issueInput())
    expect(issueInput().value).toBe('acme/web#17')
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    await waitFor(async () => expect((await adapter.getTimer())?.issueRef).toBe('acme/web#17'))
  })

  it("resolves #42 through the running timer's project and keeps it on stop", async () => {
    const adapter = await seeded({ 'timers/alice.json': timer() })
    await renderWithSession(<TimerBar />, adapter)
    await screen.findByRole('button', { name: 'Stop' })
    fireEvent.change(issueInput(), { target: { value: '#42' } })
    await blur(issueInput())
    await waitFor(async () => expect((await adapter.getTimer())?.issueRef).toBe('acme/web#42'))
    const stop = screen.getByRole('button', { name: 'Stop' })
    await waitFor(() => expect(stop).not.toBeDisabled())
    fireEvent.click(stop)
    await waitFor(async () =>
      expect((await adapter.listAllEntries())[0]?.issueRef).toBe('acme/web#42'),
    )
  })

  it('removes the link when the field is cleared', async () => {
    const adapter = await seeded({ 'timers/alice.json': timer({ issueRef: 'acme/web#42' }) })
    await renderWithSession(<TimerBar />, adapter)
    await waitFor(() => expect(issueInput().value).toBe('acme/web#42'))
    fireEvent.change(issueInput(), { target: { value: '' } })
    await blur(issueInput())
    await waitFor(async () => expect(await adapter.getTimer()).not.toHaveProperty('issueRef'))
  })

  it('refuses a manual entry whose short issue has no repository to resolve through', async () => {
    const adapter = await seeded()
    await renderWithSession(<TimerBar />, adapter)
    fireEvent.click(screen.getByRole('button', { name: 'Manual' }))
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '13:00' } })
    fireEvent.change(screen.getByLabelText('End'), { target: { value: '14:00' } })
    fireEvent.change(issueInput(), { target: { value: '#42' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    })
    expect(screen.getByRole('alert').textContent).toBe(
      'This project has no GitHub repository. Link one under “Projects & Tags”, then #42 is enough.',
    )
    expect(await adapter.listAllEntries()).toHaveLength(0)
  })
})

describe('issue link in the entry list', () => {
  const entry: TimeEntry = {
    id: 'e1',
    login: 'alice',
    start: new Date(2026, 8, 21, 9).toISOString(),
    end: new Date(2026, 8, 21, 10).toISOString(),
    description: 'Login bug',
    projectId: 'p1',
    tagIds: [],
    createdAt: '',
    updatedAt: '',
    issueRef: 'acme/web#42',
  }

  it('links to the issue in a new tab', async () => {
    const adapter = await seeded()
    await adapter.saveEntry(entry)
    await renderWithSession(<EntryList entries={[entry]} showMember={false} />, adapter)
    const link = (await screen.findByRole('link', { name: /acme\/web#42/ })) as HTMLAnchorElement
    expect(link.href).toBe('https://github.com/acme/web/issues/42')
    expect(link.target).toBe('_blank')
    expect(link.rel).toContain('noopener')
  })

  it('shows no link for a malformed value', async () => {
    const bad = { ...entry, issueRef: 'javascript:alert(1)' }
    const adapter = await seeded()
    await renderWithSession(<EntryList entries={[bad]} showMember={false} />, adapter)
    await screen.findByText('Login bug')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('edits the link inline, resolving #7 through the project', async () => {
    const adapter = await seeded()
    await adapter.saveEntry(entry)
    await renderWithSession(<EntryList entries={[entry]} showMember={false} />, adapter)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit issue' }))
    const input = screen.getByRole('textbox', { name: 'Edit issue' })
    fireEvent.change(input, { target: { value: '#7' } })
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' })
    })
    await waitFor(async () =>
      expect((await adapter.listAllEntries())[0]?.issueRef).toBe('acme/web#7'),
    )
  })

  it('copies the link on quick restart', async () => {
    const adapter = await seeded()
    await adapter.saveEntry(entry)
    await renderWithSession(<EntryList entries={[entry]} showMember={false} />, adapter)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue' }))
    await waitFor(async () => expect((await adapter.getTimer())?.issueRef).toBe('acme/web#42'))
  })
})
