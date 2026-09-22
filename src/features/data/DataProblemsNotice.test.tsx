import { useQueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../../i18n'
import { createMemoryAdapter, MemoryFileStore } from '../../storage'
import { renderWithSession } from '../../test/renderWithSession'
import { DataProblemsNotice } from './DataProblemsNotice'
import { useWorkspace } from './hooks'

const alice = { login: 'alice', avatarUrl: null }
const project = { id: 'p1', name: 'Web', color: '#4f46e5', archived: false }

function Probe() {
  const ws = useWorkspace()
  const qc = useQueryClient()
  return (
    <>
      <span>projects: {ws.data?.projects.length ?? '…'}</span>
      <button onClick={() => void qc.invalidateQueries()}>refresh</button>
    </>
  )
}

function setup(workspace: unknown) {
  const store = new MemoryFileStore({ 'workspace.json': workspace })
  const adapter = createMemoryAdapter(alice, { store, collaborators: [alice], admins: ['alice'] })
  return { store, adapter }
}

/** The notice's banner, or null (toasts also use role="status"). */
const notice = () => screen.queryByText(/could not be read/)?.closest('.banner') ?? null

const ui = (
  <>
    <DataProblemsNotice />
    <Probe />
  </>
)

describe('data problems notice', () => {
  it('stays hidden when all data is valid', async () => {
    const { adapter } = setup({ projects: [project], tags: [] })
    await renderWithSession(ui, adapter)
    await screen.findByText('projects: 1')
    expect(notice()).toBeNull()
  })

  it('lists the affected file once and stays dismissed until the file changes', async () => {
    const { store, adapter } = setup({ projects: [project, { id: 'p2' }], tags: [] })
    await renderWithSession(ui, adapter)
    await screen.findByText('projects: 1')
    await screen.findByText(/could not be read/)
    expect(notice()!.textContent).toContain('workspace.json')
    expect(notice()!.textContent).not.toContain('p2')

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(notice()).toBeNull()

    // Unchanged file: a refresh does not bring the notice back.
    fireEvent.click(screen.getByRole('button', { name: 'refresh' }))
    await act(async () => {})
    expect(notice()).toBeNull()

    // The file changes but is still broken: the notice returns.
    await store.write('workspace.json', () => ({ projects: [project, { id: 'p3' }], tags: [] }))
    fireEvent.click(screen.getByRole('button', { name: 'refresh' }))
    await waitFor(() => expect(notice()).not.toBeNull())
  })
})
